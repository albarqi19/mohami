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
        Schema::create('legal_memos', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->longText('content'); // المحتوى النصي الكامل
            $table->enum('memo_type', [
                // مذكرات افتتاحية
                'claim_petition', // صحيفة دعوى
                'response_to_claim', // مذكرة رد على صحيفة دعوى
                
                // مذكرات المرافعة
                'written_plea', // مذكرة جوابية
                'counter_plea', // مذكرة تعقيبية
                'formal_objection', // دفوع شكلية
                'substantive_objection', // دفوع موضوعية
                
                // مذكرات الإثبات والطلبات
                'oath_request', // طلب توجيه اليمين
                'witness_hearing', // سماع شهادة الشهود
                'expert_appointment', // ندب خبير
                'party_intervention', // إدخال خصم جديد
                'document_inspection', // الاطلاع على المستندات
                
                // مذكرات الأحكام والطعن
                'appeal_memo', // استئناف
                'reconsideration_request', // التماس إعادة النظر
                'cassation_appeal', // نقض
                
                // مذكرات التنفيذ
                'execution_request', // طلب تنفيذ
                'execution_objection', // اعتراض على إجراءات التنفيذ
                'execution_suspension', // وقف التنفيذ
                'execution_dispute', // إشكال في التنفيذ
                
                // مذكرات خاصة
                'family_law_memo', // أحوال شخصية
                'endowment_memo', // الوقف والوصايا
                'criminal_law_memo', // حدود وتعزيرات
                'commercial_memo', // تجارية
                'labor_memo', // عمالية
                'other' // أخرى
            ]);
            $table->enum('category', [
                'opening', // افتتاحية
                'pleading', // مرافعة
                'evidence', // إثبات وطلبات
                'appeal', // أحكام وطعن
                'execution', // تنفيذ
                'specialized' // خاصة
            ]);
            
            $table->foreignId('case_id')->nullable()->constrained('cases')->onDelete('cascade');
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('assigned_lawyer')->nullable()->constrained('users'); // المحامي المكلف
            
            // الحالة والمراجعة
            $table->enum('status', ['draft', 'under_review', 'approved', 'needs_revision', 'finalized'])->default('draft');
            $table->timestamp('last_auto_saved_at')->nullable();
            
            // التحليل الذكي
            $table->boolean('ai_analysis_enabled')->default(true);
            $table->timestamp('last_analyzed_at')->nullable();
            $table->json('ai_suggestions')->nullable(); // اقتراحات الذكاء الاصطناعي
            $table->json('ai_warnings')->nullable(); // تحذيرات الذكاء الاصطناعي
            
            // البيانات الإضافية
            $table->json('metadata')->nullable(); // معلومات إضافية
            $table->json('formatting_data')->nullable(); // بيانات التنسيق من Tiptap
            
            $table->timestamps();
            
            // Indexes للأداء
            $table->index(['case_id', 'memo_type']);
            $table->index(['created_by', 'status']);
            $table->index(['category', 'created_at']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('legal_memos');
    }
};
