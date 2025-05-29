<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Task;

class TaskPolicy
{
    public function view(User $user, Task $task)
    {
        return $task->user_id === $user->id;
    }

    public function update(User $user, Task $task)
    {
        return $task->user_id === $user->id;
    }

    public function delete(User $user, Task $task)
    {
        return $task->user_id === $user->id;
    }
}
