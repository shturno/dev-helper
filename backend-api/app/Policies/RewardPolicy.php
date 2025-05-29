<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Reward;

class RewardPolicy
{
    public function view(User $user, Reward $reward)
    {
        return $reward->user_id === $user->id;
    }

    public function update(User $user, Reward $reward)
    {
        return $reward->user_id === $user->id;
    }

    public function delete(User $user, Reward $reward)
    {
        return $reward->user_id === $user->id;
    }
}
