<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('message_settings', function (Blueprint $table) {
            // Add vendor_name column
            $table->string('vendor_name')->nullable()->after('id');

            // Add api_token column
            $table->string('api_token')->nullable()->after('whatsapp_api');
        });

        // Copy data from token to api_token
        DB::statement('UPDATE message_settings SET api_token = token WHERE token IS NOT NULL');

        // Drop the old token column
        Schema::table('message_settings', function (Blueprint $table) {
            $table->dropColumn('token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('message_settings', function (Blueprint $table) {
            // Re-add token column
            $table->string('token')->nullable()->after('whatsapp_api');
        });

        // Copy data back from api_token to token
        DB::statement('UPDATE message_settings SET token = api_token WHERE api_token IS NOT NULL');

        Schema::table('message_settings', function (Blueprint $table) {
            // Drop api_token and vendor_name
            $table->dropColumn(['api_token', 'vendor_name']);
        });
    }
};
