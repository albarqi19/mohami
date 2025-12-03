<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WhatsappSetting;
use App\Models\WhatsappMessage;
use App\Services\WhatsappService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Artisan;

class WhatsappController extends Controller
{
    protected $whatsappService;

    public function __construct(WhatsappService $whatsappService)
    {
        $this->whatsappService = $whatsappService;
    }

    /**
     * الحصول على إعدادات الواتساب
     */
    public function getSettings(): JsonResponse
    {
        $settings = WhatsappSetting::current();
        
        // إخفاء البيانات الحساسة
        $settings->makeHidden(['access_token', 'verify_token']);
        
        return response()->json([
            'success' => true,
            'data' => $settings
        ]);
    }

    /**
     * تحديث إعدادات الواتساب
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'webhook_url' => 'nullable|url',
            'access_token' => 'nullable|string',
            'verify_token' => 'nullable|string',
            'phone_number_id' => 'nullable|string',
            'notifications_enabled' => 'boolean',
            'notification_settings' => 'nullable|array',
            'message_templates' => 'nullable|array',
            'daily_report_time' => 'nullable|date_format:H:i',
            'daily_report_enabled' => 'boolean',
            'working_hours' => 'nullable|array'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في البيانات المدخلة',
                'errors' => $validator->errors()
            ], 422);
        }

        $settings = WhatsappSetting::current();
        $settings->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث الإعدادات بنجاح',
            'data' => $settings->makeHidden(['access_token', 'verify_token'])
        ]);
    }

    /**
     * اختبار إرسال رسالة
     */
    public function testMessage(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string',
            'message' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في البيانات المدخلة',
                'errors' => $validator->errors()
            ], 422);
        }

        $result = $this->whatsappService->sendTextMessage(
            $request->phone,
            $request->message,
            ['event_type' => 'test_message']
        );

        if ($result) {
            return response()->json([
                'success' => true,
                'message' => 'تم إرسال الرسالة بنجاح',
                'data' => $result
            ]);
        } else {
            return response()->json([
                'success' => false,
                'message' => 'فشل في إرسال الرسالة'
            ], 500);
        }
    }

    /**
     * إرسال رسالة باستخدام قالب
     */
    public function sendTemplateMessage(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string',
            'template_key' => 'required|string',
            'variables' => 'nullable|array'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في البيانات المدخلة',
                'errors' => $validator->errors()
            ], 422);
        }

        $result = $this->whatsappService->sendTemplateMessage(
            $request->phone,
            $request->template_key,
            $request->variables ?? [],
            ['event_type' => 'manual_template']
        );

        if ($result) {
            return response()->json([
                'success' => true,
                'message' => 'تم إرسال الرسالة بنجاح',
                'data' => $result
            ]);
        } else {
            return response()->json([
                'success' => false,
                'message' => 'فشل في إرسال الرسالة'
            ], 500);
        }
    }

    /**
     * الحصول على سجل الرسائل
     */
    public function getMessages(Request $request): JsonResponse
    {
        $perPage = $request->get('per_page', 20);
        $direction = $request->get('direction'); // inbound, outbound
        $status = $request->get('status');
        $caseId = $request->get('case_id');
        $userId = $request->get('user_id');

        $query = WhatsappMessage::with(['case', 'user'])
            ->orderBy('created_at', 'desc');

        if ($direction) {
            $query->where('direction', $direction);
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($caseId) {
            $query->where('case_id', $caseId);
        }

        if ($userId) {
            $query->where('user_id', $userId);
        }

        $messages = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $messages
        ]);
    }

    /**
     * إحصائيات الرسائل
     */
    public function getStats(Request $request): JsonResponse
    {
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');

        $stats = WhatsappMessage::getStats($startDate, $endDate);

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Webhook للتحقق من صحة الرابط
     */
    public function webhookVerify(Request $request): string
    {
        $verifyToken = WhatsappSetting::current()->verify_token;
        
        $mode = $request->get('hub_mode');
        $token = $request->get('hub_verify_token');
        $challenge = $request->get('hub_challenge');

        if ($mode === 'subscribe' && $token === $verifyToken) {
            Log::info('WhatsApp webhook verified successfully');
            return $challenge;
        }

        Log::warning('WhatsApp webhook verification failed', [
            'mode' => $mode,
            'token' => $token,
            'expected_token' => $verifyToken
        ]);

        abort(403, 'Forbidden');
    }

    /**
     * Webhook لاستقبال الرسائل والتحديثات
     */
    public function webhook(Request $request): JsonResponse
    {
        try {
            $webhookData = $request->all();
            
            Log::info('WhatsApp webhook received', $webhookData);

            $result = $this->whatsappService->handleIncomingMessage($webhookData);

            if ($result) {
                return response()->json(['success' => true]);
            } else {
                return response()->json(['success' => false], 400);
            }
        } catch (\Exception $e) {
            Log::error('WhatsApp webhook error', [
                'error' => $e->getMessage(),
                'data' => $request->all()
            ]);

            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * إرسال التقرير اليومي يدوياً
     */
    public function sendDailyReport(): JsonResponse
    {
        $result = $this->whatsappService->sendDailyReport();

        if ($result) {
            return response()->json([
                'success' => true,
                'message' => 'تم إرسال التقرير اليومي بنجاح'
            ]);
        } else {
            return response()->json([
                'success' => false,
                'message' => 'فشل في إرسال التقرير اليومي'
            ], 500);
        }
    }

    /**
     * إعادة تعيين الإعدادات للقيم الافتراضية
     */
    public function resetToDefaults(): JsonResponse
    {
        $settings = WhatsappSetting::current();
        
        $settings->update([
            'notification_settings' => WhatsappSetting::getDefaultNotificationSettings(),
            'message_templates' => WhatsappSetting::getDefaultTemplates(),
            'working_hours' => WhatsappSetting::getDefaultWorkingHours(),
            'daily_report_time' => '09:00',
            'daily_report_enabled' => true
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم إعادة تعيين الإعدادات للقيم الافتراضية',
            'data' => $settings->makeHidden(['access_token', 'verify_token'])
        ]);
    }

    /**
     * اختبار تنبيهات المحامي
     */
    public function testLawyerNotifications()
    {
        try {
            // اختبار تنبيه المهام المتأخرة
            Artisan::call('app:check-overdue-tasks');
            
            // اختبار تنبيه الجلسات القريبة
            Artisan::call('app:check-upcoming-hearings');
            
            // اختبار إرسال رسالة مباشرة للمحامي
            $whatsappService = app(\App\Services\WhatsappService::class);
            $result = $whatsappService->sendTextMessage('966530996778', 'اختبار تنبيهات المحامي - النظام يعمل بشكل صحيح');
            
            return response()->json([
                'success' => true,
                'message' => 'تم اختبار تنبيهات المحامي بنجاح',
                'overdue_tasks_output' => Artisan::output(),
                'send_result' => $result
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في اختبار التنبيهات: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * اختبار المهام المتأخرة
     */
    public function testOverdueTasks(): JsonResponse
    {
        try {
            // تشغيل الأمر للتحقق من المهام المتأخرة
            Artisan::call('app:check-overdue-tasks');
            $output = Artisan::output();
            
            return response()->json([
                'success' => true,
                'message' => 'تم تشغيل فحص المهام المتأخرة بنجاح',
                'output' => $output
            ]);
        } catch (\Exception $e) {
            Log::error('فشل في تشغيل فحص المهام المتأخرة', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'فشل في تشغيل فحص المهام المتأخرة',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * محاكاة رفع وثيقة لاختبار التنبيهات
     */
    public function testDocumentUpload(Request $request)
    {
        try {
            // البحث عن document حقيقي أو إنشاء جديد للاختبار
            $document = \App\Models\Document::first();
            
            if (!$document) {
                // إنشاء document تجريبي مؤقت
                $document = \App\Models\Document::create([
                    'title' => $request->input('title', 'وثيقة اختبار التنبيهات'),
                    'file_name' => 'test_document.pdf',
                    'file_path' => 'documents/test_document.pdf',
                    'file_size' => 1024,
                    'mime_type' => 'application/pdf',
                    'category' => $request->input('category', 'test'),
                    'case_id' => $request->input('case_id', 1),
                    'uploaded_by' => 1, // user ID افتراضي
                    'is_confidential' => false
                ]);
            }
            
            // إطلاق event التنبيه
            event(new \App\Events\DocumentUploaded($document));
            
            return response()->json([
                'success' => true,
                'message' => 'تم محاكاة رفع الوثيقة وإرسال التنبيه',
                'document_id' => $document->id,
                'document_title' => $document->title
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في محاكاة رفع الوثيقة: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * اختبار تنبيهات الجلسات القريبة
     */
    public function testUpcomingHearings()
    {
        try {
            Artisan::call('app:check-upcoming-hearings');
            return response()->json([
                'success' => true,
                'message' => 'تم تشغيل فحص الجلسات القريبة',
                'output' => Artisan::output()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في فحص الجلسات القريبة: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * إرسال رسالة تجريبية للمحامي
     */
    public function testLawyerMessage()
    {
        try {
            $message = 'مرحباً، هذه رسالة تجريبية من نظام إدارة المحاماة. تم إرسالها في ' . now()->format('Y-m-d H:i:s');
            
            $this->whatsappService->sendTextMessage('966530996778', $message);
            
            return response()->json([
                'success' => true,
                'message' => 'تم إرسال الرسالة التجريبية',
                'phone' => '966530996778',
                'text' => $message
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في إرسال الرسالة: ' . $e->getMessage()
            ], 500);
        }
    }
}
