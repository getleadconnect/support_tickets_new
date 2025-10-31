<?php

use Illuminate\Support\Facades\Route;
//use App\Http\Controllers\TaskController;

//Route::get('/send-message', [TaskController::class, 'sendMessage']);

Route::get('/{any}', function () {
    return view('dashboard');
})->where('any', '.*');


