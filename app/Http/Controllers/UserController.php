<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Display a listing of users.
     */
    public function index(Request $request)
    {
        $loggedInUser = auth()->user();
        $query = User::with(['department', 'designation', 'branch']);
        
        // Filter users based on logged-in user's role
        if ($loggedInUser->role_id == 4) {
            // Branch Admin (role_id = 4) can only see users where parent_id = their user id
            $query->where('parent_id', $loggedInUser->id);
        }
        // Admin (role_id = 1) can see all users (no filter needed)
        
        // Branch filter
        if ($request->has('branch_id') && $request->branch_id != '') {
            $query->where('branch_id', $request->branch_id);
        }
        
        // Search functionality
        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhere('email', 'like', '%' . $search . '%');
            });
        }
        
        // Sorting
        $sortField = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortField, $sortOrder);
        
        // Pagination
        $perPage = $request->get('per_page', 10);
        $users = $query->paginate($perPage);

        return response()->json($users);
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request)
    {
        $loggedInUser = auth()->user();
        
        // Validate role_id based on logged-in user's role
        $allowedRoles = [];
        if ($loggedInUser->role_id == 1) {
            // Super Admin can add Agent (2), Manager (3), Branch Admin (4)
            $allowedRoles = [2, 3, 4];
        } elseif ($loggedInUser->role_id == 4) {
            // Branch Admin can only add Agent (2)
            $allowedRoles = [2];
        } else {
            // Default: can only add Agent
            $allowedRoles = [2];
        }
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role_id' => ['nullable', 'integer', 'in:' . implode(',', $allowedRoles)],
            'status' => 'nullable|boolean',
            'department_id' => 'nullable|exists:departments,id',
            'designation_id' => 'nullable|exists:designations,id',
            'branch_id' => 'nullable|exists:branches,id',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $validated['role_id'] = $validated['role_id'] ?? 2; // Default to AGENTS
        $validated['status'] = $validated['status'] ?? 1; // Default to ACTIVATE
        
        // Handle branch_id assignment
        if ($loggedInUser->role_id == 1) {
            // Super Admin must specify branch_id (it should come from request)
            // branch_id is already in $validated from request
        } else {
            // For non-super admin users, use their own branch_id
            $validated['branch_id'] = $loggedInUser->branch_id;
        }
        
        // Set parent_id for users created by Branch Admin
        if ($loggedInUser->role_id == 4) {
            $validated['parent_id'] = $loggedInUser->id;
        }

        $user = User::create($validated);
        $user->load(['department', 'designation', 'branch']);

        return response()->json([
            'message' => 'User created successfully',
            'user' => $user
        ], 201);
    }

    /**
     * Display the specified user.
     */
    public function show(User $user)
    {
        $user->load(['department', 'designation', 'branch']);
        
        // Add role name based on role_id
        $roleNames = [
            1 => 'Admin',
            2 => 'Agent',
            3 => 'Customer'
        ];
        $user->role = $roleNames[$user->role_id] ?? 'User';
        
        return response()->json($user);
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => ['sometimes', 'required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:8|confirmed',
            'mobile' => 'nullable|string|max:50',
            'country_code' => 'nullable|string|max:10',
            'address' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'role_id' => 'nullable|integer|in:1,2,3',
            'status' => 'nullable|boolean',
            'department_id' => 'nullable|exists:departments,id',
            'designation_id' => 'nullable|exists:designations,id',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);
        $user->load(['department', 'designation', 'branch']);

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user
        ]);
    }

    /**
     * Remove the specified user.
     */
    public function destroy(User $user)
    {
        // Prevent deleting the current user
        if ($user->id === auth()->id()) {
            return response()->json([
                'message' => 'You cannot delete your own account'
            ], 403);
        }

        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully'
        ]);
    }

    /**
     * Get all users for assignment and notification.
     */
    public function getAgentUsers()
    {
        // Fetch all users (not just agents) for assignment
        $users = User::select('id', 'name', 'email', 'branch_id', 'role_id')
            ->get();

        return response()->json($users);
    }
}