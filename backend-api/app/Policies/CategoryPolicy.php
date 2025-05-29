<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Category;

class CategoryPolicy
{
    public function view(User $user, Category $category)
    {
        return $category->user_id === $user->id;
    }

    public function update(User $user, Category $category)
    {
        return $category->user_id === $user->id;
    }

    public function delete(User $user, Category $category)
    {
        return $category->user_id === $user->id;
    }
}
