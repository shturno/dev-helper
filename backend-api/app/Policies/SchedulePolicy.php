<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Schedule;

class SchedulePolicy
{
    public function view(User $user, Schedule $schedule)
    {
        return $schedule->user_id === $user->id;
    }

    public function update(User $user, Schedule $schedule)
    {
        return $schedule->user_id === $user->id;
    }

    public function delete(User $user, Schedule $schedule)
    {
        return $schedule->user_id === $user->id;
    }
}
