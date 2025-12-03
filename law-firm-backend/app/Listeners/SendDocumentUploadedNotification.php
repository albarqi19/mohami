<?php

namespace App\Listeners;

use App\Events\DocumentUploaded;
use App\Services\WhatsappService;
use Illuminate\Support\Facades\Log;

class SendDocumentUploadedNotification
{

    protected $whatsappService;

    /**
     * Create the event listener.
     */
    public function __construct(WhatsappService $whatsappService)
    {
        $this->whatsappService = $whatsappService;
    }

    /**
     * Handle the event.
     */
    public function handle(DocumentUploaded $event): void
    {
        try {
            $document = $event->document;
            
            // إرسال تنبيه للمحامين المعينين على القضية
            if ($document->case && $document->case->assignedLawyers) {
                foreach ($document->case->assignedLawyers as $lawyer) {
                    if ($lawyer->phone) {
                        $variables = [
                            'lawyer_name' => $lawyer->name,
                            'document_title' => $document->title,
                            'case_number' => $document->case->case_number,
                            'case_title' => $document->case->title,
                            'client_name' => $document->case->client->name ?? 'غير محدد',
                            'upload_time' => now()->format('H:i'),
                            'upload_date' => now()->format('Y-m-d')
                        ];

                        $this->whatsappService->sendTemplateMessage(
                            $lawyer->phone,
                            'new_document_uploaded',
                            $variables,
                            [
                                'case_id' => $document->case->id,
                                'user_id' => $lawyer->id,
                                'document_id' => $document->id,
                                'event_type' => 'new_document_uploaded'
                            ]
                        );
                    }
                }
            }

            Log::info('Document uploaded notification sent', ['document_id' => $document->id]);
        } catch (\Exception $e) {
            Log::error('Failed to send document uploaded notification', [
                'document_id' => $event->document->id,
                'error' => $e->getMessage()
            ]);
        }
    }
}
