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
        Schema::create('document_comments', function (Blueprint $table) {
            $table->id();
            $table->text('content');
            $table->foreignId('document_id')->constrained('documents')->onDelete('cascade');
            $table->foreignId('author_id')->constrained('users')->onDelete('cascade');
            $table->boolean('is_internal')->default(false)->comment('للتعليقات الداخلية بين فريق العمل');
            $table->timestamps();
            
            $table->index(['document_id', 'created_at']);
            $table->index(['author_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_comments');
    }
};
