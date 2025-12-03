<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TaskComment;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class TaskCommentController extends Controller
{
    /**
     * جلب جميع تعليقات المهمة
     */
    public function index($taskId)
    {
        try {
            $task = Task::findOrFail($taskId);
            
            $comments = TaskComment::where('task_id', $taskId)
                ->with('user:id,name,email')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $comments
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في جلب التعليقات',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * إضافة تعليق جديد
     */
    public function store(Request $request, $taskId)
    {
        try {
            $validator = Validator::make($request->all(), [
                'comment' => 'required|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'خطأ في البيانات المدخلة',
                    'errors' => $validator->errors()
                ], 422);
            }

            $task = Task::findOrFail($taskId);
            
            $comment = TaskComment::create([
                'task_id' => $taskId,
                'user_id' => Auth::id(),
                'comment' => $request->comment
            ]);

            $comment->load('user:id,name,email');

            return response()->json([
                'success' => true,
                'message' => 'تم إضافة التعليق بنجاح',
                'data' => $comment
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في إضافة التعليق',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * تحديث تعليق
     */
    public function update(Request $request, $taskId, $commentId)
    {
        try {
            $validator = Validator::make($request->all(), [
                'comment' => 'required|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'خطأ في البيانات المدخلة',
                    'errors' => $validator->errors()
                ], 422);
            }

            $comment = TaskComment::where('id', $commentId)
                ->where('task_id', $taskId)
                ->where('user_id', Auth::id())
                ->firstOrFail();

            $comment->update([
                'comment' => $request->comment
            ]);

            $comment->load('user:id,name,email');

            return response()->json([
                'success' => true,
                'message' => 'تم تحديث التعليق بنجاح',
                'data' => $comment
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في تحديث التعليق',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * حذف تعليق
     */
    public function destroy($taskId, $commentId)
    {
        try {
            $comment = TaskComment::where('id', $commentId)
                ->where('task_id', $taskId)
                ->where('user_id', Auth::id())
                ->firstOrFail();

            $comment->delete();

            return response()->json([
                'success' => true,
                'message' => 'تم حذف التعليق بنجاح'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في حذف التعليق',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
