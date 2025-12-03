<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LegalMemo;
use App\Models\CaseModel;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\GeminiAnalysisService;
use App\Services\LegalMemoAnalysisService;

class LegalMemoController extends Controller
{
    protected $geminiService;

    public function __construct(GeminiAnalysisService $geminiService)
    {
        $this->geminiService = $geminiService;
    }

    /**
     * وظيفة مساعدة لاستخراج البيانات من FormData
     */
    private function getFormDataField(Request $request, string $field, $default = null)
    {
        // محاولة عدة طرق للحصول على البيانات
        $value = $request->input($field, $default);
        
        if (is_null($value) || $value === '') {
            $value = $request->get($field, $default);
        }
        
        if (is_null($value) || $value === '') {
            $value = $request->post($field, $default);
        }

        return $value;
    }

    /**
     * وظيفة مساعدة للتعامل مع الملفات المرفوعة بأمان
     */
    private function getUploadedFiles(Request $request): array
    {
        $files = [];
        
        // محاولة الحصول على الملفات من عدة مصادر
        if ($request->hasFile('files')) {
            $uploadedFiles = $request->file('files');
            
            // إذا كان ملف واحد، ضعه في مصفوفة
            if (!is_array($uploadedFiles)) {
                $files = [$uploadedFiles];
            } else {
                $files = $uploadedFiles;
            }
        }

        return $files;
    }

