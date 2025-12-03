<?php

namespace App\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use App\Models\Activity;
use Illuminate\Support\Facades\Auth;

class LogCaseActivity
{
    /**
     * Handle the event.
     */
    public function handle($event): void
    {
        // Check if the event has necessary properties
        if (!isset($event->case) || !isset($event->activityType)) {
            return;
        }

        // Get the authenticated user
        $user = Auth::user();
        
        // Create activity log
        Activity::create([
            'case_id' => $event->case->id,
            'user_id' => $user ? $user->id : null,
            'type' => $event->activityType,
            'description' => $event->description ?? $this->getDefaultDescription($event->activityType),
            'details' => $event->details ?? null,
            'created_at' => now(),
        ]);
    }

    /**
     * Get default description based on activity type
     */
    private function getDefaultDescription(string $activityType): string
    {
        return match ($activityType) {
            'case_created' => 'تم إنشاء القضية',
            'case_updated' => 'تم تحديث القضية',
            'document_uploaded' => 'تم رفع وثيقة جديدة',
            'document_deleted' => 'تم حذف وثيقة',
            'task_created' => 'تم إنشاء مهمة جديدة',
            'task_updated' => 'تم تحديث المهمة',
            'task_completed' => 'تم إكمال المهمة',
            'notification_sent' => 'تم إرسال إشعار',
            'meeting_scheduled' => 'تم جدولة اجتماع',
            'court_hearing' => 'جلسة محكمة',
            'client_contact' => 'تواصل مع العميل',
            'case_review' => 'مراجعة القضية',
            'research' => 'بحث قانوني',
            'document_review' => 'مراجعة الوثائق',
            'case_preparation' => 'تحضير القضية',
            'settlement_discussion' => 'مناقشة تسوية',
            'expert_consultation' => 'استشارة خبير',
            'evidence_collection' => 'جمع الأدلة',
            'witness_interview' => 'مقابلة شاهد',
            'legal_research' => 'بحث قانوني متخصص',
            'case_closure' => 'إغلاق القضية',
            default => 'نشاط جديد',
        };
    }
}
