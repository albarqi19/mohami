<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Events\UserRegistered;
use App\Events\UserLoggedIn;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    /**
     * تسجيل الدخول
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'national_id' => 'required|string|max:20',
            'pin' => 'required|string|min:4'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'بيانات غير صحيحة',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::where('national_id', $request->national_id)->first();

        if ($user && Hash::check($request->pin, $user->pin)) {
            $token = $user->createToken('auth-token')->plainTextToken;

            // تحديث تاريخ آخر دخول
            $user->update(['last_login_at' => now()]);

            // إطلاق event لإرسال إشعار تسجيل الدخول عبر واتساب
            Log::info('Firing UserLoggedIn event', [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'user_role' => $user->role,
                'ip_address' => $request->ip()
            ]);
            
            event(new UserLoggedIn($user, $request->ip()));

            return response()->json([
                'success' => true,
                'message' => 'تم تسجيل الدخول بنجاح',
                'data' => [
                    'user' => $user,
                    'token' => $token,
                    'token_type' => 'Bearer'
                ]
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'رقم الهوية أو الرقم السري غير صحيح'
        ], 401);
    }

    /**
     * إنشاء حساب جديد
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'national_id' => 'required|string|max:20|unique:users',
            'pin' => 'required|string|min:4|confirmed',
            'role' => 'required|in:admin,lawyer,legal_assistant,client',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|string|email|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'بيانات غير صحيحة',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'national_id' => $request->national_id,
            'pin' => Hash::make($request->pin),
            'email' => $request->email,
            'password' => Hash::make('123456'), // كلمة مرور افتراضية
            'role' => $request->role,
            'phone' => $request->phone,
            'is_active' => true
        ]);

        // إطلاق event لإرسال رسالة ترحيب عبر واتساب
        event(new UserRegistered($user, $request->pin));

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء الحساب بنجاح',
            'data' => [
                'user' => $user,
                'token' => $token,
                'token_type' => 'Bearer'
            ]
        ], 201);
    }

    /**
     * تسجيل الخروج
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم تسجيل الخروج بنجاح'
        ]);
    }

    /**
     * تسجيل الخروج من جميع الأجهزة
     */
    public function logoutAll(Request $request)
    {
        $request->user()->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم تسجيل الخروج من جميع الأجهزة بنجاح'
        ]);
    }

    /**
     * معلومات المستخدم الحالي
     */
    public function me(Request $request)
    {
        $user = $request->user()->load(['preferences']);

        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }

    /**
     * تحديث الملف الشخصي
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'department' => 'nullable|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'بيانات غير صحيحة',
                'errors' => $validator->errors()
            ], 422);
        }

        $user->update($request->only(['name', 'email', 'phone', 'department']));

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث الملف الشخصي بنجاح',
            'data' => $user
        ]);
    }

    /**
     * تغيير كلمة المرور
     */
    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'بيانات غير صحيحة',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'كلمة المرور الحالية غير صحيحة'
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم تغيير كلمة المرور بنجاح'
        ]);
    }

    /**
     * جلب جميع المستخدمين
     */
    public function getAllUsers()
    {
        try {
            $users = User::select('id', 'name', 'email', 'role')
                         ->orderBy('name')
                         ->get();

            return response()->json([
                'success' => true,
                'message' => 'تم جلب المستخدمين بنجاح',
                'data' => $users
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في جلب المستخدمين',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * جلب المحامين فقط
     */
    public function getLawyers()
    {
        try {
            $lawyers = User::select('id', 'name', 'email')
                          ->where('role', 'lawyer')
                          ->orWhere('role', 'admin') // المديرين يمكنهم أن يكونوا محامين أيضاً
                          ->orderBy('name')
                          ->get();

            return response()->json([
                'success' => true,
                'message' => 'تم جلب المحامين بنجاح',
                'data' => $lawyers
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في جلب المحامين',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * جلب العملاء فقط
     */
    public function getClients()
    {
        try {
            $clients = User::select('id', 'name', 'email')
                          ->where('role', 'client')
                          ->orderBy('name')
                          ->get();

            return response()->json([
                'success' => true,
                'message' => 'تم جلب العملاء بنجاح',
                'data' => $clients
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في جلب العملاء',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
