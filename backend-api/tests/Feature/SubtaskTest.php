<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Subtask;
use App\Models\Task;

class SubtaskTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_crud_subtask()
    {
        $user = User::factory()->create();
        $token = $user->createToken('api')->plainTextToken;
        $headers = ['Authorization' => 'Bearer ' . $token];

        $task = Task::factory()->create(['user_id' => $user->id]);

        // Create
        $response = $this->postJson('/api/v1/subtasks', [
            'title' => 'Nova Subtask',
            'task_id' => $task->id,
        ], $headers);
        $response->assertStatus(201)->assertJsonFragment(['title' => 'Nova Subtask']);
        $subtaskId = $response->json('data.id');

        // Read
        $response = $this->getJson('/api/v1/subtasks/' . $subtaskId, $headers);
        $response->assertStatus(200)->assertJsonFragment(['title' => 'Nova Subtask']);

        // Update
        $response = $this->putJson('/api/v1/subtasks/' . $subtaskId, [
            'title' => 'Subtask Editada',
        ], $headers);
        $response->assertStatus(200)->assertJsonFragment(['title' => 'Subtask Editada']);

        // Delete
        $response = $this->deleteJson('/api/v1/subtasks/' . $subtaskId, [], $headers);
        $response->assertStatus(204);
    }

    public function test_guest_cannot_crud_subtask()
    {
        $subtask = Subtask::factory()->create();
        $this->getJson('/api/v1/subtasks')->assertStatus(401);
        $this->postJson('/api/v1/subtasks', [])->assertStatus(401);
        $this->getJson('/api/v1/subtasks/' . $subtask->id)->assertStatus(401);
        $this->putJson('/api/v1/subtasks/' . $subtask->id, [])->assertStatus(401);
        $this->deleteJson('/api/v1/subtasks/' . $subtask->id)->assertStatus(401);
    }
}
