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
            $table->string('content_hash')->nullable()->after('content');
            $table->boolean('needs_reanalysis')->default(true)->after('content_hash');
            $table->timestamp('content_last_modified')->nullable()->after('needs_reanalysis');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('legal_memos', function (Blueprint $table) {
            $table->dropColumn(['content_hash', 'needs_reanalysis', 'content_last_modified']);
        });
    }
};
