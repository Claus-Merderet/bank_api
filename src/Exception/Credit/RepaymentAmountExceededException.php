<?php
declare(strict_types=1);

namespace App\Exception\Credit;

use App\Exception\AppException;
use Symfony\Component\HttpFoundation\Response;

class RepaymentAmountExceededException extends AppException
{
    public function __construct()
    {
        parent::__construct('Repayment amount exceeds remaining debt', Response::HTTP_UNPROCESSABLE_ENTITY);
    }
}
