<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use App\Events\DocumentUploaded;

class DocumentController extends Controller
{
    /**
     * عرض جميع الوثائق
     */
    public function index(Request $request)
    {
        $query = Document::with(['case', 'task', 'uploader']);
        $user = Auth::user();

        // تطبيق فلتر الصلاحيات حسب دور المستخدم
        if ($user->role === 'client') {
            // العميل يرى وثائق قضاياه فقط
            $query->whereHas('case', function($q) use ($user) {
                $q->where('client_id', $user->id);
            });
        } elseif ($user->role === 'lawyer') {
            // المحامي يرى وثائق القضايا المكلف بها أو المهام المكلف بها
            $query->where(function($q) use ($user) {
                $q->whereHas('case.lawyers', function($subQ) use ($user) {
                    $subQ->where('lawyer_id', $user->id);
                })->orWhereHas('task', function($subQ) use ($user) {
                    $subQ->where('assigned_to', $user->id);
                });
            });
        } elseif ($user->role === 'legal_assistant') {
            // المساعد القانوني يرى وثائق المهام المكلف بها فقط
            $query->whereHas('task', function($q) use ($user) {
                $q->where('assigned_to', $user->id);
            });
        }
        // الأدمن يرى كل الوثائق (لا حاجة لفلترة)

        // التصفية حسب القضية
        if ($request->has('case_id')) {
            $query->where('case_id', $request->case_id);
        }

        // التصفية حسب المهمة
        if ($request->has('task_id')) {
            $query->where('task_id', $request->task_id);
        }

        // التصفية حسب الفئة
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        // التصفية حسب السرية
        if ($request->has('is_confidential')) {
            $query->where('is_confidential', $request->boolean('is_confidential'));
        }

        // البحث في العنوان واسم الملف
        if ($request->has('search')) {
            $query->where(function($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                  ->orWhere('file_name', 'like', '%' . $request->search . '%');
            });
        }

        // التصفية حسب النوع
        if ($request->has('mime_type')) {
            $query->where('mime_type', 'like', $request->mime_type . '%');
        }

        // الترتيب
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $documents = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $documents
        ]);
    }

    /**
     * رفع وثيقة جديدة
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'file' => 'required|file|max:10240', // 10MB max
            'category' => 'required|in:contract,evidence,pleading,correspondence,report,judgment,other',
            'case_id' => 'nullable|exists:cases,id',
            'task_id' => 'nullable|exists:tasks,id',
            'is_confidential' => 'nullable|boolean',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'بيانات غير صحيحة',
                'errors' => $validator->errors()
            ], 422);
        }

        // التحقق من أن العميل يرفع وثائق في قضاياه فقط
        if ($user->role === 'client' && $request->case_id) {
            $case = \App\Models\CaseModel::find($request->case_id);
            if (!$case || $case->client_id != $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'غير مصرح لك برفع وثائق في هذه القضية'
                ], 403);
            }
        }

        try {
            $file = $request->file('file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('documents', $fileName, 'public');

            $document = Document::create([
                'title' => $request->title,
                'description' => $request->description,
                'file_name' => $file->getClientOriginalName(),
                'file_path' => $filePath,
                'file_size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
                'category' => $request->category,
                'case_id' => $request->case_id,
                'task_id' => $request->task_id,
                'uploaded_by' => Auth::id(),
                'is_confidential' => $request->boolean('is_confidential'),
                'tags' => $request->tags
            ]);

            $document->load(['case', 'task', 'uploader']);

            // إطلاق event للتنبيه
            event(new DocumentUploaded($document));

            return response()->json([
                'success' => true,
                'message' => 'تم رفع الوثيقة بنجاح',
                'data' => $document
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء رفع الوثيقة: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * عرض وثيقة محددة
     */
    public function show($id)
    {
        $user = Auth::user();
        
        $query = Document::with(['case', 'task', 'uploader']);

        // تطبيق نفس فلترة الصلاحيات
        if ($user->role === 'client') {
            $query->whereHas('case', function($q) use ($user) {
                $q->where('client_id', $user->id);
            });
        } elseif ($user->role === 'lawyer') {
            $query->where(function($q) use ($user) {
                $q->whereHas('case.lawyers', function($subQ) use ($user) {
                    $subQ->where('lawyer_id', $user->id);
                })->orWhereHas('task', function($subQ) use ($user) {
                    $subQ->where('assigned_to', $user->id);
                });
            });
        } elseif ($user->role === 'legal_assistant') {
            $query->whereHas('task', function($q) use ($user) {
                $q->where('assigned_to', $user->id);
            });
        }

        $document = $query->find($id);

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'الوثيقة غير موجودة أو ليس لديك صلاحية للوصول إليها'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $document
        ]);
    }

    /**
     * تحديث بيانات الوثيقة
     */
    public function update(Request $request, $id)
    {
        $document = Document::find($id);

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'الوثيقة غير موجودة'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'category' => 'required|in:contract,evidence,pleading,correspondence,report,judgment,other',
            'case_id' => 'nullable|exists:cases,id',
            'task_id' => 'nullable|exists:tasks,id',
            'is_confidential' => 'boolean',
            'tags' => 'nullable|array'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'بيانات غير صحيحة',
                'errors' => $validator->errors()
            ], 422);
        }

        $document->update($request->all());
        $document->load(['case', 'task', 'uploader']);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث الوثيقة بنجاح',
            'data' => $document
        ]);
    }

    /**
     * حذف وثيقة
     */
    public function destroy($id)
    {
        $document = Document::find($id);

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'الوثيقة غير موجودة'
            ], 404);
        }

        // حذف الملف من التخزين
        if (Storage::disk('public')->exists($document->file_path)) {
            Storage::disk('public')->delete($document->file_path);
        }

        $document->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف الوثيقة بنجاح'
        ]);
    }

    /**
     * تحميل الوثيقة
     */
    public function download($id)
    {
        $document = Document::find($id);

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'الوثيقة غير موجودة'
            ], 404);
        }

        $filePath = storage_path('app/public/' . $document->file_path);

        if (!file_exists($filePath)) {
            return response()->json([
                'success' => false,
                'message' => 'الملف غير موجود'
            ], 404);
        }

        return response()->download($filePath, $document->file_name);
    }

    /**
     * معاينة الوثيقة
     */
    public function preview($id)
    {
        $document = Document::find($id);

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'الوثيقة غير موجودة'
            ], 404);
        }

        $filePath = storage_path('app/public/' . $document->file_path);

        if (!file_exists($filePath)) {
            return response()->json([
                'success' => false,
                'message' => 'الملف غير موجود'
            ], 404);
        }

        // للصور، إنشاء thumbnail
        if (str_starts_with($document->mime_type, 'image/')) {
            try {
                $manager = new ImageManager(new Driver());
                $image = $manager->read($filePath);
                $image->scale(width: 300);
                
                return response($image->toPng())->header('Content-Type', 'image/png');
            } catch (\Exception $e) {
                return response()->file($filePath);
            }
        }

        // للملفات الأخرى، إرجاع الملف مباشرة
        return response()->file($filePath);
    }

    /**
     * رفع إصدار جديد من الوثيقة
     */
    public function uploadVersion(Request $request, $id)
    {
        $document = Document::find($id);

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'الوثيقة غير موجودة'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:10240'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'بيانات غير صحيحة',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $file = $request->file('file');
            $fileName = time() . '_v' . ($document->version + 1) . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('documents', $fileName, 'public');

            // حذف النسخة القديمة
            if (Storage::disk('public')->exists($document->file_path)) {
                Storage::disk('public')->delete($document->file_path);
            }

            $document->update([
                'file_name' => $file->getClientOriginalName(),
                'file_path' => $filePath,
                'file_size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
                'version' => $document->version + 1
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم رفع الإصدار الجديد بنجاح',
                'data' => $document
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء رفع الإصدار الجديد'
            ], 500);
        }
    }

    /**
     * البحث في الوثائق
     */
    public function search(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'query' => 'required|string|min:2',
            'category' => 'nullable|in:contract,evidence,pleading,correspondence,report,judgment,other',
            'case_id' => 'nullable|exists:cases,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'بيانات غير صحيحة',
                'errors' => $validator->errors()
            ], 422);
        }

        $query = Document::with(['case', 'task', 'uploader'])
            ->where(function($q) use ($request) {
                $q->where('title', 'like', '%' . $request->query . '%')
                  ->orWhere('file_name', 'like', '%' . $request->query . '%');
            });

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        if ($request->has('case_id')) {
            $query->where('case_id', $request->case_id);
        }

        $documents = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $documents
        ]);
    }

    /**
     * إحصائيات الوثائق
     */
    public function statistics()
    {
        $stats = [
            'total_documents' => Document::count(),
            'confidential_documents' => Document::where('is_confidential', true)->count(),
            'documents_by_category' => Document::selectRaw('category, COUNT(*) as count')
                ->groupBy('category')
                ->pluck('count', 'category'),
            'documents_by_type' => Document::selectRaw('
                CASE 
                    WHEN mime_type LIKE "image/%" THEN "صور"
                    WHEN mime_type LIKE "application/pdf%" THEN "PDF"
                    WHEN mime_type LIKE "application/msword%" OR mime_type LIKE "application/vnd.openxmlformats-officedocument.wordprocessingml.document%" THEN "مستندات"
                    ELSE "أخرى"
                END as file_type, 
                COUNT(*) as count
            ')
                ->groupBy('file_type')
                ->pluck('count', 'file_type'),
            'total_size_mb' => round(Document::sum('file_size') / (1024 * 1024), 2),
            'recent_uploads' => Document::where('created_at', '>=', now()->subDays(7))->count()
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}
