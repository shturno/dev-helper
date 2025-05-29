<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Tag;

class TagTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_crud_tag()
    {
        $user = User::factory()->create();
        $token = $user->createToken('api')->plainTextToken;
        $headers = ['Authorization' => 'Bearer ' . $token];

        // Create
        $response = $this->postJson('/api/v1/tags', [
            'name' => 'Nova Tag',
        ], $headers);
        $response->assertStatus(201)->assertJsonFragment(['name' => 'Nova Tag']);
        $tagId = $response->json('data.id');

        // Read
        $response = $this->getJson('/api/v1/tags/' . $tagId, $headers);
        $response->assertStatus(200)->assertJsonFragment(['name' => 'Nova Tag']);

        // Update
        $response = $this->putJson('/api/v1/tags/' . $tagId, [
            'name' => 'Tag Editada',
        ], $headers);
        $response->assertStatus(200)->assertJsonFragment(['name' => 'Tag Editada']);

        // Delete
        $response = $this->deleteJson('/api/v1/tags/' . $tagId, [], $headers);
        $response->assertStatus(204);
    }

    public function test_guest_cannot_crud_tag()
    {
        $tag = Tag::factory()->create();
        $this->getJson('/api/v1/tags')->assertStatus(401);
        $this->postJson('/api/v1/tags', [])->assertStatus(401);
        $this->getJson('/api/v1/tags/' . $tag->id)->assertStatus(401);
        $this->putJson('/api/v1/tags/' . $tag->id, [])->assertStatus(401);
        $this->deleteJson('/api/v1/tags/' . $tag->id)->assertStatus(401);
    }
}
