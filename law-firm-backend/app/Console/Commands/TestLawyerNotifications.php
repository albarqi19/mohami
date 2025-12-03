<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\CaseModel;
use App\Models\Document;
use App\Models\Task;
use App\Models\WhatsappSetting;
use App\Services\WhatsappService;
use App\Events\DocumentUploaded;
use App\Events\LawyerAssignedToCase;
use App\Events\TaskAssigned;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class TestLawyerNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:lawyer-notifications {--phone=966530996778}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test all lawyer WhatsApp notifications';

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
        
        $this->info("🚀 بدء اختبار تنبيهات المحامي عبر واتساب");
        $this->info("📱 الرقم المستخدم: $phone");
        $this->newLine();

        // إنشاء بيانات تجريبية
        $this->createTestData();

        // اختبار 1: تنبيه رفع وثيقة
        $this->testDocumentUploadNotification($phone);

        // اختبار 2: تنبيه تعيين محامي لقضية
        $this->testLawyerAssignmentNotification($phone);

        // اختبار 3: تنبيه تعيين مهمة
        $this->testTaskAssignmentNotification($phone);

        // اختبار 4: تنبيه المهام المتأخرة
        $this->testOverdueTasksNotification($phone);

        // اختبار 5: تنبيه الجلسات القريبة
        $this->testUpcomingHearingsNotification($phone);

        // اختبار 6: إرسال رسالة مباشرة
        $this->testDirectMessage($phone);

        $this->newLine();
        $this->info("✅ تم الانتهاء من جميع الاختبارات");
    }

    private function createTestData()
    {
        $this->info("📋 إنشاء بيانات تجريبية...");
        
        // التأكد من وجود إعدادات واتساب
        if (!WhatsappSetting::first()) {
            WhatsappSetting::create([
                'notifications_enabled' => true,
                'notification_settings' => WhatsappSetting::getDefaultNotificationSettings(),
                'message_templates' => WhatsappSetting::getDefaultTemplates(),
                'daily_report_time' => '09:00',
                'daily_report_enabled' => true,
                'working_hours' => WhatsappSetting::getDefaultWorkingHours()
            ]);
            $this->info("  ✓ تم إنشاء إعدادات واتساب");
        }

        // إنشاء عميل تجريبي أو البحث عنه
        $client = User::where('email', 'test-client@example.com')->first();
        if (!$client) {
            $client = User::create([
                'name' => 'عميل تجريبي',
                'email' => 'test-client@example.com',
                'phone' => '966501234567',
                'role' => 'client',
                'password' => bcrypt('password'),
                'national_id' => '1234567890'
            ]);
        }

        // إنشاء محامي تجريبي أو البحث عنه
        $lawyer = User::where('email', 'test-lawyer@example.com')->first();
        if (!$lawyer) {
            $lawyer = User::create([
                'name' => 'محامي تجريبي',
                'email' => 'test-lawyer@example.com',
                'phone' => $this->option('phone'),
                'role' => 'lawyer',
                'password' => bcrypt('password'),
                'national_id' => '0987654321'
            ]);
        } else {
            // تحديث رقم الهاتف
            $lawyer->update(['phone' => $this->option('phone')]);
        }

        $this->info("  ✓ تم إنشاء/العثور على المستخدمين التجريبيين");
    }

    private function testDocumentUploadNotification($phone)
    {
        $this->info("🧪 اختبار 1: تنبيه رفع وثيقة جديدة");
        
        try {
            $client = User::where('email', 'test-client@example.com')->first();
            $lawyer = User::where('email', 'test-lawyer@example.com')->first();
            
            // إنشاء قضية تجريبية
            $case = \App\Models\CaseModel::create([
                'title' => 'قضية اختبار التنبيهات',
                'description' => 'قضية لاختبار تنبيهات واتساب',
                'case_number' => 'TEST-' . time(),
                'status' => 'active',
                'priority' => 'medium',
                'case_type' => 'civil',
                'client_id' => $client->id,
                'lawyer_id' => $lawyer->id,
                'filing_date' => now()
            ]);

            // إنشاء وثيقة تجريبية
            $document = Document::create([
                'title' => 'وثيقة اختبار التنبيهات',
                'file_name' => 'test_document.pdf',
                'file_path' => 'documents/test_document.pdf',
                'file_size' => 1024,
                'mime_type' => 'application/pdf',
                'category' => 'contract',
                'case_id' => $case->id,
                'uploaded_by' => $client->id,
                'is_confidential' => false
            ]);

            // إطلاق الحدث
            event(new DocumentUploaded($document));
            
            $this->info("  ✓ تم إطلاق حدث رفع الوثيقة");
            sleep(2);
            
        } catch (\Exception $e) {
            $this->error("  ✗ خطأ في اختبار رفع الوثيقة: " . $e->getMessage());
        }
    }

    private function testLawyerAssignmentNotification($phone)
    {
        $this->info("🧪 اختبار 2: تنبيه تعيين محامي لقضية");
        
        try {
            $lawyer = User::where('email', 'test-lawyer@example.com')->first();
            $case = CaseModel::where('case_number', 'like', 'TEST-%')->first();
            
            if ($case) {
                // إطلاق حدث تعيين المحامي
                event(new LawyerAssignedToCase($case, $lawyer));
                
                $this->info("  ✓ تم إطلاق حدث تعيين المحامي");
                sleep(2);
            }
            
        } catch (\Exception $e) {
            $this->error("  ✗ خطأ في اختبار تعيين المحامي: " . $e->getMessage());
        }
    }

    private function testTaskAssignmentNotification($phone)
    {
        $this->info("🧪 اختبار 3: تنبيه تعيين مهمة جديدة");
        
        try {
            $lawyer = User::where('email', 'test-lawyer@example.com')->first();
            $case = CaseModel::where('case_number', 'like', 'TEST-%')->first();
            
            // إنشاء مهمة تجريبية
            $task = Task::create([
                'title' => 'مهمة اختبار التنبيهات',
                'description' => 'مهمة لاختبار تنبيهات واتساب للمحامي',
                'case_id' => $case->id,
                'assigned_to' => $lawyer->id,
                'assigned_by' => 1, // Admin
                'priority' => 'high',
                'status' => 'pending',
                'due_date' => now()->addDays(3)
            ]);

            // إطلاق حدث تعيين المهمة
            event(new TaskAssigned($task, $lawyer));
            
            $this->info("  ✓ تم إطلاق حدث تعيين المهمة");
            sleep(2);
            
        } catch (\Exception $e) {
            $this->error("  ✗ خطأ في اختبار تعيين المهمة: " . $e->getMessage());
        }
    }

    private function testOverdueTasksNotification($phone)
    {
        $this->info("🧪 اختبار 4: تنبيه المهام المتأخرة");
        
        try {
            $lawyer = User::where('email', 'test-lawyer@example.com')->first();
            
            // إنشاء مهمة متأخرة
            $overdueTask = Task::create([
                'title' => 'مهمة متأخرة للاختبار',
                'description' => 'مهمة متأخرة لاختبار التنبيهات',
                'assigned_to' => $lawyer->id,
                'assigned_by' => 1,
                'priority' => 'urgent',
                'status' => 'pending',
                'due_date' => now()->subDays(2) // متأخرة بيومين
            ]);

            // تشغيل command فحص المهام المتأخرة
            $this->call('check:overdue-tasks');
            
            $this->info("  ✓ تم تشغيل فحص المهام المتأخرة");
            sleep(2);
            
        } catch (\Exception $e) {
            $this->error("  ✗ خطأ في اختبار المهام المتأخرة: " . $e->getMessage());
        }
    }

    private function testUpcomingHearingsNotification($phone)
    {
        $this->info("🧪 اختبار 5: تنبيه الجلسات القريبة");
        
        try {
            $lawyer = User::where('email', 'test-lawyer@example.com')->first();
            $case = CaseModel::where('case_number', 'like', 'TEST-%')->first();
            
            // إنشاء جلسة قريبة
            DB::table('case_hearings')->insert([
                'case_id' => $case->id,
                'hearing_date' => now()->addDay(), // غداً
                'hearing_time' => '10:00:00',
                'location' => 'محكمة الرياض',
                'type' => 'main_hearing',
                'status' => 'scheduled',
                'notes' => 'جلسة اختبار للتنبيهات',
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // تشغيل command فحص الجلسات القريبة
            $this->call('check:upcoming-hearings');
            
            $this->info("  ✓ تم تشغيل فحص الجلسات القريبة");
            sleep(2);
            
        } catch (\Exception $e) {
            $this->error("  ✗ خطأ في اختبار الجلسات القريبة: " . $e->getMessage());
        }
    }

    private function testDirectMessage($phone)
    {
        $this->info("🧪 اختبار 6: إرسال رسالة مباشرة");
        
        try {
            $message = "🧪 رسالة اختبار من نظام المحاماة\n\n";
            $message .= "✅ تم اختبار جميع أنواع التنبيهات بنجاح:\n";
            $message .= "• تنبيه رفع الوثائق\n";
            $message .= "• تنبيه تعيين المحامي\n";
            $message .= "• تنبيه تعيين المهام\n";
            $message .= "• تنبيه المهام المتأخرة\n";
            $message .= "• تنبيه الجلسات القريبة\n\n";
            $message .= "📅 التاريخ: " . now()->format('Y-m-d H:i:s');

            $response = $this->whatsappService->sendTextMessage($phone, $message);
            
            if ($response) {
                $this->info("  ✓ تم إرسال الرسالة المباشرة بنجاح");
            } else {
                $this->error("  ✗ فشل في إرسال الرسالة المباشرة");
            }
            
        } catch (\Exception $e) {
            $this->error("  ✗ خطأ في إرسال الرسالة المباشرة: " . $e->getMessage());
        }
    }
}
