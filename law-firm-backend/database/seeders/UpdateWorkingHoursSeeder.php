<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\WhatsappSetting;

class UpdateWorkingHoursSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = WhatsappSetting::first();
        
        if ($settings) {
            $workingHours = $settings->working_hours;
            
            // توسيع ساعات العمل لتشمل المساء للاختبار
            $workingHours['monday']['end'] = '23:59';
            $workingHours['tuesday']['end'] = '23:59';
            $workingHours['wednesday']['end'] = '23:59';
            $workingHours['thursday']['end'] = '23:59';
            $workingHours['sunday']['end'] = '23:59';
            
            $settings->update(['working_hours' => $workingHours]);
            
            $this->command->info('تم تحديث ساعات العمل بنجاح');
        }
    }
}
