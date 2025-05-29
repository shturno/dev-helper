<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Subtask;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'title', 'description', 'priority', 'priority_criteria', 'xp_reward', 'category_id', 'user_id'
    ];

    public function subtasks()
    {
        return $this->hasMany(Subtask::class);
    }

    public function tags()
    {
        return $this->belongsToMany(Tag::class, 'tag_task', 'task_id', 'tag_id');
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}
