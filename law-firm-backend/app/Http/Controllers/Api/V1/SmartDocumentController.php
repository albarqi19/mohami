<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Services\GeminiAnalysisService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SmartDocumentController extends Controller
{
    protected $geminiService;

    public function __construct(GeminiAnalysisService $geminiService)
    {
        $this->geminiService = $geminiService;
    }

    /**
     * تحليل الوثيقة باستخدام الذكاء الاصطناعي
     */
    public function analyzeDocument(Request $request)
    {
        // إضافة تشخيص مفصل
        Log::info('Smart Document Analysis Request Started');
        Log::info('Request data: ', $request->all());
        Log::info('Has file: ' . ($request->hasFile('file') ? 'Yes' : 'No'));
        
        $request->validate([
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png,doc,docx|max:10240', // 10MB max
            'case_id' => 'required|integer' // إزالة exists للتبسيط مؤقتاً
        ]);

        Log::info('Validation passed successfully');

        try {
            $file = $request->file('file');
            $caseId = $request->case_id;
            
            Log::info('File info: ' . $file->getClientOriginalName() . ', Size: ' . $file->getSize() . ', Mime: ' . $file->getMimeType());
            
            // قراءة محتوى الملف
            $fileContent = file_get_contents($file->getPathname());
            $mimeType = $file->getMimeType();
            
            Log::info('File content length: ' . strlen($fileContent));
            Log::info('About to call Gemini service');
            
            // تحليل الوثيقة باستخدام Gemini
            $analysis = $this->geminiService->analyzeDocument($fileContent, $mimeType);
            
            Log::info('Gemini analysis completed successfully');
            
            // حفظ الملف مؤقتاً
            $fileName = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $filePath = $file->storeAs('temp-documents', $fileName, 'public');
            
            return response()->json([
                'success' => true,
                'message' => 'تم تحليل الوثيقة بنجاح',
                'data' => [
                    'analysis' => $analysis,
                    'file_info' => [
                        'original_name' => $file->getClientOriginalName(),
                        'temp_path' => $filePath,
                        'size' => $file->getSize(),
                        'mime_type' => $mimeType
                    ],
                    'case_id' => $caseId
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Smart Document Analysis Error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في تحليل الوثيقة: ' . $e->getMessage(),
                'error_details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * حفظ الوثيقة بعد الموافقة على التحليل
     */
    public function saveAnalyzedDocument(Request $request)
    {
        $request->validate([
            'case_id' => 'required|exists:cases,id',
            'temp_path' => 'required|string',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'document_type' => 'nullable|string',
            'keywords' => 'nullable|array',
            'parties' => 'nullable|array',
            'important_dates' => 'nullable|array',
            'priority' => 'nullable|string'
        ]);

        try {
            // نقل الملف من المجلد المؤقت إلى المجلد النهائي
            $tempPath = $request->temp_path;
            $finalPath = str_replace('temp-documents/', 'documents/', $tempPath);
            
            if (Storage::disk('public')->exists($tempPath)) {
                Storage::disk('public')->move($tempPath, $finalPath);
            } else {
                throw new \Exception('الملف المؤقت غير موجود');
            }

            // إنشاء سجل الوثيقة في قاعدة البيانات
            $document = Document::create([
                'case_id' => $request->case_id,
                'title' => $request->title,
                'description' => $request->description,
                'file_path' => $finalPath,
                'file_name' => basename($finalPath),
                'file_size' => Storage::disk('public')->size($finalPath),
                'mime_type' => mime_content_type(Storage::disk('public')->path($finalPath)),
                'document_type' => $request->document_type,
                'metadata' => [
                    'ai_analyzed' => true,
                    'keywords' => $request->keywords ?? [],
                    'parties' => $request->parties ?? [],
                    'important_dates' => $request->important_dates ?? [],
                    'priority' => $request->priority,
                    'analyzed_at' => now()->toISOString()
                ],
                'uploaded_by' => 1 // سنحتاج لتحديث هذا ليأخذ المستخدم الحالي
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم حفظ الوثيقة بنجاح',
                'data' => $document->load('case', 'uploader')
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل في حفظ الوثيقة: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * حذف الملف المؤقت
     */
    public function deleteTempFile(Request $request)
    {
        $request->validate([
            'temp_path' => 'required|string'
        ]);

        try {
            $tempPath = $request->temp_path;
            
            if (Storage::disk('public')->exists($tempPath)) {
                Storage::disk('public')->delete($tempPath);
            }

            return response()->json([
                'success' => true,
                'message' => 'تم حذف الملف المؤقت'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل في حذف الملف المؤقت: ' . $e->getMessage()
            ], 500);
        }
    }
}
