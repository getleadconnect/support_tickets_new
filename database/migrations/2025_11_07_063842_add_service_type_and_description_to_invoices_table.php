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
        Schema::table('invoices', function (Blueprint $table) {
            // Add service_type column (Shop or Outsource)
            if (!Schema::hasColumn('invoices', 'service_type')) {
                $table->enum('service_type', ['Shop', 'Outsource'])->nullable()->after('service_charge');
            }

            // Add description column
            if (!Schema::hasColumn('invoices', 'description')) {
                $table->text('description')->nullable()->after('service_type');
            }

            // Add branch_id column
            if (!Schema::hasColumn('invoices', 'branch_id')) {
                $table->unsignedBigInteger('branch_id')->nullable()->after('customer_id');
                $table->foreign('branch_id')->references('id')->on('branches')->nullOnDelete();
            }

            // Add payment_method column (used by controller)
            if (!Schema::hasColumn('invoices', 'payment_method')) {
                $table->string('payment_method')->nullable()->after('total_amount');
            }

            // Add status column if not exists
            if (!Schema::hasColumn('invoices', 'status')) {
                $table->string('status')->default('pending')->after('payment_method');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            // Drop foreign key first
            if (Schema::hasColumn('invoices', 'branch_id')) {
                $table->dropForeign(['branch_id']);
                $table->dropColumn('branch_id');
            }

            // Drop other columns
            if (Schema::hasColumn('invoices', 'service_type')) {
                $table->dropColumn('service_type');
            }

            if (Schema::hasColumn('invoices', 'description')) {
                $table->dropColumn('description');
            }

            if (Schema::hasColumn('invoices', 'payment_method')) {
                $table->dropColumn('payment_method');
            }

            if (Schema::hasColumn('invoices', 'status')) {
                $table->dropColumn('status');
            }
        });
    }
};
