<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'message',
        'type',
        'user_id',
        'is_read',
        'action_url',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'is_read' => 'boolean',
            'metadata' => 'array',
        ];
    }

    // Relationships

    /**
     * Get the user this notification belongs to.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Helper Methods

    /**
     * Mark notification as read.
     */
    public function markAsRead(): bool
    {
        return $this->update(['is_read' => true]);
    }

    /**
     * Get notification type in Arabic.
     */
    public function getTypeInArabic(): string
    {
        return match($this->type) {
            'task_assigned' => 'تكليف مهمة',
            'task_due' => 'مهمة مستحقة',
            'case_update' => 'تحديث قضية',
            'document_shared' => 'مشاركة وثيقة',
            'hearing_reminder' => 'تذكير جلسة',
            'system' => 'نظام',
            default => $this->type,
        };
    }

    // Scopes

    /**
     * Scope to get unread notifications.
     */
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    /**
     * Scope to get read notifications.
     */
    public function scopeRead($query)
    {
        return $query->where('is_read', true);
    }
}
