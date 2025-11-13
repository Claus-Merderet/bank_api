<?php
declare(strict_types=1);

namespace App\Exception\Credit;

use App\Exception\AppException;
use Symfony\Component\HttpFoundation\Response;

class InsufficientRepaymentAmountException extends AppException
{
    public function __construct($creditBalance)
    {
        parent::__construct('The amount is not enough. Credit balance: ' . $creditBalance, Response::HTTP_UNPROCESSABLE_ENTITY);
    }
}
