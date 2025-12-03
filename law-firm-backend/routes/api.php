<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\SimpleTestController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CaseController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\TaskCommentController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\DocumentCommentController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\ActivityController;
use App\Http\Controllers\Api\WhatsappController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\V1\SmartDocumentController;
use App\Http\Controllers\Api\LegalMemoController;
use App\Http\Controllers\Api\NajizImportController;
use App\Http\Controllers\Api\SessionController;
use Illuminate\Support\Facades\Log;

// Public routes (no authentication required)
Route::prefix('v1')->group(function () {
    // Authentication routes
    Route::post('/auth/login', [AuthController::class, 'login'])->name('login');
    Route::post('/auth/register', [AuthController::class, 'register']);
    
    // WhatsApp webhook routes (public)
    Route::prefix('whatsapp')->group(function () {
        Route::get('/webhook', [WhatsappController::class, 'webhookVerify']);
        Route::post('/webhook', [WhatsappController::class, 'webhook']);
    });
    
    // Test routes for lawyer notifications
    Route::prefix('test')->group(function () {
        Route::post('/document-upload', [WhatsappController::class, 'testDocumentUpload']);
        Route::post('/lawyer-notifications/overdue-tasks', [WhatsappController::class, 'testOverdueTasks']);
        Route::post('/lawyer-notifications/upcoming-hearings', [WhatsappController::class, 'testUpcomingHearings']);
        Route::post('/lawyer-notifications/test-message', [WhatsappController::class, 'testLawyerMessage']);
    });
    
    // Simple test routes (no auth)
    Route::prefix('simple')->group(function () {
        Route::get('/hello', [SimpleTestController::class, 'hello']);
        Route::get('/cases', [SimpleTestController::class, 'cases']);
        Route::get('/tasks', [SimpleTestController::class, 'tasks']);  
        Route::get('/documents', [SimpleTestController::class, 'documents']);
    });

    // Najiz Import routes (no auth for Chrome extension)
    Route::prefix('najiz')->group(function () {
        Route::post('/cases/import', [NajizImportController::class, 'importCases']);
        Route::post('/case', [NajizImportController::class, 'importCase']);
        Route::post('/appointments/import', [NajizImportController::class, 'importAppointments']);
        Route::get('/sync-status', [NajizImportController::class, 'getSyncStatus']);
        Route::get('/cases', [NajizImportController::class, 'getCases']);
    });

    // Sessions routes (no auth for now)
    Route::prefix('sessions')->group(function () {
        Route::get('/upcoming', [SessionController::class, 'upcoming']);
        Route::get('/case/{caseId}', [SessionController::class, 'byCaseId']);
        Route::get('/statistics', [SessionController::class, 'statistics']);
    });

    // Test user routes (no auth) - for debugging only
    Route::prefix('test/users')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::post('/', [UserController::class, 'store']);
        Route::get('/lawyers', [UserController::class, 'getLawyers']);
        Route::get('/clients', [UserController::class, 'getClients']);
        Route::get('/stats', [UserController::class, 'getUserStats']);
        Route::get('/{id}', [UserController::class, 'show']);
        Route::put('/{id}', [UserController::class, 'update']);
        Route::delete('/{id}', [UserController::class, 'destroy']);
    });

    // Smart Document Analysis routes (no auth for testing)
    Route::prefix('smart-documents')->group(function () {
        Route::post('/analyze', [SmartDocumentController::class, 'analyzeDocument']);
        Route::post('/save', [SmartDocumentController::class, 'saveAnalyzedDocument']);
        Route::delete('/temp', [SmartDocumentController::class, 'deleteTempFile']);
        
        // Test route
        Route::post('/test', function() {
            Log::info('Smart documents test route reached');
            return response()->json(['message' => 'Test route works']);
        });
    });
});

