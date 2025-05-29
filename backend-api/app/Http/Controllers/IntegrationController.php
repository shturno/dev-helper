<?php

namespace App\Http\Controllers;

use App\Models\Integration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Resources\Json\JsonResource;

class IntegrationController extends Controller
{
    public function index(Request $request)
    {
        $integrations = Integration::where('user_id', Auth::id())->get();
        return JsonResource::collection($integrations);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'type' => 'required|string|max:50',
            'config' => 'nullable|array',
        ]);
        $integration = Integration::create(array_merge($data, [
            'user_id' => Auth::id(),
        ]));
        return new JsonResource($integration);
    }

    public function show(Integration $integration)
    {
        $this->authorize('view', $integration);
        return new JsonResource($integration);
    }

    public function update(Request $request, Integration $integration)
    {
        $this->authorize('update', $integration);
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'type' => 'sometimes|required|string|max:50',
            'config' => 'nullable|array',
        ]);
        $integration->update($data);
        return new JsonResource($integration->fresh());
    }

    public function destroy(Integration $integration)
    {
        $this->authorize('delete', $integration);
        $integration->delete();
        return response()->noContent();
    }
}
