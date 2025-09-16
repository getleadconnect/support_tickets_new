<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CustomerController extends Controller
{
    /**
     * Display a listing of the customers.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = Customer::with('branch');
        
        // Filter by branch for non-admin users
        if ($user->role_id != 1) {
            // For non-admin users, show only customers from their branch
            if ($user->branch_id) {
                $query->where('branch_id', $user->branch_id);
            }
        }
        // Admin users (role_id = 1) can see all customers
        
        $customers = $query->orderBy('id', 'ASC')->get();
        
        return response()->json($customers);
    }

    /**
     * Get customers with ticket counts for listing
     */
    public function customersWithTickets(Request $request)
    {
        $user = auth()->user();
        $query = Customer::with('branch')->withCount('ticket');
        
        // Filter by branch for non-admin users
        if ($user->role_id != 1) {
            // For non-admin users, show only customers from their branch
            if ($user->branch_id) {
                $query->where('branch_id', $user->branch_id);
            }
        }
        // Admin users (role_id = 1) can see all customers
        
        // Handle search
        if ($search = $request->get('search')) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('mobile', 'like', "%{$search}%")
                  ->orWhere('company_name', 'like', "%{$search}%");
            });
        }
        
        $perPage = $request->get('per_page', 10);
        $customers = $query->orderBy('created_at', 'desc')->paginate($perPage);
        
        // Transform the data to rename ticket_count to tickets_count for consistency
        $customers->getCollection()->transform(function ($customer) {
            $customer->tickets_count = $customer->ticket_count;
            unset($customer->ticket_count);
            return $customer;
        });
        
        return response()->json($customers);
    }

    /**
     * Store a newly created customer.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'contact_number' => 'nullable|string|max:20',
            'company_name' => 'nullable|string|max:255',
            'branch_id' => 'nullable|exists:branches,id',
        ]);

        // Set default country code
        $validated['country_code'] = '+91';
        
        // Set created_by to the authenticated user
        $validated['created_by'] = auth()->id() ?? 1;
        
        // Handle branch_id assignment
        $user = auth()->user();
        if ($user->role_id != 1) {
            // For non-admin users, use their branch_id
            $validated['branch_id'] = $user->branch_id;
        }
        // Admin users can specify branch_id or it will be from request
        
        // Handle mobile number
        if (!empty($validated['contact_number'])) {
            // If the number doesn't start with +91, add it
            if (!str_starts_with($validated['contact_number'], '+91')) {
                $validated['mobile'] = '+91' . $validated['contact_number'];
            } else {
                $validated['mobile'] = $validated['contact_number'];
            }
            unset($validated['contact_number']);
        } else {
            $validated['mobile'] = null;
        }

        $customer = Customer::create($validated);
        
        // Load branch relationship
        $customer->load('branch');

        return response()->json([
            'message' => 'Customer created successfully',
            'customer' => $customer
        ], 201);
    }

    /**
     * Update the specified customer in storage.
     */
    public function update(Request $request, $id)
    {
        $customer = Customer::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'contact_number' => 'nullable|string|max:20',
            'company_name' => 'nullable|string|max:255',
            'branch_id' => 'nullable|exists:branches,id',
        ]);

        // Handle mobile number
        if (!empty($validated['contact_number'])) {
            // Extract country code and mobile number
            if (preg_match('/^(\+\d{1,3})(.*)$/', $validated['contact_number'], $matches)) {
                $validated['country_code'] = $matches[1];
                $validated['mobile'] = $validated['country_code'] . $matches[2];
            } else {
                $validated['country_code'] = '+91';
                $validated['mobile'] = '+91' . $validated['contact_number'];
            }
            unset($validated['contact_number']);
        } else {
            $validated['mobile'] = null;
            $validated['country_code'] = null;
        }

        $customer->update($validated);
        
        // Load branch relationship
        $customer->load('branch');

        return response()->json([
            'message' => 'Customer updated successfully',
            'customer' => $customer
        ]);
    }

    /**
     * Get customer details with tickets
     */
    public function customerDetails($customerId)
    {
        $customer = Customer::with('branch')->findOrFail($customerId);
        
        // Get tickets with relationships
        $tickets = Ticket::where('customer_id', $customer->id)
            ->with(['ticketStatus', 'ticketPriority', 'user:id,name', 'agent:id,name'])
            ->orderBy('created_at', 'desc')
            ->get();
        
        // Calculate stats
        $stats = [
            'total_tickets' => $tickets->count(),
            'open_tickets' => $tickets->filter(function($t) {
                return $t->ticketStatus && strtolower($t->ticketStatus->status) === 'open';
            })->count(),
            'in_progress_tickets' => $tickets->filter(function($t) {
                return $t->ticketStatus && str_contains(strtolower($t->ticketStatus->status), 'progress');
            })->count(),
            'closed_tickets' => $tickets->filter(function($t) {
                return $t->ticketStatus && strtolower($t->ticketStatus->status) === 'closed';
            })->count(),
        ];
        
        return response()->json([
            'customer' => $customer,
            'tickets' => $tickets,
            'stats' => $stats
        ]);
    }



    public function getTicketStatus()
    {
        return response()->json(\App\Models\TicketStatus::select('id', 'status', 'color_code')->where('active', 1)->get());
    }

