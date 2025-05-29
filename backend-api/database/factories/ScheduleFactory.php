<?php

namespace Database\Factories;

use App\Models\Schedule;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ScheduleFactory extends Factory
{
    protected $model = Schedule::class;

    public function definition(): array
    {
        return [
            'title' => $this->faker->sentence(3),
            'start_time' => $this->faker->dateTimeBetween('+1 hour', '+2 hours'),
            'end_time' => $this->faker->dateTimeBetween('+3 hours', '+4 hours'),
            'user_id' => User::factory(),
        ];
    }
}
