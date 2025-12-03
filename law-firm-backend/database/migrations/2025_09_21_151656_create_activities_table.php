<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->enum('type', [
                'case_created', 'case_updated', 'task_created', 'task_assigned', 
                'task_updated', 'task_completed', 'document_uploaded', 'comment_added',
                'hearing_scheduled', 'status_changed', 'user_assigned', 'client_meeting'
            ]);
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('case_id')->nullable()->constrained('cases')->onDelete('cascade');
            $table->foreignId('task_id')->nullable()->constrained('tasks')->onDelete('cascade');
            $table->foreignId('performed_by')->constrained('users')->onDelete('cascade');
            $table->json('metadata')->nullable();
            $table->timestamps();
            
            $table->index(['case_id', 'created_at']);
            $table->index(['task_id', 'created_at']);
            $table->index(['performed_by', 'created_at']);
            $table->index(['type', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activities');
    }
};
