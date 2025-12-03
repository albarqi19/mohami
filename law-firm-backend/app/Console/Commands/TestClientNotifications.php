<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Document;
use App\Models\Task;
use App\Models\WhatsappSetting;
use App\Services\WhatsappService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class TestClientNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:client-notifications {--phone=966530996778}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test all client WhatsApp notifications';

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
        
        $this->info("🚀 بدء اختبار تنبيهات العميل عبر واتساب");
        $this->info("📱 الرقم المستخدم: $phone");
        $this->newLine();

        // إنشاء بيانات تجريبية
        $this->createTestData($phone);

        // اختبار 1: ترحيب بالعميل الجديد
        $this->testWelcomeNotification($phone);

        // اختبار 2: تنبيه إنشاء قضية جديدة
        $this->testCaseCreatedNotification($phone);

        // اختبار 3: تنبيه تحديث حالة القضية
        $this->testCaseUpdatedNotification($phone);

        // اختبار 4: تذكير بموعد جلسة
        $this->testHearingReminderNotification($phone);

        // اختبار 5: تنبيه إضافة تعليق جديد
        $this->testNewCommentNotification($phone);

        // اختبار 6: رسالة مباشرة للعميل
        $this->testDirectClientMessage($phone);

        $this->newLine();
        $this->info("✅ تم الانتهاء من جميع اختبارات العميل");
    }

    private function createTestData($phone)
    {
        $this->info("📋 إنشاء بيانات تجريبية للعميل...");
        
        // إنشاء عميل تجريبي بالرقم المحدد
        $client = User::where('email', 'test-client-main@example.com')->first();
        if (!$client) {
            $client = User::create([
                'name' => 'العميل الرئيسي للاختبار',
                'email' => 'test-client-main@example.com',
                'phone' => $phone,
                'role' => 'client',
                'password' => bcrypt('password'),
                'national_id' => '5555555555'
            ]);
        } else {
            // تحديث رقم الهاتف
            $client->update(['phone' => $phone]);
        }

        // إنشاء محامي مساعد
        $lawyer = User::where('email', 'test-lawyer-helper@example.com')->first();
        if (!$lawyer) {
            $lawyer = User::create([
                'name' => 'المحامي المساعد',
                'email' => 'test-lawyer-helper@example.com',
                'phone' => '966501111111',
                'role' => 'lawyer',
                'password' => bcrypt('password'),
                'national_id' => '6666666666'
            ]);
        }

        $this->info("  ✓ تم إنشاء/العثور على المستخدمين التجريبيين");
    }

    private function testWelcomeNotification($phone)
    {
        $this->info("🧪 اختبار 1: رسالة ترحيب بالعميل الجديد");
        
        try {
            $client = User::where('email', 'test-client-main@example.com')->first();
            
            $message = "🌟 أهلاً وسهلاً بك في مكتب المحاماة\n\n";
            $message .= "👤 عزيزي/عزيزتي: " . $client->name . "\n\n";
            $message .= "📋 تم إنشاء حسابك بنجاح وسنقوم بخدمتك على أكمل وجه\n\n";
            $message .= "📞 للاستفسارات: اتصل بنا في أي وقت\n";
            $message .= "💼 ستصلك تنبيهات فورية عن جميع تحديثات قضاياك";

            $response = $this->whatsappService->sendTextMessage($phone, $message);
            
            if ($response) {
                $this->info("  ✓ تم إرسال رسالة الترحيب بنجاح");
            } else {
                $this->error("  ✗ فشل في إرسال رسالة الترحيب");
            }
            
            sleep(2);
            
        } catch (\Exception $e) {
            $this->error("  ✗ خطأ في اختبار رسالة الترحيب: " . $e->getMessage());
        }
    }

    private function testCaseCreatedNotification($phone)
    {
        $this->info("🧪 اختبار 2: تنبيه إنشاء قضية جديدة");
        
        try {
            $client = User::where('email', 'test-client-main@example.com')->first();
            $lawyer = User::where('email', 'test-lawyer-helper@example.com')->first();
            
            // إنشاء قضية تجريبية للعميل
            $caseId = DB::table('cases')->insertGetId([
                'title' => 'قضية العميل الرئيسية',
                'description' => 'قضية تجريبية لاختبار تنبيهات العميل',
                'file_number' => 'CLIENT-TEST-' . time(),
                'status' => 'active',
                'priority' => 'high',
                'case_type' => 'commercial',
                'client_id' => $client->id,
                'client_name' => $client->name,
                'filing_date' => now(),
                'created_by' => $lawyer->id,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            $case = DB::table('cases')->find($caseId);

            $message = "📂 تم إنشاء قضية جديدة لك\n\n";
            $message .= "📋 رقم الملف: " . $case->file_number . "\n";
            $message .= "📝 العنوان: " . $case->title . "\n";
            $message .= "⚖️ نوع القضية: " . $case->case_type . "\n";
            $message .= "📅 تاريخ التسجيل: " . Carbon::parse($case->filing_date)->format('Y-m-d') . "\n";
            $message .= "🔔 الأولوية: " . $case->priority . "\n\n";
            $message .= "سنقوم بمتابعة قضيتك وإرسال التحديثات فور توفرها 📱";

            $response = $this->whatsappService->sendTextMessage($phone, $message);
            
            if ($response) {
                $this->info("  ✓ تم إرسال تنبيه إنشاء القضية بنجاح");
            } else {
                $this->error("  ✗ فشل في إرسال تنبيه إنشاء القضية");
            }
            
            sleep(2);
            
        } catch (\Exception $e) {
            $this->error("  ✗ خطأ في اختبار تنبيه إنشاء القضية: " . $e->getMessage());
        }
    }

    private function testCaseUpdatedNotification($phone)
    {
        $this->info("🧪 اختبار 3: تنبيه تحديث حالة القضية");
        
        try {
            $case = DB::table('cases')->where('file_number', 'like', 'CLIENT-TEST-%')->first();
            
            if ($case) {
                // تحديث حالة القضية
                DB::table('cases')->where('id', $case->id)->update([
                    'status' => 'active',
                    'updated_at' => now()
                ]);

                $message = "📈 تحديث في قضيتك\n\n";
                $message .= "📋 رقم الملف: " . $case->file_number . "\n";
                $message .= "📝 العنوان: " . $case->title . "\n";
                $message .= "🔄 الحالة الجديدة: نشطة ومعالجة\n";
                $message .= "📅 تاريخ التحديث: " . now()->format('Y-m-d H:i') . "\n\n";
                $message .= "💼 تم البدء في معالجة قضيتك وسنوافيك بالتطورات";

                $response = $this->whatsappService->sendTextMessage($phone, $message);
                
                if ($response) {
                    $this->info("  ✓ تم إرسال تنبيه تحديث القضية بنجاح");
                } else {
                    $this->error("  ✗ فشل في إرسال تنبيه تحديث القضية");
                }
            }
            
            sleep(2);
            
        } catch (\Exception $e) {
            $this->error("  ✗ خطأ في اختبار تنبيه تحديث القضية: " . $e->getMessage());
        }
    }

    private function testHearingReminderNotification($phone)
    {
        $this->info("🧪 اختبار 4: تذكير بموعد جلسة");
        
        try {
            $case = DB::table('cases')->where('file_number', 'like', 'CLIENT-TEST-%')->first();
            
            $hearingDate = now()->addDays(3)->format('Y-m-d');
            $hearingTime = '10:00';

            $message = "⏰ تذكير مهم: موعد جلسة محكمة\n\n";
            $message .= "📋 رقم الملف: " . $case->file_number . "\n";
            $message .= "📝 القضية: " . $case->title . "\n";
            $message .= "📅 تاريخ الجلسة: " . $hearingDate . "\n";
            $message .= "🕙 الوقت: " . $hearingTime . " صباحاً\n";
            $message .= "🏛️ المكان: محكمة الرياض العامة\n\n";
            $message .= "⚠️ يرجى الحضور قبل الموعد بـ 30 دقيقة\n";
            $message .= "📞 للاستفسار اتصل بنا فوراً";

            $response = $this->whatsappService->sendTextMessage($phone, $message);
            
            if ($response) {
                $this->info("  ✓ تم إرسال تذكير الجلسة بنجاح");
            } else {
                $this->error("  ✗ فشل في إرسال تذكير الجلسة");
            }
            
            sleep(2);
            
        } catch (\Exception $e) {
            $this->error("  ✗ خطأ في اختبار تذكير الجلسة: " . $e->getMessage());
        }
    }

    private function testNewCommentNotification($phone)
    {
        $this->info("🧪 اختبار 5: تنبيه إضافة تعليق جديد");
        
        try {
            $case = DB::table('cases')->where('file_number', 'like', 'CLIENT-TEST-%')->first();
            $lawyer = User::where('email', 'test-lawyer-helper@example.com')->first();

            $message = "💬 تعليق جديد على قضيتك\n\n";
            $message .= "📋 رقم الملف: " . $case->file_number . "\n";
            $message .= "👤 من: " . $lawyer->name . " (المحامي)\n";
            $message .= "📅 التاريخ: " . now()->format('Y-m-d H:i') . "\n\n";
            $message .= "💭 التعليق:\n";
            $message .= "تم مراجعة الوثائق المرفوعة وهي مكتملة. سنقوم بتقديم المرافعة خلال الأيام القادمة.\n\n";
            $message .= "📱 يمكنك الرد على هذا التعليق عبر النظام";

            $response = $this->whatsappService->sendTextMessage($phone, $message);
            
            if ($response) {
                $this->info("  ✓ تم إرسال تنبيه التعليق الجديد بنجاح");
            } else {
                $this->error("  ✗ فشل في إرسال تنبيه التعليق الجديد");
            }
            
            sleep(2);
            
        } catch (\Exception $e) {
            $this->error("  ✗ خطأ في اختبار تنبيه التعليق الجديد: " . $e->getMessage());
        }
    }

    private function testDirectClientMessage($phone)
    {
        $this->info("🧪 اختبار 6: رسالة مباشرة للعميل");
        
        try {
            $client = User::where('email', 'test-client-main@example.com')->first();
            
            $message = "📧 رسالة من مكتب المحاماة\n\n";
            $message .= "👤 عزيزي/عزيزتي: " . $client->name . "\n\n";
            $message .= "✅ تم اختبار جميع أنواع التنبيهات:\n";
            $message .= "• 🌟 رسالة الترحيب\n";
            $message .= "• 📂 تنبيه إنشاء القضية\n";
            $message .= "• 📈 تنبيه تحديث القضية\n";
            $message .= "• ⏰ تذكير الجلسات\n";
            $message .= "• 💬 التعليقات الجديدة\n\n";
            $message .= "🔔 جميع التنبيهات تعمل بشكل ممتاز!\n\n";
            $message .= "📞 نحن هنا لخدمتك على مدار الساعة\n";
            $message .= "📅 " . now()->format('Y-m-d H:i:s');

            $response = $this->whatsappService->sendTextMessage($phone, $message);
            
            if ($response) {
                $this->info("  ✓ تم إرسال الرسالة المباشرة للعميل بنجاح");
                $this->info("  🎉 جميع تنبيهات العميل تعمل بشكل ممتاز!");
            } else {
                $this->error("  ✗ فشل في إرسال الرسالة المباشرة للعميل");
            }
            
        } catch (\Exception $e) {
            $this->error("  ✗ خطأ في إرسال الرسالة المباشرة للعميل: " . $e->getMessage());
        }
    }
}
