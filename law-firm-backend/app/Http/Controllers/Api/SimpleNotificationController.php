<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SimpleNotificationController extends Controller
{
    public function index(Request $request)
    {
        try {
            $notifications = Notification::orderBy('created_at', 'desc')->paginate(15);
            
            return response()->json([
                'success' => true,
                'message' => 'تم جلب الإشعارات بنجاح',
                'data' => $notifications
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في جلب الإشعارات',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function unreadCount()
    {
        try {
            $count = Notification::where('user_id', Auth::id())
                                ->where('is_read', false)
                                ->count();
            
            return response()->json([
                'success' => true,
                'message' => 'تم جلب عدد الإشعارات غير المقروءة',
                'data' => ['count' => $count]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في جلب عدد الإشعارات',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
