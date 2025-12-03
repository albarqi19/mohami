<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CaseModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SimpleCaseController extends Controller
{
    public function index(Request $request)
    {
        try {
            $cases = CaseModel::orderBy('created_at', 'desc')->paginate(15);
            
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

    public function store(Request $request)
    {
        try {
            $case = CaseModel::create([
                'title' => $request->title,
                'client_name' => $request->client_name,
                'status' => $request->status ?? 'active',
                'case_type' => $request->case_type,
                'description' => $request->description,
                'created_by' => Auth::id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم إنشاء القضية بنجاح',
                'data' => $case
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في إنشاء القضية',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $case = CaseModel::findOrFail($id);
            
            return response()->json([
                'success' => true,
                'message' => 'تم جلب القضية بنجاح',
                'data' => $case
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'القضية غير موجودة',
                'error' => $e->getMessage()
            ], 404);
        }
    }
}
