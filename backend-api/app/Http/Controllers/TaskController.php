<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Auth;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class TaskController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $tasks = Task::where('user_id', Auth::id())->with(['subtasks', 'tags', 'category'])->get();
        return JsonResource::collection($tasks);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'priority' => 'required|string',
            'priority_criteria' => 'nullable|array',
            'xp_reward' => 'nullable|integer',
            'category_id' => 'nullable|exists:categories,id',
        ]);
        $task = Task::create(array_merge($data, [
            'user_id' => Auth::id(),
        ]));
        return new JsonResource($task->load(['subtasks', 'tags', 'category']));
    }

    /**
     * Display the specified resource.
     */
    public function show(Task $task)
    {
        $this->authorize('view', $task);
        return new JsonResource($task->load(['subtasks', 'tags', 'category']));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Task $task)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Task $task)
    {
        $this->authorize('update', $task);
        $data = $request->validate([
            'title' => 'sometimes|required|string|max:100',
            'description' => 'nullable|string|max:500',
            'priority' => 'sometimes|required|string',
            'priority_criteria' => 'nullable|array',
            'xp_reward' => 'nullable|integer',
            'category_id' => 'nullable|exists:categories,id',
        ]);
        $task->update($data);
        return new JsonResource($task->fresh()->load(['subtasks', 'tags', 'category']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Task $task)
    {
        $this->authorize('delete', $task);
        $task->delete();
        return response()->noContent();
    }
}
