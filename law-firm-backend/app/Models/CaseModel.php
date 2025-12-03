<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CaseModel extends Model
{
    use HasFactory;

    protected $table = 'cases';

    protected $fillable = [
        'file_number',
        'title',
        'client_name',
        'client_id',
        'client_phone',
        'client_email',
        'plaintiff_name',
        'plaintiff_id',
        'opponent_name',
        'opponent_lawyer',
        'defendant_name',
        'defendant_id',
        'court',
        'department',
        'sub_circle',
        'case_type',
        'case_type_arabic',
        'case_category',
        'case_classification',
        'status',
        'najiz_status',
        'priority',
        'description',
        'case_subject',
        'case_demands',
        'case_proofs',
        'plaintiff_requests',
        'case_evidence',
        'contract_value',
        'filing_date',
        'case_date_hijri',
        'due_date',
        'next_hearing',
        'next_hearing_time',
        'next_hearing_type',
        'hearing_method',
        'notes',
        'created_by',
        // Najiz Integration Fields
        'najiz_id',
        'najiz_url',
        'najiz_data',
        'najiz_synced_at',
        'source',
    ];

    protected function casts(): array
    {
        return [
            'contract_value' => 'decimal:2',
            'filing_date' => 'date',
            'due_date' => 'date',
            'next_hearing' => 'datetime',
            'najiz_synced_at' => 'datetime',
            'najiz_data' => 'array',
        ];
    }

    // Relationships

    /**
     * Get the client for this case.
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    /**
     * Get the user who created this case.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the lawyers assigned to this case.
     */
    public function lawyers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'case_lawyers', 'case_id', 'lawyer_id')
                    ->withPivot('assigned_at', 'assigned_by', 'is_primary')
                    ->withTimestamps();
    }

    /**
     * Get the primary lawyer for this case.
     */
    public function primaryLawyer(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'case_lawyers', 'case_id', 'lawyer_id')
                    ->wherePivot('is_primary', true)
                    ->withPivot('assigned_at', 'assigned_by', 'is_primary')
                    ->withTimestamps();
    }

    /**
     * Get the tasks for this case.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class, 'case_id');
    }

    /**
     * Get the documents for this case.
     */
    public function documents(): HasMany
    {
        return $this->hasMany(Document::class, 'case_id');
    }

    /**
     * Get the comments for this case.
     */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class, 'case_id');
    }

    /**
     * Get the activities for this case.
     */
    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class, 'case_id');
    }

    /**
     * Get the parties (أطراف) for this case.
     */
    public function parties(): HasMany
    {
        return $this->hasMany(CaseParty::class, 'case_id');
    }

    /**
     * Get the plaintiffs (المدعين) for this case.
     */
    public function plaintiffs(): HasMany
    {
        return $this->hasMany(CaseParty::class, 'case_id')->where('side', 'plaintiff');
    }

    /**
     * Get the defendants (المدعى عليهم) for this case.
     */
    public function defendants(): HasMany
    {
        return $this->hasMany(CaseParty::class, 'case_id')->where('side', 'defendant');
    }

    /**
     * Get the sessions (الجلسات) for this case.
     */
    public function sessions(): HasMany
    {
        return $this->hasMany(CaseSession::class, 'case_id')->orderBy('session_date', 'desc');
    }

    /**
     * Get upcoming sessions (الجلسات القادمة).
     */
    public function upcomingSessions(): HasMany
    {
        return $this->hasMany(CaseSession::class, 'case_id')
            ->where(function ($q) {
                $q->where('status', 'جديدة')
                  ->orWhere('status', 'scheduled');
            })
            ->orderBy('session_date', 'asc');
    }

    // Helper Methods

    /**
     * Check if case is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if case is closed.
     */
    public function isClosed(): bool
    {
        return in_array($this->status, ['closed', 'settled', 'dismissed']);
    }

    /**
     * Check if case is overdue.
     */
    public function isOverdue(): bool
    {
        return $this->due_date && $this->due_date->isPast() && !$this->isClosed();
    }

    /**
     * Get case status in Arabic.
     */
    public function getStatusInArabic(): string
    {
        return match($this->status) {
            'active' => 'نشطة',
            'pending' => 'معلقة',
            'closed' => 'مغلقة',
            'appealed' => 'مستأنفة',
            'settled' => 'مصالحة',
            'dismissed' => 'مرفوضة',
            default => $this->status,
        };
    }

    /**
     * Get case type in Arabic.
     */
    public function getTypeInArabic(): string
    {
        return match($this->case_type) {
            'civil' => 'مدنية',
            'criminal' => 'جنائية',
            'commercial' => 'تجارية',
            'family' => 'أسرية',
            'labor' => 'عمالية',
            'administrative' => 'إدارية',
            'real_estate' => 'عقارية',
            'intellectual_property' => 'ملكية فكرية',
            'other' => 'أخرى',
            default => $this->case_type,
        };
    }

    /**
     * Get priority in Arabic.
     */
    public function getPriorityInArabic(): string
    {
        return match($this->priority) {
            'urgent' => 'عاجل',
            'high' => 'عالية',
            'medium' => 'متوسطة',
            'low' => 'منخفضة',
            default => $this->priority,
        };
    }

    /**
     * Generate unique case number.
     */
    public static function generateCaseNumber(): string
    {
        $year = date('Y');
        $count = self::whereYear('created_at', $year)->count() + 1;
        return sprintf('%s-%04d', $year, $count);
    }
}
