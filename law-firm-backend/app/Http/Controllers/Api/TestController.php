<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class TestController extends Controller
{
    /**
     * قائمة القضايا
     */
    public function cases()
    {
        return response()->json([
            'success' => true,
            'message' => 'تم جلب القضايا بنجاح',
            'data' => [
                'cases' => [],
                'count' => 0
            ]
        ]);
    }

    /**
     * قائمة المهام
     */
    public function tasks()
    {
        return response()->json([
            'success' => true,
            'message' => 'تم جلب المهام بنجاح',
            'data' => [
                'tasks' => [],
                'count' => 0
            ]
        ]);
    }

    /**
     * قائمة الوثائق
     */
    public function documents()
    {
        return response()->json([
            'success' => true,
            'message' => 'تم جلب الوثائق بنجاح',
            'data' => [
                'documents' => [],
                'count' => 0
            ]
        ]);
    }

    /**
     * قائمة الإشعارات
     */
    public function notifications()
    {
        return response()->json([
            'success' => true,
            'message' => 'تم جلب الإشعارات بنجاح',
            'data' => [
                'notifications' => [],
                'unread_count' => 0
            ]
        ]);
    }

    /**
     * عدد الإشعارات غير المقروءة
     */
    public function unreadCount()
    {
        return response()->json([
            'success' => true,
            'message' => 'تم جلب عدد الإشعارات غير المقروءة',
            'data' => [
                'unread_count' => 0
            ]
        ]);
    }

    /**
     * تسجيل الخروج (اختبار)
     */
    public function logout(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'تم تسجيل الخروج بنجاح (اختبار)'
        ]);
    }
}
