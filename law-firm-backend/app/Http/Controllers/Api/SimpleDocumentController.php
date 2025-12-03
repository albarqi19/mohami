<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Http\Request;

class SimpleDocumentController extends Controller
{
    public function index(Request $request)
    {
        try {
            $documents = Document::orderBy('created_at', 'desc')->paginate(15);
            
            return response()->json([
                'success' => true,
                'message' => 'تم جلب الوثائق بنجاح',
                'data' => $documents
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في جلب الوثائق',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
