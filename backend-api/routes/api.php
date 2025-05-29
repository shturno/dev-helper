<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\SubtaskController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\RewardController;
use App\Http\Controllers\ProductivityMetricController;
use App\Http\Controllers\XpTransactionController;
use App\Http\Controllers\IntegrationController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\AuthController;

Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    Route::apiResource('tasks', TaskController::class);
    Route::apiResource('subtasks', SubtaskController::class);
    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('tags', TagController::class);
    Route::apiResource('rewards', RewardController::class);
    Route::apiResource('productivity-metrics', ProductivityMetricController::class);
    Route::apiResource('xp-transactions', XpTransactionController::class);
    Route::apiResource('integrations', IntegrationController::class);
    Route::apiResource('schedules', ScheduleController::class);
    Route::post('auth/logout', [AuthController::class, 'logout']);
});

// Endpoints públicos (ex: login, registro)
Route::middleware(['throttle:auth'])->group(function () {
    Route::post('auth/login', [AuthController::class, 'login']);
    Route::post('auth/register', [AuthController::class, 'register']);
});
