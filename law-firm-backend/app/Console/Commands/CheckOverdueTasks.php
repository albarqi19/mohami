<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\WhatsappService;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class CheckOverdueTasks extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'whatsapp:check-overdue-tasks';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for overdue and upcoming tasks and send WhatsApp notifications to lawyers';

    protected $whatsappService;

    /**
     * Create a new command instance.
     */
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
        $this->info('Checking for overdue and upcoming tasks...');

        try {
            // التحقق من المهام المتأخرة
            $this->checkOverdueTasks();
            
            // التحقق من المهام القريبة من الانتهاء (خلال 24 ساعة)
            $this->checkUpcomingTasks();
            
            $this->info('Task notifications check completed successfully.');
            
        } catch (\Exception $e) {
            $this->error('Error checking tasks: ' . $e->getMessage());
            Log::error('CheckOverdueTasks command failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * التحقق من المهام المتأخرة
     */
    private function checkOverdueTasks()
    {
        // هنا يمكن إضافة logic للحصول على المهام المتأخرة من قاعدة البيانات
        // مؤقتاً سنستخدم mock data للاختبار
        
        $lawyers = User::where('role', 'lawyer')->where('phone', '!=', null)->get();
        
        foreach ($lawyers as $lawyer) {
            // محاكاة مهمة متأخرة
            $mockOverdueTask = (object) [
                'id' => 1,
                'title' => 'مراجعة العقد التجاري',
                'case_number' => 'LAW-2025-001',
                'case_title' => 'قضية نزاع تجاري',
                'days_overdue' => 3,
                'priority' => 'high'
            ];

            $variables = [
                'lawyer_name' => $lawyer->name,
                'task_title' => $mockOverdueTask->title,
                'case_number' => $mockOverdueTask->case_number,
                'days_overdue' => $mockOverdueTask->days_overdue,
                'priority' => $this->getPriorityInArabic($mockOverdueTask->priority)
            ];

            $result = $this->whatsappService->sendTemplateMessage(
                $lawyer->phone,
                'task_overdue',
                $variables,
                [
                    'task_id' => $mockOverdueTask->id,
                    'user_id' => $lawyer->id,
                    'event_type' => 'task_overdue_reminder'
                ]
            );

            if ($result) {
                $this->info("Overdue task notification sent to {$lawyer->name}");
            } else {
                $this->warn("Failed to send overdue task notification to {$lawyer->name}");
            }
            
            break; // إرسال لمحامي واحد فقط للاختبار
        }
    }

    /**
     * التحقق من المهام القريبة من الانتهاء
     */
    private function checkUpcomingTasks()
    {
        $lawyers = User::where('role', 'lawyer')->where('phone', '!=', null)->get();
        
        foreach ($lawyers as $lawyer) {
            // محاكاة مهمة قريبة من الانتهاء
            $mockUpcomingTask = (object) [
                'id' => 2,
                'title' => 'إعداد مذكرة دفاع',
                'case_number' => 'LAW-2025-002',
                'case_title' => 'قضية عمالية',
                'hours_remaining' => 18,
                'priority' => 'high'
            ];

            $variables = [
                'lawyer_name' => $lawyer->name,
                'task_title' => $mockUpcomingTask->title,
                'case_number' => $mockUpcomingTask->case_number,
                'hours_remaining' => $mockUpcomingTask->hours_remaining,
                'priority' => $this->getPriorityInArabic($mockUpcomingTask->priority)
            ];

            $result = $this->whatsappService->sendTemplateMessage(
                $lawyer->phone,
                'task_due_reminder',
                $variables,
                [
                    'task_id' => $mockUpcomingTask->id,
                    'user_id' => $lawyer->id,
                    'event_type' => 'task_due_reminder'
                ]
            );

            if ($result) {
                $this->info("Due task reminder sent to {$lawyer->name}");
            } else {
                $this->warn("Failed to send due task reminder to {$lawyer->name}");
            }
            
            break; // إرسال لمحامي واحد فقط للاختبار
        }
    }

    private function getPriorityInArabic($priority): string
    {
        $priorities = [
            'low' => 'منخفضة',
            'medium' => 'متوسطة',
            'high' => 'عالية',
            'urgent' => 'عاجلة'
        ];

        return $priorities[$priority] ?? $priority;
    }
}
