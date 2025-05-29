<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Integration;

class IntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_crud_integration()
    {
        $user = User::factory()->create();
        $token = $user->createToken('api')->plainTextToken;
        $headers = ['Authorization' => 'Bearer ' . $token];

        // Create
        $response = $this->postJson('/api/v1/integrations', [
            'name' => 'Nova Integração',
        ], $headers);
        $response->assertStatus(201)->assertJsonFragment(['name' => 'Nova Integração']);
        $integrationId = $response->json('data.id');

        // Read
        $response = $this->getJson('/api/v1/integrations/' . $integrationId, $headers);
        $response->assertStatus(200)->assertJsonFragment(['name' => 'Nova Integração']);

        // Update
        $response = $this->putJson('/api/v1/integrations/' . $integrationId, [
            'name' => 'Integração Editada',
        ], $headers);
        $response->assertStatus(200)->assertJsonFragment(['name' => 'Integração Editada']);

        // Delete
        $response = $this->deleteJson('/api/v1/integrations/' . $integrationId, [], $headers);
        $response->assertStatus(204);
    }

    public function test_guest_cannot_crud_integration()
    {
        $integration = Integration::factory()->create();
        $this->getJson('/api/v1/integrations')->assertStatus(401);
        $this->postJson('/api/v1/integrations', [])->assertStatus(401);
        $this->getJson('/api/v1/integrations/' . $integration->id)->assertStatus(401);
        $this->putJson('/api/v1/integrations/' . $integration->id, [])->assertStatus(401);
        $this->deleteJson('/api/v1/integrations/' . $integration->id)->assertStatus(401);
    }
}
