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
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('case_id')->constrained('cases')->onDelete('cascade');
            $table->string('title'); // عنوان الموعد
            $table->text('description')->nullable(); // وصف الموعد
            $table->enum('type', [
                'court_hearing',     // جلسة محكمة
                'client_meeting',    // موعد عميل
                'team_meeting',      // اجتماع فريق
                'document_filing',   // تقديم وثائق
                'arbitration',       // تحكيم
                'consultation',      // استشارة
                'mediation',         // وساطة
                'settlement',        // صلح
                'other'             // أخرى
            ]);
            $table->datetime('scheduled_at'); // تاريخ ووقت الموعد
            $table->integer('duration_minutes')->default(60); // مدة الموعد بالدقائق
            $table->string('location')->nullable(); // مكان الموعد
            $table->json('attendees')->nullable(); // المشاركون
            $table->enum('status', [
                'scheduled',    // مجدول
                'confirmed',    // مؤكد
                'in_progress',  // قيد التنفيذ
                'completed',    // مكتمل
                'cancelled',    // ملغي
                'postponed',    // مؤجل
                'no_show'       // لم يحضر
            ])->default('scheduled');
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->text('notes')->nullable(); // ملاحظات
            $table->json('reminders')->nullable(); // تذكيرات (15 دقيقة، ساعة، يوم)
            $table->datetime('reminder_sent_at')->nullable(); // متى تم إرسال التذكير
            $table->text('outcome')->nullable(); // نتيجة الموعد
            $table->json('documents')->nullable(); // وثائق مرفقة
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('assigned_to')->nullable()->constrained('users'); // المسؤول عن الموعد
            $table->datetime('rescheduled_from')->nullable(); // إذا تم التأجيل، من متى
            $table->text('cancellation_reason')->nullable(); // سبب الإلغاء
            $table->timestamps();
            
            // فهارس للبحث السريع
            $table->index(['case_id', 'scheduled_at']);
            $table->index(['status', 'scheduled_at']);
            $table->index(['type', 'scheduled_at']);
            $table->index(['assigned_to', 'scheduled_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
