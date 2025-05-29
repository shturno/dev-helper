<?php

namespace App\Http\Controllers;

use App\Models\ProductivityMetric;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductivityMetricController extends Controller
{
    public function index(Request $request)
    {
        $metrics = ProductivityMetric::where('user_id', Auth::id())->get();
        return JsonResource::collection($metrics);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'type' => 'required|string|max:50',
            'value' => 'required|numeric',
            'recorded_at' => 'required|date',
        ]);
        $metric = ProductivityMetric::create(array_merge($data, [
            'user_id' => Auth::id(),
        ]));
        return new JsonResource($metric);
    }

    public function show(ProductivityMetric $productivityMetric)
    {
        $this->authorize('view', $productivityMetric);
        return new JsonResource($productivityMetric);
    }

    public function update(Request $request, ProductivityMetric $productivityMetric)
    {
        $this->authorize('update', $productivityMetric);
        $data = $request->validate([
            'type' => 'sometimes|required|string|max:50',
            'value' => 'sometimes|required|numeric',
            'recorded_at' => 'sometimes|required|date',
        ]);
        $productivityMetric->update($data);
        return new JsonResource($productivityMetric->fresh());
    }

    public function destroy(ProductivityMetric $productivityMetric)
    {
        $this->authorize('delete', $productivityMetric);
        $productivityMetric->delete();
        return response()->noContent();
    }
}
