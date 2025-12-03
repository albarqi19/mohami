<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'type',
        'case_id',
        'assigned_to',
        'assigned_by',
        'status',
        'priority',
        'due_date',
        'completed_at',
        'estimated_hours',
        'actual_hours',
        'tags',
        'notes',
        'starred',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'datetime',
            'completed_at' => 'datetime',
            'estimated_hours' => 'decimal:2',
            'actual_hours' => 'decimal:2',
            'tags' => 'array',
            'starred' => 'boolean',
        ];
    }

    /**
     * Get the case this task belongs to.
     */
    public function case()
    {
        return $this->belongsTo(CaseModel::class, 'case_id');
    }

    /**
     * Get the user this task is assigned to.
     */
    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * Get the user who assigned this task.
     */
    public function assigner()
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    /**
     * Get the documents for this task.
     */
    public function documents()
    {
        return $this->hasMany(Document::class, 'task_id');
    }

    /**
     * Get the comments for this task.
     */
    public function comments()
    {
        return $this->hasMany(TaskComment::class, 'task_id');
    }

    /**
     * Get the activities for this task.
     */
    public function activities()
    {
        return $this->hasMany(Activity::class, 'task_id');
    }

    /**
     * Check if task is completed.
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Check if task is overdue.
     */
    public function isOverdue(): bool
    {
        return $this->due_date && $this->due_date->isPast() && !$this->isCompleted();
    }

    /**
     * Mark task as completed.
     */
    public function markAsCompleted()
    {
        $this->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);
    }

    /**
     * Get status in Arabic.
     */
    public function getStatusInArabic(): string
    {
        return match($this->status) {
            'todo' => 'معلقة',
            'in_progress' => 'قيد التنفيذ',
            'review' => 'تحت المراجعة',
            'completed' => 'مكتملة',
            'cancelled' => 'ملغية',
            'overdue' => 'متأخرة',
            default => $this->status,
        };
    }

    /**
     * Get type in Arabic.
     */
    public function getTypeInArabic(): string
    {
        return match($this->type) {
            'review' => 'مراجعة',
            'research' => 'بحث قانوني',
            'consultation' => 'استشارة',
            'court' => 'جلسة محكمة',
            'document' => 'إعداد وثائق',
            'meeting' => 'اجتماع',
            'other' => 'أخرى',
            default => $this->type,
        };
    }
}
