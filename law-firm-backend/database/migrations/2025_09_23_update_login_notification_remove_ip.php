<?php

use Illuminate\Database\Migrations\Migration;
use App\Models\WhatsappSetting;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // تحديث قالب login_notification لإزالة عنوان IP
        $settings = WhatsappSetting::current();
        
        $currentTemplates = $settings->message_templates ?: [];
        
        // تحديث قالب login_notification
        if (isset($currentTemplates['login_notification'])) {
            $currentTemplates['login_notification'] = [
                'title' => 'إشعار تسجيل الدخول',
                'template' => 'مرحباً {user_name} 👋\n\nتم تسجيل دخولك إلى نظام المحاماة بنجاح 💼\n\n📅 التاريخ: {login_date} - {day_name}\n⏰ الوقت: {login_time}\n\nنتمنى لك يوماً موفقاً! ⚖️✨'
            ];
            
            $settings->update([
                'message_templates' => $currentTemplates
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // إعادة إضافة عنوان IP
        $settings = WhatsappSetting::current();
        
        $currentTemplates = $settings->message_templates ?: [];
        
        if (isset($currentTemplates['login_notification'])) {
            $currentTemplates['login_notification'] = [
                'title' => 'إشعار تسجيل الدخول',
                'template' => 'مرحباً {user_name} 👋\n\nتم تسجيل دخولك إلى نظام المحاماة بنجاح 💼\n\n📅 التاريخ: {login_date} - {day_name}\n⏰ الوقت: {login_time}\n🌐 عنوان IP: {ip_address}\n\nنتمنى لك يوماً موفقاً! ⚖️✨'
            ];
            
            $settings->update([
                'message_templates' => $currentTemplates
            ]);
        }
    }
};
