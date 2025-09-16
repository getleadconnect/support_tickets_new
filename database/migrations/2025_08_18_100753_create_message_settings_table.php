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
        Schema::create('message_settings', function (Blueprint $table) {
            $table->id();
            $table->string('message_type', 50);
            $table->string('whatsapp_api')->nullable();
            $table->string('token')->nullable();
            $table->string('secret_key')->nullable();
            $table->string('template_name')->nullable();
            $table->text('template_text')->nullable();
            $table->boolean('status')->default(true);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
            
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->index('message_type');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('message_settings');
    }
};