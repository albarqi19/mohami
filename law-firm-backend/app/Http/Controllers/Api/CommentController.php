<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class CommentController extends Controller
{
    public function index(Request $request)
    {
        $query = Comment::with(['user']);

        if ($request->has('case_id')) {
            $query->where('case_id', $request->case_id);
        }

        if ($request->has('task_id')) {
            $query->where('task_id', $request->task_id);
        }

        $comments = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $comments
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'content' => 'required|string',
            'case_id' => 'nullable|exists:cases,id',
            'task_id' => 'nullable|exists:tasks,id',
            'parent_id' => 'nullable|exists:comments,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'بيانات غير صحيحة',
                'errors' => $validator->errors()
            ], 422);
        }

        $comment = Comment::create([
            'content' => $request->content,
            'case_id' => $request->case_id,
            'task_id' => $request->task_id,
            'parent_id' => $request->parent_id,
            'user_id' => Auth::id()
        ]);

        $comment->load(['user']);

        return response()->json([
            'success' => true,
            'message' => 'تم إضافة التعليق بنجاح',
            'data' => $comment
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $comment = Comment::find($id);

        if (!$comment) {
            return response()->json([
                'success' => false,
                'message' => 'التعليق غير موجود'
            ], 404);
        }

        if ($comment->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح لك بتعديل هذا التعليق'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'content' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'بيانات غير صحيحة',
                'errors' => $validator->errors()
            ], 422);
        }

        $comment->update(['content' => $request->content]);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث التعليق بنجاح',
            'data' => $comment
        ]);
    }

    public function destroy($id)
    {
        $comment = Comment::find($id);

        if (!$comment) {
            return response()->json([
                'success' => false,
                'message' => 'التعليق غير موجود'
            ], 404);
        }

        if ($comment->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح لك بحذف هذا التعليق'
            ], 403);
        }

        $comment->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف التعليق بنجاح'
        ]);
    }
}
