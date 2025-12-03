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
        // التأكد من تحديث إعدادات الواتساب لتشمل login_notification
        $settings = WhatsappSetting::current();
        
        $currentTemplates = $settings->message_templates ?: [];
        $currentNotificationSettings = $settings->notification_settings ?: [];
        
        // إضافة قالب login_notification إذا لم يكن موجوداً
        if (!isset($currentTemplates['login_notification'])) {
            $currentTemplates['login_notification'] = [
                'title' => 'إشعار تسجيل الدخول',
                'template' => 'مرحباً {user_name} 👋\n\nتم تسجيل دخولك إلى نظام المحاماة بنجاح 💼\n\n📅 التاريخ: {login_date} - {day_name}\n⏰ الوقت: {login_time}\n🌐 عنوان IP: {ip_address}\n\nنتمنى لك يوماً موفقاً! ⚖️✨'
            ];
        }
        
        // إضافة إعدادات التنبيه للـ login_notification إذا لم تكن موجودة
        if (!isset($currentNotificationSettings['login_notification'])) {
            $currentNotificationSettings['login_notification'] = ['enabled' => true, 'delay_minutes' => 0];
        }
        
        $settings->update([
            'message_templates' => $currentTemplates,
            'notification_settings' => $currentNotificationSettings
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $settings = WhatsappSetting::current();
        
        $currentTemplates = $settings->message_templates ?: [];
        $currentNotificationSettings = $settings->notification_settings ?: [];
        
        // إزالة قالب login_notification
        unset($currentTemplates['login_notification']);
        unset($currentNotificationSettings['login_notification']);
        
        $settings->update([
            'message_templates' => $currentTemplates,
            'notification_settings' => $currentNotificationSettings
        ]);
    }
};