// Protected routes (authentication required)
Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    // Authentication management
    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });

    // Protected endpoints
    // Debug route
    Route::get('/debug/cases', function() {
        return response()->json(['message' => 'Debug route works', 'data' => \App\Models\CaseModel::all()]);
    });
    
    Route::apiResource('cases', CaseController::class);
    
    // Additional case routes
    Route::get('cases/{caseId}/documents', [CaseController::class, 'getDocuments']);
    
    Route::apiResource('tasks', TaskController::class);
    
    // Additional task routes
    Route::put('tasks/{id}/status', [TaskController::class, 'updateTaskStatus']);
    Route::put('tasks/{id}/assign', [TaskController::class, 'assignTask']);
    Route::put('tasks/{id}/archive', [TaskController::class, 'archive']);
    Route::get('tasks/statistics', [TaskController::class, 'getTaskStatistics']);
    Route::get('tasks/my-tasks', [TaskController::class, 'getMyTasks']);
    Route::get('tasks/overdue', [TaskController::class, 'getOverdueTasks']);
    
    // Task comments routes
    Route::get('tasks/{taskId}/comments', [TaskCommentController::class, 'index']);
    Route::post('tasks/{taskId}/comments', [TaskCommentController::class, 'store']);
    Route::put('tasks/{taskId}/comments/{commentId}', [TaskCommentController::class, 'update']);
    Route::delete('tasks/{taskId}/comments/{commentId}', [TaskCommentController::class, 'destroy']);
    
    Route::apiResource('documents', DocumentController::class);
    
    // Additional document routes
    Route::get('documents/{document}/download', [DocumentController::class, 'download'])->name('documents.download');
    Route::get('documents/{document}/preview', [DocumentController::class, 'preview'])->name('documents.preview');
    Route::post('documents/{document}/upload-version', [DocumentController::class, 'uploadVersion']);
    
    // Document comments routes
    Route::get('documents/{documentId}/comments', [DocumentCommentController::class, 'index']);
    Route::post('documents/{documentId}/comments', [DocumentCommentController::class, 'store']);
    Route::put('documents/{documentId}/comments/{commentId}', [DocumentCommentController::class, 'update']);
    Route::delete('documents/{documentId}/comments/{commentId}', [DocumentCommentController::class, 'destroy']);
    
    Route::apiResource('notifications', NotificationController::class);
    Route::apiResource('activities', ActivityController::class);
    
    // Legal Memos routes
    Route::apiResource('legal-memos', LegalMemoController::class);
    Route::post('legal-memos/{id}/auto-save', [LegalMemoController::class, 'autoSave']);
    Route::get('legal-memos/{id}/save-status', [LegalMemoController::class, 'getSaveStatus']);
    Route::patch('legal-memos/{id}/quick-save', [LegalMemoController::class, 'quickSave']);
    Route::post('legal-memos/{id}/ai-analysis', [LegalMemoController::class, 'aiAnalysis']);
    Route::post('legal-memos/{id}/smart-analysis', [LegalMemoController::class, 'smartAnalysis']);
    
    // Legal Memos with files routes
    Route::post('legal-memos/with-files', [LegalMemoController::class, 'storeWithFiles']);
    Route::post('legal-memos/{id}/with-files', [LegalMemoController::class, 'updateWithFiles']);

    // Additional case routes
    Route::prefix('cases')->group(function () {
        Route::post('/{case}/assign-lawyer', [CaseController::class, 'assignLawyer']);
        Route::delete('/{case}/lawyers/{lawyer}', [CaseController::class, 'removeLawyer']);
        Route::get('/statistics', [CaseController::class, 'statistics']);
        Route::get('/{case}/activities', [ActivityController::class, 'getCaseActivities']);
        Route::get('/{caseId}/appointments', [AppointmentController::class, 'getCaseAppointments']);
    });

    // Client-specific routes
    Route::prefix('client')->group(function () {
        Route::get('/dashboard', [ClientController::class, 'dashboard']);
        Route::get('/cases', [ClientController::class, 'myCases']);
        Route::get('/cases/{caseId}', [ClientController::class, 'getCaseDetails']);
        Route::get('/cases/{caseId}/timeline', [ClientController::class, 'getCaseTimeline']);
        Route::post('/cases/{caseId}/documents', [ClientController::class, 'uploadDocument']);
        Route::get('/documents', [ClientController::class, 'myDocuments']);
    });

    // WhatsApp management routes (protected)
    Route::prefix('whatsapp')->group(function () {
        Route::get('/settings', [WhatsappController::class, 'getSettings']);
        Route::put('/settings', [WhatsappController::class, 'updateSettings']);
        Route::post('/test-message', [WhatsappController::class, 'testMessage']);
        Route::post('/send-template', [WhatsappController::class, 'sendTemplateMessage']);
        Route::get('/messages', [WhatsappController::class, 'getMessages']);
        Route::get('/stats', [WhatsappController::class, 'getStats']);
        Route::post('/daily-report', [WhatsappController::class, 'sendDailyReport']);
        Route::post('/reset-defaults', [WhatsappController::class, 'resetToDefaults']);
        Route::post('/test-overdue-tasks', [WhatsappController::class, 'testOverdueTasks']);
        Route::post('/test-lawyer-notifications', [WhatsappController::class, 'testLawyerNotifications']);
    });
});

// User management routes (temporarily without auth for testing)
Route::prefix('v1/users')->group(function () {
    Route::get('/', [UserController::class, 'index']);
    Route::post('/', [UserController::class, 'store']);
    Route::get('/lawyers', [UserController::class, 'getLawyers']);
    Route::get('/clients', [UserController::class, 'getClients']);
    Route::get('/stats', [UserController::class, 'getUserStats']);
    Route::get('/{id}', [UserController::class, 'show']);
    Route::put('/{id}', [UserController::class, 'update']);
    Route::delete('/{id}', [UserController::class, 'destroy']);
});

// Appointments routes (temporarily without auth for testing)
Route::prefix('v1/appointments')->group(function () {
    Route::get('/case/{caseId}', [AppointmentController::class, 'getCaseAppointments']);
    Route::get('/{id}', [AppointmentController::class, 'show']);
    Route::post('/', [AppointmentController::class, 'store']);
    Route::put('/{id}', [AppointmentController::class, 'update']);
    Route::delete('/{id}', [AppointmentController::class, 'destroy']);
    Route::patch('/{id}/confirm', [AppointmentController::class, 'confirm']);
    Route::patch('/{id}/cancel', [AppointmentController::class, 'cancel']);
    Route::patch('/{id}/reschedule', [AppointmentController::class, 'reschedule']);
    Route::patch('/{id}/start', [AppointmentController::class, 'start']);
    Route::patch('/{id}/complete', [AppointmentController::class, 'complete']);
    Route::get('/upcoming', [AppointmentController::class, 'getUpcoming']);
    Route::get('/overdue', [AppointmentController::class, 'getOverdue']);
    Route::get('/stats', [AppointmentController::class, 'getStats']);
});

// Fallback
Route::fallback(function () {
    return response()->json(['error' => 'Route not found'], 404);
});
