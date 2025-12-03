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
        Schema::create('legal_memo_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('legal_memo_id')->constrained('legal_memos')->onDelete('cascade');
            $table->foreignId('document_id')->constrained('documents')->onDelete('cascade');
            $table->enum('relation_type', [
                'reference', // وثيقة مرجعية
                'evidence', // دليل
                'attachment', // مرفق
                'source' // مصدر
            ])->default('reference');
            $table->text('notes')->nullable(); // ملاحظات حول العلاقة
            $table->timestamps();
            
            // فهرسة مركبة لتجنب التكرار
            $table->unique(['legal_memo_id', 'document_id']);
            $table->index('relation_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('legal_memo_documents');
    }
};
