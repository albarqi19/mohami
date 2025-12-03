<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WhatsappMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'message_id',
        'to_phone',
        'from_phone',
        'message_content',
        'message_type',
        'direction',
        'status',
        'whatsapp_message_id',
        'metadata',
        'sent_at',
        'delivered_at',
        'read_at',
        'case_id',
        'user_id',
        'event_type'
    ];

    protected $casts = [
        'metadata' => 'array',
        'sent_at' => 'datetime',
        'delivered_at' => 'datetime',
        'read_at' => 'datetime'
    ];

    /**
     * العلاقة مع القضية
     */
    public function case(): BelongsTo
    {
        return $this->belongsTo(CaseModel::class, 'case_id');
    }

    /**
     * العلاقة مع المستخدم
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * تحديث حالة الرسالة
     */
    public function updateStatus(string $status, array $metadata = [])
    {
        $this->update([
            'status' => $status,
            'metadata' => array_merge($this->metadata ?? [], $metadata)
        ]);

        // تحديث أوقات خاصة حسب الحالة
        switch ($status) {
            case 'sent':
                $this->update(['sent_at' => now()]);
                break;
            case 'delivered':
                $this->update(['delivered_at' => now()]);
                break;
            case 'read':
                $this->update(['read_at' => now()]);
                break;
        }
    }

    /**
     * الرسائل الصادرة
     */
    public function scopeOutbound($query)
    {
        return $query->where('direction', 'outbound');
    }

    /**
     * الرسائل الواردة
     */
    public function scopeInbound($query)
    {
        return $query->where('direction', 'inbound');
    }

    /**
     * الرسائل حسب الحالة
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * الرسائل في فترة زمنية
     */
    public function scopeInDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    /**
     * إحصائيات الرسائل
     */
    public static function getStats($startDate = null, $endDate = null)
    {
        $query = self::query();
        
        if ($startDate && $endDate) {
            $query->inDateRange($startDate, $endDate);
        }

        return [
            'total' => $query->count(),
            'sent' => $query->clone()->byStatus('sent')->count(),
            'delivered' => $query->clone()->byStatus('delivered')->count(),
            'failed' => $query->clone()->byStatus('failed')->count(),
            'outbound' => $query->clone()->outbound()->count(),
            'inbound' => $query->clone()->inbound()->count()
        ];
    }
}
