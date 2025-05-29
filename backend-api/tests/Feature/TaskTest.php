<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Task;

class TaskTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_crud_task()
    {
        $user = User::factory()->create();
        $token = $user->createToken('api')->plainTextToken;
        $headers = ['Authorization' => 'Bearer ' . $token];

        // Create
        $response = $this->postJson('/api/v1/tasks', [
            'title' => 'Nova Task',
            'priority' => 'high',
        ], $headers);
        $response->assertStatus(201)->assertJsonFragment(['title' => 'Nova Task']);
        $taskId = $response->json('data.id');

        // Read
        $response = $this->getJson('/api/v1/tasks/' . $taskId, $headers);
        $response->assertStatus(200)->assertJsonFragment(['title' => 'Nova Task']);

        // Update
        $response = $this->putJson('/api/v1/tasks/' . $taskId, [
            'title' => 'Task Editada',
        ], $headers);
        $response->assertStatus(200)->assertJsonFragment(['title' => 'Task Editada']);

        // Delete
        $response = $this->deleteJson('/api/v1/tasks/' . $taskId, [], $headers);
        $response->assertStatus(204);
    }

    public function test_guest_cannot_crud_task()
    {
        $task = Task::factory()->create();
        $this->getJson('/api/v1/tasks')->assertStatus(401);
        $this->postJson('/api/v1/tasks', [])->assertStatus(401);
        $this->getJson('/api/v1/tasks/' . $task->id)->assertStatus(401);
        $this->putJson('/api/v1/tasks/' . $task->id, [])->assertStatus(401);
        $this->deleteJson('/api/v1/tasks/' . $task->id)->assertStatus(401);
    }
}
