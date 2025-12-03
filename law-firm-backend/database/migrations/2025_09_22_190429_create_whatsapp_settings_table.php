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
        Schema::create('whatsapp_settings', function (Blueprint $table) {
            $table->id();
            $table->string('webhook_url')->nullable()->comment('رابط Webhook لاستقبال الرسائل');
            $table->string('access_token')->nullable()->comment('رمز الوصول للواتساب API');
            $table->string('verify_token')->nullable()->comment('رمز التحقق للWebhook');
            $table->string('phone_number_id')->nullable()->comment('معرف رقم الهاتف');
            $table->boolean('notifications_enabled')->default(true)->comment('تفعيل/إلغاء التنبيهات');
            $table->json('notification_settings')->nullable()->comment('إعدادات التنبيهات لكل نوع حدث');
            $table->json('message_templates')->nullable()->comment('قوالب الرسائل');
            $table->time('daily_report_time')->default('09:00')->comment('وقت إرسال التقرير اليومي');
            $table->boolean('daily_report_enabled')->default(true)->comment('تفعيل التقرير اليومي');
            $table->json('working_hours')->nullable()->comment('ساعات العمل');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('whatsapp_settings');
    }
};
