<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'file_name',
        'file_path',
        'file_size',
        'mime_type',
        'category',
        'document_type',
        'case_id',
        'task_id',
        'memo_id',
        'uploaded_by',
        'is_confidential',
        'version',
        'tags',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'is_confidential' => 'boolean',
            'tags' => 'array',
            'metadata' => 'array',
        ];
    }

    // Relationships

    /**
     * Get the case this document belongs to.
     */
    public function case(): BelongsTo
    {
        return $this->belongsTo(CaseModel::class, 'case_id');
    }

    /**
     * Get the task this document belongs to.
     */
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class, 'task_id');
    }

    /**
     * Get the user who uploaded this document.
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    // Helper Methods

    /**
     * Get file size in human readable format.
     */
    public function getFormattedFileSizeAttribute(): string
    {
        $bytes = $this->file_size;
        if ($bytes === 0) return '0 بايت';
        
        $units = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
        $power = floor(log($bytes, 1024));
        
        return round($bytes / (1024 ** $power), 2) . ' ' . $units[$power];
    }

    /**
     * Get the comments for this document.
     */
    public function comments()
    {
        return $this->hasMany(DocumentComment::class);
    }

    /**
     * Check if document is an image.
     */
    public function isImage(): bool
    {
        return str_starts_with($this->mime_type, 'image/');
    }

    /**
     * Check if document is a PDF.
     */
    public function isPdf(): bool
    {
        return $this->mime_type === 'application/pdf';
    }

    /**
     * Get category in Arabic.
     */
    public function getCategoryInArabic(): string
    {
        return match($this->category) {
            'contract' => 'عقد',
            'evidence' => 'دليل',
            'pleading' => 'مذكرة',
            'correspondence' => 'مراسلات',
            'report' => 'تقرير',
            'judgment' => 'حكم',
            'other' => 'أخرى',
            default => $this->category,
        };
    }

    /**
     * Get the legal memo this document belongs to (direct relationship).
     */
    public function legalMemo(): BelongsTo
    {
        return $this->belongsTo(LegalMemo::class, 'memo_id');
    }

    /**
     * Get legal memos this document is associated with (many-to-many).
     */
    public function memos()
    {
        return $this->belongsToMany(LegalMemo::class, 'legal_memo_documents')
                    ->withPivot(['relation_type', 'notes'])
                    ->withTimestamps();
    }

    /**
     * Generate download URL.
     */
    public function getDownloadUrlAttribute(): string
    {
        return route('documents.download', $this->id);
    }
}
