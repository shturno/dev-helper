<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\ProductivityMetric;

class ProductivityMetricTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_crud_productivity_metric()
    {
        $user = User::factory()->create();
        $token = $user->createToken('api')->plainTextToken;
        $headers = ['Authorization' => 'Bearer ' . $token];

        // Create
        $response = $this->postJson('/api/v1/productivity-metrics', [
            'name' => 'Nova Métrica',
        ], $headers);
        $response->assertStatus(201)->assertJsonFragment(['name' => 'Nova Métrica']);
        $metricId = $response->json('data.id');

        // Read
        $response = $this->getJson('/api/v1/productivity-metrics/' . $metricId, $headers);
        $response->assertStatus(200)->assertJsonFragment(['name' => 'Nova Métrica']);

        // Update
        $response = $this->putJson('/api/v1/productivity-metrics/' . $metricId, [
            'name' => 'Métrica Editada',
        ], $headers);
        $response->assertStatus(200)->assertJsonFragment(['name' => 'Métrica Editada']);

        // Delete
        $response = $this->deleteJson('/api/v1/productivity-metrics/' . $metricId, [], $headers);
        $response->assertStatus(204);
    }

    public function test_guest_cannot_crud_productivity_metric()
    {
        $metric = ProductivityMetric::factory()->create();
        $this->getJson('/api/v1/productivity-metrics')->assertStatus(401);
        $this->postJson('/api/v1/productivity-metrics', [])->assertStatus(401);
        $this->getJson('/api/v1/productivity-metrics/' . $metric->id)->assertStatus(401);
        $this->putJson('/api/v1/productivity-metrics/' . $metric->id, [])->assertStatus(401);
        $this->deleteJson('/api/v1/productivity-metrics/' . $metric->id)->assertStatus(401);
    }
}
