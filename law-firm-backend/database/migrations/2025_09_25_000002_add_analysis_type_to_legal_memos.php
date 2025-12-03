<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('legal_memos', function (Blueprint $table) {
            $table->string('analysis_type')->nullable()->after('analysis_result')->comment('نوع التحليل: gemini_api أو local_fallback');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('legal_memos', function (Blueprint $table) {
            $table->dropColumn('analysis_type');
        });
    }
};
