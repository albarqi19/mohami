<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class CaseSession extends Model
{
    protected $fillable = [
        'case_id',
        'session_type',
        'session_number',
        'session_date',
        'session_date_gregorian',
        'session_time',
        'status',
        'najiz_status',
        'court',
        'department',
        'method',
        'location',
        'degree',
        'notes',
        'result',
    ];

    protected $casts = [
        'session_date_gregorian' => 'date',
    ];

    // حالات الجلسة
    const STATUS_SCHEDULED = 'scheduled'; // مجدولة
    const STATUS_NEW = 'جديدة';
    const STATUS_COMPLETED = 'منتهية';
    const STATUS_CANCELLED = 'ملغاة';

    /**
     * العلاقة مع القضية
     */
    public function case(): BelongsTo
    {
        return $this->belongsTo(CaseModel::class, 'case_id');
    }

    /**
     * هل الجلسة قادمة؟
     */
    public function isUpcoming(): bool
    {
        if ($this->status === self::STATUS_NEW || $this->status === self::STATUS_SCHEDULED) {
            return true;
        }
        
        if ($this->session_date_gregorian) {
            return $this->session_date_gregorian->isFuture();
        }
        
        return false;
    }

    /**
     * هل الجلسة منتهية؟
     */
    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED || $this->status === 'منتهية';
    }

    /**
     * الحصول على التاريخ والوقت مجتمعين
     */
    public function getDateTimeAttribute(): string
    {
        $date = $this->session_date ?: ($this->session_date_gregorian ? $this->session_date_gregorian->format('Y/m/d') : '');
        $time = $this->session_time ?: '';
        
        return trim("$date $time");
    }

    /**
     * نطاق الجلسات القادمة
     */
    public function scopeUpcoming($query)
    {
        return $query->where(function ($q) {
            $q->where('status', self::STATUS_NEW)
              ->orWhere('status', self::STATUS_SCHEDULED)
              ->orWhere('session_date_gregorian', '>=', now()->toDateString());
        });
    }

    /**
     * نطاق الجلسات المنتهية
     */
    public function scopeCompleted($query)
    {
        return $query->where(function ($q) {
            $q->where('status', self::STATUS_COMPLETED)
              ->orWhere('status', 'منتهية');
        });
    }
}
