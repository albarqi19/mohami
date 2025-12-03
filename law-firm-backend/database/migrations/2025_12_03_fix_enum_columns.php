<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // تحويل case_type و status و priority من enum إلى varchar
        DB::statement("ALTER TABLE cases MODIFY case_type VARCHAR(255) NULL DEFAULT 'other'");
        DB::statement("ALTER TABLE cases MODIFY status VARCHAR(100) NULL DEFAULT 'pending'");
        DB::statement("ALTER TABLE cases MODIFY priority VARCHAR(50) NULL DEFAULT 'medium'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // لا نحتاج للتراجع
    }
};
