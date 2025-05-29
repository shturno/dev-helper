<?php

namespace App\Http\Controllers;

use App\Models\Schedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Resources\Json\JsonResource;

class ScheduleController extends Controller
{
    public function index(Request $request)
    {
        $schedules = Schedule::where('user_id', Auth::id())->get();
        return JsonResource::collection($schedules);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after_or_equal:start_time',
            'recurrence' => 'nullable|string|max:50',
        ]);
        $schedule = Schedule::create(array_merge($data, [
            'user_id' => Auth::id(),
        ]));
        return new JsonResource($schedule);
    }

    public function show(Schedule $schedule)
    {
        $this->authorize('view', $schedule);
        return new JsonResource($schedule);
    }

    public function update(Request $request, Schedule $schedule)
    {
        $this->authorize('update', $schedule);
        $data = $request->validate([
            'title' => 'sometimes|required|string|max:100',
            'description' => 'nullable|string|max:255',
            'start_time' => 'sometimes|required|date',
            'end_time' => 'sometimes|required|date|after_or_equal:start_time',
            'recurrence' => 'nullable|string|max:50',
        ]);
        $schedule->update($data);
        return new JsonResource($schedule->fresh());
    }

    public function destroy(Schedule $schedule)
    {
        $this->authorize('delete', $schedule);
        $schedule->delete();
        return response()->noContent();
    }
}
