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
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->string('issue');
            $table->text('description')->nullable();
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->string('priority')->default('medium');
            $table->string('status')->default('open');
            $table->date('due_date')->nullable();
            $table->string('ticket_type')->nullable();
            $table->string('branch_id')->nullable();
            $table->string('tracking_number')->unique();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->string('slug')->unique();
            $table->string('service_id')->nullable();
            $table->timestamp('closed_time')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};