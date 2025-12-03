<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class TaskController extends Controller
{
    /**
     * عرض جميع المهام
     */
    public function index(Request $request)
    {
        try {
            $query = Task::query();
            $user = Auth::user();

            // تطبيق فلتر الصلاحيات حسب دور المستخدم
            if ($user->role === 'client') {
                // العميل يرى فقط المهام المتعلقة بقضاياه
                $query->whereHas('case', function($q) use ($user) {
                    $q->where('client_id', $user->id);
                });
            } elseif ($user->role === 'lawyer') {
                // المحامي يرى المهام المكلف بها أو المهام في القضايا المكلف بها
                $query->where(function($q) use ($user) {
                    $q->where('assigned_to', $user->id)
                      ->orWhereHas('case.lawyers', function($subQ) use ($user) {
                          $subQ->where('lawyer_id', $user->id);
                      });
                });
            } elseif ($user->role === 'legal_assistant') {
                // المساعد القانوني يرى المهام المكلف بها فقط
                $query->where('assigned_to', $user->id);
            }
            // الأدمن يرى كل المهام (لا حاجة لفلترة)

            // التصفية حسب الحالة
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // التصفية حسب الأولوية
            if ($request->has('priority')) {
                $query->where('priority', $request->priority);
            }

            // التصفية حسب النوع
            if ($request->has('type')) {
                $query->where('type', $request->type);
            }

            // التصفية حسب القضية
            if ($request->has('case_id')) {
                $query->where('case_id', $request->case_id);
            }

            // التصفية حسب المستخدم المكلف
            if ($request->has('assigned_to')) {
                $query->where('assigned_to', $request->assigned_to);
            }

            // البحث في العنوان والوصف
            if ($request->has('search')) {
                $query->where(function($q) use ($request) {
                    $q->where('title', 'like', '%' . $request->search . '%')
                      ->orWhere('description', 'like', '%' . $request->search . '%');
                });
            }

            // الترتيب
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // التصفح
            $perPage = $request->get('per_page', 15);
            $tasks = $query->paginate($perPage);

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

    /**
     * إنشاء مهمة جديدة
     */
    public function store(Request $request)
    {
        // Log the incoming request data for debugging
        \Illuminate\Support\Facades\Log::info('Task creation request data:', $request->all());
        
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'nullable|string|in:review,research,consultation,court,document,meeting,other',
            'case_id' => 'required|exists:cases,id',
            'assigned_to' => 'required|exists:users,id',
            'priority' => 'required|in:low,medium,high,urgent',
            'due_date' => 'required|date|after:now',
            'estimated_hours' => 'nullable|numeric|min:0',
            'tags' => 'nullable|array'
        ]);

        if ($validator->fails()) {
            \Illuminate\Support\Facades\Log::error('Task validation failed:', $validator->errors()->toArray());
            return response()->json([
                'success' => false,
                'message' => 'بيانات غير صحيحة',
                'errors' => $validator->errors()
            ], 422);
        }

        \Illuminate\Support\Facades\Log::info('Task validation passed, attempting to create task');

        $task = Task::create([
            'title' => $request->title,
            'description' => $request->description,
            'type' => $request->type ?? 'other',
            'case_id' => $request->case_id,
            'assigned_to' => $request->assigned_to,
            'assigned_by' => Auth::id(),
            'status' => 'todo',
            'priority' => $request->priority,
            'due_date' => $request->due_date,
            'estimated_hours' => $request->estimated_hours,
            'tags' => $request->tags
        ]);

        $task->load(['case', 'assignee', 'assigner']);

        // إطلاق حدث تعيين المهمة
        event(new \App\Events\TaskAssigned($task, $task->assignee));

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء المهمة بنجاح',
            'data' => $task
        ], 201);
    }

    /**
     * عرض مهمة محددة
     */
    public function show($id)
    {
        $user = Auth::user();
        
        $query = Task::with([
            'case', 
            'assignee', 
            'assigner', 
            'documents', 
            'comments.user'
        ]);

        // تطبيق نفس فلترة الصلاحيات
        if ($user->role === 'client') {
            $query->whereHas('case', function($q) use ($user) {
                $q->where('client_id', $user->id);
            });
        } elseif ($user->role === 'lawyer') {
            $query->where(function($q) use ($user) {
                $q->where('assigned_to', $user->id)
                  ->orWhereHas('case.lawyers', function($subQ) use ($user) {
                      $subQ->where('lawyer_id', $user->id);
                  });
            });
        } elseif ($user->role === 'legal_assistant') {
            $query->where('assigned_to', $user->id);
        }

        $task = $query->find($id);

        if (!$task) {
            return response()->json([
                'success' => false,
                'message' => 'المهمة غير موجودة أو ليس لديك صلاحية للوصول إليها'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $task
        ]);
    }

    /**
     * تحديث مهمة
     */
    public function update(Request $request, $id)
    {
        $task = Task::find($id);

        if (!$task) {
            return response()->json([
                'success' => false,
                'message' => 'المهمة غير موجودة'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'nullable|string|in:review,research,consultation,court,document,meeting,other',
            'assigned_to' => 'required|exists:users,id',
            'status' => 'required|in:todo,pending,in_progress,review,completed,cancelled,overdue',
            'priority' => 'required|in:low,medium,high,urgent',
            'due_date' => 'required|date',
            'estimated_hours' => 'nullable|numeric|min:0',
            'actual_hours' => 'nullable|numeric|min:0',
            'tags' => 'nullable|array'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'بيانات غير صحيحة',
                'errors' => $validator->errors()
            ], 422);
        }

        // تحديث تاريخ الإكمال عند تغيير الحالة إلى مكتملة
        $updateData = $request->all();
        if ($request->status === 'completed' && $task->status !== 'completed') {
            $updateData['completed_at'] = now();
        } elseif ($request->status !== 'completed') {
            $updateData['completed_at'] = null;
        }

        $task->update($updateData);
        $task->load(['case', 'assignee', 'assigner']);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث المهمة بنجاح',
            'data' => $task
        ]);
    }

    /**
     * حذف مهمة
     */
    public function destroy($id)
    {
        $task = Task::find($id);

        if (!$task) {
            return response()->json([
                'success' => false,
                'message' => 'المهمة غير موجودة'
            ], 404);
        }

        $task->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف المهمة بنجاح'
        ]);
    }

    /**
     * تحديث حالة المهمة
     */
    public function updateStatus(Request $request, $id)
    {
        $task = Task::find($id);

        if (!$task) {
            return response()->json([
                'success' => false,
                'message' => 'المهمة غير موجودة'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:todo,pending,in_progress,review,completed,cancelled,overdue',
            'notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'بيانات غير صحيحة',
                'errors' => $validator->errors()
            ], 422);
        }

        $updateData = ['status' => $request->status];

        // تحديث تاريخ الإكمال
        if ($request->status === 'completed' && $task->status !== 'completed') {
            $updateData['completed_at'] = now();
            
            // تحديث المهمة أولاً
            $task->update($updateData);
            
            // إطلاق حدث إنجاز المهمة
            event(new \App\Events\TaskCompleted($task));
        } elseif ($request->status !== 'completed') {
            $updateData['completed_at'] = null;
            $task->update($updateData);
        } else {
            $task->update($updateData);
        }

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث حالة المهمة بنجاح',
            'data' => $task
        ]);
    }

    /**
     * إعادة تعيين المهمة لمستخدم آخر
     */
    public function reassign(Request $request, $id)
    {
        $task = Task::find($id);

        if (!$task) {
            return response()->json([
                'success' => false,
                'message' => 'المهمة غير موجودة'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'assigned_to' => 'required|exists:users,id',
            'notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'بيانات غير صحيحة',
                'errors' => $validator->errors()
            ], 422);
        }

        $task->update([
            'assigned_to' => $request->assigned_to,
            'status' => 'pending' // إعادة تعيين الحالة عند إعادة التكليف
        ]);

        $task->load(['assignedTo']);

        return response()->json([
            'success' => true,
            'message' => 'تم إعادة تعيين المهمة بنجاح',
            'data' => $task
        ]);
    }

    /**
     * مهام المستخدم الحالي
     */
    public function myTasks(Request $request)
    {
        $userId = Auth::id();
        
        $query = Task::with(['case', 'createdBy'])
            ->where('assigned_to', $userId);

        // التصفية حسب الحالة
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // التصفية حسب الأولوية
        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }

        $tasks = $query->orderBy('due_date', 'asc')->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $tasks
        ]);
    }

    /**
     * المهام المتأخرة
     */
    public function overdueTasks()
    {
        $tasks = Task::with(['case', 'assignedTo'])
            ->where('due_date', '<', now())
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->orderBy('due_date', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $tasks
        ]);
    }

    /**
     * إحصائيات المهام
     */
    public function statistics()
    {
        $stats = [
            'total_tasks' => Task::count(),
            'pending_tasks' => Task::where('status', 'pending')->count(),
            'in_progress_tasks' => Task::where('status', 'in_progress')->count(),
            'completed_tasks' => Task::where('status', 'completed')->count(),
            'overdue_tasks' => Task::where('due_date', '<', now())
                ->whereNotIn('status', ['completed', 'cancelled'])->count(),
            'urgent_tasks' => Task::where('priority', 'urgent')
                ->whereNotIn('status', ['completed', 'cancelled'])->count(),
            'tasks_by_priority' => Task::selectRaw('priority, COUNT(*) as count')
                ->groupBy('priority')
                ->pluck('count', 'priority'),
            'tasks_by_status' => Task::selectRaw('status, COUNT(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status'),
            'completion_rate' => Task::where('status', 'completed')->count() / max(Task::count(), 1) * 100
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * تحديث حالة المهمة
     */
    public function updateTaskStatus(Request $request, $id)
    {
        try {
            $task = Task::find($id);
            
            if (!$task) {
                return response()->json([
                    'success' => false,
                    'message' => 'المهمة غير موجودة'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'status' => 'required|in:todo,pending,in_progress,review,completed,cancelled,overdue',
                'notes' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'بيانات غير صحيحة',
                    'errors' => $validator->errors()
                ], 422);
            }

            // تحديث تاريخ الإكمال عند تغيير الحالة إلى مكتملة
            $updateData = $request->only(['status', 'notes']);
            if ($request->status === 'completed' && $task->status !== 'completed') {
                $updateData['completed_at'] = now();
            } elseif ($request->status !== 'completed') {
                $updateData['completed_at'] = null;
            }

            $task->update($updateData);
            $task->load(['case', 'assignee', 'assigner']);

            return response()->json([
                'success' => true,
                'message' => 'تم تحديث حالة المهمة بنجاح',
                'data' => $task
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في تحديث حالة المهمة',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * تعيين المهمة لمستخدم
     */
    public function assignTask(Request $request, $id)
    {
        try {
            $task = Task::find($id);
            
            if (!$task) {
                return response()->json([
                    'success' => false,
                    'message' => 'المهمة غير موجودة'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'assigned_to' => 'required|exists:users,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'بيانات غير صحيحة',
                    'errors' => $validator->errors()
                ], 422);
            }

            $task->update([
                'assigned_to' => $request->assigned_to
            ]);
            
            $task->load(['case', 'assignee', 'assigner']);

            return response()->json([
                'success' => true,
                'message' => 'تم تعيين المهمة بنجاح',
                'data' => $task
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في تعيين المهمة',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * جلب إحصائيات المهام
     */
    public function getTaskStatistics()
    {
        try {
            $user = Auth::user();
            
            // تطبيق نفس فلترة الصلاحيات للإحصائيات
            $query = Task::query();
            
            if ($user->role === 'client') {
                $query->whereHas('case', function($q) use ($user) {
                    $q->where('client_id', $user->id);
                });
            } elseif ($user->role === 'lawyer') {
                $query->where(function($q) use ($user) {
                    $q->where('assigned_to', $user->id)
                      ->orWhereHas('case.lawyers', function($subQ) use ($user) {
                          $subQ->where('lawyer_id', $user->id);
                      });
                });
            } elseif ($user->role === 'legal_assistant') {
                $query->where('assigned_to', $user->id);
            }
            // الأدمن يرى كل الإحصائيات

            $stats = [
                'total' => $query->count(),
                'todo' => (clone $query)->where('status', 'todo')->count(),
                'in_progress' => (clone $query)->where('status', 'in_progress')->count(),
                'completed' => (clone $query)->where('status', 'completed')->count(),
                'overdue' => (clone $query)->where('due_date', '<', now())
                    ->where('status', '!=', 'completed')->count(),
                'by_priority' => [
                    'low' => (clone $query)->where('priority', 'low')->count(),
                    'medium' => (clone $query)->where('priority', 'medium')->count(),
                    'high' => (clone $query)->where('priority', 'high')->count(),
                    'urgent' => (clone $query)->where('priority', 'urgent')->count(),
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في جلب إحصائيات المهام',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * جلب مهام المستخدم الحالي
     */
    public function getMyTasks()
    {
        try {
            $tasks = Task::where('assigned_to', Auth::id())
                ->with(['case', 'assignee', 'assigner'])
                ->orderBy('due_date', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $tasks
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في جلب مهامي',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * جلب المهام المتأخرة
     */
    public function getOverdueTasks()
    {
        try {
            $tasks = Task::where('due_date', '<', now())
                ->where('status', '!=', 'completed')
                ->with(['case', 'assignee', 'assigner'])
                ->orderBy('due_date', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $tasks
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في جلب المهام المتأخرة',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * أرشفة المهمة
     */
    public function archive($id)
    {
        try {
            $task = Task::findOrFail($id);
            
            // التحقق من صلاحية المستخدم
            $user = Auth::user();
            if (!$user || ($task->assigned_to != $user->id && $task->assigned_by != $user->id && $user->role !== 'admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'ليس لديك صلاحية أرشفة هذه المهمة'
                ], 403);
            }

            // تحديث حالة المهمة إلى مؤرشفة
            $task->update([
                'status' => 'archived',
                'archived_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم أرشفة المهمة بنجاح',
                'data' => $task
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في أرشفة المهمة',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
