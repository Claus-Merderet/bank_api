<?php

declare(strict_types=1);

namespace App\Exception\Account;

use App\Exception\AppException;
use Symfony\Component\HttpFoundation\Response;

class AccountNotFoundException extends AppException
{
    public function __construct(int $accountId, ?int $userId = null)
    {
        if ($userId !== null) {
            parent::__construct(sprintf('Account %d not found or does not belong to userId %d', $accountId, $userId), Response::HTTP_NOT_FOUND);
        } else {
            parent::__construct(sprintf('Account with ID %d not found', $accountId), Response::HTTP_NOT_FOUND);
        }
    }
}
