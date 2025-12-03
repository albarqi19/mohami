<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\WhatsappSetting;

class UpdateWhatsappTemplatesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = WhatsappSetting::first();
        
        if ($settings) {
            $settings->update([
                'notification_settings' => WhatsappSetting::getDefaultNotificationSettings(),
                'message_templates' => WhatsappSetting::getDefaultTemplates()
            ]);
            
            $this->command->info('WhatsApp templates and notifications updated successfully');
        } else {
            WhatsappSetting::create([
                'notifications_enabled' => true,
                'notification_settings' => WhatsappSetting::getDefaultNotificationSettings(),
                'message_templates' => WhatsappSetting::getDefaultTemplates(),
                'daily_report_time' => '09:00',
                'daily_report_enabled' => true,
                'working_hours' => WhatsappSetting::getDefaultWorkingHours()
            ]);
            
            $this->command->info('WhatsApp settings created with new templates');
        }
    }
}
