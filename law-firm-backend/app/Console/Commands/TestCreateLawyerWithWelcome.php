<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\WhatsappSetting;
use App\Events\UserRegistered;
use App\Services\WhatsappService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class TestCreateLawyerWithWelcome extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:create-lawyer-welcome {--phone=966530996778}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test creating a new lawyer and sending welcome WhatsApp message';

    protected $whatsappService;

    public function __construct(WhatsappService $whatsappService)
    {
        parent::__construct();
        $this->whatsappService = $whatsappService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $phone = $this->option('phone');
        
        $this->info("🚀 اختبار إضافة محامي جديد مع رسالة ترحيب واتساب");
        $this->info("📱 الرقم المستخدم: $phone");
        $this->newLine();

        // إعداد النظام
        $this->setupWhatsappSettings();

        // اختبار 1: فحص إعدادات الواتساب
        $this->testWhatsappSettings();

        // اختبار 2: إنشاء محامي جديد
        $this->testCreateLawyer($phone);

        // اختبار 3: إرسال رسالة ترحيب مباشرة
        $this->testDirectWelcomeMessage($phone);

        // اختبار 4: فحص الرسائل المرسلة
        $this->checkSentMessages();

        $this->newLine();
        $this->info("✅ تم الانتهاء من جميع الاختبارات");
        $this->info("📱 تحقق من واتساب على الرقم: $phone");
    }

    private function setupWhatsappSettings()
    {
        $this->info("🔧 إعداد نظام الواتساب...");
        
        // التأكد من وجود إعدادات واتساب
        $settings = WhatsappSetting::first();
        if (!$settings) {
            WhatsappSetting::create([
                'notifications_enabled' => true,
                'webhook_url' => 'https://example.com/webhook',
                'access_token' => 'test_token',
                'verify_token' => 'test_verify',
                'phone_number_id' => '123456789',
                'notification_settings' => WhatsappSetting::getDefaultNotificationSettings(),
                'message_templates' => WhatsappSetting::getDefaultTemplates(),
                'daily_report_time' => '09:00',
                'daily_report_enabled' => true,
                'working_hours' => WhatsappSetting::getDefaultWorkingHours()
            ]);
            $this->info("  ✓ تم إنشاء إعدادات واتساب");
        } else {
            // تفعيل الإشعارات
            $settings->update(['notifications_enabled' => true]);
            $this->info("  ✓ تم تفعيل إعدادات واتساب");
        }
    }

    private function testWhatsappSettings()
    {
        $this->info("🔍 فحص إعدادات الواتساب:");
        
        $settings = WhatsappSetting::first();
        if ($settings) {
            $this->info("  ✓ الإعدادات موجودة");
            $this->info("  ✓ التنبيهات مفعلة: " . ($settings->notifications_enabled ? 'نعم' : 'لا'));
            $this->info("  ✓ رقم الهاتف: " . $settings->phone_number_id);
            
            // فحص قوالب الرسائل
            $templates = $settings->message_templates;
            if (isset($templates['welcome_message'])) {
                $this->info("  ✓ قالب رسالة الترحيب موجود");
            } else {
                $this->error("  ✗ قالب رسالة الترحيب غير موجود");
            }
        } else {
            $this->error("  ✗ إعدادات الواتساب غير موجودة");
        }
    }

    private function testCreateLawyer($phone)
    {
        $this->info("👨‍💼 اختبار إنشاء محامي جديد:");
        
        try {
            // حذف المحامي التجريبي إذا كان موجوداً
            $testNationalId = 'TEST' . time();
            User::where('national_id', $testNationalId)->delete();
            
            // توليد PIN من 5 أرقام
            $pin = str_pad(rand(0, 99999), 5, '0', STR_PAD_LEFT);
            
            // إنشاء محامي جديد
            $lawyer = User::create([
                'name' => 'محامي اختبار - ' . now()->format('H:i'),
                'email' => 'test.lawyer.' . time() . '@example.com',
                'national_id' => $testNationalId,
                'password' => Hash::make('Law123456!'),
                'pin' => Hash::make($pin),
                'role' => 'lawyer',
                'phone' => $phone,
                'is_active' => true
            ]);

            $this->info("  ✓ تم إنشاء المحامي بنجاح");
            $this->info("  📋 الاسم: " . $lawyer->name);
            $this->info("  🆔 رقم الهوية: " . $lawyer->national_id);
            $this->info("  🔑 الرقم السري: $pin");
            $this->info("  📱 رقم الهاتف: " . $lawyer->phone);

            // إطلاق Event لإرسال رسالة الترحيب
            $this->info("  📨 إطلاق Event لرسالة الترحيب...");
            event(new UserRegistered($lawyer, $pin));
            
            $this->info("  ✓ تم إطلاق Event بنجاح");
            
            // انتظار قليل لمعالجة Event
            sleep(2);
            
        } catch (\Exception $e) {
            $this->error("  ✗ فشل في إنشاء المحامي: " . $e->getMessage());
        }
    }

    private function testDirectWelcomeMessage($phone)
    {
        $this->info("📞 اختبار إرسال رسالة ترحيب مباشرة:");
        
        try {
            // إنشاء مستخدم وهمي للاختبار
            $testUser = new User([
                'name' => 'محامي اختبار مباشر',
                'national_id' => 'DIRECT123',
                'phone' => $phone
            ]);
            
            $testPin = str_pad(rand(0, 99999), 5, '0', STR_PAD_LEFT);
            
            // إرسال رسالة الترحيب مباشرة
            $result = $this->whatsappService->sendWelcomeMessage($testUser, $testPin);
            
            if ($result) {
                $this->info("  ✓ تم إرسال رسالة الترحيب المباشرة بنجاح");
                $this->info("  🔑 الرقم السري المرسل: $testPin");
            } else {
                $this->error("  ✗ فشل في إرسال رسالة الترحيب المباشرة");
            }
            
        } catch (\Exception $e) {
            $this->error("  ✗ خطأ في إرسال الرسالة المباشرة: " . $e->getMessage());
        }
    }

    private function checkSentMessages()
    {
        $this->info("📬 فحص الرسائل المرسلة:");
        
        try {
            // فحص جدول رسائل الواتساب
            $messages = DB::table('whatsapp_messages')
                         ->where('created_at', '>=', now()->subMinutes(5))
                         ->orderBy('created_at', 'desc')
                         ->get();
            
            if ($messages->count() > 0) {
                $this->info("  ✓ تم العثور على " . $messages->count() . " رسالة مرسلة خلال آخر 5 دقائق");
                
                foreach ($messages as $message) {
                    $this->info("    📩 إلى: " . $message->to_phone);
                    $this->info("    📄 المحتوى: " . substr($message->message_content, 0, 100) . "...");
                    $this->info("    📊 الحالة: " . $message->status);
                    $this->info("    🕐 الوقت: " . $message->created_at);
                    $this->line("    " . str_repeat("-", 50));
                }
            } else {
                $this->warn("  ⚠️ لم يتم العثور على رسائل مرسلة حديثاً");
            }
            
        } catch (\Exception $e) {
            $this->error("  ✗ خطأ في فحص الرسائل: " . $e->getMessage());
        }
    }
}
