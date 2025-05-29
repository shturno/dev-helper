<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductivityMetric extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'type', 'value', 'recorded_at', 'user_id'];
}
