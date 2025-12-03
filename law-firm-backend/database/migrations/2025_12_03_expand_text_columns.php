<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // توسيع أعمدة القضايا مباشرة بـ SQL
        DB::statement('ALTER TABLE cases MODIFY title TEXT NULL');
        DB::statement('ALTER TABLE cases MODIFY court TEXT NULL');
        DB::statement('ALTER TABLE cases MODIFY department TEXT NULL');
        DB::statement('ALTER TABLE cases MODIFY sub_circle TEXT NULL');
        DB::statement('ALTER TABLE cases MODIFY case_type_arabic TEXT NULL');
        DB::statement('ALTER TABLE cases MODIFY case_category TEXT NULL');
        DB::statement('ALTER TABLE cases MODIFY case_classification TEXT NULL');
        DB::statement('ALTER TABLE cases MODIFY plaintiff_name TEXT NULL');
        DB::statement('ALTER TABLE cases MODIFY defendant_name TEXT NULL');
        DB::statement('ALTER TABLE cases MODIFY client_name TEXT NULL');
        DB::statement('ALTER TABLE cases MODIFY opponent_name TEXT NULL');
        DB::statement('ALTER TABLE cases MODIFY next_hearing_type TEXT NULL');
        DB::statement('ALTER TABLE cases MODIFY hearing_method TEXT NULL');
        DB::statement('ALTER TABLE cases MODIFY najiz_url TEXT NULL');
        DB::statement('ALTER TABLE cases MODIFY case_subject LONGTEXT NULL');
        DB::statement('ALTER TABLE cases MODIFY case_demands LONGTEXT NULL');
        DB::statement('ALTER TABLE cases MODIFY case_proofs LONGTEXT NULL');
        DB::statement('ALTER TABLE cases MODIFY najiz_data LONGTEXT NULL');
        
        // توسيع أعمدة الأطراف (بدون role لأنها في index)
        DB::statement('ALTER TABLE case_parties MODIFY name TEXT NULL');
        DB::statement('ALTER TABLE case_parties MODIFY nationality TEXT NULL');
        DB::statement('ALTER TABLE case_parties MODIFY party_type TEXT NULL');
        DB::statement('ALTER TABLE case_parties MODIFY represents TEXT NULL');
        // تغيير role إلى varchar أكبر بدلاً من text
        DB::statement('ALTER TABLE case_parties MODIFY role VARCHAR(500) NULL');
        
        // توسيع أعمدة الجلسات
        DB::statement('ALTER TABLE case_sessions MODIFY session_type TEXT NULL');
        DB::statement('ALTER TABLE case_sessions MODIFY session_date TEXT NULL');
        DB::statement('ALTER TABLE case_sessions MODIFY session_time TEXT NULL');
        DB::statement('ALTER TABLE case_sessions MODIFY court TEXT NULL');
        DB::statement('ALTER TABLE case_sessions MODIFY department TEXT NULL');
        DB::statement('ALTER TABLE case_sessions MODIFY method TEXT NULL');
        DB::statement('ALTER TABLE case_sessions MODIFY location TEXT NULL');
        DB::statement('ALTER TABLE case_sessions MODIFY degree TEXT NULL');
        DB::statement('ALTER TABLE case_sessions MODIFY status VARCHAR(255) NULL');
        DB::statement('ALTER TABLE case_sessions MODIFY result LONGTEXT NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // لا نحتاج للتراجع
    }
};
