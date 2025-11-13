<?php

declare(strict_types=1);

namespace App\Exception\Credit;

use App\Exception\AppException;
use Symfony\Component\HttpFoundation\Response;

class ActiveCreditExistsException extends AppException
{
    public function __construct()
    {
        parent::__construct('Only one active credit allowed per user', Response::HTTP_FORBIDDEN);
    }
}
