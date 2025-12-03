<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Activity extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'title',
        'description',
        'case_id',
        'task_id',
        'performed_by',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    // Relationships

    /**
     * Get the user who performed this activity.
     */
    public function performer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    /**
     * Get the case this activity belongs to.
     */
    public function case(): BelongsTo
    {
        return $this->belongsTo(CaseModel::class, 'case_id');
    }

    /**
     * Get the task this activity belongs to.
     */
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class, 'task_id');
    }

    // Helper Methods

    /**
     * Get activity type in Arabic.
     */
    public function getTypeInArabic(): string
    {
        return match($this->type) {
            'case_created' => 'إنشاء قضية',
            'case_updated' => 'تحديث قضية',
            'task_created' => 'إنشاء مهمة',
            'task_assigned' => 'تكليف مهمة',
            'task_updated' => 'تحديث مهمة',
            'task_completed' => 'إكمال مهمة',
            'document_uploaded' => 'رفع وثيقة',
            'comment_added' => 'إضافة تعليق',
            'hearing_scheduled' => 'جدولة جلسة',
            'status_changed' => 'تغيير الحالة',
            'user_assigned' => 'تعيين مستخدم',
            'client_meeting' => 'اجتماع عميل',
            default => $this->type,
        };
    }
}
