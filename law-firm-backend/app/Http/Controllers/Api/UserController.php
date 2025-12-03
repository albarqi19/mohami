<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        if ($request->has('search')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        $users = $query->orderBy('name')->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'nullable|string|email|max:255|unique:users',
            'national_id' => 'required|string|max:20|unique:users',
            'role' => 'required|in:admin,partner,senior_lawyer,lawyer,legal_assistant,assistant,client',
            'phone' => 'nullable|string|max:20'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'بيانات غير صحيحة',
                'errors' => $validator->errors()
            ], 422);
        }

        // توليد PIN من 5 أرقام
        $pin = str_pad(rand(0, 99999), 5, '0', STR_PAD_LEFT);
        
        // توليد كلمة مرور قوية
        $password = 'Law' . rand(100000, 999999) . '!';

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'national_id' => $request->national_id,
            'password' => Hash::make($password),
            'pin' => Hash::make($pin),
            'role' => $request->role,
            'phone' => $request->phone,
            'is_active' => true
        ]);

        // إطلاق Event لإرسال رسالة الترحيب عبر واتساب
        event(new \App\Events\UserRegistered($user, $pin));

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء المستخدم بنجاح وتم إرسال رسالة ترحيب عبر واتساب',
            'data' => [
                'user' => $user,
                'pin' => $pin, // إرسال الـ PIN للمدير ليتمكن من إبلاغ المحامي
                'temporary_password' => $password
            ]
        ], 201);
    }

    public function show($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'المستخدم غير موجود'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'المستخدم غير موجود'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'role' => 'required|in:admin,partner,senior_lawyer,lawyer,legal_assistant,assistant,client',
            'phone' => 'nullable|string|max:20',
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'بيانات غير صحيحة',
                'errors' => $validator->errors()
            ], 422);
        }

        $user->update($request->only(['name', 'email', 'role', 'phone', 'is_active']));

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث المستخدم بنجاح',
            'data' => $user
        ]);
    }

    public function destroy($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'المستخدم غير موجود'
            ], 404);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف المستخدم بنجاح'
        ]);
    }
}
