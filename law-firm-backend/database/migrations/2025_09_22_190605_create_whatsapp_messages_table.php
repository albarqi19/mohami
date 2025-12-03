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
        Schema::create('whatsapp_messages', function (Blueprint $table) {
            $table->id();
            $table->string('message_id')->nullable()->comment('معرف الرسالة في واتساب');
            $table->string('to_phone')->comment('رقم الهاتف المرسل إليه');
            $table->string('from_phone')->nullable()->comment('رقم الهاتف المرسل منه');
            $table->text('message_content')->comment('محتوى الرسالة');
            $table->enum('message_type', ['text', 'template', 'media'])->default('text')->comment('نوع الرسالة');
            $table->enum('direction', ['outbound', 'inbound'])->comment('اتجاه الرسالة');
            $table->enum('status', ['pending', 'sent', 'delivered', 'read', 'failed'])->default('pending')->comment('حالة الرسالة');
            $table->string('whatsapp_message_id')->nullable()->comment('معرف الرسالة من واتساب');
            $table->json('metadata')->nullable()->comment('بيانات إضافية');
            $table->timestamp('sent_at')->nullable()->comment('وقت الإرسال');
            $table->timestamp('delivered_at')->nullable()->comment('وقت التسليم');
            $table->timestamp('read_at')->nullable()->comment('وقت القراءة');
            $table->unsignedBigInteger('case_id')->nullable()->comment('معرف القضية المرتبطة');
            $table->unsignedBigInteger('user_id')->nullable()->comment('معرف المستخدم المرتبط');
            $table->string('event_type')->nullable()->comment('نوع الحدث المسبب للرسالة');
            $table->timestamps();

            $table->foreign('case_id')->references('id')->on('cases')->onDelete('set null');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->index(['to_phone', 'created_at']);
            $table->index(['case_id', 'created_at']);
            $table->index(['user_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('whatsapp_messages');
    }
};
