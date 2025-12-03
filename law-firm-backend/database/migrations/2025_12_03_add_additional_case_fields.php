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
        // إضافة حقول إضافية لجدول القضايا
        Schema::table('cases', function (Blueprint $table) {
            if (!Schema::hasColumn('cases', 'case_demands')) {
                $table->text('case_demands')->nullable()->after('case_subject'); // مطالب القضية
            }
            if (!Schema::hasColumn('cases', 'case_proofs')) {
                $table->text('case_proofs')->nullable()->after('case_demands'); // أدلة القضية
            }
            if (!Schema::hasColumn('cases', 'sub_circle')) {
                $table->string('sub_circle')->nullable()->after('department'); // الدائرة الفرعية
            }
            if (!Schema::hasColumn('cases', 'case_classification')) {
                $table->string('case_classification')->nullable()->after('case_category'); // تصنيف القضية
            }
        });
        
        // إضافة حقول إضافية لجدول الأطراف
        Schema::table('case_parties', function (Blueprint $table) {
            if (!Schema::hasColumn('case_parties', 'party_type')) {
                $table->string('party_type')->nullable()->after('nationality'); // نوع الطرف (فرد/منشأة)
            }
            if (!Schema::hasColumn('case_parties', 'represents')) {
                $table->string('represents')->nullable()->after('party_type'); // يمثل (للمحامي)
            }
        });
        
        // إضافة حقول إضافية لجدول الجلسات
        Schema::table('case_sessions', function (Blueprint $table) {
            if (!Schema::hasColumn('case_sessions', 'location')) {
                $table->string('location')->nullable()->after('method'); // موقع الجلسة
            }
            if (!Schema::hasColumn('case_sessions', 'session_number')) {
                $table->integer('session_number')->nullable()->after('session_type'); // رقم الجلسة
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cases', function (Blueprint $table) {
            $columns = ['case_demands', 'case_proofs', 'sub_circle', 'case_classification'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('cases', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
        
        Schema::table('case_parties', function (Blueprint $table) {
            if (Schema::hasColumn('case_parties', 'party_type')) {
                $table->dropColumn('party_type');
            }
            if (Schema::hasColumn('case_parties', 'represents')) {
                $table->dropColumn('represents');
            }
        });
        
        Schema::table('case_sessions', function (Blueprint $table) {
            if (Schema::hasColumn('case_sessions', 'location')) {
                $table->dropColumn('location');
            }
            if (Schema::hasColumn('case_sessions', 'session_number')) {
                $table->dropColumn('session_number');
            }
        });
    }
};
