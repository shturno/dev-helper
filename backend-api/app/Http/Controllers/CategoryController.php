<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $categories = Category::where('user_id', Auth::id())->get();
        return JsonResource::collection($categories);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:20',
            'icon' => 'nullable|string|max:50',
            'parent_id' => 'nullable|exists:categories,id',
        ]);
        $category = Category::create(array_merge($data, [
            'user_id' => Auth::id(),
        ]));
        return new JsonResource($category);
    }

    public function show(Category $category)
    {
        $this->authorize('view', $category);
        return new JsonResource($category);
    }

    public function update(Request $request, Category $category)
    {
        $this->authorize('update', $category);
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'description' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:20',
            'icon' => 'nullable|string|max:50',
            'parent_id' => 'nullable|exists:categories,id',
        ]);
        $category->update($data);
        return new JsonResource($category->fresh());
    }

    public function destroy(Category $category)
    {
        $this->authorize('delete', $category);
        $category->delete();
        return response()->noContent();
    }
}
