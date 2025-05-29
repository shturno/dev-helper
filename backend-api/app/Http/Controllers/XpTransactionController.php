<?php

namespace App\Http\Controllers;

use App\Models\XpTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Resources\Json\JsonResource;

class XpTransactionController extends Controller
{
    public function index(Request $request)
    {
        $transactions = XpTransaction::where('user_id', Auth::id())->get();
        return JsonResource::collection($transactions);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'amount' => 'required|integer',
            'type' => 'required|string|max:50',
            'description' => 'nullable|string|max:255',
        ]);
        $transaction = XpTransaction::create(array_merge($data, [
            'user_id' => Auth::id(),
        ]));
        return new JsonResource($transaction);
    }

    public function show(XpTransaction $xpTransaction)
    {
        $this->authorize('view', $xpTransaction);
        return new JsonResource($xpTransaction);
    }

    public function update(Request $request, XpTransaction $xpTransaction)
    {
        $this->authorize('update', $xpTransaction);
        $data = $request->validate([
            'amount' => 'sometimes|required|integer',
            'type' => 'sometimes|required|string|max:50',
            'description' => 'nullable|string|max:255',
        ]);
        $xpTransaction->update($data);
        return new JsonResource($xpTransaction->fresh());
    }

    public function destroy(XpTransaction $xpTransaction)
    {
        $this->authorize('delete', $xpTransaction);
        $xpTransaction->delete();
        return response()->noContent();
    }
}