public function getPriorities()
{
return response()->json(\App\Models\Priority::select('id', 'title', 'color')
            ->where('active', 1)
            ->where('title', '!=', 'Urgent')
            ->get());
}

public function getBranches()
{
return response()->json(\App\Models\Branch::select('id', 'branch')->get());
}

public function getTicketLabels()
{
    return response()->json(\App\Models\TicketLabel::select('id', 'label', 'color')
            ->where('active', 1)
            ->get());
}

    /**
     * Register a new customer with an issue (creates customer and ticket)
     */
    public function registerCustomer(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'contact_number' => 'nullable|string|max:20',
            'company_name' => 'nullable|string|max:255',
            'issue' => 'required|string|min:10',
        ]);

        try {
            DB::beginTransaction();

            // Check if customer with same email already exists
            $existingCustomer = Customer::where('email', $validated['email'])->first();
            
            if ($existingCustomer) {
                // Use existing customer
                $customer = $existingCustomer;
                
                // Update customer info if provided
                if (!empty($validated['contact_number']) && empty($customer->mobile)) {
                    if (preg_match('/^(\+\d{1,3})(.*)$/', $validated['contact_number'], $matches)) {
                        $customer->country_code = $matches[1];
                        $customer->mobile = $validated['contact_number'];
                    } else {
                        $customer->country_code = '+91';
                        $customer->mobile = '+91' . $validated['contact_number'];
                    }
                }
                if (!empty($validated['company_name']) && empty($customer->company_name)) {
                    $customer->company_name = $validated['company_name'];
                }
                $customer->save();
            } else {
                // Create new customer
                $customerData = [
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'company_name' => $validated['company_name'] ?? null,
                    'branch_id' => auth()->user()->branch_id ?? null,
                    'created_by' => 1, // System user
                ];

                // Handle mobile number
                if (!empty($validated['contact_number'])) {
                    if (preg_match('/^(\+\d{1,3})(.*)$/', $validated['contact_number'], $matches)) {
                        $customerData['country_code'] = $matches[1];
                        $customerData['mobile'] = $validated['contact_number'];
                    } else {
                        $customerData['country_code'] = '+91';
                        $customerData['mobile'] = '+91' . $validated['contact_number'];
                    }
                }

                $customer = Customer::create($customerData);
            }

       
            // Generate unique tracking number with ONS prefix
            $lastTicket = Ticket::withTrashed()->orderBy('id', 'desc')->first();
            $nextNumber = $lastTicket ? $lastTicket->id + 1 : 1;
            $trackingNumber = 'ONS' . str_pad($nextNumber, 7, '0', STR_PAD_LEFT);
            
            // Ensure uniqueness
            while (Ticket::withTrashed()->where('tracking_number', $trackingNumber)->exists()) {
                $nextNumber++;
                $trackingNumber = 'ONS' . str_pad($nextNumber, 7, '0', STR_PAD_LEFT);
            }

            // Set due date to day after tomorrow at 5:30 PM
            $dueDate = now()->addDays(2)->setTime(17, 30, 0)->format('Y-m-d H:i:s');
            
            $ticket = Ticket::create([
                'issue' => $validated['issue'],
                'description' => 'Issue submitted through customer registration form',
                'customer_id' => $customer->id,
                'created_by' => 1, // System user
                'tracking_number' => $trackingNumber,
                'slug' => Str::slug($validated['issue'] . '-' . time()),
                'priority' => 2, // Normal priority
                'status' => 1, // Open status
                'due_date' => $dueDate,
                'closed_time' => Carbon::parse('01-01-2025 5:30:00 PM')->format('h:i:s'),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Registration successful. Your ticket has been created.',
                'tracking_number' => $trackingNumber,
                'customer_id' => $customer->id,
                'ticket_id' => $ticket->id,
                'due_date' => $dueDate
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Registration failed. Please try again.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

}