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
        // Create activities table
        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->string('type');
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('ticket_id')->nullable()->constrained()->cascadeOnDelete();
            $table->text('description')->nullable();
            $table->json('properties')->nullable();
            $table->timestamps();
        });

        // Create additional_fields table
        Schema::create('additional_fields', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('name');
            $table->string('type'); // text, select, date, etc.
            $table->text('selection')->nullable(); // for dropdown options
            $table->boolean('mandatory')->default(0);
            $table->boolean('show_filter')->default(0);
            $table->boolean('show_list')->default(0);
            $table->integer('order')->default(0);
            $table->timestamps();
        });

        // Create additional_field_options table
        Schema::create('additional_field_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('additional_field_id')->constrained()->cascadeOnDelete();
            $table->string('option');
            $table->integer('order')->default(0);
            $table->timestamps();
        });

        // Create ticket_additional_fields table
        Schema::create('ticket_additional_fields', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained()->cascadeOnDelete();
            $table->foreignId('additional_field_id')->constrained()->cascadeOnDelete();
            $table->text('user_input')->nullable();
            $table->timestamps();
        });

        // Create departments table
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('department_name');
            $table->text('description')->nullable();
            $table->boolean('active')->default(1);
            $table->timestamps();
        });

        // Create designations table
        Schema::create('designations', function (Blueprint $table) {
            $table->id();
            $table->string('designation_name');
            $table->text('description')->nullable();
            $table->boolean('active')->default(1);
            $table->timestamps();
        });

        // Create ticket_labels table
        Schema::create('ticket_labels', function (Blueprint $table) {
            $table->id();
            $table->string('label_name');
            $table->string('color')->nullable();
            $table->text('description')->nullable();
            $table->boolean('active')->default(1);
            $table->timestamps();
        });

        // Create label_ticket table (pivot)
        Schema::create('label_ticket', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained()->cascadeOnDelete();
            $table->foreignId('label_id')->constrained('ticket_labels')->cascadeOnDelete();
            $table->timestamps();
        });

        // Create ticket_types table
        Schema::create('ticket_types', function (Blueprint $table) {
            $table->id();
            $table->string('type');
            $table->boolean('active')->default(1);
            $table->timestamps();
        });

        // Create tasks table
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('status', ['pending', 'in_progress', 'completed'])->default('pending');
            $table->dateTime('due_date')->nullable();
            $table->dateTime('completed_at')->nullable();
            $table->timestamps();
        });

        // Create ticket_images table
        Schema::create('ticket_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained()->cascadeOnDelete();
            $table->string('image_path');
            $table->string('image_name')->nullable();
            $table->integer('size')->nullable();
            $table->timestamps();
        });

        // Create ticket_log_notes table
        Schema::create('ticket_log_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('ticket_id')->constrained()->cascadeOnDelete();
            $table->integer('outcome_id')->nullable();
            $table->integer('type_id')->nullable();
            $table->time('time')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Create logs table
        Schema::create('logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('ticket_id')->nullable()->constrained()->cascadeOnDelete();
            $table->integer('outcome_id')->nullable();
            $table->integer('type_id')->nullable();
            $table->time('time')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Create log_types table
        Schema::create('log_types', function (Blueprint $table) {
            $table->id();
            $table->string('type');
            $table->timestamps();
        });

        // Create log_outcomes table
        Schema::create('log_outcomes', function (Blueprint $table) {
            $table->id();
            $table->string('outcome');
            $table->integer('type_id')->nullable();
            $table->timestamps();
        });

        // Create task_types table
        Schema::create('task_types', function (Blueprint $table) {
            $table->id();
            $table->string('type');
            $table->timestamps();
        });

        // Create product_tickets table (pivot)
        Schema::create('product_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->integer('quantity')->default(1);
            $table->decimal('price', 10, 2)->nullable();
            $table->decimal('total_price', 10, 2)->nullable();
            $table->timestamps();
        });

        // Create payments table
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->enum('payment_method', ['cash', 'card', 'upi', 'bank_transfer', 'other'])->default('cash');
            $table->string('transaction_id')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // Create notifications table
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->string('type')->nullable();
            $table->morphs('notifiable');
            $table->text('data');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });

        // Create notification_settings table
        Schema::create('notification_settings', function (Blueprint $table) {
            $table->id();
            $table->string('message_type');
            $table->string('channel'); // email, sms, push
            $table->boolean('enabled')->default(1);
            $table->json('settings')->nullable();
            $table->timestamps();
        });

        // Create api_logs table
        Schema::create('api_logs', function (Blueprint $table) {
            $table->id();
            $table->string('type')->nullable();
            $table->string('url')->nullable();
            $table->string('method')->nullable();
            $table->text('params')->nullable();
            $table->string('status')->nullable();
            $table->text('response')->nullable();
            $table->timestamps();
        });

        // Create assign_agents table
        Schema::create('assign_agents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // Create agent_task table
        Schema::create('agent_task', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });

        // Create company table
        Schema::create('company', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->string('website')->nullable();
            $table->string('logo')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('company');
        Schema::dropIfExists('agent_task');
        Schema::dropIfExists('assign_agents');
        Schema::dropIfExists('api_logs');
        Schema::dropIfExists('notification_settings');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('product_tickets');
        Schema::dropIfExists('task_types');
        Schema::dropIfExists('log_outcomes');
        Schema::dropIfExists('log_types');
        Schema::dropIfExists('logs');
        Schema::dropIfExists('ticket_log_notes');
        Schema::dropIfExists('ticket_images');
        Schema::dropIfExists('tasks');
        Schema::dropIfExists('ticket_types');
        Schema::dropIfExists('label_ticket');
        Schema::dropIfExists('ticket_labels');
        Schema::dropIfExists('designations');
        Schema::dropIfExists('departments');
        Schema::dropIfExists('ticket_additional_fields');
        Schema::dropIfExists('additional_field_options');
        Schema::dropIfExists('additional_fields');
        Schema::dropIfExists('activities');
    }
};