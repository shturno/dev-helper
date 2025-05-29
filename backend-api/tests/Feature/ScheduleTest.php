<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Schedule;

class ScheduleTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_crud_schedule()
    {
        $user = User::factory()->create();
        $token = $user->createToken('api')->plainTextToken;
        $headers = ['Authorization' => 'Bearer ' . $token];

        // Create
        $response = $this->postJson('/api/v1/schedules', [
            'title' => 'Nova Agenda',
            'start_time' => now()->addHour()->toDateTimeString(),
            'end_time' => now()->addHours(2)->toDateTimeString(),
        ], $headers);
        $response->assertStatus(201)->assertJsonFragment(['title' => 'Nova Agenda']);
        $scheduleId = $response->json('data.id');

        // Read
        $response = $this->getJson('/api/v1/schedules/' . $scheduleId, $headers);
        $response->assertStatus(200)->assertJsonFragment(['title' => 'Nova Agenda']);

        // Update
        $response = $this->putJson('/api/v1/schedules/' . $scheduleId, [
            'title' => 'Agenda Editada',
            'start_time' => now()->addHour()->toDateTimeString(),
            'end_time' => now()->addHours(2)->toDateTimeString(),
        ], $headers);
        $response->assertStatus(200)->assertJsonFragment(['title' => 'Agenda Editada']);

        // Delete
        $response = $this->deleteJson('/api/v1/schedules/' . $scheduleId, [], $headers);
        $response->assertStatus(204);
    }

    public function test_guest_cannot_crud_schedule()
    {
        $schedule = Schedule::factory()->create();
        $this->getJson('/api/v1/schedules')->assertStatus(401);
        $this->postJson('/api/v1/schedules', [])->assertStatus(401);
        $this->getJson('/api/v1/schedules/' . $schedule->id)->assertStatus(401);
        $this->putJson('/api/v1/schedules/' . $schedule->id, [])->assertStatus(401);
        $this->deleteJson('/api/v1/schedules/' . $schedule->id)->assertStatus(401);
    }
}
