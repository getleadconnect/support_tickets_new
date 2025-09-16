<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BranchController extends Controller
{
    /**
     * Display a listing of branches.
     */
    public function index(Request $request)
    {
        $query = Branch::with('createdBy:id,name');
        
        // Search functionality
        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('branch_name', 'like', '%' . $search . '%');
            });
        }
        
        // Sorting
        $sortField = $request->get('sort_by', 'id');
        $sortOrder = $request->get('sort_order', 'DESC');
        $query->orderBy($sortField, $sortOrder);
        
        // Pagination
        $perPage = $request->get('per_page', 10);
        $branches = $query->paginate($perPage);
        
        // Transform the data to match frontend expectations
        $branches->getCollection()->transform(function ($branch) {
            return [
                'id' => $branch->id,
                'branch_name' => $branch->branch_name,
                'created_by' => $branch->createdBy ? [
                    'id' => $branch->createdBy->id,
                    'name' => $branch->createdBy->name
                ] : null,
                'created_at' => $branch->created_at,
                'updated_at' => $branch->updated_at,
            ];
        });

        return response()->json($branches);
    }

    /**
     * Store a newly created branch.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_name' => 'required|string|max:255|unique:branches',
        ]);

        $validated['created_by'] = Auth::id();

        $branch = Branch::create($validated);
        $branch->load('createdBy:id,name');

        return response()->json([
            'message' => 'Branch created successfully',
            'branch' => [
                'id' => $branch->id,
                'branch_name' => $branch->branch_name,
                'created_by' => $branch->createdBy ? [
                    'id' => $branch->createdBy->id,
                    'name' => $branch->createdBy->name
                ] : null,
                'created_at' => $branch->created_at,
                'updated_at' => $branch->updated_at,
            ]
        ], 201);
    }

    /**
     * Display the specified branch.
     */
    public function show(Branch $branch)
    {
        return response()->json($branch->load(['createdBy', 'tickets']));
    }

    /**
     * Update the specified branch.
     */
    public function update(Request $request, Branch $branch)
    {
        $validated = $request->validate([
            'branch_name' => 'sometimes|required|string|max:255|unique:branches,branch_name,' . $branch->id,
        ]);

        $branch->update($validated);
        $branch->load('createdBy:id,name');

        return response()->json([
            'message' => 'Branch updated successfully',
            'branch' => [
                'id' => $branch->id,
                'branch_name' => $branch->branch_name,
                'created_by' => $branch->createdBy ? [
                    'id' => $branch->createdBy->id,
                    'name' => $branch->createdBy->name
                ] : null,
                'created_at' => $branch->created_at,
                'updated_at' => $branch->updated_at,
            ]
        ]);
    }

    /**
     * Remove the specified branch.
     */
    public function destroy(Branch $branch)
    {
        // Check if branch has tickets
        if ($branch->tickets()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete branch with assigned tickets'
            ], 403);
        }

        $branch->delete();

        return response()->json([
            'message' => 'Branch deleted successfully'
        ]);
    }
}