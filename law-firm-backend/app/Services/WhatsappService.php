<?php

namespace App\Services;

use App\Models\WhatsappMessage;
use App\Models\WhatsappSetting;
use App\Models\User;
use App\Models\CaseModel;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class WhatsappService
{
    protected $settings;
    protected $baseUrl = 'https://graph.facebook.com/v18.0';

    public function __construct()
    {
        $this->settings = WhatsappSetting::current();
    }

    /**
     * إرسال رسالة نصية
     */
    public function sendTextMessage(string $to, string $message, array $options = [])
    {
        if (!$this->settings->notifications_enabled) {
            Log::info('WhatsApp notifications are disabled');
            return false;
        }

        // التحقق من ساعات العمل
        if (!$this->isWithinWorkingHours()) {
            Log::info('Message not sent - outside working hours');
            return false;
        }

        $messageData = [
            'messaging_product' => 'whatsapp',
            'to' => $this->formatPhoneNumber($to),
            'type' => 'text',
            'text' => [
                'body' => $message
            ]
        ];

        return $this->sendMessage($messageData, $options);
    }

    /**
     * إرسال رسالة من قالب
     */
    public function sendTemplateMessage(string $to, string $templateKey, array $variables = [], array $options = [])
    {
        $templates = $this->settings->message_templates;
        
        Log::info('sendTemplateMessage called', [
            'to' => $to,
            'templateKey' => $templateKey,
            'templates_count' => count($templates ?? []),
            'template_exists' => isset($templates[$templateKey]),
            'available_templates' => array_keys($templates ?? [])
        ]);
        
        if (!isset($templates[$templateKey])) {
            Log::error("Template not found: {$templateKey}", [
                'available_templates' => array_keys($templates ?? [])
            ]);
            return false;
        }

        $template = $templates[$templateKey]['template'];
        
        // استبدال المتغيرات في القالب
        foreach ($variables as $key => $value) {
            $template = str_replace("{{$key}}", $value, $template);
        }

        // تحويل رموز السطر الجديد إلى أسطر فعلية
        $template = str_replace('\\n', "\n", $template);
        $template = str_replace('\n', "\n", $template);

        Log::info('Template processed, calling sendTextMessage', [
            'processed_template' => substr($template, 0, 100) . '...',
            'to' => $to
        ]);

        return $this->sendTextMessage($to, $template, array_merge($options, [
            'template_key' => $templateKey,
            'variables' => $variables
        ]));
    }

    /**
     * إرسال إشعار لقضية جديدة
     */
    public function sendCaseCreatedNotification(CaseModel $case)
    {
        $client = $case->client;
        if (!$client || !$client->phone) {
            return false;
        }

        $variables = [
            'client_name' => $client->name,
            'case_number' => $case->case_number,
            'case_title' => $case->title
        ];

        return $this->sendTemplateMessage(
            $client->phone,
            'case_created',
            $variables,
            ['case_id' => $case->id, 'user_id' => $client->id, 'event_type' => 'case_created']
        );
    }

    /**
     * إرسال إشعار لتحديث القضية
     */
    public function sendCaseUpdatedNotification(CaseModel $case, string $updateDescription = '')
    {
        $client = $case->client;
        if (!$client || !$client->phone) {
            return false;
        }

        $variables = [
            'client_name' => $client->name,
            'case_number' => $case->case_number,
            'case_status' => $case->status,
            'update_description' => $updateDescription
        ];

        return $this->sendTemplateMessage(
            $client->phone,
            'case_updated',
            $variables,
            ['case_id' => $case->id, 'user_id' => $client->id, 'event_type' => 'case_updated']
        );
    }

    /**
     * إرسال تذكير بجلسة محكمة
     */
    public function sendHearingReminder(CaseModel $case, string $hearingTime, string $courtLocation = '')
    {
        $client = $case->client;
        if (!$client || !$client->phone) {
            return false;
        }

        $variables = [
            'client_name' => $client->name,
            'case_number' => $case->case_number,
            'hearing_time' => $hearingTime,
            'court_location' => $courtLocation
        ];

        return $this->sendTemplateMessage(
            $client->phone,
            'hearing_reminder',
            $variables,
            ['case_id' => $case->id, 'user_id' => $client->id, 'event_type' => 'hearing_reminder']
        );
    }

    /**
     * إرسال رسالة ترحيب للعميل الجديد
     */
    public function sendWelcomeMessage(User $user, string $pin)
    {
        if (!$user->phone) {
            return false;
        }

        $variables = [
            'client_name' => $user->name,
            'national_id' => $user->national_id,
            'pin' => $pin
        ];

        return $this->sendTemplateMessage(
            $user->phone,
            'welcome_message',
            $variables,
            ['user_id' => $user->id, 'event_type' => 'welcome_message']
        );
    }

    /**
     * إرسال إشعار تسجيل الدخول
     */
    public function sendLoginNotification(User $user, string $ipAddress = null)
    {
        Log::info('sendLoginNotification called', [
            'user_id' => $user->id,
            'user_role' => $user->role,
            'user_phone' => $user->phone,
            'ip_address' => $ipAddress
        ]);

        // فقط للمحامين والمساعدين القانونيين
        if (!in_array($user->role, ['lawyer', 'legal_assistant'])) {
            Log::info('User role not eligible for login notification', ['role' => $user->role]);
            return false;
        }

        if (!$user->phone) {
            Log::warning('User has no phone number for login notification', ['user_id' => $user->id]);
            return false;
        }

        $loginTime = now();
        $variables = [
            'user_name' => $user->name,
            'login_date' => $loginTime->format('Y-m-d'),
            'login_time' => $loginTime->format('H:i'),
            'day_name' => $loginTime->locale('ar')->dayName
        ];

        Log::info('Sending login notification template message', [
            'user_phone' => $user->phone,
            'template_key' => 'login_notification',
            'variables' => $variables
        ]);

        return $this->sendTemplateMessage(
            $user->phone,
            'login_notification',
            $variables,
            ['user_id' => $user->id, 'event_type' => 'login_notification']
        );
    }

    /**
     * إرسال التقرير اليومي
     */
    public function sendDailyReport()
    {
        if (!$this->settings->daily_report_enabled) {
            return false;
        }

        // جمع إحصائيات اليوم
        $today = Carbon::today();
        $newCasesCount = CaseModel::whereDate('created_at', $today)->count();
        $hearingsToday = 0; // يمكن إضافة نموذج الجلسات لاحقاً
        $pendingTasks = 0; // يمكن إضافة نموذج المهام لاحقاً

        $variables = [
            'date' => $today->format('Y-m-d'),
            'new_cases' => $newCasesCount,
            'hearings_today' => $hearingsToday,
            'pending_tasks' => $pendingTasks
        ];

        // إرسال للمدير أو المحامين (يمكن تحديد المستلمين)
        $managers = User::where('role', 'lawyer')->get();
        
        foreach ($managers as $manager) {
            if ($manager->phone) {
                $this->sendTemplateMessage(
                    $manager->phone,
                    'daily_report',
                    $variables,
                    ['user_id' => $manager->id, 'event_type' => 'daily_report']
                );
            }
        }

        return true;
    }

    /**
     * إرسال الرسالة عبر واتساب API
     */
    protected function sendMessage(array $messageData, array $options = [])
    {
        // حفظ الرسالة في قاعدة البيانات
        $whatsappMessage = WhatsappMessage::create([
            'to_phone' => $messageData['to'],
            'message_content' => $messageData['text']['body'] ?? json_encode($messageData),
            'message_type' => $messageData['type'] ?? 'text',
            'direction' => 'outbound',
            'status' => 'pending',
            'case_id' => $options['case_id'] ?? null,
            'user_id' => $options['user_id'] ?? null,
            'event_type' => $options['event_type'] ?? null,
            'metadata' => $options
        ]);

        try {
            // استخدام API الجديد بدلاً من Meta WhatsApp API
            $apiUrl = "http://localhost:8080/message/sendText/Ahmad";
            $apiKey = "E4E89BD94453-41C1-ACC4-88BCE177F847";
            
            $requestData = [
                'text' => $messageData['text']['body'],
                'number' => $messageData['to']
            ];

            $response = Http::withHeaders([
                'apikey' => $apiKey,
                'Content-Type' => 'application/json; charset=utf-8'
            ])->post($apiUrl, $requestData);

            if ($response->successful()) {
                $responseData = $response->json();
                $whatsappMessage->updateStatus('sent', [
                    'whatsapp_message_id' => $responseData['key']['id'] ?? null,
                    'response' => $responseData
                ]);
                
                Log::info('WhatsApp message sent successfully', [
                    'to' => $messageData['to'],
                    'message_id' => $whatsappMessage->id,
                    'api_response' => $responseData
                ]);
                
                return $whatsappMessage;
            } else {
                $whatsappMessage->updateStatus('failed', [
                    'error' => $response->json(),
                    'status_code' => $response->status()
                ]);
                
                Log::error('WhatsApp message failed', [
                    'to' => $messageData['to'],
                    'error' => $response->json()
                ]);
                
                return false;
            }
        } catch (\Exception $e) {
            $whatsappMessage->updateStatus('failed', [
                'error' => $e->getMessage()
            ]);
            
            Log::error('WhatsApp message exception', [
                'to' => $messageData['to'],
                'error' => $e->getMessage()
            ]);
            
            return false;
        }
    }

    /**
     * معالجة الرسائل الواردة من Webhook
     */
    public function handleIncomingMessage(array $webhookData)
    {
        $entry = $webhookData['entry'][0] ?? null;
        $changes = $entry['changes'][0] ?? null;
        $value = $changes['value'] ?? null;

        if (!$value) {
            return false;
        }

        // معالجة الرسائل الواردة
        if (isset($value['messages'])) {
            foreach ($value['messages'] as $message) {
                $this->processIncomingMessage($message, $value['contacts'][0] ?? null);
            }
        }

        // معالجة حالات الرسائل
        if (isset($value['statuses'])) {
            foreach ($value['statuses'] as $status) {
                $this->processMessageStatus($status);
            }
        }

        return true;
    }

    /**
     * معالجة رسالة واردة
     */
    protected function processIncomingMessage(array $message, array $contact = null)
    {
        $fromPhone = $this->formatPhoneNumber($message['from']);
        $messageContent = '';
        $messageType = $message['type'];

        // استخراج محتوى الرسالة حسب النوع
        switch ($messageType) {
            case 'text':
                $messageContent = $message['text']['body'];
                break;
            case 'image':
            case 'document':
            case 'audio':
            case 'video':
                $messageContent = $message[$messageType]['caption'] ?? 'Media file';
                break;
        }

        // البحث عن المستخدم
        $user = User::where('phone', $fromPhone)->first();

        WhatsappMessage::create([
            'whatsapp_message_id' => $message['id'],
            'from_phone' => $fromPhone,
            'to_phone' => $this->settings->phone_number_id,
            'message_content' => $messageContent,
            'message_type' => $messageType,
            'direction' => 'inbound',
            'status' => 'delivered',
            'user_id' => $user?->id,
            'metadata' => [
                'contact' => $contact,
                'raw_message' => $message
            ]
        ]);

        Log::info('Incoming WhatsApp message processed', [
            'from' => $fromPhone,
            'type' => $messageType,
            'user_id' => $user?->id
        ]);
    }

    /**
     * معالجة حالة الرسالة
     */
    protected function processMessageStatus(array $status)
    {
        $whatsappMessage = WhatsappMessage::where('whatsapp_message_id', $status['id'])->first();
        
        if ($whatsappMessage) {
            $whatsappMessage->updateStatus($status['status'], [
                'timestamp' => $status['timestamp'],
                'recipient_id' => $status['recipient_id']
            ]);
        }
    }

    /**
     * تنسيق رقم الهاتف
     */
    protected function formatPhoneNumber(string $phone): string
    {
        // إزالة الرموز والمسافات
        $phone = preg_replace('/[^0-9]/', '', $phone);
        
        // إضافة رمز البلد إذا لم يكن موجوداً (966 للسعودية)
        if (!str_starts_with($phone, '966')) {
            if (str_starts_with($phone, '0')) {
                $phone = '966' . substr($phone, 1);
            } else {
                $phone = '966' . $phone;
            }
        }
        
        return $phone;
    }

    /**
     * التحقق من ساعات العمل - معطل مؤقتاً للإرسال في أي وقت
     */
    protected function isWithinWorkingHours(): bool
    {
        // إرجاع true دائماً للإرسال في أي وقت
        return true;
        
        // الكود الأصلي معلق مؤقتاً
        /*
        $workingHours = $this->settings->working_hours;
        $now = Carbon::now();
        $dayOfWeek = strtolower($now->format('l'));
        
        if (!isset($workingHours[$dayOfWeek]) || !$workingHours[$dayOfWeek]['enabled']) {
            return false;
        }
        
        $startTime = Carbon::createFromFormat('H:i', $workingHours[$dayOfWeek]['start']);
        $endTime = Carbon::createFromFormat('H:i', $workingHours[$dayOfWeek]['end']);
        
        return $now->between($startTime, $endTime);
        */
    }

    /**
     * إرسال رسالة مع تأخير
     */
    public function sendDelayedMessage(string $to, string $templateKey, array $variables = [], int $delayMinutes = 0, array $options = [])
    {
        if ($delayMinutes > 0) {
            // يمكن استخدام Queue لتأخير الإرسال
            // dispatch(new SendWhatsappMessageJob($to, $templateKey, $variables, $options))->delay(now()->addMinutes($delayMinutes));
            return true;
        }
        
        return $this->sendTemplateMessage($to, $templateKey, $variables, $options);
    }
}
