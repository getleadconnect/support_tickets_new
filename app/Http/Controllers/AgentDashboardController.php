<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AgentDashboardController extends Controller
{
    /**
     * Get dashboard statistics for agent users
     */
    public function getStats(Request $request)
    {
        try {
            $user = Auth::user();
            
            // Only agents (role_id = 2) can access this endpoint
            if ($user->role_id != 2) {
                return response()->json(['error' => 'Unauthorized - Not an agent'], 403);
            }

            $today = Carbon::today();
            $userId = $user->id;
            
            // Log for debugging
            Log::info('Agent Dashboard Stats Request', [
                'user_id' => $userId, 
                'user_email' => $user->email,
                'role_id' => $user->role_id,
                'auth_check' => Auth::check()
            ]);
            
            // 1. Total Assigned: Count all tickets from agent_ticket table where agent_id matches logged-in user
            $totalAssigned = DB::table('agent_ticket')
                ->where('agent_id', $userId)
                ->count();
            
            Log::info('Total Assigned Query', [
                'user_id' => $userId,
                'count' => $totalAssigned,
                'raw_query' => DB::table('agent_ticket')->where('agent_id', $userId)->toSql()
            ]);
            
            // 2. Total Opens: Count assigned tickets with status = 1 (Open)
            $openTickets = DB::table('tickets')
                ->join('agent_ticket', 'tickets.id', '=', 'agent_ticket.ticket_id')
                ->where('agent_ticket.agent_id', $userId)
                ->where('tickets.status', 1)
                ->count();
            
            // 3. In Progress: Count assigned tickets with status = 2 (In Progress)
            $inProgressTickets = DB::table('tickets')
                ->join('agent_ticket', 'tickets.id', '=', 'agent_ticket.ticket_id')
                ->where('agent_ticket.agent_id', $userId)
                ->where('tickets.status', 2)
                ->count();
            
            // 4. Closed Today: Count assigned tickets with status = 3 (Closed) where updated_at is today
            $closedToday = DB::table('tickets')
                ->join('agent_ticket', 'tickets.id', '=', 'agent_ticket.ticket_id')
                ->where('agent_ticket.agent_id', $userId)
                ->where('tickets.status', 3)
                ->whereDate('tickets.updated_at', $today)
                ->count();
            
            // 5. Due Today: Count assigned tickets where due_date = today
            $dueToday = DB::table('tickets')
                ->join('agent_ticket', 'tickets.id', '=', 'agent_ticket.ticket_id')
                ->where('agent_ticket.agent_id', $userId)
                ->whereDate('tickets.due_date', $today)
                ->count();
            
            // 6. Overdue: Count assigned tickets where due_date < today, excluding closed (status 3) and completed (status 4)
            $overdue = DB::table('tickets')
                ->join('agent_ticket', 'tickets.id', '=', 'agent_ticket.ticket_id')
                ->where('agent_ticket.agent_id', $userId)
                ->whereDate('tickets.due_date', '<', $today)
                ->whereNotIn('tickets.status', [3, 4])
                ->count();

            Log::info('Agent Dashboard Stats Results', [
                'user_id' => $userId,
                'totalAssigned' => $totalAssigned,
                'openTickets' => $openTickets,
                'inProgressTickets' => $inProgressTickets,
                'closedToday' => $closedToday,
                'dueToday' => $dueToday,
                'overdue' => $overdue
            ]);

            return response()->json([
                'totalAssigned' => $totalAssigned,
                'openTickets' => $openTickets,
                'inProgressTickets' => $inProgressTickets,
                'closedToday' => $closedToday,
                'dueToday' => $dueToday,
                'overdue' => $overdue
            ]);
            
        } catch (\Exception $e) {
            Log::error('Agent Dashboard Stats Error', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Failed to fetch dashboard statistics',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}