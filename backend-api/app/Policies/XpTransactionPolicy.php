<?php

namespace App\Policies;

use App\Models\User;
use App\Models\XpTransaction;

class XpTransactionPolicy
{
    public function view(User $user, XpTransaction $xpTransaction)
    {
        return $xpTransaction->user_id === $user->id;
    }

    public function update(User $user, XpTransaction $xpTransaction)
    {
        return $xpTransaction->user_id === $user->id;
    }

    public function delete(User $user, XpTransaction $xpTransaction)
    {
        return $xpTransaction->user_id === $user->id;
    }
}
