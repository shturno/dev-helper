<?php

namespace App\Http\Controllers;

use App\Models\Subtask;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Resources\Json\JsonResource;

class SubtaskController extends Controller
{
    public function index(Request $request)
    {
        $subtasks = Subtask::where('user_id', Auth::id())->with(['task'])->get();
        return JsonResource::collection($subtasks);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'status' => 'required|string',
            'task_id' => 'required|exists:tasks,id',
        ]);
        $subtask = Subtask::create(array_merge($data, [
            'user_id' => Auth::id(),
        ]));
        return new JsonResource($subtask->load(['task']));
    }

    public function show(Subtask $subtask)
    {
        $this->authorize('view', $subtask);
        return new JsonResource($subtask->load(['task']));
    }

    public function update(Request $request, Subtask $subtask)
    {
        $this->authorize('update', $subtask);
        $data = $request->validate([
            'title' => 'sometimes|required|string|max:100',
            'description' => 'nullable|string|max:500',
            'status' => 'sometimes|required|string',
        ]);
        $subtask->update($data);
        return new JsonResource($subtask->fresh()->load(['task']));
    }

    public function destroy(Subtask $subtask)
    {
        $this->authorize('delete', $subtask);
        $subtask->delete();
        return response()->noContent();
    }
}
