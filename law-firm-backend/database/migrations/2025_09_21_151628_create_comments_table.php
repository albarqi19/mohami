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
        Schema::create('comments', function (Blueprint $table) {
            $table->id();
            $table->text('content');
            $table->foreignId('author_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('case_id')->nullable()->constrained('cases')->onDelete('cascade');
            $table->foreignId('task_id')->nullable()->constrained('tasks')->onDelete('cascade');
            $table->boolean('is_internal')->default(false);
            $table->timestamps();
            
            $table->index(['case_id', 'created_at']);
            $table->index(['task_id', 'created_at']);
            $table->index(['author_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('comments');
    }
};
