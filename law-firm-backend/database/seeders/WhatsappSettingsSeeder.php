<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\WhatsappSetting;

class WhatsappSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // إنشاء إعدادات واتساب افتراضية إذا لم تكن موجودة
        if (!WhatsappSetting::exists()) {
            WhatsappSetting::create([
                'webhook_url' => null,
                'access_token' => null,
                'verify_token' => 'law_firm_verify_token_' . uniqid(),
                'phone_number_id' => null,
                'notifications_enabled' => true,
                'notification_settings' => WhatsappSetting::getDefaultNotificationSettings(),
                'message_templates' => WhatsappSetting::getDefaultTemplates(),
                'daily_report_time' => '09:00',
                'daily_report_enabled' => true,
                'working_hours' => WhatsappSetting::getDefaultWorkingHours()
            ]);

            $this->command->info('WhatsApp settings created successfully');
        } else {
            $this->command->info('WhatsApp settings already exist');
        }
    }
}
