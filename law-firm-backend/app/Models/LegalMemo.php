<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class LegalMemo extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'content',
        'memo_type',
        'category',
        'case_id',
        'created_by',
        'assigned_lawyer',
        'status',
        'last_auto_saved_at',
        'ai_analysis_enabled',
        'last_analyzed_at',
        'ai_suggestions',
        'ai_warnings',
        'metadata',
        'formatting_data',
        'analysis_result',
        'quality_score',
        'improvement_suggestions',
        'legal_compliance_issues',
        'content_hash',
        'needs_reanalysis',
        'content_last_modified',
        'analysis_type',
    ];

    protected function casts(): array
    {
        return [
            'ai_analysis_enabled' => 'boolean',
            'needs_reanalysis' => 'boolean',
            'last_auto_saved_at' => 'datetime',
            'last_analyzed_at' => 'datetime',
            'content_last_modified' => 'datetime',
            'ai_suggestions' => 'array',
            'ai_warnings' => 'array',
            'metadata' => 'array',
            'formatting_data' => 'array',
            'analysis_result' => 'array',
            'improvement_suggestions' => 'array',
            'legal_compliance_issues' => 'array',
        ];
    }

    // أنواع المذكرات مجموعة حسب الفئات
    public static function getMemoTypes(): array
    {
        return [
            'opening' => [
                'claim_petition' => 'صحيفة دعوى',
                'response_to_claim' => 'مذكرة رد على صحيفة دعوى',
            ],
            'pleading' => [
                'written_plea' => 'مذكرة جوابية (مرافعة مكتوبة)',
                'counter_plea' => 'مذكرة تعقيبية',
                'formal_objection' => 'مذكرة بدفوع شكلية',
                'substantive_objection' => 'مذكرة بدفوع موضوعية',
            ],
            'evidence' => [
                'oath_request' => 'مذكرة بطلب توجيه اليمين',
                'witness_hearing' => 'مذكرة بطلب سماع شهادة الشهود',
                'expert_appointment' => 'مذكرة بطلب ندب خبير أو محاسب',
                'party_intervention' => 'مذكرة بطلب إدخال خصم جديد',
                'document_inspection' => 'مذكرة بطلب الاطلاع على المستندات',
            ],
            'appeal' => [
                'appeal_memo' => 'مذكرة استئناف (لائحة اعتراضية)',
                'reconsideration_request' => 'مذكرة التماس إعادة النظر',
                'cassation_appeal' => 'مذكرة نقض (طعن أمام المحكمة العليا)',
            ],
            'execution' => [
                'execution_request' => 'مذكرة بطلب تنفيذ حكم أو سند تنفيذي',
                'execution_objection' => 'مذكرة اعتراض على إجراءات التنفيذ',
                'execution_suspension' => 'مذكرة بطلب وقف التنفيذ',
                'execution_dispute' => 'مذكرة إشكال في التنفيذ (إشكال وقتي)',
            ],
            'specialized' => [
                'family_law_memo' => 'مذكرة في دعاوى الأحوال الشخصية',
                'endowment_memo' => 'مذكرة في دعاوى الوقف والوصايا',
                'criminal_law_memo' => 'مذكرة في دعاوى الحدود والتعزيرات',
                'commercial_memo' => 'مذكرة في القضايا التجارية',
                'labor_memo' => 'مذكرة في القضايا العمالية',
                'other' => 'مذكرة أخرى',
            ]
        ];
    }

    // أسماء الفئات
    public static function getCategoryNames(): array
    {
        return [
            'opening' => 'مذكرات افتتاحية',
            'pleading' => 'مذكرات المرافعة',
            'evidence' => 'مذكرات الإثبات والطلبات',
            'appeal' => 'مذكرات الأحكام والطعن',
            'execution' => 'مذكرات التنفيذ',
            'specialized' => 'مذكرات خاصة حسب نوع القضايا',
        ];
    }

    // حالات المذكرة
    public static function getStatusOptions(): array
    {
        return [
            'draft' => 'مسودة',
            'under_review' => 'قيد المراجعة',
            'approved' => 'معتمدة',
            'needs_revision' => 'تحتاج مراجعة',
            'finalized' => 'نهائية',
        ];
    }

    // Relationships

    /**
     * القضية المرتبطة بالمذكرة
     */
    public function case(): BelongsTo
    {
        return $this->belongsTo(CaseModel::class, 'case_id');
    }

    /**
     * منشئ المذكرة
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * المحامي المكلف بالمذكرة
     */
    public function assignedLawyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_lawyer');
    }

    /**
     * الوثائق المرتبطة بالمذكرة (جدول الربط)
     */
    public function documents(): BelongsToMany
    {
        return $this->belongsToMany(Document::class, 'legal_memo_documents')
                    ->withPivot(['relation_type', 'notes'])
                    ->withTimestamps();
    }

    /**
     * الملفات المرفوعة مباشرة مع المذكرة
     */
    public function attachedFiles()
    {
        return $this->hasMany(Document::class, 'memo_id');
    }

    /**
     * جميع الوثائق المرتبطة بالمذكرة (المرتبطة + المرفوعة مباشرة)
     */
    public function allDocuments()
    {
        return Document::where('memo_id', $this->id)
                      ->orWhereHas('memos', function ($query) {
                          $query->where('legal_memo_id', $this->id);
                      });
    }

    // Scopes

    /**
     * نطاق للمذكرات حسب الحالة
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * نطاق للمذكرات حسب الفئة
     */
    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    /**
     * نطاق للمذكرات التي تحتاج تحليل ذكي
     */
    public function scopeNeedingAiAnalysis($query)
    {
        return $query->where('ai_analysis_enabled', true)
                    ->where(function($q) {
                        $q->whereNull('last_analyzed_at')
                          ->orWhere('updated_at', '>', 'last_analyzed_at');
                    });
    }

    // Accessors & Mutators

    /**
     * الحصول على اسم نوع المذكرة
     */
    public function getMemoTypeNameAttribute(): string
    {
        $types = self::getMemoTypes();
        foreach ($types as $category => $memoTypes) {
            if (isset($memoTypes[$this->memo_type])) {
                return $memoTypes[$this->memo_type];
            }
        }
        return $this->memo_type;
    }

    /**
     * الحصول على اسم الفئة
     */
    public function getCategoryNameAttribute(): string
    {
        $categories = self::getCategoryNames();
        return $categories[$this->category] ?? $this->category;
    }

    /**
     * الحصول على اسم الحالة
     */
    public function getStatusNameAttribute(): string
    {
        $statuses = self::getStatusOptions();
        return $statuses[$this->status] ?? $this->status;
    }

    /**
     * تحديد ما إذا كانت المذكرة تحتاج حفظ تلقائي
     */
    public function needsAutoSave(): bool
    {
        if (!$this->last_auto_saved_at) {
            return true;
        }
        
        return $this->updated_at > $this->last_auto_saved_at;
    }

    /**
     * تحديث وقت الحفظ التلقائي
     */
    public function markAutoSaved(): void
    {
        $this->update(['last_auto_saved_at' => now()]);
    }

    /**
     * تحديث وقت التحليل الذكي
     */
    public function markAnalyzed(array $suggestions = [], array $warnings = []): void
    {
        $this->update([
            'last_analyzed_at' => now(),
            'ai_suggestions' => $suggestions,
            'ai_warnings' => $warnings,
        ]);
    }

    /**
     * حساب hash للمحتوى لمتابعة التغييرات
     */
    public function calculateContentHash(): string
    {
        $content = $this->title . '|' . $this->content . '|' . $this->memo_type . '|' . $this->category;
        return hash('sha256', $content);
    }

    /**
     * فحص ما إذا كان المحتوى قد تغير
     */
    public function hasContentChanged(): bool
    {
        $currentHash = $this->calculateContentHash();
        return $this->content_hash !== $currentHash;
    }

    /**
     * تحديث hash المحتوى وتعيين حاجة التحليل
     */
    public function updateContentHash(): void
    {
        $this->update([
            'content_hash' => $this->calculateContentHash(),
            'content_last_modified' => now(),
            'needs_reanalysis' => true
        ]);
    }

    /**
     * تحديد ما إذا كان التحليل موجود وصالح
     */
    public function hasValidAnalysis(): bool
    {
        return !empty($this->analysis_result) && 
               !$this->needs_reanalysis && 
               $this->last_analyzed_at !== null &&
               $this->analysis_type === 'gemini_api'; // فقط التحليل من Gemini API يُعتبر صالح
    }

    /**
     * تعيين التحليل كمكتمل
     */
    public function markAnalysisComplete(array $analysisResult, string $analysisType = 'gemini_api'): void
    {
        $this->update([
            'analysis_result' => $analysisResult,
            'quality_score' => $analysisResult['quality_score'] ?? null,
            'improvement_suggestions' => $analysisResult['improvement_suggestions'] ?? null,
            'legal_compliance_issues' => $analysisResult['legal_compliance_issues'] ?? null,
            'last_analyzed_at' => now(),
            'needs_reanalysis' => false,
            'content_hash' => $this->calculateContentHash(),
            'analysis_type' => $analysisType
        ]);
    }

    /**
     * Bootstrap the model's event listeners.
     */
    protected static function booted(): void
    {
        // عند الإنشاء، حساب hash للمحتوى
        static::creating(function (LegalMemo $memo) {
            $memo->content_hash = $memo->calculateContentHash();
            $memo->content_last_modified = now();
            $memo->needs_reanalysis = true;
        });

        // عند التحديث، فحص التغييرات في المحتوى
        static::updating(function (LegalMemo $memo) {
            $contentFields = ['title', 'content', 'memo_type', 'category'];
            $hasContentChanged = false;

            foreach ($contentFields as $field) {
                if ($memo->isDirty($field)) {
                    $hasContentChanged = true;
                    break;
                }
            }

            if ($hasContentChanged) {
                $memo->content_hash = $memo->calculateContentHash();
                $memo->content_last_modified = now();
                $memo->needs_reanalysis = true;
            }
        });
    }
}
