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
        Schema::create('cases', function (Blueprint $table) {
            $table->id();
            $table->string('file_number', 50)->unique();
            $table->string('title');
            $table->string('client_name');
            $table->string('client_id', 50);
            $table->string('client_phone', 20)->nullable();
            $table->string('client_email')->nullable();
            $table->string('opponent_name')->nullable();
            $table->string('opponent_lawyer')->nullable();
            $table->string('court')->nullable();
            $table->enum('case_type', [
                'civil', 'criminal', 'commercial', 'family', 'labor', 
                'administrative', 'real_estate', 'intellectual_property', 'other'
            ]);
            $table->string('case_category', 100)->nullable();
            $table->enum('status', ['active', 'pending', 'closed', 'appealed', 'settled', 'dismissed'])
                  ->default('active');
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->text('description')->nullable();
            $table->decimal('contract_value', 15, 2)->nullable();
            $table->date('filing_date')->nullable();
            $table->date('due_date')->nullable();
            $table->datetime('next_hearing')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            
            $table->index(['status', 'priority']);
            $table->index(['case_type', 'created_at']);
            $table->index('client_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cases');
    }
};
