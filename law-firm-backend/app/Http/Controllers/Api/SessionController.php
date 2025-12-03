<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CaseSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SessionController extends Controller
{
    /**
     * الحصول على جميع الجلسات القادمة
     */
    public function upcoming(Request $request)
    {
        try {
            $query = CaseSession::with(['case' => function($q) {
                $q->select('id', 'title', 'file_number', 'case_type_arabic', 'client_name', 'court', 'najiz_status');
            }]);
            
            // فلترة الجلسات القادمة فقط (التاريخ >= اليوم)
            if (!$request->has('all')) {
                $query->where(function($q) {
                    $q->whereDate('session_date', '>=', now()->toDateString())
                      ->orWhereNull('session_date');
                });
            }
            
            // ترتيب حسب التاريخ (الأقرب أولاً)
            $query->orderBy('session_date', 'asc')
                  ->orderBy('session_time', 'asc');
            
            $sessions = $query->get();
            
            return response()->json([
                'success' => true,
                'data' => $sessions,
                'count' => $sessions->count()
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error fetching upcoming sessions: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطأ في جلب الجلسات',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * الحصول على جلسات قضية معينة
     */
    public function byCaseId($caseId)
    {
        try {
            $sessions = CaseSession::where('case_id', $caseId)
                ->orderBy('session_date', 'desc')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $sessions
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في جلب الجلسات',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * إحصائيات الجلسات
     */
    public function statistics()
    {
        try {
            $today = now()->toDateString();
            $weekEnd = now()->addDays(7)->toDateString();
            $monthEnd = now()->addMonth()->toDateString();
            
            $stats = [
                'today' => CaseSession::whereDate('session_date', $today)->count(),
                'this_week' => CaseSession::whereBetween('session_date', [$today, $weekEnd])->count(),
                'this_month' => CaseSession::whereBetween('session_date', [$today, $monthEnd])->count(),
                'total_upcoming' => CaseSession::whereDate('session_date', '>=', $today)->count(),
                'completed' => CaseSession::where('status', 'completed')
                    ->orWhere('status', 'منتهية')
                    ->count(),
            ];
            
            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في جلب الإحصائيات',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
