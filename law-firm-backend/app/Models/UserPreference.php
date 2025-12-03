<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPreference extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'language',
        'timezone',
        'date_format',
        'time_format',
        'notifications_enabled',
        'email_notifications',
        'sms_notifications',
        'dashboard_layout',
        'theme',
    ];

    protected function casts(): array
    {
        return [
            'notifications_enabled' => 'boolean',
            'email_notifications' => 'boolean',
            'sms_notifications' => 'boolean',
        ];
    }

    // Relationships

    /**
     * Get the user this preference belongs to.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Helper Methods

    /**
     * Get language in Arabic.
     */
    public function getLanguageInArabic(): string
    {
        return match($this->language) {
            'ar' => 'العربية',
            'en' => 'الإنجليزية',
            'fr' => 'الفرنسية',
            default => $this->language,
        };
    }

    /**
     * Get timezone display name.
     */
    public function getTimezoneDisplay(): string
    {
        return match($this->timezone) {
            'Africa/Cairo' => 'القاهرة (GMT+2)',
            'Asia/Riyadh' => 'الرياض (GMT+3)',
            'Asia/Kuwait' => 'الكويت (GMT+3)',
            'Asia/Dubai' => 'دبي (GMT+4)',
            default => $this->timezone,
        };
    }

    /**
     * Get theme in Arabic.
     */
    public function getThemeInArabic(): string
    {
        return match($this->theme) {
            'light' => 'فاتح',
            'dark' => 'داكن',
            'auto' => 'تلقائي',
            default => $this->theme,
        };
    }

    /**
     * Check if notifications are fully enabled.
     */
    public function isNotificationsFullyEnabled(): bool
    {
        return $this->notifications_enabled && 
               ($this->email_notifications || $this->sms_notifications);
    }

    /**
     * Get all notification settings.
     */
    public function getNotificationSettings(): array
    {
        return [
            'enabled' => $this->notifications_enabled,
            'email' => $this->email_notifications,
            'sms' => $this->sms_notifications,
        ];
    }
}
