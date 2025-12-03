<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\WhatsappService;
use App\Models\User;
use App\Models\CaseModel;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class CheckUpcomingHearings extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'whatsapp:check-upcoming-hearings';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for upcoming court hearings and send WhatsApp notifications to lawyers';

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
        $this->info('Checking for upcoming court hearings...');

        try {
            // التحقق من الجلسات خلال 24 ساعة القادمة
            $this->checkTomorrowHearings();
            
            // التحقق من الجلسات خلال 3 ساعات القادمة
            $this->checkImmediateHearings();
            
            $this->info('Hearing notifications check completed successfully.');
            
        } catch (\Exception $e) {
            $this->error('Error checking hearings: ' . $e->getMessage());
            Log::error('CheckUpcomingHearings command failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * التحقق من جلسات الغد
     */
    private function checkTomorrowHearings()
    {
        $lawyers = User::where('role', 'lawyer')->where('phone', '!=', null)->get();
        
        foreach ($lawyers as $lawyer) {
            // محاكاة جلسة غداً
            $mockHearing = (object) [
                'case_number' => 'LAW-2025-001',
                'case_title' => 'قضية نزاع تجاري',
                'client_name' => 'شركة الخليج للتجارة',
                'hearing_time' => '10:00',
                'court_location' => 'المحكمة التجارية - الرياض',
                'when' => 'غداً'
            ];

            $variables = [
                'lawyer_name' => $lawyer->name,
                'when' => $mockHearing->when,
                'hearing_time' => $mockHearing->hearing_time,
                'case_number' => $mockHearing->case_number,
                'case_title' => $mockHearing->case_title,
                'court_location' => $mockHearing->court_location,
                'client_name' => $mockHearing->client_name
            ];

            $result = $this->whatsappService->sendTemplateMessage(
                $lawyer->phone,
                'hearing_reminder_lawyer',
                $variables,
                [
                    'case_id' => 1,
                    'user_id' => $lawyer->id,
                    'event_type' => 'hearing_reminder'
                ]
            );

            if ($result) {
                $this->info("Tomorrow hearing reminder sent to {$lawyer->name}");
            } else {
                $this->warn("Failed to send tomorrow hearing reminder to {$lawyer->name}");
            }
            
            break; // إرسال لمحامي واحد فقط للاختبار
        }
    }

    /**
     * التحقق من الجلسات خلال 3 ساعات
     */
    private function checkImmediateHearings()
    {
        $lawyers = User::where('role', 'lawyer')->where('phone', '!=', null)->get();
        
        foreach ($lawyers as $lawyer) {
            // محاكاة جلسة خلال 3 ساعات
            $mockHearing = (object) [
                'case_number' => 'LAW-2025-002',
                'case_title' => 'قضية عمالية',
                'client_name' => 'أحمد محمد علي',
                'hearing_time' => '14:00',
                'court_location' => 'محكمة العمل - جدة',
                'when' => 'اليوم'
            ];

            $variables = [
                'lawyer_name' => $lawyer->name,
                'when' => $mockHearing->when,
                'hearing_time' => $mockHearing->hearing_time,
                'case_number' => $mockHearing->case_number,
                'case_title' => $mockHearing->case_title,
                'court_location' => $mockHearing->court_location,
                'client_name' => $mockHearing->client_name
            ];

            $result = $this->whatsappService->sendTemplateMessage(
                $lawyer->phone,
                'hearing_reminder_lawyer',
                $variables,
                [
                    'case_id' => 2,
                    'user_id' => $lawyer->id,
                    'event_type' => 'immediate_hearing_reminder'
                ]
            );

            if ($result) {
                $this->info("Immediate hearing reminder sent to {$lawyer->name}");
            } else {
                $this->warn("Failed to send immediate hearing reminder to {$lawyer->name}");
            }
            
            break; // إرسال لمحامي واحد فقط للاختبار
        }
    }
}
