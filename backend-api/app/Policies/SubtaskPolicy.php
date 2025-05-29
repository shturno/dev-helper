<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Subtask;

class SubtaskPolicy
{
    public function view(User $user, Subtask $subtask)
    {
        return $subtask->user_id === $user->id;
    }

    public function update(User $user, Subtask $subtask)
    {
        return $subtask->user_id === $user->id;
    }

    public function delete(User $user, Subtask $subtask)
    {
        return $subtask->user_id === $user->id;
    }
}
