<?php

namespace App\Events;

use App\Models\Document;
use App\Models\CaseModel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DocumentUploaded
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $document;
    public $case;
    public $activityType;
    public $description;
    public $details;

    /**
     * Create a new event instance.
     */
    public function __construct(Document $document)
    {
        $this->document = $document;
        $this->case = $document->case; // Get the related case
        $this->activityType = 'document_uploaded';
        $this->description = 'تم رفع وثيقة جديدة: ' . $document->title;
        $this->details = json_encode([
            'document_id' => $document->id,
            'document_title' => $document->title,
            'document_type' => $document->type,
            'file_name' => $document->file_name,
            'file_size' => $document->file_size,
        ]);
    }
}
