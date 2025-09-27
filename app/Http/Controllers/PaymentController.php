<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Invoice;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = auth()->user();
            $query = Payment::with(['invoice', 'ticket', 'customer', 'createdBy']);

            // Apply branch filter for non-admin users
            if ($user->role_id != 1 && $user->branch_id) {
                $query->where('branch_id', $user->branch_id);
            }

            // Search functionality
            if ($request->has('search') && $request->search != '') {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('id', 'like', "%{$search}%")
                      ->orWhere('payment_mode', 'like', "%{$search}%")
                      ->orWhereHas('customer', function($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                      })
                      ->orWhereHas('invoice', function($q) use ($search) {
                        $q->where('invoice_id', 'like', "%{$search}%");
                      });
                });
            }

            // Date range filter
            if ($request->has('start_date') && $request->start_date != '') {
                $query->whereDate('created_at', '>=', $request->start_date);
            }

            if ($request->has('end_date') && $request->end_date != '') {
                $query->whereDate('created_at', '<=', $request->end_date);
            }

            // Customer filter
            if ($request->has('customer_id') && $request->customer_id != '' && $request->customer_id != 'all') {
                $query->where('customer_id', $request->customer_id);
            }

            // Payment mode filter
            if ($request->has('payment_mode') && $request->payment_mode != '' && $request->payment_mode != 'all') {
                $paymentMode = str_replace('_', ' ', $request->payment_mode);
                $query->where('payment_mode', 'like', "%{$paymentMode}%");
            }

            // Calculate total net amount for all filtered records
            $totalNetAmount = $query->sum('net_amount');

            // Order by latest first
            $query->orderBy('id', 'desc');

            // Pagination
            $perPage = $request->get('per_page', 50);
            $payments = $query->paginate($perPage);

            // Add total net amount to the response
            $response = $payments->toArray();
            $response['total_net_amount'] = $totalNetAmount;

            return response()->json($response, 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch payments',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function recordPayment(Request $request, $invoiceId)
    {
        $validated = $request->validate([
            'payment_mode' => 'required|string',
            'discount' => 'nullable|numeric|min:0',
        ]);

        try {
            DB::beginTransaction();

            // Get the invoice
            $invoice = Invoice::findOrFail($invoiceId);

            // Calculate net amount
            $discount = $validated['discount'] ?? 0;
            $netAmount = $invoice->total_amount - $discount;

            // Get user for branch_id
            $user = auth()->user();
            
            // Create payment record
            $payment = Payment::create([
                'invoice_id' => $invoice->id,
                'ticket_id' => $invoice->ticket_id,
                'customer_id' => $invoice->customer_id,
                'branch_id' => $user->branch_id ?? $invoice->branch_id ?? null,
                'service_charge' => $invoice->service_charge,
                'item_amount' => $invoice->item_cost,
                'total_amount' => $invoice->total_amount,
                'discount' => $discount,
                'net_amount' => $netAmount,
                'payment_mode' => $validated['payment_mode'],
                'created_by' => Auth::id() ?? 1,
            ]);

            // Update invoice with discount, net_amount, status and payment method
            $invoice->update([
                'status' => 'paid',
                'payment_method' => $validated['payment_mode'],
                'discount' => $discount,
                'net_amount' => $netAmount
            ]);


            // Update status and closed at in tickets
            $ticket=Ticket::where('id',$invoice->ticket_id)->update([
                'status' => 3,
                'closed_at' => now()
            ]);


            DB::commit();

            return response()->json([
                'message' => 'Payment recorded successfully',
                'payment' => $payment,
                'invoice' => $invoice
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to record payment',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
