<?php

namespace App\Policies;

use App\Models\User;
use App\Models\ProductivityMetric;

class ProductivityMetricPolicy
{
    public function view(User $user, ProductivityMetric $metric)
    {
        return $metric->user_id === $user->id;
    }

    public function update(User $user, ProductivityMetric $metric)
    {
        return $metric->user_id === $user->id;
    }

    public function delete(User $user, ProductivityMetric $metric)
    {
        return $metric->user_id === $user->id;
    }
}
