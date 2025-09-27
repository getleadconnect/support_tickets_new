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
        Schema::table('users', function (Blueprint $table) {
            // Check and add missing columns
            if (!Schema::hasColumn('users', 'role_id')) {
                $table->foreignId('role_id')->nullable()->after('password')->constrained()->nullOnDelete();
            }

            if (!Schema::hasColumn('users', 'department_id')) {
                $table->foreignId('department_id')->nullable()->after('role_id')->constrained()->nullOnDelete();
            }

            if (!Schema::hasColumn('users', 'designation_id')) {
                $table->foreignId('designation_id')->nullable()->after('department_id')->constrained()->nullOnDelete();
            }

            if (!Schema::hasColumn('users', 'country_code')) {
                $table->string('country_code', 10)->nullable()->after('designation_id');
            }

            if (!Schema::hasColumn('users', 'mobile')) {
                $table->string('mobile', 20)->nullable()->after('country_code');
            }

            if (!Schema::hasColumn('users', 'status')) {
                $table->tinyInteger('status')->default(1)->after('mobile');
            }

            if (!Schema::hasColumn('users', 'branch_id')) {
                $table->foreignId('branch_id')->nullable()->after('status')->constrained('branches')->nullOnDelete();
            }

            if (!Schema::hasColumn('users', 'parent_id')) {
                $table->foreignId('parent_id')->nullable()->after('branch_id')->constrained('users')->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropColumn('parent_id');

            $table->dropForeign(['branch_id']);
            $table->dropColumn('branch_id');

            $table->dropColumn('status');
            $table->dropColumn('mobile');
            $table->dropColumn('country_code');

            $table->dropForeign(['designation_id']);
            $table->dropColumn('designation_id');

            $table->dropForeign(['department_id']);
            $table->dropColumn('department_id');

            $table->dropForeign(['role_id']);
            $table->dropColumn('role_id');
        });
    }
};