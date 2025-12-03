<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'case_id',
        'title',
        'description',
        'type',
        'scheduled_at',
        'duration_minutes',
        'location',
        'attendees',
        'status',
        'priority',
        'notes',
        'reminders',
        'reminder_sent_at',
        'outcome',
        'documents',
        'created_by',
        'assigned_to',
        'rescheduled_from',
        'cancellation_reason',
        // Najiz Integration Fields
        'najiz_id',
        'najiz_synced_at',
        'source',
        'date',
        'time'
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'rescheduled_from' => 'datetime',
        'reminder_sent_at' => 'datetime',
        'attendees' => 'array',
        'reminders' => 'array',
        'documents' => 'array',
        'najiz_synced_at' => 'datetime',
        'date' => 'date'
    ];

    /**
     * العلاقة مع القضية
     */
    public function case(): BelongsTo
    {
        return $this->belongsTo(CaseModel::class, 'case_id');
    }

    /**
     * العلاقة مع منشئ الموعد
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * العلاقة مع المسؤول عن الموعد
     */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * الحصول على نوع الموعد باللغة العربية
     */
    public function getTypeInArabic(): string
    {
        return match ($this->type) {
            'court_hearing' => 'جلسة محكمة',
            'client_meeting' => 'موعد عميل',
            'team_meeting' => 'اجتماع فريق',
            'document_filing' => 'تقديم وثائق',
            'arbitration' => 'جلسة تحكيم',
            'consultation' => 'استشارة قانونية',
            'mediation' => 'جلسة وساطة',
            'settlement' => 'جلسة صلح',
            default => 'موعد أخر'
        };
    }

    /**
     * الحصول على حالة الموعد باللغة العربية
     */
    public function getStatusInArabic(): string
    {
        return match ($this->status) {
            'scheduled' => 'مجدول',
            'confirmed' => 'مؤكد',
            'in_progress' => 'قيد التنفيذ',
            'completed' => 'مكتمل',
            'cancelled' => 'ملغي',
            'postponed' => 'مؤجل',
            'no_show' => 'لم يحضر',
            default => $this->status
        };
    }

    /**
     * الحصول على الأولوية باللغة العربية
     */
    public function getPriorityInArabic(): string
    {
        return match ($this->priority) {
            'low' => 'منخفضة',
            'medium' => 'متوسطة',
            'high' => 'عالية',
            'urgent' => 'عاجلة',
            default => $this->priority
        };
    }

    /**
     * فحص إذا كان الموعد اليوم
     */
    public function isToday(): bool
    {
        return $this->scheduled_at->isToday();
    }

    /**
     * فحص إذا كان الموعد غداً
     */
    public function isTomorrow(): bool
    {
        return $this->scheduled_at->isTomorrow();
    }

    /**
     * فحص إذا كان الموعد هذا الأسبوع
     */
    public function isThisWeek(): bool
    {
        return $this->scheduled_at->isCurrentWeek();
    }

    /**
     * الحصول على الوقت المتبقي للموعد
     */
    public function getTimeUntil(): string
    {
        $now = now();
        $scheduled = $this->scheduled_at;

        if ($scheduled->isPast()) {
            return 'منتهي';
        }

        $diff = $now->diffInDays($scheduled);
        
        if ($diff == 0) {
            $hours = $now->diffInHours($scheduled);
            if ($hours == 0) {
                $minutes = $now->diffInMinutes($scheduled);
                return "خلال {$minutes} دقيقة";
            }
            return "خلال {$hours} ساعة";
        } elseif ($diff == 1) {
            return 'غداً';
        } else {
            return "خلال {$diff} يوم";
        }
    }

    /**
     * إنشاء نشاط عند تغيير الموعد
     */
    protected static function booted()
    {
        static::created(function ($appointment) {
            Activity::create([
                'case_id' => $appointment->case_id,
                'type' => 'appointment_created',
                'title' => "تم جدولة موعد: {$appointment->title}",
                'description' => "تم جدولة {$appointment->getTypeInArabic()} في {$appointment->scheduled_at->format('Y-m-d H:i')}",
                'performed_by' => $appointment->created_by,
                'performed_at' => now(),
                'metadata' => [
                    'appointment_id' => $appointment->id,
                    'appointment_type' => $appointment->type,
                    'scheduled_at' => $appointment->scheduled_at
                ]
            ]);
        });

        static::updated(function ($appointment) {
            if ($appointment->isDirty('status')) {
                Activity::create([
                    'case_id' => $appointment->case_id,
                    'type' => 'appointment_updated',
                    'title' => "تم تحديث موعد: {$appointment->title}",
                    'description' => "تم تغيير الحالة إلى: {$appointment->getStatusInArabic()}",
                    'performed_by' => 1, // سنحتاج لتحديث هذا لاحقاً
                    'performed_at' => now(),
                    'metadata' => [
                        'appointment_id' => $appointment->id,
                        'old_status' => $appointment->getOriginal('status'),
                        'new_status' => $appointment->status
                    ]
                ]);
            }
        });
    }
}
