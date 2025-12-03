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
        Schema::table('documents', function (Blueprint $table) {
            $table->unsignedBigInteger('memo_id')->nullable()->after('case_id');
            $table->foreign('memo_id')->references('id')->on('legal_memos')->onDelete('cascade');
            $table->index('memo_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropForeign(['memo_id']);
            $table->dropColumn('memo_id');
        });
    }
};
