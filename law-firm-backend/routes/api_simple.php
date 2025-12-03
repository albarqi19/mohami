<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\SimpleTestController;

// Very simple test routes
Route::prefix('v1/simple')->group(function () {
    Route::get('/hello', [SimpleTestController::class, 'hello']);
    Route::get('/cases', [SimpleTestController::class, 'cases']);
    Route::get('/tasks', [SimpleTestController::class, 'tasks']);  
    Route::get('/documents', [SimpleTestController::class, 'documents']);
});

// Fallback
Route::fallback(function () {
    return response()->json(['error' => 'Route not found'], 404);
});
