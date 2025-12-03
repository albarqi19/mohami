<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UsersWithNationalIdSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // إضافة المدير
        User::updateOrCreate(
            ['national_id' => '1234567890'],
            [
                'name' => 'أحمد محمد الإدارة',
                'national_id' => '1234567890',
                'pin' => Hash::make('1234'),
                'email' => 'admin@law.com',
                'password' => Hash::make('123456'),
                'role' => 'admin',
                'phone' => '+966501234567',
                'is_active' => true,
                'last_login_at' => now(),
            ]
        );

        // إضافة المحامي
        User::updateOrCreate(
            ['national_id' => '1234567891'],
            [
                'name' => 'فاطمة أحمد المحاماة',
                'national_id' => '1234567891',
                'pin' => Hash::make('1234'),
                'email' => 'lawyer@law.com',
                'password' => Hash::make('123456'),
                'role' => 'lawyer',
                'phone' => '+966507654321',
                'is_active' => true,
                'last_login_at' => now(),
            ]
        );

        // إضافة المساعد القانوني
        User::updateOrCreate(
            ['national_id' => '1234567892'],
            [
                'name' => 'سارة علي المساعدة',
                'national_id' => '1234567892',
                'pin' => Hash::make('1234'),
                'email' => 'assistant@law.com',
                'password' => Hash::make('123456'),
                'role' => 'legal_assistant',
                'phone' => '+966509876543',
                'is_active' => true,
                'last_login_at' => now(),
            ]
        );

        // إضافة العميل
        User::updateOrCreate(
            ['national_id' => '1234567893'],
            [
                'name' => 'محمد خالد العميل',
                'national_id' => '1234567893',
                'pin' => Hash::make('1234'),
                'email' => 'client@law.com',
                'password' => Hash::make('123456'),
                'role' => 'client',
                'phone' => '+966502468135',
                'is_active' => true,
                'last_login_at' => now(),
            ]
        );
    }
}
