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
        // تغيير نوع العمود إلى string بدلاً من enum لمرونة أكثر
        Schema::table('activities', function (Blueprint $table) {
            $table->string('type')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->enum('type', [
                'case_created', 'case_updated', 'task_created', 'task_assigned', 
                'task_updated', 'task_completed', 'document_uploaded', 'comment_added',
                'hearing_scheduled', 'status_changed', 'user_assigned', 'client_meeting'
            ])->change();
        });
    }
};
