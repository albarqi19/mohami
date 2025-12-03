<?php

namespace App\Listeners;

use App\Events\DocumentUploaded;
use App\Models\Activity;
use Illuminate\Support\Facades\Auth;

class LogDocumentUploadedActivity
{
    /**
     * Handle the event.
     */
    public function handle(DocumentUploaded $event): void
    {
        Activity::create([
            'type' => 'document_uploaded',
            'title' => 'تم رفع وثيقة جديدة',
            'description' => "تم رفع الوثيقة: {$event->document->title}",
            'case_id' => $event->document->case_id,
            'performed_by' => Auth::id() ?? $event->document->uploaded_by,
            'metadata' => [
                'document_title' => $event->document->title,
                'document_file_name' => $event->document->file_name,
                'document_size' => $event->document->file_size,
                'document_type' => $event->document->mime_type,
                'category' => $event->document->category,
            ]
        ]);
    }
}
