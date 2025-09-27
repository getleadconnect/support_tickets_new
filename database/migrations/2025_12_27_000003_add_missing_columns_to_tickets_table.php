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
        Schema::table('tickets', function (Blueprint $table) {
            // Check and add missing columns
            if (!Schema::hasColumn('tickets', 'slug')) {
                $table->string('slug')->nullable()->after('tracking_number');
            }

            if (!Schema::hasColumn('tickets', 'service_id')) {
                $table->unsignedBigInteger('service_id')->nullable()->after('slug');
            }

            if (!Schema::hasColumn('tickets', 'closed_time')) {
                $table->time('closed_time')->nullable()->after('closed_at');
            }

            if (!Schema::hasColumn('tickets', 'branch')) {
                $table->string('branch')->nullable()->after('branch_id');
            }

            if (!Schema::hasColumn('tickets', 'label')) {
                $table->string('label')->nullable()->after('branch');
            }

            if (!Schema::hasColumn('tickets', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropColumn('label');
            $table->dropColumn('branch');
            $table->dropColumn('closed_time');
            $table->dropColumn('service_id');
            $table->dropColumn('slug');
        });
    }
};