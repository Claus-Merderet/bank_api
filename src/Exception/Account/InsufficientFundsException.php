<?php

declare(strict_types=1);

namespace App\Exception\Account;

use App\Exception\AppException;
use Symfony\Component\HttpFoundation\Response;

class InsufficientFundsException extends AppException
{
    public function __construct(float $currentBalance, float $requiredAmount)
    {
        $message = sprintf(
            'Insufficient funds. Current balance: %.2f, required: %.2f',
            $currentBalance,
            $requiredAmount
        );
        parent::__construct($message, Response::HTTP_UNPROCESSABLE_ENTITY);
    }
}
