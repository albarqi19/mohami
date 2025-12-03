<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\CaseModel;
use App\Models\Task;
use App\Models\Document;
use App\Models\Activity;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // إنشاء المستخدمين
        $admin = User::create([
            'name' => 'أحمد محمد الإدارة',
            'email' => 'admin@law.com',
            'national_id' => '1234567890',
            'password' => Hash::make('password'),
            'pin' => Hash::make('1234'),
            'role' => 'admin',
            'phone' => '+966501234567',
            'is_active' => true,
        ]);

        $lawyer = User::create([
            'name' => 'فاطمة أحمد المحاماة',
            'email' => 'lawyer@law.com',
            'national_id' => '1234567891',
            'password' => Hash::make('password'),
            'pin' => Hash::make('1234'),
            'role' => 'lawyer',
            'phone' => '+966507654321',
            'is_active' => true,
        ]);

        $assistant = User::create([
            'name' => 'سارة علي المساعدة',
            'email' => 'assistant@law.com',
            'national_id' => '1234567892',
            'password' => Hash::make('password'),
            'pin' => Hash::make('1234'),
            'role' => 'legal_assistant',
            'phone' => '+966509876543',
            'is_active' => true,
        ]);

        $client = User::create([
            'name' => 'محمد خالد العميل',
            'email' => 'client@law.com',
            'national_id' => '1234567893',
            'password' => Hash::make('password'),
            'pin' => Hash::make('1234'),
            'role' => 'client',
            'phone' => '+966502468135',
            'is_active' => true,
        ]);

        // إنشاء القضايا
        $case1 = CaseModel::create([
            'file_number' => 'LAW-2025-001',
            'title' => 'قضية عقارية - نزاع ملكية',
            'client_name' => $client->name,
            'client_id' => $client->national_id,
            'client_phone' => $client->phone,
            'client_email' => $client->email,
            'opponent_name' => 'شركة التطوير العقاري',
            'opponent_lawyer' => 'مكتب المحاماة الشريك',
            'court' => 'المحكمة العامة',
            'case_type' => 'real_estate',
            'case_category' => 'نزاع ملكية',
            'status' => 'active',
            'priority' => 'high',
            'description' => 'نزاع حول ملكية قطعة أرض في شمال الرياض',
            'contract_value' => 500000.00,
            'filing_date' => now()->subDays(30),
            'due_date' => now()->addDays(60),
            'next_hearing' => now()->addDays(15),
            'created_by' => $admin->id,
        ]);

        $case2 = CaseModel::create([
            'file_number' => 'LAW-2025-002',
            'title' => 'قضية تجارية - خلاف عقد',
            'client_name' => 'شركة الأعمال المتقدمة',
            'client_id' => '2345678901',
            'client_phone' => '+966512345678',
            'client_email' => 'business@company.com',
            'opponent_name' => 'مؤسسة التجارة الحديثة',
            'court' => 'المحكمة التجارية',
            'case_type' => 'commercial',
            'case_category' => 'خلاف عقد',
            'status' => 'pending',
            'priority' => 'medium',
            'description' => 'خلاف حول تنفيذ عقد توريد بقيمة مليون ريال',
            'contract_value' => 1000000.00,
            'filing_date' => now()->subDays(15),
            'due_date' => now()->addDays(45),
            'created_by' => $admin->id,
        ]);

        // ربط المحامين بالقضايا
        $case1->lawyers()->attach($lawyer->id, [
            'assigned_at' => now(),
            'assigned_by' => $admin->id,
            'is_primary' => true,
        ]);

        $case2->lawyers()->attach($lawyer->id, [
            'assigned_at' => now(),
            'assigned_by' => $admin->id,
            'is_primary' => true,
        ]);

        // إنشاء المهام
        $task1 = Task::create([
            'title' => 'مراجعة عقد الشراء',
            'description' => 'مراجعة شاملة لعقد شراء الأرض وتحديد النقاط القانونية',
            'type' => 'review',
            'case_id' => $case1->id,
            'assigned_to' => $lawyer->id,
            'assigned_by' => $admin->id,
            'status' => 'in_progress',
            'priority' => 'high',
            'due_date' => now()->addDays(5),
            'estimated_hours' => 8.0,
        ]);

        $task2 = Task::create([
            'title' => 'إعداد لائحة الدعوى',
            'description' => 'صياغة لائحة الدعوى وإرفاق المستندات المطلوبة',
            'type' => 'document',
            'case_id' => $case1->id,
            'assigned_to' => $assistant->id,
            'assigned_by' => $lawyer->id,
            'status' => 'todo',
            'priority' => 'medium',
            'due_date' => now()->addDays(10),
            'estimated_hours' => 12.0,
        ]);

        // إنشاء الأنشطة
        Activity::create([
            'type' => 'case_created',
            'title' => 'إنشاء قضية جديدة',
            'description' => 'تم إنشاء القضية: ' . $case1->title,
            'case_id' => $case1->id,
            'performed_by' => $admin->id,
            'metadata' => json_encode([
                'case_type' => $case1->case_type,
                'priority' => $case1->priority,
            ]),
        ]);

        Activity::create([
            'type' => 'task_assigned',
            'title' => 'تكليف مهمة جديدة',
            'description' => 'تم تكليف ' . $lawyer->name . ' بمهمة: ' . $task1->title,
            'case_id' => $case1->id,
            'task_id' => $task1->id,
            'performed_by' => $admin->id,
            'metadata' => json_encode([
                'task_type' => $task1->type,
                'assigned_to' => $lawyer->name,
            ]),
        ]);

        $this->command->info('تم إنشاء البيانات التجريبية بنجاح!');
        $this->command->info('المستخدمين:');
        $this->command->info('- Admin: 1234567890 / 1234');
        $this->command->info('- Lawyer: 1234567891 / 1234');
        $this->command->info('- Assistant: 1234567892 / 1234');
        $this->command->info('- Client: 1234567893 / 1234');
    }
}
