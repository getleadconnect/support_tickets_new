<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class NotificationController extends Controller
{
    /**
     * Get all notifications for the authenticated user
     */
    public function index(Request $request)
    {
        $userId = auth()->id();
        
        // Query only unread notifications - handle both notifiable_type formats
        $notifications = DB::table('notifications')
            ->where('notifiable_id', $userId)
            ->where(function($query) {
                $query->where('notifiable_type', 'App\Models\User')
                      ->orWhere('notifiable_type', '1'); // Handle numeric type
            })
            ->whereNull('read_at') // Only unread notifications
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();
            
        // Get unread count
        $unreadCount = DB::table('notifications')
            ->where('notifiable_id', $userId)
            ->where(function($query) {
                $query->where('notifiable_type', 'App\Models\User')
                      ->orWhere('notifiable_type', '1'); // Handle numeric type
            })
            ->whereNull('read_at')
            ->count();
            
        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount
        ]);
    }
    
    /**
     * Mark a notification as read
     */
    public function markAsRead($id)
    {
        DB::table('notifications')
            ->where('id', $id)
            ->where('notifiable_id', auth()->id())
            ->update(['read_at' => Carbon::now()]);
            
        return response()->json(['message' => 'Notification marked as read']);
    }
    
    /**
     * Mark all notifications as read
     */
    public function markAllAsRead()
    {
        DB::table('notifications')
            ->where('notifiable_id', auth()->id())
            ->where(function($query) {
                $query->where('notifiable_type', 'App\Models\User')
                      ->orWhere('notifiable_type', '1'); // Handle numeric type
            })
            ->whereNull('read_at')
            ->update(['read_at' => Carbon::now()]);
            
        return response()->json(['message' => 'All notifications marked as read']);
    }
    
    /**
     * Get unread count only
     */
    public function unreadCount()
    {
        $count = DB::table('notifications')
            ->where('notifiable_id', auth()->id())
            ->where(function($query) {
                $query->where('notifiable_type', 'App\Models\User')
                      ->orWhere('notifiable_type', '1'); // Handle numeric type
            })
            ->whereNull('read_at')
            ->count();
            
        return response()->json(['count' => $count]);
    }
}