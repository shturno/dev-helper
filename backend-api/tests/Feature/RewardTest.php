<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Reward;

class RewardTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_crud_reward()
    {
        $user = User::factory()->create();
        $token = $user->createToken('api')->plainTextToken;
        $headers = ['Authorization' => 'Bearer ' . $token];

        // Create
        $response = $this->postJson('/api/v1/rewards', [
            'name' => 'Nova Recompensa',
        ], $headers);
        $response->assertStatus(201)->assertJsonFragment(['name' => 'Nova Recompensa']);
        $rewardId = $response->json('data.id');

        // Read
        $response = $this->getJson('/api/v1/rewards/' . $rewardId, $headers);
        $response->assertStatus(200)->assertJsonFragment(['name' => 'Nova Recompensa']);

        // Update
        $response = $this->putJson('/api/v1/rewards/' . $rewardId, [
            'name' => 'Recompensa Editada',
        ], $headers);
        $response->assertStatus(200)->assertJsonFragment(['name' => 'Recompensa Editada']);

        // Delete
        $response = $this->deleteJson('/api/v1/rewards/' . $rewardId, [], $headers);
        $response->assertStatus(204);
    }

    public function test_guest_cannot_crud_reward()
    {
        $reward = Reward::factory()->create();
        $this->getJson('/api/v1/rewards')->assertStatus(401);
        $this->postJson('/api/v1/rewards', [])->assertStatus(401);
        $this->getJson('/api/v1/rewards/' . $reward->id)->assertStatus(401);
        $this->putJson('/api/v1/rewards/' . $reward->id, [])->assertStatus(401);
        $this->deleteJson('/api/v1/rewards/' . $reward->id)->assertStatus(401);
    }
}
