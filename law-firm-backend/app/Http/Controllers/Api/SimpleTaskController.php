<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SimpleTaskController extends Controller
{
    public function index(Request $request)
    {
        try {
            $tasks = Task::orderBy('created_at', 'desc')->paginate(15);
            
            return response()->json([
                'success' => true,
                'message' => 'تم جلب المهام بنجاح',
                'data' => $tasks
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في جلب المهام',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $task = Task::create([
                'title' => $request->title,
                'description' => $request->description,
                'status' => $request->status ?? 'pending',
                'priority' => $request->priority ?? 'medium',
                'assigned_to' => $request->assigned_to,
                'case_id' => $request->case_id,
                'due_date' => $request->due_date,
                'created_by' => Auth::id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم إنشاء المهمة بنجاح',
                'data' => $task
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في إنشاء المهمة',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $task = Task::findOrFail($id);
            
            return response()->json([
                'success' => true,
                'message' => 'تم جلب المهمة بنجاح',
                'data' => $task
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'المهمة غير موجودة',
                'error' => $e->getMessage()
            ], 404);
        }
    }
}
