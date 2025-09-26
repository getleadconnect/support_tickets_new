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
            $table->decimal('net_amount', 10, 2)->default(0)->after('discount');
        });

        // Update existing records to set net_amount = total_amount - discount
        \DB::statement('UPDATE invoices SET net_amount = total_amount - COALESCE(discount, 0)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn('net_amount');
        });
    }
};
