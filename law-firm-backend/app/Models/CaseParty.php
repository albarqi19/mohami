<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CaseParty extends Model
{
    protected $fillable = [
        'case_id',
        'name',
        'role',
        'side',
        'national_id',
        'commercial_reg',
        'nationality',
        'party_type',
        'represents',
        'phone',
        'email',
    ];

    /**
     * العلاقة مع القضية
     */
    public function case(): BelongsTo
    {
        return $this->belongsTo(CaseModel::class, 'case_id');
    }

    /**
     * هل هذا الطرف مدعي؟
     */
    public function isPlaintiff(): bool
    {
        return $this->side === 'plaintiff';
    }

    /**
     * هل هذا الطرف مدعى عليه؟
     */
    public function isDefendant(): bool
    {
        return $this->side === 'defendant';
    }

    /**
     * الحصول على رقم الهوية/السجل
     */
    public function getIdentifierAttribute(): ?string
    {
        return $this->national_id ?: $this->commercial_reg;
    }
}
