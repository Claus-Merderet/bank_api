<?php

declare(strict_types=1);

namespace App\Exception\Credit;

use App\Exception\AppException;

class CreditLimitException extends AppException
{
    public function __construct(float $maxAmount, bool $isMaxAmountExeption)
    {
        if ($isMaxAmountExeption) {
            parent::__construct(sprintf('Credit amount cannot exceed %.2f', $maxAmount), 422);
        } else {
            parent::__construct(sprintf('Credit amount cannot exceed %.2f', $maxAmount), 422);
        }
    }
}