    /**
     * وظيفة مساعدة لحساب عدد الملفات بأمان
     */
    private function getFilesCount(Request $request): int
    {
        if (!$request->hasFile('files')) {
            return 0;
        }

        $uploadedFiles = $request->file('files');
        
        if (is_array($uploadedFiles)) {
            return count($uploadedFiles);
        } else {
            // ملف واحد
            return 1;
        }
    }
    /**
     * عرض قائمة المذكرات
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            
            $query = LegalMemo::with(['creator', 'assignedLawyer', 'case'])
                             ->orderBy('created_at', 'desc');

            // فلترة حسب القضية إن وجدت
            if ($request->has('case_id')) {
                $query->where('case_id', $request->case_id);
            }

            // فلترة حسب الفئة إن وجدت
            if ($request->has('category')) {
                $query->where('category', $request->category);
            }

            // فلترة حسب الحالة إن وجدت
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // فلترة حسب صلاحية المستخدم
            if ($user->role === 'client') {
                // العميل يرى فقط مذكرات قضاياه
                $query->whereHas('case', function($q) use ($user) {
                    $q->where('client_id', $user->id);
                });
            } elseif ($user->role === 'lawyer') {
                // المحامي يرى المذكرات المكلف بها أو التي أنشأها
                $query->where(function($q) use ($user) {
                    $q->where('assigned_lawyer', $user->id)
                      ->orWhere('created_by', $user->id);
                });
            }

            $memos = $query->paginate($request->get('per_page', 15));

            return response()->json([
                'success' => true,
                'data' => $memos,
                'memo_types' => LegalMemo::getMemoTypes(),
                'categories' => LegalMemo::getCategoryNames(),
                'statuses' => LegalMemo::getStatusOptions()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل في جلب المذكرات',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * إنشاء مذكرة جديدة
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'content' => 'nullable|string',
            'memo_type' => 'required|string',
            'category' => 'required|string|in:opening,pleading,evidence,appeal,execution,specialized',
            'case_id' => 'nullable|exists:cases,id',
            'assigned_lawyer' => 'nullable|exists:users,id',
            'document_ids' => 'nullable|array',
            'document_ids.*' => 'exists:documents,id',
            'formatting_data' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'بيانات غير صحيحة',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = Auth::user();

            // التحقق من صلاحية الوصول للقضية
            if ($request->case_id) {
                $case = CaseModel::find($request->case_id);
                if (!$case || !$this->canAccessCase($user, $case)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'غير مصرح لك بالوصول لهذه القضية'
                    ], 403);
                }
            }

            DB::beginTransaction();

            $memo = LegalMemo::create([
                'title' => $request->title,
                'content' => $request->content ?? '',
                'memo_type' => $request->memo_type,
                'category' => $request->category,
                'case_id' => $request->case_id,
                'created_by' => $user->id,
                'assigned_lawyer' => $request->assigned_lawyer ?? $user->id,
                'status' => 'draft',
                'formatting_data' => $request->formatting_data,
                'ai_analysis_enabled' => true,
            ]);

            // ربط الوثائق إن وجدت
            if ($request->document_ids) {
                foreach ($request->document_ids as $documentId) {
                    $memo->documents()->attach($documentId, [
                        'relation_type' => 'reference'
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'تم إنشاء المذكرة بنجاح',
                'data' => $memo->load(['creator', 'assignedLawyer', 'case', 'documents'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'فشل في إنشاء المذكرة',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * عرض مذكرة محددة
     */
    public function show($id)
    {
        try {
            $user = Auth::user();
            
            $memo = LegalMemo::with([
                'creator', 
                'assignedLawyer', 
                'case', 
                'documents' => function($query) {
                    $query->withPivot(['relation_type', 'notes']);
                }
            ])->find($id);

            if (!$memo) {
                return response()->json([
                    'success' => false,
                    'message' => 'المذكرة غير موجودة'
                ], 404);
            }

            // التحقق من صلاحية الوصول
            if (!$this->canAccessMemo($user, $memo)) {
                return response()->json([
                    'success' => false,
                    'message' => 'غير مصرح لك بالوصول لهذه المذكرة'
                ], 403);
            }

            return response()->json([
                'success' => true,
                'data' => $memo
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل في جلب المذكرة',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * تحديث مذكرة
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'content' => 'sometimes|string',
            'memo_type' => 'sometimes|string',
            'category' => 'sometimes|string|in:opening,pleading,evidence,appeal,execution,specialized',
            'case_id' => 'sometimes|nullable|exists:cases,id',
            'assigned_lawyer' => 'sometimes|nullable|exists:users,id',
            'status' => 'sometimes|string|in:draft,under_review,approved,needs_revision,finalized',
            'document_ids' => 'sometimes|array',
            'document_ids.*' => 'exists:documents,id',
            'formatting_data' => 'sometimes|nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'بيانات غير صحيحة',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = Auth::user();
            
            $memo = LegalMemo::find($id);
            if (!$memo) {
                return response()->json([
                    'success' => false,
                    'message' => 'المذكرة غير موجودة'
                ], 404);
            }

            // التحقق من صلاحية التعديل
            if (!$this->canEditMemo($user, $memo)) {
                return response()->json([
                    'success' => false,
                    'message' => 'غير مصرح لك بتعديل هذه المذكرة'
                ], 403);
            }

            DB::beginTransaction();

            // حفظ البيانات القديمة للمقارنة
            $oldData = [
                'title' => $memo->title,
                'content' => $memo->content,
                'memo_type' => $memo->memo_type,
                'category' => $memo->category
            ];

            $updateData = $request->only([
                'title', 'content', 'memo_type', 'category', 'case_id',
                'assigned_lawyer', 'status', 'formatting_data'
            ]);

            // تحديث المذكرة
            $memo->update($updateData);

            // تحديث الوثائق المرتبطة
            if ($request->has('document_ids')) {
                $memo->documents()->detach();
                foreach ($request->document_ids as $documentId) {
                    $memo->documents()->attach($documentId, [
                        'relation_type' => 'reference'
                    ]);
                }
            }

            // تحديث وقت الحفظ التلقائي عند الحفظ العادي
            $memo->markAutoSaved();

            DB::commit();

            // إرجاع البيانات المحدثة مع معلومات إضافية
            return response()->json([
                'success' => true,
                'message' => 'تم تحديث المذكرة بنجاح',
                'data' => $memo->fresh()->load(['creator', 'assignedLawyer', 'case', 'documents']),
                'metadata' => [
                    'last_saved_at' => $memo->last_auto_saved_at,
                    'needs_reanalysis' => $memo->needs_reanalysis,
                    'has_changes' => $memo->hasContentChanged(),
                    'save_status' => 'saved'
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'فشل في تحديث المذكرة',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * حفظ تلقائي للمذكرة
     */
    public function autoSave(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'content' => 'required|string',
            'formatting_data' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'بيانات غير صحيحة',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = Auth::user();
            
            $memo = LegalMemo::find($id);
            if (!$memo) {
                return response()->json([
                    'success' => false,
                    'message' => 'المذكرة غير موجودة'
                ], 404);
            }

            if (!$this->canEditMemo($user, $memo)) {
                return response()->json([
                    'success' => false,
                    'message' => 'غير مصرح لك بتعديل هذه المذكرة'
                ], 403);
            }

            // حفظ المحتوى القديم للمقارنة
            $oldContent = $memo->content;

            $memo->update([
                'content' => $request->content,
                'formatting_data' => $request->formatting_data,
            ]);

            $memo->markAutoSaved();

            // فحص ما إذا تغير المحتوى
            $hasChanged = $oldContent !== $request->content;

            return response()->json([
                'success' => true,
                'message' => 'تم الحفظ التلقائي',
                'data' => [
                    'last_saved_at' => $memo->last_auto_saved_at,
                    'needs_reanalysis' => $memo->needs_reanalysis,
                    'has_changes' => $hasChanged,
                    'save_status' => 'auto_saved'
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل في الحفظ التلقائي',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * الحصول على حالة الحفظ للمذكرة
     */
    public function getSaveStatus($id)
    {
        try {
            $user = Auth::user();
            
            $memo = LegalMemo::find($id);
            if (!$memo) {
                return response()->json([
                    'success' => false,
                    'message' => 'المذكرة غير موجودة'
                ], 404);
            }

            if (!$this->canAccessMemo($user, $memo)) {
                return response()->json([
                    'success' => false,
                    'message' => 'غير مصرح لك بالوصول لهذه المذكرة'
                ], 403);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'can_save' => $this->canEditMemo($user, $memo),
                    'last_saved_at' => $memo->last_auto_saved_at,
                    'last_updated_at' => $memo->updated_at,
                    'needs_reanalysis' => $memo->needs_reanalysis,
                    'has_analysis' => !empty($memo->analysis_result),
                    'content_hash' => $memo->content_hash,
                    'save_status' => $memo->needsAutoSave() ? 'needs_save' : 'saved'
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل في جلب حالة الحفظ',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * حفظ سريع للمذكرة (يحفظ الحقول الأساسية فقط)
     */
    public function quickSave(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'content' => 'sometimes|string',
            'formatting_data' => 'sometimes|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'بيانات غير صحيحة',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = Auth::user();
            
            $memo = LegalMemo::find($id);
            if (!$memo) {
                return response()->json([
                    'success' => false,
                    'message' => 'المذكرة غير موجودة'
                ], 404);
            }

            if (!$this->canEditMemo($user, $memo)) {
                return response()->json([
                    'success' => false,
                    'message' => 'غير مصرح لك بتعديل هذه المذكرة'
                ], 403);
            }

            // حفظ سريع للحقول المطلوبة فقط
            $updateData = array_filter($request->only(['title', 'content', 'formatting_data']));
            
            if (!empty($updateData)) {
                $memo->update($updateData);
                $memo->markAutoSaved();
            }

            return response()->json([
                'success' => true,
                'message' => 'تم الحفظ بنجاح',
                'data' => [
                    'id' => $memo->id,
                    'title' => $memo->title,
                    'last_saved_at' => $memo->last_auto_saved_at,
                    'needs_reanalysis' => $memo->needs_reanalysis,
                    'save_status' => 'saved'
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل في الحفظ السريع: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * تحليل ذكي للمذكرة
     */
    public function aiAnalysis($id)
    {
        try {
            $user = Auth::user();
            
            $memo = LegalMemo::find($id);
            if (!$memo) {
                return response()->json([
                    'success' => false,
                    'message' => 'المذكرة غير موجودة'
                ], 404);
            }

            if (!$this->canAccessMemo($user, $memo)) {
                return response()->json([
                    'success' => false,
                    'message' => 'غير مصرح لك بالوصول لهذه المذكرة'
                ], 403);
            }

            // TODO: تطبيق التحليل الذكي الفعلي باستخدام AI
            // هذا مجرد مثال للهيكل
            $suggestions = $this->performAiAnalysis($memo);
            $warnings = $this->checkLegalWarnings($memo);

            $memo->markAnalyzed($suggestions, $warnings);

            return response()->json([
                'success' => true,
                'message' => 'تم التحليل الذكي للمذكرة',
                'data' => [
                    'suggestions' => $suggestions,
                    'warnings' => $warnings,
                    'analyzed_at' => $memo->last_analyzed_at
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل في التحليل الذكي',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * حذف مذكرة
     */
    public function destroy($id)
    {
        try {
            $user = Auth::user();
            
            $memo = LegalMemo::find($id);
            if (!$memo) {
                return response()->json([
                    'success' => false,
                    'message' => 'المذكرة غير موجودة'
                ], 404);
            }

            if (!$this->canDeleteMemo($user, $memo)) {
                return response()->json([
                    'success' => false,
                    'message' => 'غير مصرح لك بحذف هذه المذكرة'
                ], 403);
            }

            DB::beginTransaction();
            
            $memo->documents()->detach();
            $memo->delete();
            
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'تم حذف المذكرة بنجاح'
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'فشل في حذف المذكرة',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * إجراء تحليل ذكي للمذكرة باستخدام Gemini AI - مع نظام الخطوات المرئية
     */
    public function smartAnalysis(Request $request, $id)
    {
        // زيادة وقت التنفيذ لطلبات AI
        set_time_limit(180); // 3 دقائق للتحليل المعمق
        ini_set('max_execution_time', 180);
        
        try {
            $memo = LegalMemo::with('documents')->findOrFail($id);
            
            // التحقق من صلاحية الوصول
            $user = Auth::user();
            if (!$this->canAccessMemo($user, $memo)) {
                return response()->json([
                    'success' => false,
                    'message' => 'غير مصرح لك بالوصول لهذه المذكرة'
                ], 403);
            }
            
            // فحص ما إذا كان لديه تحليل صالح بالفعل
            if ($memo->hasValidAnalysis() && !$request->boolean('force_reanalysis')) {
                return response()->json([
                    'success' => true,
                    'message' => 'تم استرجاع التحليل المحفوظ بنجاح - لم يتم تغيير المحتوى',
                    'data' => [
                        'memo' => $memo->fresh(),
                        'analysis_result' => $memo->analysis_result,
                        'from_cache' => true,
                        'last_analyzed_at' => $memo->last_analyzed_at,
                        'analysis_steps' => [
                            [
                                'step' => 1,
                                'title' => 'استرجاع التحليل المحفوظ',
                                'status' => 'completed',
                                'result' => 'تم العثور على تحليل سابق صالح'
                            ]
                        ]
                    ]
                ]);
            }
            
            // إجراء تحليل جديد مع عرض الخطوات
            $analysisService = new LegalMemoAnalysisService();
            
            // بدء التحليل المرحلي
            $analysisResult = $analysisService->analyzeWithGemini($memo);
            
            // تحديد نوع التحليل بناءً على وجود الوثائق
            $analysisType = $memo->documents && $memo->documents->count() > 0 ? 'with_documents' : 'memo_only';
            
            // حفظ نتائج التحليل باستخدام النموذج المحسن
            $memo->markAnalysisComplete($analysisResult);
            $memo->analysis_type = $analysisType;
            $memo->save();
            
            return response()->json([
                'success' => true,
                'message' => 'تم إجراء التحليل الذكي الجديد بنجاح',
                'data' => [
                    'memo' => $memo->fresh(),
                    'analysis_result' => $analysisResult,
                    'from_cache' => false,
                    'last_analyzed_at' => now(),
                    'analysis_type' => $analysisType,
                    'total_steps' => isset($analysisResult['analysis_steps']) ? count($analysisResult['analysis_steps']) : 1
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل في إجراء التحليل الذكي: ' . $e->getMessage(),
                'error' => $e->getMessage(),
                'analysis_steps' => [
                    [
                        'step' => 1,
                        'title' => 'خطأ في التحليل',
                        'status' => 'error',
                        'result' => $e->getMessage()
                    ]
                ]
            ], 500);
        }
    }

    // Helper Methods

    private function canAccessCase($user, $case): bool
    {
        if ($user->role === 'admin') return true;
        if ($user->role === 'client') return $case->client_id === $user->id;
        if ($user->role === 'lawyer') {
            return $case->lawyers()->where('lawyer_id', $user->id)->exists();
        }
        return false;
    }

    private function canAccessMemo($user, $memo): bool
    {
        if ($user->role === 'admin') return true;
        
        if ($memo->case_id && !$this->canAccessCase($user, $memo->case)) {
            return false;
        }

        return $memo->created_by === $user->id || 
               $memo->assigned_lawyer === $user->id;
    }

    private function canEditMemo($user, $memo): bool
    {
        if ($user->role === 'admin') return true;
        
        // العميل لا يمكنه تعديل المذكرات
        if ($user->role === 'client') return false;
        
        return $memo->created_by === $user->id || 
               $memo->assigned_lawyer === $user->id;
    }

    private function canDeleteMemo($user, $memo): bool
    {
        if ($user->role === 'admin') return true;
        
        // فقط منشئ المذكرة يمكنه حذفها
        return $memo->created_by === $user->id;
    }

    private function performAiAnalysis($memo): array
    {
        // TODO: تطبيق التحليل الذكي الفعلي
        return [
            'grammar_suggestions' => [],
            'legal_structure_recommendations' => [],
            'citation_suggestions' => [],
            'completeness_score' => 85
        ];
    }

    private function checkLegalWarnings($memo): array
    {
        // TODO: فحص التحذيرات القانونية
        return [
            'missing_citations' => [],
            'procedural_issues' => [],
            'deadline_warnings' => []
        ];
    }

    private function generateRecommendations($memo, $analysis, $warnings): array
    {
        return [
            'structure_improvements' => [
                'اقتراح إضافة مقدمة أكثر وضوحاً',
                'تنظيم الحجج القانونية في نقاط مرقمة',
                'إضافة خلاصة في نهاية المذكرة'
            ],
            'content_suggestions' => [
                'الاستشهاد بالمواد القانونية ذات الصلة',
                'تعزيز الحجج بالسوابق القضائية',
                'مراجعة الأسلوب القانوني'
            ],
            'priority_level' => 'متوسطة'
        ];
    }

    /**
     * إنشاء مذكرة جديدة مع الملفات المرفقة
     */
    public function storeWithFiles(Request $request)
    {
        try {
            DB::beginTransaction();

            // تسجيل معلومات الطلب الخام
            Log::info('Raw request info:', [
                'content_type' => $request->header('Content-Type'),
                'method' => $request->method(),
                'all_keys' => array_keys($request->all()),
                'file_keys' => array_keys($request->allFiles()),
                'raw_content' => substr($request->getContent(), 0, 500),
                'query_params' => $request->query->all(),
                'request_params' => $request->request->all()
            ]);

            // تسجيل البيانات المرسلة للتشخيص
            $title = $this->getFormDataField($request, 'title');
            $content = $this->getFormDataField($request, 'content');
            $memo_type = $this->getFormDataField($request, 'memo_type');
            $category = $this->getFormDataField($request, 'category');
            
            Log::info('Create memo with files request data:', [
                'title' => $title,
                'content' => substr($content ?? '', 0, 100) . '...',
                'memo_type' => $memo_type,
                'category' => $category,
                'has_files' => $request->hasFile('files'),
                'files_count' => $this->getFilesCount($request),
                'all_data' => array_keys($request->all()),
                'content_type' => $request->header('Content-Type'),
                'method' => $request->method()
            ]);

            // تسجيل تفاصيل الملفات
            if ($request->hasFile('files')) {
                $uploadedFiles = $this->getUploadedFiles($request);
                Log::info('Files details for creation:', [
                    'files' => collect($uploadedFiles)->map(function($file) {
                        return [
                            'original_name' => $file->getClientOriginalName(),
                            'size' => $file->getSize(),
                            'mime_type' => $file->getClientMimeType(),
                            'is_valid' => $file->isValid(),
                            'error' => $file->getError()
                        ];
                    })->toArray()
                ]);
            }

            // إنشاء مصفوفة البيانات للتحقق
            $data = [
                'title' => $title,
                'content' => $content,
                'memo_type' => $memo_type,
                'category' => $category,
                'case_id' => $this->getFormDataField($request, 'case_id'),
            ];

            // إضافة الملفات إن وجدت
            if ($request->hasFile('files')) {
                $data['files'] = $request->file('files');
            }

            // التحقق من صحة البيانات الأساسية - مبسط للاختبار
            $validator = Validator::make($data, [
                'title' => 'required|string|max:255',
                'content' => 'required|string',
                'memo_type' => 'required|string',
                'category' => 'required|string',
                'case_id' => 'nullable|exists:cases,id',
                'files' => 'nullable|array',
                'files.*' => 'nullable|file|max:20480', // 20MB max, remove strict mime check for debugging
            ]);

            if ($validator->fails()) {
                Log::error('Validation failed for storeWithFiles:', [
                    'errors' => $validator->errors()->toArray(),
                    'request_data' => $request->except(['files']),
                    'has_files' => $request->hasFile('files'),
                    'files_count' => $request->hasFile('files') ? count($request->file('files')) : 0
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'بيانات غير صالحة',
                    'errors' => $validator->errors(),
                    'debug' => [
                        'has_files' => $request->hasFile('files'),
                        'files_count' => $request->hasFile('files') ? count($request->file('files')) : 0
                    ]
                ], 422);
            }

            // إنشاء المذكرة
            $memo = LegalMemo::create([
                'title' => $title,
                'content' => $content,
                'memo_type' => $memo_type,
                'category' => $category,
                'case_id' => $this->getFormDataField($request, 'case_id'),
                'created_by' => Auth::id(),
                'status' => 'draft',
                'formatting_data' => $this->getFormDataField($request, 'formatting_data') ? json_decode($this->getFormDataField($request, 'formatting_data'), true) : null,
            ]);

            // معالجة الملفات المرفوعة
            if ($request->hasFile('files')) {
                Log::info('Processing files for memo creation');
                $uploadedFiles = $this->getUploadedFiles($request);
                foreach ($uploadedFiles as $index => $file) {
                    try {
                        Log::info("Processing file {$index}:", [
                            'name' => $file->getClientOriginalName(),
                            'size' => $file->getSize(),
                            'mime' => $file->getClientMimeType()
                        ]);

                        // حفظ الملف
                        $fileName = time() . '_' . $file->getClientOriginalName();
                        $filePath = $file->storeAs('legal-memos/' . $memo->id, $fileName, 'public');
                        
                        Log::info("File stored successfully:", [
                            'original_name' => $file->getClientOriginalName(),
                            'stored_name' => $fileName,
                            'path' => $filePath
                        ]);

                        // إنشاء سجل في جدول الوثائق
                        $document = \App\Models\Document::create([
                            'title' => $file->getClientOriginalName(),
                            'file_name' => $fileName,
                            'mime_type' => $file->getClientMimeType(),
                            'file_path' => $filePath,
                            'file_size' => $file->getSize(),
                            'category' => 'other',
                            'case_id' => $request->case_id,
                            'uploaded_by' => Auth::id(),
                            'memo_id' => $memo->id, // ربط الوثيقة بالمذكرة
                        ]);

                        Log::info("Document record created:", ['document_id' => $document->id]);

                    } catch (\Exception $e) {
                        Log::error("Error processing file {$index}:", [
                            'error' => $e->getMessage(),
                            'file_name' => $file->getClientOriginalName()
                        ]);
                        throw $e;
                    }
                }
            }

            // معالجة الوثائق المحددة مسبقاً
            if ($request->document_ids) {
                $documentIds = json_decode($request->document_ids, true);
                if (is_array($documentIds)) {
                    $memo->documents()->attach($documentIds);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'تم إنشاء المذكرة مع الملفات بنجاح',
                'data' => $memo->load(['creator', 'assignedLawyer', 'case', 'documents'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'خطأ في إنشاء المذكرة: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * تحديث مذكرة موجودة مع الملفات المرفقة
     */
    public function updateWithFiles(Request $request, $id)
    {
        try {
            DB::beginTransaction();

            // تسجيل البيانات المرسلة للتشخيص
            $title = $this->getFormDataField($request, 'title');
            $content = $this->getFormDataField($request, 'content');
            $memo_type = $this->getFormDataField($request, 'memo_type');
            $category = $this->getFormDataField($request, 'category');
            
            Log::info('Update memo with files request data:', [
                'memo_id' => $id,
                'title' => $title,
                'content' => substr($content ?? '', 0, 100) . '...',
                'memo_type' => $memo_type,
                'category' => $category,
                'has_files' => $request->hasFile('files'),
                'files_count' => $request->hasFile('files') ? count($request->file('files')) : 0,
                'all_data' => array_keys($request->all()),
                'content_type' => $request->header('Content-Type'),
                'method' => $request->method()
            ]);

            $memo = LegalMemo::findOrFail($id);
            
            // التحقق من صلاحية التعديل
            $user = Auth::user();
            if (!$this->canEditMemo($user, $memo)) {
                return response()->json([
                    'success' => false,
                    'message' => 'غير مصرح لك بتعديل هذه المذكرة'
                ], 403);
            }

            // تسجيل تفاصيل الملفات
            if ($request->hasFile('files')) {
                Log::info('Files details:', [
                    'files' => collect($request->file('files'))->map(function($file) {
                        return [
                            'original_name' => $file->getClientOriginalName(),
                            'size' => $file->getSize(),
                            'mime_type' => $file->getClientMimeType(),
                            'is_valid' => $file->isValid(),
                            'error' => $file->getError()
                        ];
                    })->toArray()
                ]);
            }

            // إنشاء مصفوفة البيانات للتحقق
            $data = [
                'title' => $title,
                'content' => $content,
                'memo_type' => $memo_type,
                'category' => $category,
            ];

            // إضافة الملفات إن وجدت
            if ($request->hasFile('files')) {
                $data['files'] = $request->file('files');
            }

            // التحقق من صحة البيانات الأساسية - مبسط للاختبار
            $validator = Validator::make($data, [
                'title' => 'required|string|max:255',
                'content' => 'required|string',
                'memo_type' => 'required|string',
                'category' => 'required|string',
                'files' => 'nullable|array',
                'files.*' => 'nullable|file|max:20480', // 20MB max, remove strict mime check for debugging
            ]);

            if ($validator->fails()) {
                Log::error('Validation failed for updateWithFiles:', [
                    'errors' => $validator->errors()->toArray(),
                    'request_data' => $request->except(['files']),
                    'has_files' => $request->hasFile('files'),
                    'files_count' => $request->hasFile('files') ? count($request->file('files')) : 0
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'بيانات غير صالحة',
                    'errors' => $validator->errors(),
                    'debug' => [
                        'has_files' => $request->hasFile('files'),
                        'files_count' => $request->hasFile('files') ? count($request->file('files')) : 0
                    ]
                ], 422);
            }

            // تحديث المذكرة
            $memo->update([
                'title' => $title,
                'content' => $content,
                'memo_type' => $memo_type,
                'category' => $category,
                'formatting_data' => $this->getFormDataField($request, 'formatting_data') ? json_decode($this->getFormDataField($request, 'formatting_data'), true) : null,
                'needs_reanalysis' => true, // تحديد أن المذكرة تحتاج إعادة تحليل
            ]);

            // معالجة الملفات المرفوعة الجديدة
            if ($request->hasFile('files')) {
                Log::info('Processing files for memo update');
                foreach ($request->file('files') as $index => $file) {
                    try {
                        Log::info("Processing update file {$index}:", [
                            'name' => $file->getClientOriginalName(),
                            'size' => $file->getSize(),
                            'mime' => $file->getClientMimeType()
                        ]);

                        // حفظ الملف
                        $fileName = time() . '_' . $file->getClientOriginalName();
                        $filePath = $file->storeAs('legal-memos/' . $memo->id, $fileName, 'public');
                        
                        Log::info("Update file stored successfully:", [
                            'original_name' => $file->getClientOriginalName(),
                            'stored_name' => $fileName,
                            'path' => $filePath
                        ]);

                        // إنشاء سجل في جدول الوثائق
                        $document = \App\Models\Document::create([
                            'title' => $file->getClientOriginalName(),
                            'file_name' => $fileName,
                            'mime_type' => $file->getClientMimeType(),
                            'file_path' => $filePath,
                            'file_size' => $file->getSize(),
                            'category' => 'other',
                            'case_id' => $memo->case_id,
                            'uploaded_by' => Auth::id(),
                            'memo_id' => $memo->id,
                        ]);

                        Log::info("Update document record created:", ['document_id' => $document->id]);

                    } catch (\Exception $e) {
                        Log::error("Error processing update file {$index}:", [
                            'error' => $e->getMessage(),
                            'file_name' => $file->getClientOriginalName()
                        ]);
                        throw $e;
                    }
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'تم تحديث المذكرة مع الملفات بنجاح',
                'data' => $memo->fresh()->load(['creator', 'assignedLawyer', 'case', 'documents'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'خطأ في تحديث المذكرة: ' . $e->getMessage()
            ], 500);
        }
    }


}
