<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ActivityController extends Controller
{
    public function index(Request $request)
    {
        $query = Activity::with(['performer', 'case', 'task']);
        $user = Auth::user();

        // تطبيق فلتر الصلاحيات حسب دور المستخدم
        if ($user->role === 'client') {
            // العميل يرى أنشطة قضاياه فقط
            $query->whereHas('case', function($q) use ($user) {
                $q->where('client_id', $user->id);
            });
        } elseif ($user->role === 'lawyer') {
            // المحامي يرى أنشطة القضايا المكلف بها أو المهام المكلف بها
            $query->where(function($q) use ($user) {
                $q->whereHas('case.lawyers', function($subQ) use ($user) {
                    $subQ->where('lawyer_id', $user->id);
                })->orWhereHas('task', function($subQ) use ($user) {
                    $subQ->where('assigned_to', $user->id);
                })->orWhere('user_id', $user->id); // أو الأنشطة التي قام بها
            });
        } elseif ($user->role === 'legal_assistant') {
            // المساعد القانوني يرى أنشطة المهام المكلف بها أو التي قام بها
            $query->where(function($q) use ($user) {
                $q->whereHas('task', function($subQ) use ($user) {
                    $subQ->where('assigned_to', $user->id);
                })->orWhere('user_id', $user->id);
            });
        }
        // الأدمن يرى كل الأنشطة (لا حاجة لفلترة)

        if ($request->has('case_id')) {
            $query->where('case_id', $request->case_id);
        }

        if ($request->has('task_id')) {
            $query->where('task_id', $request->task_id);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('action')) {
            $query->where('action', $request->action);
        }

        $activities = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $activities
        ]);
    }

    public function store(Request $request)
    {
        $activity = Activity::create([
            'type' => $request->type ?? 'quick_action', // إضافة النوع مع قيمة افتراضية
            'title' => $request->title,
            'action' => $request->action,
            'description' => $request->description,
            'case_id' => $request->case_id,
            'task_id' => $request->task_id,
            'metadata' => $request->metadata,
            'performed_by' => Auth::id() // استخدام performed_by بدلاً من user_id
        ]);

        $activity->load(['performer', 'case', 'task']);

        return response()->json([
            'success' => true,
            'data' => $activity
        ], 201);
    }

    public function show($id)
    {
        $user = Auth::user();
        
        $query = Activity::with(['performer', 'case', 'task']);

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
                })->orWhere('user_id', $user->id);
            });
        } elseif ($user->role === 'legal_assistant') {
            $query->where(function($q) use ($user) {
                $q->whereHas('task', function($subQ) use ($user) {
                    $subQ->where('assigned_to', $user->id);
                })->orWhere('user_id', $user->id);
            });
        }

        $activity = $query->find($id);

        if (!$activity) {
            return response()->json([
                'success' => false,
                'message' => 'النشاط غير موجود أو ليس لديك صلاحية للوصول إليه'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $activity
        ]);
    }

    /**
     * Get activities for a specific case
     */
    public function getCaseActivities($caseId)
    {
        try {
            $activities = Activity::where('case_id', $caseId)
                ->with(['performer'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function($activity) {
                    return [
                        'id' => $activity->id,
                        'type' => $activity->type,
                        'title' => $activity->title,
                        'description' => $activity->description,
                        'date' => $activity->created_at,
                        'user' => $activity->performer ? $activity->performer->name : 'النظام',
                        'metadata' => $activity->metadata
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $activities
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل في جلب الأنشطة: ' . $e->getMessage()
            ], 500);
        }
    }
}
