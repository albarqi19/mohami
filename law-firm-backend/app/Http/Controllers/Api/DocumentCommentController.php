<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentComment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class DocumentCommentController extends Controller
{
    /**
     * عرض تعليقات الوثيقة
     */
    public function index(Request $request, $documentId)
    {
        try {
            $document = Document::findOrFail($documentId);
            $user = Auth::user();

            // التحقق من الصلاحيات
            if ($user->role === 'client') {
                // العميل يرى فقط تعليقات وثائق قضاياه والتعليقات غير الداخلية
                if ($document->case->client_id !== $user->id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'ليس لديك صلاحية لعرض هذه التعليقات'
                    ], 403);
                }
                $comments = $document->comments()
                    ->where('is_internal', false)
                    ->with('author:id,name,role')
                    ->orderBy('created_at', 'asc')
                    ->get();
            } else {
                // المحامون والإداريون يرون كل التعليقات
                $comments = $document->comments()
                    ->with('author:id,name,role')
                    ->orderBy('created_at', 'asc')
                    ->get();
            }

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
    public function store(Request $request, $documentId)
    {
        $validator = Validator::make($request->all(), [
            'content' => 'required|string|min:1|max:1000',
            'is_internal' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'بيانات غير صحيحة',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $document = Document::findOrFail($documentId);
            $user = Auth::user();

            // التحقق من الصلاحيات
            if ($user->role === 'client') {
                // العميل يستطيع التعليق فقط على وثائق قضاياه
                if ($document->case->client_id !== $user->id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'ليس لديك صلاحية للتعليق على هذه الوثيقة'
                    ], 403);
                }
                // العميل لا يستطيع إنشاء تعليقات داخلية
                $isInternal = false;
            } else {
                // المحامون والإداريون يستطيعون إنشاء تعليقات داخلية
                $isInternal = $request->get('is_internal', false);
            }

            $comment = DocumentComment::create([
                'content' => $request->content,
                'document_id' => $documentId,
                'author_id' => $user->id,
                'is_internal' => $isInternal
            ]);

            $comment->load('author:id,name,role');

            // إرسال إشعار للمحامي إذا كان التعليق من العميل
            if ($user->role === 'client' && $document->case) {
                // يمكن إضافة إشعار واتساب هنا لاحقاً
            }

            return response()->json([
                'success' => true,
                'message' => 'تم إضافة التعليق بنجاح',
                'data' => $comment
            ]);
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
    public function update(Request $request, $documentId, $commentId)
    {
        $validator = Validator::make($request->all(), [
            'content' => 'required|string|min:1|max:1000'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'بيانات غير صحيحة',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $comment = DocumentComment::findOrFail($commentId);
            $user = Auth::user();

            // التحقق من الصلاحيات - فقط صاحب التعليق أو الإداري
            if ($comment->author_id !== $user->id && $user->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'ليس لديك صلاحية لتعديل هذا التعليق'
                ], 403);
            }

            $comment->update([
                'content' => $request->content
            ]);

            $comment->load('author:id,name,role');

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
    public function destroy($documentId, $commentId)
    {
        try {
            $comment = DocumentComment::findOrFail($commentId);
            $user = Auth::user();

            // التحقق من الصلاحيات - فقط صاحب التعليق أو الإداري
            if ($comment->author_id !== $user->id && $user->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'ليس لديك صلاحية لحذف هذا التعليق'
                ], 403);
            }

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
