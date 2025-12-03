<?php

namespace App\Listeners;

use App\Events\LawyerAssignedToCase;
use App\Services\WhatsappService;
use Illuminate\Support\Facades\Log;

class SendLawyerAssignedNotification
{

    protected $whatsappService;

    /**
     * Create the event listener.
     */
    public function __construct(WhatsappService $whatsappService)
    {
        $this->whatsappService = $whatsappService;
    }

    /**
     * Handle the event.
     */
    public function handle(LawyerAssignedToCase $event): void
    {
        try {
            $lawyer = $event->lawyer;
            $case = $event->case;

            if ($lawyer->phone) {
                $variables = [
                    'lawyer_name' => $lawyer->name,
                    'case_number' => $case->case_number,
                    'case_title' => $case->title,
                    'client_name' => $case->client->name ?? 'غير محدد',
                    'case_type' => $this->getCaseTypeInArabic($case->type),
                    'priority' => $this->getPriorityInArabic($case->priority),
                    'due_date' => $case->due_date ? $case->due_date->format('Y-m-d') : 'غير محدد'
                ];

                $this->whatsappService->sendTemplateMessage(
                    $lawyer->phone,
                    'lawyer_assigned',
                    $variables,
                    [
                        'case_id' => $case->id,
                        'user_id' => $lawyer->id,
                        'event_type' => 'lawyer_assigned'
                    ]
                );
            }

            Log::info('Lawyer assigned notification sent', [
                'lawyer_id' => $lawyer->id,
                'case_id' => $case->id
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send lawyer assigned notification', [
                'lawyer_id' => $event->lawyer->id,
                'case_id' => $event->case->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    private function getCaseTypeInArabic($type): string
    {
        $types = [
            'civil' => 'مدني',
            'criminal' => 'جنائي',
            'commercial' => 'تجاري',
            'labor' => 'عمالي',
            'family' => 'أحوال شخصية',
            'real_estate' => 'عقاري',
            'administrative' => 'إداري'
        ];

        return $types[$type] ?? ($type ?? 'غير محدد');
    }

    private function getPriorityInArabic($priority): string
    {
        $priorities = [
            'low' => 'منخفضة',
            'medium' => 'متوسطة',
            'high' => 'عالية',
            'urgent' => 'عاجلة'
        ];

        return $priorities[$priority] ?? ($priority ?? 'غير محدد');
    }
}
