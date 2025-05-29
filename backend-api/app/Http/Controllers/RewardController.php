<?php

namespace App\Http\Controllers;

use App\Models\Reward;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Resources\Json\JsonResource;

class RewardController extends Controller
{
    public function index(Request $request)
    {
        $rewards = Reward::where('user_id', Auth::id())->get();
        return JsonResource::collection($rewards);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'xp_required' => 'required|integer',
            'icon' => 'nullable|string|max:50',
            'category' => 'nullable|string|max:50',
        ]);
        $reward = Reward::create(array_merge($data, [
            'user_id' => Auth::id(),
        ]));
        return new JsonResource($reward);
    }

    public function show(Reward $reward)
    {
        $this->authorize('view', $reward);
        return new JsonResource($reward);
    }

    public function update(Request $request, Reward $reward)
    {
        $this->authorize('update', $reward);
        $data = $request->validate([
            'title' => 'sometimes|required|string|max:100',
            'description' => 'nullable|string|max:255',
            'xp_required' => 'sometimes|required|integer',
            'icon' => 'nullable|string|max:50',
            'category' => 'nullable|string|max:50',
        ]);
        $reward->update($data);
        return new JsonResource($reward->fresh());
    }

    public function destroy(Reward $reward)
    {
        $this->authorize('delete', $reward);
        $reward->delete();
        return response()->noContent();
    }
}
