<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\WhatsappService;
use App\Models\WhatsappSetting;

class TestWhatsappServiceDebug extends Command
{
    protected $signature = 'test:whatsapp-debug {--phone=966530996778}';
    protected $description = 'Debug WhatsApp service issues';

    public function handle()
    {
        $phone = $this->option('phone');
        
        $this->info("🔍 فحص تفصيلي لخدمة الواتساب");
        $this->info("📱 الرقم: $phone");
        $this->newLine();

        // فحص الإعدادات
        $settings = WhatsappSetting::first();
        $this->info("1️⃣ فحص الإعدادات:");
        $this->info("   ✓ التنبيهات مفعلة: " . ($settings->notifications_enabled ? 'نعم' : 'لا'));
        
        // فحص ساعات العمل
        $this->info("2️⃣ فحص ساعات العمل:");
        $now = \Carbon\Carbon::now();
        $dayOfWeek = strtolower($now->format('l'));
        $currentTime = $now->format('H:i');
        
        $this->info("   📅 اليوم: $dayOfWeek");
        $this->info("   🕐 الوقت الحالي: $currentTime");
        
        $workingHours = $settings->working_hours;
        if (isset($workingHours[$dayOfWeek])) {
            $daySettings = $workingHours[$dayOfWeek];
            $this->info("   ⚙️ إعدادات اليوم: مفعل=" . ($daySettings['enabled'] ? 'نعم' : 'لا') . 
                       ", من=" . $daySettings['start'] . ", إلى=" . $daySettings['end']);
        }

        // اختبار الخدمة
        $this->info("3️⃣ اختبار إرسال الرسالة:");
        
        try {
            $whatsappService = app(WhatsappService::class);
            $result = $whatsappService->sendTextMessage($phone, "🧪 رسالة اختبار تفصيلية من Laravel");
            
            $this->info("   📤 نتيجة الإرسال: " . ($result ? 'نجح' : 'فشل'));
            
            if ($result) {
                $this->info("   ✓ تم الإرسال بنجاح!");
                $this->info("   📋 معرف الرسالة: " . ($result->id ?? 'غير محدد'));
            } else {
                $this->error("   ✗ فشل في الإرسال");
            }
            
        } catch (\Exception $e) {
            $this->error("   💥 خطأ: " . $e->getMessage());
        }

        $this->newLine();
        $this->info("✅ انتهى الفحص التفصيلي");
    }
}
