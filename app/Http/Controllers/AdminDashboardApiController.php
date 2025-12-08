<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AdminDashboardApiController extends Controller
{
    /**
     * Get ticket counts for admin dashboard
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getDashboardStats(Request $request)
    {
        // Get all tickets
        $tickets = Ticket::all();

        // Total tickets count
        $totalTickets = $tickets->count();

        // Count tickets by status
        $openTickets = $tickets->where('status', 1)->count();
        $inProgressTickets = $tickets->where('status', 2)->count();
        $closedTickets = $tickets->where('status', 3)->count();
        $completedTickets = $tickets->where('status', 4)->count();

        // Count overdue tickets (tickets with due_date passed and not closed/completed)
        $today = Carbon::today();
        $overdueTickets = $tickets->filter(function ($ticket) use ($today) {
            return $ticket->status != 3 && $ticket->status != 4 &&
                   $ticket->due_date && Carbon::parse($ticket->due_date)->lt($today);
        })->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_tickets' => $totalTickets,
                'overdue_tickets' => $overdueTickets,
                'completed_tickets' => $completedTickets,
                'open_tickets' => $openTickets,
                'inprogress_tickets' => $inProgressTickets,
                'closed_tickets' => $closedTickets
            ],
            'generated_at' => now()->format('Y-m-d H:i:s')
        ]);
    }

    /**
     * Get quick summary stats (lightweight version)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getQuickStats(Request $request)
    {
        // Get all tickets
        $tickets = Ticket::all();

        // Total tickets count
        $totalTickets = $tickets->count();

        // Count tickets by status
        $openTickets = $tickets->where('status', 1)->count();
        $inProgressTickets = $tickets->where('status', 2)->count();
        $closedTickets = $tickets->where('status', 3)->count();
        $completedTickets = $tickets->where('status', 4)->count();

        // Count overdue tickets (tickets with due_date passed and not closed/completed)
        $today = Carbon::today();
        $overdueTickets = $tickets->filter(function ($ticket) use ($today) {
            return $ticket->status != 3 && $ticket->status != 4 &&
                   $ticket->due_date && Carbon::parse($ticket->due_date)->lt($today);
        })->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_tickets' => $totalTickets,
                'overdue_tickets' => $overdueTickets,
                'completed_tickets' => $completedTickets,
                'open_tickets' => $openTickets,
                'inprogress_tickets' => $inProgressTickets,
                'closed_tickets' => $closedTickets
            ],
            'generated_at' => now()->format('Y-m-d H:i:s')
        ]);
    }
}
