<?php

namespace App\Http\Controllers;

use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Resources\Json\JsonResource;

class TagController extends Controller
{
    public function index(Request $request)
    {
        $tags = Tag::where('user_id', Auth::id())->get();
        return JsonResource::collection($tags);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:50',
            'color' => 'nullable|string|max:20',
        ]);
        $tag = Tag::create(array_merge($data, [
            'user_id' => Auth::id(),
        ]));
        return new JsonResource($tag);
    }

    public function show(Tag $tag)
    {
        $this->authorize('view', $tag);
        return new JsonResource($tag);
    }

    public function update(Request $request, Tag $tag)
    {
        $this->authorize('update', $tag);
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:50',
            'color' => 'nullable|string|max:20',
        ]);
        $tag->update($data);
        return new JsonResource($tag->fresh());
    }

    public function destroy(Tag $tag)
    {
        $this->authorize('delete', $tag);
        $tag->delete();
        return response()->noContent();
    }
}
