<?php

declare(strict_types=1);

namespace App\Exception\Credit;

use App\Exception\AppException;
use Symfony\Component\HttpFoundation\Response;

class CreditNotFoundException extends AppException
{
    public function __construct(int $creditId)
    {
        parent::__construct(sprintf('Credit with ID %d was not found or does not belong to the user', $creditId), Response::HTTP_NOT_FOUND);
    }
}
