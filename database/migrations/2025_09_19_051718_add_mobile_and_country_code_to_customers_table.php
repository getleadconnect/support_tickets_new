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
        Schema::table('customers', function (Blueprint $table) {
            // Check if columns don't exist before adding them
            if (!Schema::hasColumn('customers', 'mobile')) {
                $table->string('mobile')->nullable()->after('email');
            }
            if (!Schema::hasColumn('customers', 'country_code')) {
                $table->string('country_code', 10)->nullable()->default('+91')->after('email');
            }
            if (!Schema::hasColumn('customers', 'company_name')) {
                $table->string('company_name')->nullable()->after('mobile');
            }
            if (!Schema::hasColumn('customers', 'branch_id')) {
                $table->unsignedBigInteger('branch_id')->nullable()->after('company_name');
            }
            if (!Schema::hasColumn('customers', 'created_by')) {
                $table->unsignedBigInteger('created_by')->nullable()->after('branch_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['mobile', 'country_code', 'company_name', 'branch_id', 'created_by']);
        });
    }
};