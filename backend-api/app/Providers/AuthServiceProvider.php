<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\Task;
use App\Policies\TaskPolicy;
use App\Models\Subtask;
use App\Policies\SubtaskPolicy;
use App\Models\Category;
use App\Policies\CategoryPolicy;
use App\Models\Tag;
use App\Policies\TagPolicy;
use App\Models\Reward;
use App\Policies\RewardPolicy;
use App\Models\ProductivityMetric;
use App\Policies\ProductivityMetricPolicy;
use App\Models\XpTransaction;
use App\Policies\XpTransactionPolicy;
use App\Models\Integration;
use App\Policies\IntegrationPolicy;
use App\Models\Schedule;
use App\Policies\SchedulePolicy;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Task::class => TaskPolicy::class,
        Subtask::class => SubtaskPolicy::class,
        Category::class => CategoryPolicy::class,
        Tag::class => TagPolicy::class,
        Reward::class => RewardPolicy::class,
        ProductivityMetric::class => ProductivityMetricPolicy::class,
        XpTransaction::class => XpTransactionPolicy::class,
        Integration::class => IntegrationPolicy::class,
        Schedule::class => SchedulePolicy::class,
    ];

    public function boot()
    {
        $this->registerPolicies();
    }
}
