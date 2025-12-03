<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CaseModel;
use App\Models\Task;
use App\Models\Document;
use App\Models\Activity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class ClientController extends Controller
{
    /**
     * لوحة تحكم العميل - عرض ملخص قضاياه
     */
    public function dashboard()
    {
        try {
            $user = Auth::user();
            
            if ($user->role !== 'client') {
                return response()->json([
                    'success' => false,
                    'message' => 'غير مصرح لك بالوصول'
                ], 403);
            }

            // إحصائيات القضايا
            $totalCases = CaseModel::where('client_id', $user->id)->count();
            $activeCases = CaseModel::where('client_id', $user->id)->where('status', 'active')->count();
            $closedCases = CaseModel::where('client_id', $user->id)->where('status', 'closed')->count();
            
            // المهام المعلقة
            $pendingTasks = Task::whereHas('case', function($q) use ($user) {
                $q->where('client_id', $user->id);
            })->where('status', 'pending')->count();

            // المواعيد القادمة
            $upcomingHearings = CaseModel::where('client_id', $user->id)
                ->whereNotNull('next_hearing')
                ->where('next_hearing', '>=', now())
                ->orderBy('next_hearing', 'asc')
                ->limit(5)
                ->get(['id', 'title', 'next_hearing', 'court']);

            // آخر الأنشطة
            $recentActivities = Activity::whereHas('case', function($q) use ($user) {
                $q->where('client_id', $user->id);
            })
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->with(['performer', 'case'])
            ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'statistics' => [
                        'total_cases' => $totalCases,
                        'active_cases' => $activeCases,
                        'closed_cases' => $closedCases,
                        'pending_tasks' => $pendingTasks
                    ],
                    'upcoming_hearings' => $upcomingHearings,
                    'recent_activities' => $recentActivities
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في جلب البيانات: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * عرض قضايا العميل
     */
    public function myCases(Request $request)
    {
        try {
            $user = Auth::user();
            
            if ($user->role !== 'client') {
                return response()->json([
                    'success' => false,
                    'message' => 'غير مصرح لك بالوصول'
                ], 403);
            }

            $query = CaseModel::where('client_id', $user->id)
                ->with(['assignedLawyers', 'documents', 'tasks']);

            // التصفية حسب الحالة
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // البحث
            if ($request->has('search')) {
                $query->where(function($q) use ($request) {
                    $q->where('title', 'like', '%' . $request->search . '%')
                      ->orWhere('description', 'like', '%' . $request->search . '%')
                      ->orWhere('file_number', 'like', '%' . $request->search . '%');
                });
            }

            $cases = $query->orderBy('created_at', 'desc')
                ->paginate($request->get('per_page', 10));

            return response()->json([
                'success' => true,
                'data' => $cases
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في جلب القضايا: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * عرض تفاصيل قضية معينة للعميل
     */
    public function getCaseDetails($caseId)
    {
        try {
            $user = Auth::user();
            
            if ($user->role !== 'client') {
                return response()->json([
                    'success' => false,
                    'message' => 'غير مصرح لك بالوصول'
                ], 403);
            }

            $case = CaseModel::where('id', $caseId)
                ->where('client_id', $user->id)
                ->with([
                    'assignedLawyers',
                    'documents' => function($q) {
                        $q->orderBy('created_at', 'desc');
                    },
                    'tasks' => function($q) {
                        $q->orderBy('due_date', 'asc');
                    },
                    'activities' => function($q) {
                        $q->orderBy('created_at', 'desc')->limit(20);
                    }
                ])
                ->first();

            if (!$case) {
                return response()->json([
                    'success' => false,
                    'message' => 'القضية غير موجودة أو غير مصرح لك بالوصول إليها'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $case
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في جلب تفاصيل القضية: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * عرض المخطط الزمني لقضية معينة
     */
    public function getCaseTimeline($caseId)
    {
        try {
            $user = Auth::user();
            
            if ($user->role !== 'client') {
                return response()->json([
                    'success' => false,
                    'message' => 'غير مصرح لك بالوصول'
                ], 403);
            }

            $case = CaseModel::where('id', $caseId)
                ->where('client_id', $user->id)
                ->first();

            if (!$case) {
                return response()->json([
                    'success' => false,
                    'message' => 'القضية غير موجودة أو غير مصرح لك بالوصول إليها'
                ], 404);
            }

            // جمع الأحداث من مصادر مختلفة
            $timeline = collect();

            // إضافة أنشطة القضية
            $activities = Activity::where('case_id', $caseId)
                ->with('performer')
                ->get()
                ->map(function($activity) {
                    return [
                        'id' => $activity->id,
                        'type' => 'activity',
                        'title' => $activity->description,
                        'description' => $activity->details,
                        'date' => $activity->created_at,
                        'user' => $activity->performer ? $activity->performer->name : 'النظام',
                        'priority' => $activity->priority ?? 'medium'
                    ];
                });

            // إضافة المهام
            $tasks = Task::where('case_id', $caseId)
                ->get()
                ->map(function($task) {
                    return [
                        'id' => $task->id,
                        'type' => 'task',
                        'title' => $task->title,
                        'description' => $task->description,
                        'date' => $task->due_date ?? $task->created_at,
                        'status' => $task->status,
                        'priority' => $task->priority
                    ];
                });

            // إضافة الوثائق
            $documents = Document::where('case_id', $caseId)
                ->with('uploadedBy')
                ->get()
                ->map(function($document) {
                    return [
                        'id' => $document->id,
                        'type' => 'document',
                        'title' => 'تم رفع وثيقة: ' . $document->title,
                        'description' => $document->category,
                        'date' => $document->created_at,
                        'user' => $document->uploadedBy ? $document->uploadedBy->name : 'غير معروف',
                        'file_name' => $document->file_name
                    ];
                });

            // دمج جميع الأحداث وترتيبها حسب التاريخ
            $timeline = $timeline->merge($activities)
                                ->merge($tasks)
                                ->merge($documents)
                                ->sortByDesc('date')
                                ->values();

            return response()->json([
                'success' => true,
                'data' => [
                    'case' => $case,
                    'timeline' => $timeline
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في جلب المخطط الزمني: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * رفع وثيقة للقضية
     */
    public function uploadDocument(Request $request, $caseId)
    {
        try {
            $user = Auth::user();
            
            if ($user->role !== 'client') {
                return response()->json([
                    'success' => false,
                    'message' => 'غير مصرح لك بالوصول'
                ], 403);
            }

            $case = CaseModel::where('id', $caseId)
                ->where('client_id', $user->id)
                ->first();

            if (!$case) {
                return response()->json([
                    'success' => false,
                    'message' => 'القضية غير موجودة أو غير مصرح لك بالوصول إليها'
                ], 404);
            }

            $request->merge(['case_id' => $caseId]);
            
            // استخدام DocumentController لرفع الوثيقة
            $documentController = new DocumentController();
            return $documentController->store($request);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في رفع الوثيقة: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * عرض وثائق العميل
     */
    public function myDocuments(Request $request)
    {
        try {
            $user = Auth::user();
            
            if ($user->role !== 'client') {
                return response()->json([
                    'success' => false,
                    'message' => 'غير مصرح لك بالوصول'
                ], 403);
            }

            $query = Document::whereHas('case', function($q) use ($user) {
                $q->where('client_id', $user->id);
            })->with(['case', 'uploadedBy']);

            // التصفية حسب القضية
            if ($request->has('case_id')) {
                $query->where('case_id', $request->case_id);
            }

            // البحث
            if ($request->has('search')) {
                $query->where(function($q) use ($request) {
                    $q->where('title', 'like', '%' . $request->search . '%')
                      ->orWhere('file_name', 'like', '%' . $request->search . '%');
                });
            }

            $documents = $query->orderBy('created_at', 'desc')
                ->paginate($request->get('per_page', 15));

            return response()->json([
                'success' => true,
                'data' => $documents
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في جلب الوثائق: ' . $e->getMessage()
            ], 500);
        }
    }
}
