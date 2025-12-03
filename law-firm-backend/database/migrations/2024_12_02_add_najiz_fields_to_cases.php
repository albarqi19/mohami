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
        Schema::table('cases', function (Blueprint $table) {
            // إضافة حقول ناجز إذا لم تكن موجودة
            if (!Schema::hasColumn('cases', 'najiz_id')) {
                $table->string('najiz_id')->nullable()->after('notes');
            }
            if (!Schema::hasColumn('cases', 'najiz_url')) {
                $table->string('najiz_url')->nullable()->after('najiz_id');
            }
            if (!Schema::hasColumn('cases', 'najiz_synced_at')) {
                $table->timestamp('najiz_synced_at')->nullable()->after('najiz_url');
            }
            if (!Schema::hasColumn('cases', 'source')) {
                $table->string('source')->default('manual')->after('najiz_synced_at');
            }
        });
        
        // إضافة حقول ناجز للمواعيد
        Schema::table('appointments', function (Blueprint $table) {
            if (!Schema::hasColumn('appointments', 'najiz_id')) {
                $table->string('najiz_id')->nullable();
            }
            if (!Schema::hasColumn('appointments', 'najiz_synced_at')) {
                $table->timestamp('najiz_synced_at')->nullable();
            }
            if (!Schema::hasColumn('appointments', 'source')) {
                $table->string('source')->default('manual');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cases', function (Blueprint $table) {
            $table->dropColumn(['najiz_id', 'najiz_url', 'najiz_synced_at', 'source']);
        });
        
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn(['najiz_id', 'najiz_synced_at', 'source']);
        });
    }
};
