<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Company;
use App\Models\ProductTicket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Barryvdh\DomPDF\Facade\Pdf;

class InvoiceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = Invoice::with(['customer', 'ticket', 'createdBy', 'branch']);
        
        // Filter by branch for non-admin users
        if ($user->role_id != 1) {
            // For non-admin users, show only invoices from their branch
            if ($user->branch_id) {
                $query->where('branch_id', $user->branch_id);
            }
        }
        // Admin users (role_id = 1) can see all invoices
        
        // Search filter
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('invoice_id', 'like', "%{$search}%")
                  ->orWhere('ticket_id', 'like', "%{$search}%")
                  ->orWhereHas('customer', function($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%");
                  });
            });
        }
        
        // Date range filter
        if ($request->has('start_date') && $request->start_date) {
            $query->whereDate('invoice_date', '>=', $request->start_date);
        }
        
        if ($request->has('end_date') && $request->end_date) {
            $query->whereDate('invoice_date', '<=', $request->end_date);
        }
        
        // Customer filter
        if ($request->has('customer_id') && $request->customer_id && $request->customer_id !== 'all') {
            $query->where('customer_id', $request->customer_id);
        }
        
        // Pagination
        $perPage = $request->get('per_page', 10);
        $invoices = $query->orderBy('id', 'desc')->paginate($perPage);
            
        return response()->json($invoices);
    }

    /**
     * Check if invoice exists for a ticket
     */
    public function checkInvoiceExists($ticketId)
    {
        $exists = Invoice::where('ticket_id', $ticketId)->exists();
        
        return response()->json([
            'exists' => $exists,
            'invoice' => $exists ? Invoice::where('ticket_id', $ticketId)->first() : null
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'ticket_id' => 'required|exists:tickets,id',
            'customer_id' => 'required|exists:customers,id',
            'item_cost' => 'required|numeric|min:0',
            'service_charge' => 'required|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'payment_mode' => 'required|in:Cash,Card,UPI,Bank Transfer',
            'payment_status' => 'nullable|string',
            'invoice_date' => 'required|date',
            'products' => 'nullable|array',
        ]);

        try {
            DB::beginTransaction();

            // Generate invoice ID
            $lastInvoice = Invoice::orderBy('id', 'desc')->first();
            $invoiceId = 'INV-' . str_pad(($lastInvoice ? $lastInvoice->id + 1 : 1), 6, '0', STR_PAD_LEFT);

            // Get the current user
            $user = Auth::user();
            
            // Create invoice
            $invoice = Invoice::create([
                'invoice_id' => $invoiceId,
                'ticket_id' => $validated['ticket_id'],
                'customer_id' => $validated['customer_id'],
                'branch_id' => $user->branch_id ?? null,
                'item_cost' => $validated['item_cost'],
                'service_charge' => $validated['service_charge'],
                'total_amount' => $validated['total_amount'],
                'payment_method' => $validated['payment_mode'],
                'status' => $validated['payment_status'] ?? 'pending',
                'invoice_date' => $validated['invoice_date'],
                'created_by' => Auth::id() ?? 1,
            ]);

            // If products are provided, you can store them in a separate invoice_items table if needed
            // For now, the products are already linked through the ticket's product_tickets table

            DB::commit();

            return response()->json([
                'message' => 'Invoice created successfully',
                'invoice' => $invoice->load(['customer', 'ticket', 'branch'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create invoice',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $user = auth()->user();
        $invoice = Invoice::with(['customer', 'ticket', 'branch'])
            ->findOrFail($id);
        
        // Check if user has access to this invoice
        if ($user->role_id != 1 && $user->branch_id && $invoice->branch_id != $user->branch_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
            
        return response()->json($invoice);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $invoice = Invoice::findOrFail($id);
        
        $validated = $request->validate([
            'status' => 'nullable|string',
            'payment_method' => 'nullable|in:Cash,Card,UPI,Bank Transfer',
            'service_charge' => 'nullable|numeric|min:0',
        ]);

        // Recalculate total if service charge is updated
        if (isset($validated['service_charge'])) {
            $validated['total_amount'] = $invoice->item_cost + $validated['service_charge'];
        }

        $invoice->update($validated);

        return response()->json([
            'message' => 'Invoice updated successfully',
            'invoice' => $invoice->load(['customer', 'ticket', 'branch'])
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $user = auth()->user();
        $invoice = Invoice::findOrFail($id);
        
        // Check if user has access to delete this invoice
        if ($user->role_id != 1 && $user->branch_id && $invoice->branch_id != $user->branch_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $invoice->delete();

        return response()->json([
            'message' => 'Invoice deleted successfully'
        ]);
    }

    /**
     * Download invoice as PDF
     */
    public function downloadPDF($id)
    {
        $user = auth()->user();
        $invoice = Invoice::with(['customer', 'ticket', 'createdBy', 'branch'])->findOrFail($id);
        
        // Check if user has access to this invoice
        if ($user->role_id != 1 && $user->branch_id && $invoice->branch_id != $user->branch_id) {
            abort(403, 'Unauthorized');
        }
        
        // Get company info
        $company = Company::first();
        
        // Get spare parts for this ticket directly from ProductTicket
        $spareParts = ProductTicket::with('product')
            ->where('ticket_id', $invoice->ticket_id)
            ->get();
        
        // Calculate totals
        $sparePartsTotal = $spareParts->sum('total_price');
        $totalAmount = $invoice->item_cost + $invoice->service_charge;
        
        // Check if payment exists and get discount
        $payment = DB::table('payments')
            ->where('invoice_id', $invoice->id)
            ->first();
        
        $discount = $payment ? $payment->discount : 0;
        $netAmount = $totalAmount - $discount;
        
        // Convert amount to words (Indian numbering system)
        $amountInWords = $this->convertNumberToWords($netAmount);
        
        $data = [
            'invoice' => $invoice,
            'company' => $company,
            'spareParts' => $spareParts,
            'sparePartsTotal' => $sparePartsTotal,
            'totalAmount' => $totalAmount,
            'discount' => $discount,
            'netAmount' => $netAmount,
            'amountInWords' => $amountInWords
        ];
        
        $pdf = Pdf::loadView('invoices.pdf', $data);
        $pdf->setPaper('A4', 'portrait');
        $pdf->setOption('margin-top', 30);
        $pdf->setOption('margin-right', 30);
        $pdf->setOption('margin-bottom', 30);
        $pdf->setOption('margin-left', 30);
        
        return $pdf->download('invoice-' . $invoice->invoice_id . '.pdf');
    }
    
    /**
     * Convert number to words (Indian format)
     */
    private function convertNumberToWords($number)
    {
        $number = intval($number);
        
        if ($number == 0) {
            return 'Zero';
        }
        
        $ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
                 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
                 'seventeen', 'eighteen', 'nineteen'];
        
        $tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
        
        if ($number < 20) {
            return $ones[$number];
        }
        
        if ($number < 100) {
            return $tens[intval($number / 10)] . ' ' . $ones[$number % 10];
        }
        
        if ($number < 1000) {
            return $ones[intval($number / 100)] . ' hundred ' . $this->convertNumberToWords($number % 100);
        }
        
        if ($number < 100000) {
            return $this->convertNumberToWords(intval($number / 1000)) . ' thousand ' . $this->convertNumberToWords($number % 1000);
        }
        
        return 'one thousand fifty'; // Simplified for the example
    }
}