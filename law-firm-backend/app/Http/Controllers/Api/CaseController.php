<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CaseModel;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CaseController extends Controller
{
    /**
     * عرض جميع القضايا
     */
    public function index(Request $request)
    {
        try {
            $query = CaseModel::with(['client', 'lawyers']);
            $user = Auth::user();

            // إذا كان المستخدم عميل، عرض قضاياه فقط
            if ($user->role === 'client') {
                $query->where('client_id', $user->id);
            }
            // إذا كان المستخدم محامي، عرض القضايا المكلف بها فقط
            elseif ($user->role === 'lawyer') {
                $query->whereHas('lawyers', function($q) use ($user) {
                    $q->where('lawyer_id', $user->id);
                });
            }
            // إذا كان المستخدم مساعد قانوني، عرض القضايا المكلف بها أو القضايا التي له مهام فيها
            elseif ($user->role === 'legal_assistant') {
                $query->where(function($q) use ($user) {
                    // القضايا المكلف بها مباشرة
                    $q->whereHas('lawyers', function($subQ) use ($user) {
                        $subQ->where('lawyer_id', $user->id);
                    })
                    // أو القضايا التي له مهام فيها
                    ->orWhereHas('tasks', function($subQ) use ($user) {
                        $subQ->where('assigned_to', $user->id);
                    });
                });
            }
            // الأدمن يرى كل القضايا (لا حاجة لفلترة)

            // التصفية حسب الحالة
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // التصفية حسب النوع
            if ($request->has('case_type')) {
                $query->where('case_type', $request->case_type);
            }

            // البحث في العنوان والوصف
            if ($request->has('search')) {
                $query->where(function($q) use ($request) {
                    $q->where('title', 'like', '%' . $request->search . '%')
                      ->orWhere('description', 'like', '%' . $request->search . '%')
                      ->orWhere('file_number', 'like', '%' . $request->search . '%');
                });
            }

            // الترتيب - القضايا النشطة وقيد النظر أولاً
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            
            // ترتيب مخصص: active و pending أولاً
            $query->orderByRaw("FIELD(status, 'active', 'pending', 'appealed', 'settled', 'closed', 'dismissed') ASC")
                  ->orderBy($sortBy, $sortOrder);

            // التصفح
            $perPage = $request->get('per_page', 15);
            $cases = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'message' => 'تم جلب القضايا بنجاح',
                'data' => $cases
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في جلب القضايا',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * إنشاء قضية جديدة
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:civil,criminal,commercial,administrative,family,labor,real_estate,intellectual_property,other',
            'priority' => 'required|in:low,medium,high,urgent',
            'client_id' => 'required|exists:users,id',
            'primary_lawyer_id' => 'required|exists:users,id',
            'start_date' => 'required|date',
            'expected_end_date' => 'nullable|date|after:start_date',
            'court_name' => 'nullable|string|max:255',
            'court_reference' => 'nullable|string|max:255',
            'opposing_party' => 'nullable|string|max:255',
            'case_value' => 'nullable|numeric'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'بيانات غير صحيحة',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // جلب بيانات العميل
            $client = User::find($request->client_id);
            
            $case = CaseModel::create([
                'title' => $request->title,
                'description' => $request->description,
                'file_number' => CaseModel::generateCaseNumber(),
                'client_name' => $client->name,
                'client_id' => $request->client_id,
                'client_phone' => $client->phone ?? null,
                'client_email' => $client->email ?? null,
                'case_type' => $request->type,
                'status' => $request->status ?? 'active',
                'priority' => $request->priority,
                'filing_date' => $request->start_date,
                'due_date' => $request->expected_end_date,
                'court' => $request->court_name,
                'opponent_name' => $request->opposing_party,
                'contract_value' => $request->case_value,
                'created_by' => Auth::id()
            ]);

            // إضافة المحامي الأساسي إلى فريق القضية
            $case->lawyers()->attach($request->primary_lawyer_id, [
                'assigned_at' => now(),
                'assigned_by' => Auth::id(),
                'is_primary' => true
            ]);

            $case->load(['lawyers']);

            // إطلاق الأحداث
            event(new \App\Events\CaseCreated($case));
            event(new \App\Events\LawyerAssignedToCase(User::find($request->primary_lawyer_id), $case));

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'تم إنشاء القضية بنجاح',
                'data' => $case
            ], 201);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء إنشاء القضية'
            ], 500);
        }
    }

    /**
     * عرض قضية محددة
     */
    public function show($id)
    {
        $user = Auth::user();
        
        $query = CaseModel::with([
            'client', 
            'primaryLawyer', 
            'lawyers', 
            'tasks.assignee', 
            'documents', 
            'comments.user',
            'activities.performer',
            'parties',
            'sessions'
        ]);

        // تطبيق نفس فلترة الصلاحيات
        if ($user->role === 'client') {
            $query->where('client_id', $user->id);
        } elseif ($user->role === 'lawyer') {
            $query->whereHas('lawyers', function($q) use ($user) {
                $q->where('lawyer_id', $user->id);
            });
        } elseif ($user->role === 'legal_assistant') {
            $query->where(function($q) use ($user) {
                $q->whereHas('lawyers', function($subQ) use ($user) {
                    $subQ->where('lawyer_id', $user->id);
                })->orWhereHas('tasks', function($subQ) use ($user) {
                    $subQ->where('assigned_to', $user->id);
                });
            });
        }

        $case = $query->find($id);

        if (!$case) {
            return response()->json([
                'success' => false,
                'message' => 'القضية غير موجودة أو ليس لديك صلاحية للوصول إليها'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $case
        ]);
    }

    /**
     * تحديث قضية
     */
    public function update(Request $request, $id)
    {
        $case = CaseModel::find($id);

        if (!$case) {
            return response()->json([
                'success' => false,
                'message' => 'القضية غير موجودة'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'string|max:255',
            'description' => 'nullable|string',
            'case_type' => 'string|in:civil,criminal,commercial,administrative,family,labor',
            'status' => 'string|in:active,closed,pending,suspended',
            'priority' => 'string|in:low,medium,high,urgent',
            'opponent_name' => 'nullable|string|max:255',
            'court' => 'nullable|string|max:255',
            'contract_value' => 'nullable|numeric',
            'due_date' => 'nullable|date'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'بيانات غير صحيحة',
                'errors' => $validator->errors()
            ], 422);
        }

        $case->update($request->all());
        $case->load(['client', 'primaryLawyer', 'lawyers']);

        // إطلاق حدث تحديث القضية
        event(new \App\Events\CaseUpdated($case));

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث القضية بنجاح',
            'data' => $case
        ]);
    }

    /**
     * حذف قضية
     */
    public function destroy($id)
    {
        $case = CaseModel::find($id);

        if (!$case) {
            return response()->json([
                'success' => false,
                'message' => 'القضية غير موجودة'
            ], 404);
        }

        $case->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف القضية بنجاح'
        ]);
    }

    /**
     * إضافة محامي للقضية
     */
    public function addLawyer(Request $request, $id)
    {
        $case = CaseModel::find($id);

        if (!$case) {
            return response()->json([
                'success' => false,
                'message' => 'القضية غير موجودة'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'lawyer_id' => 'required|exists:users,id',
            'role' => 'required|in:primary,secondary,consultant'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'بيانات غير صحيحة',
                'errors' => $validator->errors()
            ], 422);
        }

        // التحقق من عدم وجود المحامي بالفعل
        if ($case->lawyers()->where('user_id', $request->lawyer_id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'المحامي مضاف للقضية بالفعل'
            ], 422);
        }

        $case->lawyers()->attach($request->lawyer_id, [
            'role' => $request->role,
            'assigned_at' => now(),
            'assigned_by' => Auth::id()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم إضافة المحامي للقضية بنجاح'
        ]);
    }

    /**
     * إزالة محامي من القضية
     */
    public function removeLawyer($id, $lawyerId)
    {
        $case = CaseModel::find($id);

        if (!$case) {
            return response()->json([
                'success' => false,
                'message' => 'القضية غير موجودة'
            ], 404);
        }

        $case->lawyers()->detach($lawyerId);

        return response()->json([
            'success' => true,
            'message' => 'تم إزالة المحامي من القضية بنجاح'
        ]);
    }

    /**
     * إحصائيات القضايا
     */
    public function statistics()
    {
        $user = Auth::user();
        
        // تطبيق نفس فلترة الصلاحيات للإحصائيات
        $query = CaseModel::query();
        
        if ($user->role === 'client') {
            $query->where('client_id', $user->id);
        } elseif ($user->role === 'lawyer') {
            $query->whereHas('lawyers', function($q) use ($user) {
                $q->where('lawyer_id', $user->id);
            });
        } elseif ($user->role === 'legal_assistant') {
            $query->where(function($q) use ($user) {
                $q->whereHas('lawyers', function($subQ) use ($user) {
                    $subQ->where('lawyer_id', $user->id);
                })->orWhereHas('tasks', function($subQ) use ($user) {
                    $subQ->where('assigned_to', $user->id);
                });
            });
        }
        // الأدمن يرى كل الإحصائيات

        $stats = [
            'total_cases' => $query->count(),
            'active_cases' => (clone $query)->where('status', 'active')->count(),
            'pending_cases' => (clone $query)->where('status', 'pending')->count(),
            'closed_cases' => (clone $query)->where('status', 'closed')->count(),
            'urgent_cases' => (clone $query)->where('priority', 'urgent')->count(),
            'high_priority_cases' => (clone $query)->where('priority', 'high')->count(),
            'cases_by_type' => (clone $query)->selectRaw('case_type, COUNT(*) as count')
                ->groupBy('case_type')
                ->pluck('count', 'case_type'),
            'cases_by_status' => (clone $query)->selectRaw('status, COUNT(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status')
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * جلب وثائق القضية
     */
    public function getDocuments($caseId)
    {
        try {
            $user = Auth::user();
            
            // البحث عن القضية مع التحقق من الصلاحيات
            $query = CaseModel::with(['documents.uploader']);
            
            // تطبيق فلترة الصلاحيات
            if ($user->role === 'client') {
                $query->where('client_id', $user->id);
            } elseif ($user->role === 'lawyer') {
                $query->whereHas('lawyers', function($q) use ($user) {
                    $q->where('lawyer_id', $user->id);
                });
            } elseif ($user->role === 'legal_assistant') {
                $query->where(function($q) use ($user) {
                    $q->whereHas('lawyers', function($subQ) use ($user) {
                        $subQ->where('lawyer_id', $user->id);
                    })
                    ->orWhereHas('tasks', function($subQ) use ($user) {
                        $subQ->where('assigned_to', $user->id);
                    });
                });
            }
            
            $case = $query->findOrFail($caseId);
            
            return response()->json([
                'success' => true,
                'data' => $case->documents
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في جلب وثائق القضية: ' . $e->getMessage()
            ], 500);
        }
    }
}
