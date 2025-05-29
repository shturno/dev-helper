<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Category;

class CategoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_crud_category()
    {
        $user = User::factory()->create();
        $token = $user->createToken('api')->plainTextToken;
        $headers = ['Authorization' => 'Bearer ' . $token];

        // Create
        $response = $this->postJson('/api/v1/categories', [
            'name' => 'Nova Categoria',
        ], $headers);
        $response->assertStatus(201)->assertJsonFragment(['name' => 'Nova Categoria']);
        $categoryId = $response->json('data.id');

        // Read
        $response = $this->getJson('/api/v1/categories/' . $categoryId, $headers);
        $response->assertStatus(200)->assertJsonFragment(['name' => 'Nova Categoria']);

        // Update
        $response = $this->putJson('/api/v1/categories/' . $categoryId, [
            'name' => 'Categoria Editada',
        ], $headers);
        $response->assertStatus(200)->assertJsonFragment(['name' => 'Categoria Editada']);

        // Delete
        $response = $this->deleteJson('/api/v1/categories/' . $categoryId, [], $headers);
        $response->assertStatus(204);
    }

    public function test_guest_cannot_crud_category()
    {
        $category = Category::factory()->create();
        $this->getJson('/api/v1/categories')->assertStatus(401);
        $this->postJson('/api/v1/categories', [])->assertStatus(401);
        $this->getJson('/api/v1/categories/' . $category->id)->assertStatus(401);
        $this->putJson('/api/v1/categories/' . $category->id, [])->assertStatus(401);
        $this->deleteJson('/api/v1/categories/' . $category->id)->assertStatus(401);
    }
}
