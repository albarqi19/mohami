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
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('file_name');
            $table->string('file_path', 500);
            $table->bigInteger('file_size');
            $table->string('mime_type', 100);
            $table->enum('category', [
                'contract', 'evidence', 'pleading', 'correspondence', 
                'report', 'judgment', 'other'
            ])->default('other');
            $table->foreignId('case_id')->nullable()->constrained('cases')->onDelete('cascade');
            $table->foreignId('task_id')->nullable()->constrained('tasks')->onDelete('cascade');
            $table->foreignId('uploaded_by')->constrained('users');
            $table->boolean('is_confidential')->default(false);
            $table->integer('version')->default(1);
            $table->json('tags')->nullable();
            $table->timestamps();
            
            $table->index(['case_id', 'category']);
            $table->index(['task_id', 'created_at']);
            $table->index(['uploaded_by', 'created_at']);
            $table->index('is_confidential');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
