<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Document;
use App\Models\Task;
use App\Models\WhatsappSetting;
use App\Services\WhatsappService;
use App\Events\DocumentUploaded;
use App\Events\LawyerAssignedToCase;
use App\Events\TaskAssigned;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class TestLawyerNotificationsFixed extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:lawyer-notifications-fixed {--phone=966530996778}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test all lawyer WhatsApp notifications (Fixed Version)';

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

        // اختبار 1: ترحيب بالمحامي الجديد
        $this->testWelcomeLawyerNotification($phone);

        // اختبار 2: تنبيه رفع وثيقة
        $this->testDocumentUploadNotification($phone);

        // اختبار 3: تنبيه تعيين قضية جديدة
        $this->testCaseAssignmentNotification($phone);

        // اختبار 4: تنبيه تعيين مهمة
        $this->testTaskAssignmentNotification($phone);

        // اختبار 5: تنبيه المهام المتأخرة
        $this->testOverdueTasksNotification($phone);

        // اختبار 6: تنبيه رسالة من العميل
        $this->testClientMessageNotification($phone);

        // اختبار 7: تذكير بجلسة قريبة
        $this->testUpcomingHearingNotification($phone);

        // اختبار 8: تقرير يومي للمحامي
        $this->testDailyReportNotification($phone);

        // اختبار 9: إرسال رسالة مباشرة
        $this->testDirectMessage($phone);

        $this->newLine();
        $this->info("✅ تم الانتهاء من جميع اختبارات المحامي");
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

    private function testWelcomeLawyerNotification($phone)
    {
        $this->info("🧪 اختبار 1: رسالة ترحيب بالمحامي الجديد");
        
        try {
            $lawyer = User::where('email', 'test-lawyer@example.com')->first();
            
            $message = "⚖️ أهلاً وسهلاً بك في فريق المحامين\n\n";
            $message .= "👤 أستاذ/أستاذة: " . $lawyer->name . "\n\n";
            $message .= "🎯 مرحباً بك في منصة إدارة القضايا المتطورة\n";
            $message .= "📋 ستتلقى تنبيهات فورية عن:\n";
            $message .= "• القضايا الجديدة المكلف بها\n";
            $message .= "• الوثائق المرفوعة من العملاء\n";
            $message .= "• المهام والمواعيد المطلوبة\n";
            $message .= "• رسائل العملاء الجديدة\n\n";
            $message .= "💼 نتمنى لك التوفيق في عملك\n";
            $message .= "📞 للدعم الفني: اتصل بنا في أي وقت";

            $response = $this->whatsappService->sendTextMessage($phone, $message);
            
            if ($response) {
                $this->info("  ✓ تم إرسال رسالة ترحيب المحامي بنجاح");
            } else {
                $this->error("  ✗ فشل في إرسال رسالة ترحيب المحامي");
            }
            
            sleep(2);
            
        } catch (\Exception $e) {
            $this->error("  ✗ خطأ في اختبار رسالة ترحيب المحامي: " . $e->getMessage());
        }
    }

    private function testDocumentUploadNotification($phone)
    {
        $this->info("🧪 اختبار 2: تنبيه رفع وثيقة جديدة من العميل");
        
        try {
            $client = User::where('email', 'test-client@example.com')->first();
            $lawyer = User::where('email', 'test-lawyer@example.com')->first();
            
            // إنشاء قضية تجريبية باستخدام DB builder
            $caseId = DB::table('cases')->insertGetId([
                'title' => 'قضية اختبار التنبيهات',
                'description' => 'قضية لاختبار تنبيهات واتساب',
                'file_number' => 'TEST-' . time(),
                'status' => 'active',
                'priority' => 'medium',
                'case_type' => 'civil',
                'client_id' => $client->id,
                'client_name' => $client->name,
                'filing_date' => now(),
                'created_by' => $lawyer->id,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // إنشاء وثيقة تجريبية
            $document = Document::create([
                'title' => 'وثيقة اختبار التنبيهات',
                'file_name' => 'test_document.pdf',
                'file_path' => 'documents/test_document.pdf',
                'file_size' => 1024,
                'mime_type' => 'application/pdf',
                'category' => 'contract',
                'case_id' => $caseId,
                'uploaded_by' => $client->id,
                'is_confidential' => false
            ]);

            // إرسال تنبيه مباشر للمحامي
            $case = DB::table('cases')->find($caseId);
            $message = "📄 وثيقة جديدة تم رفعها\n\n";
            $message .= "👤 العميل: " . $client->name . "\n";
            $message .= "📋 القضية: " . $case->title . "\n";
            $message .= "📂 رقم الملف: " . $case->file_number . "\n";
            $message .= "📝 اسم الوثيقة: " . $document->title . "\n";
            $message .= "📄 نوع الملف: " . $document->mime_type . "\n";
            $message .= "📅 وقت الرفع: " . now()->format('Y-m-d H:i') . "\n\n";
            $message .= "⚡ يرجى مراجعة الوثيقة والرد على العميل";

            // إطلاق الحدث أيضاً
            event(new DocumentUploaded($document));
            
            $response = $this->whatsappService->sendTextMessage($phone, $message);
            
            if ($response) {
                $this->info("  ✓ تم إرسال تنبيه رفع الوثيقة بنجاح");
            } else {
                $this->error("  ✗ فشل في إرسال تنبيه رفع الوثيقة");
            }
            
            sleep(2);
            
        } catch (\Exception $e) {
            $this->error("  ✗ خطأ في اختبار رفع الوثيقة: " . $e->getMessage());
        }
    }

    private function testCaseAssignmentNotification($phone)
    {
        $this->info("🧪 اختبار 3: تنبيه تعيين قضية جديدة للمحامي");
        
        try {
            $lawyer = User::where('email', 'test-lawyer@example.com')->first();
            $client = User::where('email', 'test-client@example.com')->first();
            
            // إنشاء قضية جديدة للمحامي
            $caseId = DB::table('cases')->insertGetId([
                'title' => 'قضية تجارية مهمة',
                'description' => 'قضية تجارية معقدة تتطلب خبرة قانونية',
                'file_number' => 'ASSIGN-' . time(),
                'status' => 'active',
                'priority' => 'high',
                'case_type' => 'commercial',
                'client_id' => $client->id,
                'client_name' => $client->name,
                'filing_date' => now(),
                'created_by' => 1, // Admin
                'created_at' => now(),
                'updated_at' => now()
            ]);

            $case = DB::table('cases')->find($caseId);

            $message = "⚖️ قضية جديدة تم تعيينك عليها\n\n";
            $message .= "📋 رقم الملف: " . $case->file_number . "\n";
            $message .= "📝 عنوان القضية: " . $case->title . "\n";
            $message .= "👤 العميل: " . $case->client_name . "\n";
            $message .= "⚖️ نوع القضية: " . $case->case_type . "\n";
            $message .= "🔔 الأولوية: " . $case->priority . "\n";
            $message .= "📅 تاريخ التعيين: " . now()->format('Y-m-d H:i') . "\n\n";
            $message .= "📋 الوصف:\n" . $case->description . "\n\n";
            $message .= "⚡ يرجى مراجعة تفاصيل القضية والتواصل مع العميل";

            $response = $this->whatsappService->sendTextMessage($phone, $message);
            
            if ($response) {
                $this->info("  ✓ تم إرسال تنبيه تعيين القضية بنجاح");
            } else {
                $this->error("  ✗ فشل في إرسال تنبيه تعيين القضية");
            }
            
            sleep(2);
            
        } catch (\Exception $e) {
            $this->error("  ✗ خطأ في اختبار تعيين القضية: " . $e->getMessage());
        }
    }

    private function testTaskAssignmentNotification($phone)
    {
        $this->info("🧪 اختبار 4: تنبيه تعيين مهمة جديدة");
        
        try {
            $lawyer = User::where('email', 'test-lawyer@example.com')->first();
            $case = DB::table('cases')->where('file_number', 'like', 'TEST-%')->first();
            
            // إنشاء مهمة تجريبية
            $task = Task::create([
                'title' => 'إعداد مرافعة قانونية',
                'description' => 'إعداد مرافعة شاملة للقضية مع جمع الأدلة والسوابق القضائية المؤيدة',
                'case_id' => $case->id,
                'assigned_to' => $lawyer->id,
                'assigned_by' => 1, // Admin
                'priority' => 'high',
                'status' => 'todo',
                'due_date' => now()->addDays(3)
            ]);

            $message = "📋 مهمة جديدة تم تعيينها لك\n\n";
            $message .= "📝 المهمة: " . $task->title . "\n";
            $message .= "📂 القضية: " . ($case ? $case->title : 'غير محدد') . "\n";
            $message .= "📋 رقم الملف: " . ($case ? $case->file_number : 'غير محدد') . "\n";
            $message .= "🔔 الأولوية: " . $task->priority . "\n";
            $message .= "📅 تاريخ الاستحقاق: " . $task->due_date->format('Y-m-d') . "\n";
            $message .= "⏰ المدة المتبقية: " . $task->due_date->diffForHumans() . "\n\n";
            $message .= "📋 التفاصيل:\n" . $task->description . "\n\n";
            $message .= "⚡ يرجى البدء في تنفيذ المهمة في أقرب وقت";

            // إطلاق حدث تعيين المهمة
            event(new TaskAssigned($task, $lawyer));
            
            $response = $this->whatsappService->sendTextMessage($phone, $message);
            
            if ($response) {
                $this->info("  ✓ تم إرسال تنبيه تعيين المهمة بنجاح");
            } else {
                $this->error("  ✗ فشل في إرسال تنبيه تعيين المهمة");
            }
            
            sleep(2);
            
        } catch (\Exception $e) {
            $this->error("  ✗ خطأ في اختبار تعيين المهمة: " . $e->getMessage());
        }
    }

    private function testOverdueTasksNotification($phone)
    {
        $this->info("🧪 اختبار 5: تنبيه المهام المتأخرة");
        
        try {
            $lawyer = User::where('email', 'test-lawyer@example.com')->first();
            
            // إنشاء مهمة متأخرة
            $overdueTask = Task::create([
                'title' => 'مراجعة عقد الشراكة',
                'description' => 'مراجعة عقد الشراكة وتحديد المخاطر القانونية والتوصيات المطلوبة',
                'assigned_to' => $lawyer->id,
                'assigned_by' => 1,
                'priority' => 'urgent',
                'status' => 'todo',
                'due_date' => now()->subDays(2) // متأخرة بيومين
            ]);

            $message = "🚨 تنبيه عاجل: مهمة متأخرة!\n\n";
            $message .= "📝 المهمة: " . $overdueTask->title . "\n";
            $message .= "� الأولوية: " . $overdueTask->priority . "\n";
            $message .= "📅 كان مطلوب إنجازها في: " . $overdueTask->due_date->format('Y-m-d') . "\n";
            $message .= "⏰ متأخرة منذ: " . $overdueTask->due_date->diffForHumans() . "\n\n";
            $message .= "� تفاصيل المهمة:\n" . $overdueTask->description . "\n\n";
            $message .= "⚠️ يرجى إنجاز هذه المهمة على وجه السرعة\n";
            $message .= "📞 في حالة وجود مشكلة، يرجى التواصل مع الإدارة";
            
            $response = $this->whatsappService->sendTextMessage($phone, $message);
            
            if ($response) {
                $this->info("  ✓ تم إرسال تنبيه المهام المتأخرة بنجاح");
            } else {
                $this->error("  ✗ فشل في إرسال تنبيه المهام المتأخرة");
            }
            
            sleep(2);
            
        } catch (\Exception $e) {
            $this->error("  ✗ خطأ في اختبار المهام المتأخرة: " . $e->getMessage());
        }
    }

    private function testClientMessageNotification($phone)
    {
        $this->info("🧪 اختبار 6: تنبيه رسالة جديدة من العميل");
        
        try {
            $client = User::where('email', 'test-client@example.com')->first();
            $case = DB::table('cases')->where('file_number', 'like', 'TEST-%')->first();

            $message = "💬 رسالة جديدة من العميل\n\n";
            $message .= "👤 العميل: " . $client->name . "\n";
            $message .= "📂 القضية: " . ($case ? $case->title : 'غير محدد') . "\n";
            $message .= "📋 رقم الملف: " . ($case ? $case->file_number : 'غير محدد') . "\n";
            $message .= "📅 وقت الرسالة: " . now()->format('Y-m-d H:i') . "\n\n";
            $message .= "💭 نص الرسالة:\n";
            $message .= "\"أريد الاستفسار عن آخر التطورات في قضيتي وما هي الخطوات التالية المتوقعة. كما أرجو إعلامي بموعد الجلسة القادمة إن وجدت.\"\n\n";
            $message .= "⚡ يرجى الرد على العميل في أقرب وقت";

            $response = $this->whatsappService->sendTextMessage($phone, $message);
            
            if ($response) {
                $this->info("  ✓ تم إرسال تنبيه رسالة العميل بنجاح");
            } else {
                $this->error("  ✗ فشل في إرسال تنبيه رسالة العميل");
            }
            
            sleep(2);
            
        } catch (\Exception $e) {
            $this->error("  ✗ خطأ في اختبار تنبيه رسالة العميل: " . $e->getMessage());
        }
    }

    private function testUpcomingHearingNotification($phone)
    {
        $this->info("🧪 اختبار 7: تذكير بجلسة محكمة قريبة");
        
        try {
            $case = DB::table('cases')->where('file_number', 'like', 'TEST-%')->first();
            
            $hearingDate = now()->addDay()->format('Y-m-d');
            $hearingTime = '09:30';

            $message = "⏰ تذكير مهم: جلسة محكمة غداً\n\n";
            $message .= "📂 القضية: " . ($case ? $case->title : 'غير محدد') . "\n";
            $message .= "📋 رقم الملف: " . ($case ? $case->file_number : 'غير محدد') . "\n";
            $message .= "📅 تاريخ الجلسة: " . $hearingDate . "\n";
            $message .= "🕘 الوقت: " . $hearingTime . " صباحاً\n";
            $message .= "🏛️ المحكمة: المحكمة العامة بالرياض\n";
            $message .= "📍 القاعة: رقم 12 - الدور الثاني\n\n";
            $message .= "📋 نوع الجلسة: جلسة مرافعة\n";
            $message .= "⚠️ تذكير:\n";
            $message .= "• احضر قبل الموعد بـ 30 دقيقة\n";
            $message .= "• تأكد من إحضار جميع الوثائق المطلوبة\n";
            $message .= "• راجع نقاط المرافعة مسبقاً\n\n";
            $message .= "🎯 بالتوفيق في الجلسة!";

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

    private function testDailyReportNotification($phone)
    {
        $this->info("🧪 اختبار 8: تقرير يومي للمحامي");
        
        try {
            $lawyer = User::where('email', 'test-lawyer@example.com')->first();
            
            // إحصائيات تجريبية
            $totalCases = DB::table('cases')->count();
            $pendingTasks = Task::where('assigned_to', $lawyer->id)
                                ->where('status', 'todo')
                                ->count();
            $overdueTasks = Task::where('assigned_to', $lawyer->id)
                               ->where('status', 'todo')
                               ->where('due_date', '<', now())
                               ->count();

            $message = "📊 التقرير اليومي\n\n";
            $message .= "📅 " . now()->format('Y-m-d') . "\n";
            $message .= "👤 الأستاذ/ة: " . $lawyer->name . "\n\n";
            $message .= "📈 ملخص اليوم:\n";
            $message .= "• إجمالي القضايا: " . $totalCases . "\n";
            $message .= "• المهام المعلقة: " . $pendingTasks . "\n";
            $message .= "• المهام المتأخرة: " . $overdueTasks . "\n\n";
            $message .= "📋 مهام اليوم:\n";
            $message .= "• مراجعة الوثائق الجديدة\n";
            $message .= "• إعداد المرافعات القانونية\n";
            $message .= "• الرد على استفسارات العملاء\n\n";
            $message .= "⏰ مواعيد مهمة:\n";
            $message .= "• جلسة محكمة غداً الساعة 9:30\n";
            $message .= "• اجتماع مع العميل الساعة 14:00\n\n";
            $message .= "💼 نتمنى لك يوماً مثمراً!";

            $response = $this->whatsappService->sendTextMessage($phone, $message);
            
            if ($response) {
                $this->info("  ✓ تم إرسال التقرير اليومي بنجاح");
            } else {
                $this->error("  ✗ فشل في إرسال التقرير اليومي");
            }
            
            sleep(2);
            
        } catch (\Exception $e) {
            $this->error("  ✗ خطأ في اختبار التقرير اليومي: " . $e->getMessage());
        }
    }

    private function testUpcomingHearingsNotification($phone)
    {
        $this->info("🧪 اختبار 5: تنبيه الجلسات القريبة");
        
        try {
            $this->info("  ⚠️ تم تخطي اختبار الجلسات - جدول case_hearings غير موجود");
            
        } catch (\Exception $e) {
            $this->error("  ✗ خطأ في اختبار الجلسات القريبة: " . $e->getMessage());
        }
    }

    private function testDirectMessage($phone)
    {
        $this->info("🧪 اختبار 6: إرسال رسالة مباشرة");
        
        try {
            // تعديل ساعات العمل مؤقتاً للاختبار
            $settings = WhatsappSetting::first();
            $originalWorkingHours = $settings->working_hours;
            
            // توسيع ساعات العمل لتشمل المساء
            $testWorkingHours = $originalWorkingHours;
            $testWorkingHours['monday']['end'] = '23:59';
            $testWorkingHours['tuesday']['end'] = '23:59';
            $testWorkingHours['wednesday']['end'] = '23:59';
            $testWorkingHours['thursday']['end'] = '23:59';
            $testWorkingHours['sunday']['end'] = '23:59';
            
            $settings->update(['working_hours' => $testWorkingHours]);
            
            $message = "🧪 رسالة اختبار من نظام المحاماة\n\n";
            $message .= "✅ تم اختبار جميع أنواع التنبيهات بنجاح:\n";
            $message .= "• تنبيه رفع الوثائق\n";
            $message .= "• تنبيه تعيين المحامي\n";
            $message .= "• تنبيه تعيين المهام\n";
            $message .= "• تنبيه المهام المتأخرة\n";
            $message .= "• تنبيه الجلسات القريبة\n\n";
            $message .= "📅 التاريخ: " . now()->format('Y-m-d H:i:s');

            $this->info("  📱 محاولة إرسال الرسالة إلى: $phone");
            
            $response = $this->whatsappService->sendTextMessage($phone, $message);
            
            $this->info("  📊 استجابة الإرسال: " . ($response ? 'true' : 'false'));
            
            if ($response) {
                $this->info("  ✓ تم إرسال الرسالة المباشرة بنجاح");
            } else {
                $this->error("  ✗ فشل في إرسال الرسالة المباشرة");
                
                // اختبار مبسط جداً
                $this->info("  🔧 محاولة اختبار مبسط...");
                $simpleResponse = $this->whatsappService->sendTextMessage($phone, "اختبار بسيط");
                $this->info("  📊 الاختبار البسيط: " . ($simpleResponse ? 'نجح' : 'فشل'));
            }
            
            // إعادة ساعات العمل الأصلية
            $settings->update(['working_hours' => $originalWorkingHours]);
            
        } catch (\Exception $e) {
            $this->error("  ✗ خطأ في إرسال الرسالة المباشرة: " . $e->getMessage());
        }
    }
}
