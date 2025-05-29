<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Tag;

class TagPolicy
{
    public function view(User $user, Tag $tag)
    {
        return $tag->user_id === $user->id;
    }

    public function update(User $user, Tag $tag)
    {
        return $tag->user_id === $user->id;
    }

    public function delete(User $user, Tag $tag)
    {
        return $tag->user_id === $user->id;
    }
}
