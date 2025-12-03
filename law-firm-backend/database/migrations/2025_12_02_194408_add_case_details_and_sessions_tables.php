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
        // إضافة حقول التفاصيل الجديدة لجدول القضايا
        Schema::table('cases', function (Blueprint $table) {
            // الحقول الجديدة فقط (غير موجودة مسبقاً)
            if (!Schema::hasColumn('cases', 'case_date_hijri')) {
                $table->string('case_date_hijri')->nullable()->after('filing_date');
            }
            if (!Schema::hasColumn('cases', 'department')) {
                $table->string('department')->nullable()->after('court');
            }
            if (!Schema::hasColumn('cases', 'plaintiff_name')) {
                $table->string('plaintiff_name')->nullable()->after('client_name');
            }
            if (!Schema::hasColumn('cases', 'plaintiff_id')) {
                $table->string('plaintiff_id')->nullable()->after('plaintiff_name');
            }
            if (!Schema::hasColumn('cases', 'defendant_name')) {
                $table->string('defendant_name')->nullable()->after('opponent_name');
            }
            if (!Schema::hasColumn('cases', 'defendant_id')) {
                $table->string('defendant_id')->nullable()->after('defendant_name');
            }
            if (!Schema::hasColumn('cases', 'next_hearing_time')) {
                $table->string('next_hearing_time')->nullable()->after('next_hearing');
            }
            if (!Schema::hasColumn('cases', 'next_hearing_type')) {
                $table->string('next_hearing_type')->nullable()->after('next_hearing_time');
            }
            if (!Schema::hasColumn('cases', 'hearing_method')) {
                $table->string('hearing_method')->nullable()->after('next_hearing_type');
            }
        });
        
        // جدول أطراف القضية
        if (!Schema::hasTable('case_parties')) {
            Schema::create('case_parties', function (Blueprint $table) {
                $table->id();
                $table->foreignId('case_id')->constrained('cases')->onDelete('cascade');
                $table->string('name'); // اسم الطرف
                $table->string('role'); // الصفة (المدعي، مدعى عليه، محامي)
                $table->string('side'); // جهة الطرف (plaintiff, defendant)
                $table->string('national_id')->nullable(); // رقم الهوية الوطنية
                $table->string('commercial_reg')->nullable(); // السجل التجاري
                $table->string('nationality')->nullable(); // الجنسية
                $table->string('phone')->nullable(); // رقم الهاتف
                $table->string('email')->nullable(); // البريد الإلكتروني
                $table->timestamps();
                
                $table->index(['case_id', 'side']);
                $table->index(['case_id', 'role']);
            });
        }
        
        // جدول جلسات القضية
        if (!Schema::hasTable('case_sessions')) {
            Schema::create('case_sessions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('case_id')->constrained('cases')->onDelete('cascade');
                $table->string('session_type')->nullable(); // نوع الجلسة
                $table->string('session_date')->nullable(); // تاريخ الجلسة (هجري)
                $table->date('session_date_gregorian')->nullable(); // تاريخ ميلادي
                $table->string('session_time')->nullable(); // وقت الجلسة
                $table->string('status')->default('scheduled'); // الحالة
                $table->string('court')->nullable(); // المحكمة
                $table->string('department')->nullable(); // الدائرة
                $table->string('method')->nullable(); // آلية الانعقاد
                $table->string('degree')->nullable(); // الدرجة
                $table->text('notes')->nullable(); // ملاحظات
                $table->text('result')->nullable(); // نتيجة الجلسة
                $table->timestamps();
                
                $table->index(['case_id', 'status']);
                $table->index(['session_date_gregorian']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('case_sessions');
        Schema::dropIfExists('case_parties');
        
        Schema::table('cases', function (Blueprint $table) {
            $columns = [
                'case_date_hijri',
                'department',
                'plaintiff_name',
                'plaintiff_id',
                'defendant_name',
                'defendant_id',
                'next_hearing_time',
                'next_hearing_type',
                'hearing_method'
            ];
            
            foreach ($columns as $column) {
                if (Schema::hasColumn('cases', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
