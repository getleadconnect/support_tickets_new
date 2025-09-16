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
        Schema::create('priorities', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('color')->nullable();
            $table->integer('order')->default(0);
            $table->timestamps();
        });

        // Insert default priorities
        DB::table('priorities')->insert([
            ['id' => 1, 'name' => 'Low', 'color' => '#06b6d4', 'order' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'name' => 'Medium', 'color' => '#eab308', 'order' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 3, 'name' => 'High', 'color' => '#ef4444', 'order' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 4, 'name' => 'Urgent', 'color' => '#dc2626', 'order' => 4, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('priorities');
    }
};