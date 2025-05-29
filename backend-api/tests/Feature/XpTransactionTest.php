<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\XpTransaction;

class XpTransactionTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_crud_xp_transaction()
    {
        $user = User::factory()->create();
        $token = $user->createToken('api')->plainTextToken;
        $headers = ['Authorization' => 'Bearer ' . $token];

        // Create
        $response = $this->postJson('/api/v1/xp-transactions', [
            'amount' => 100,
            'type' => 'gain',
        ], $headers);
        $response->assertStatus(201)->assertJsonFragment(['amount' => 100]);
        $transactionId = $response->json('data.id');

        // Read
        $response = $this->getJson('/api/v1/xp-transactions/' . $transactionId, $headers);
        $response->assertStatus(200)->assertJsonFragment(['amount' => 100]);

        // Update
        $response = $this->putJson('/api/v1/xp-transactions/' . $transactionId, [
            'amount' => 200,
        ], $headers);
        $response->assertStatus(200)->assertJsonFragment(['amount' => 200]);

        // Delete
        $response = $this->deleteJson('/api/v1/xp-transactions/' . $transactionId, [], $headers);
        $response->assertStatus(204);
    }

    public function test_guest_cannot_crud_xp_transaction()
    {
        $transaction = XpTransaction::factory()->create();
        $this->getJson('/api/v1/xp-transactions')->assertStatus(401);
        $this->postJson('/api/v1/xp-transactions', [])->assertStatus(401);
        $this->getJson('/api/v1/xp-transactions/' . $transaction->id)->assertStatus(401);
        $this->putJson('/api/v1/xp-transactions/' . $transaction->id, [])->assertStatus(401);
        $this->deleteJson('/api/v1/xp-transactions/' . $transaction->id)->assertStatus(401);
    }
}
