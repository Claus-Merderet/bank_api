<?php

declare(strict_types=1);

namespace App\Exception\Credit;

use App\Exception\AppException;
use Symfony\Component\HttpFoundation\Response;

class CreditAlreadyRepaid extends AppException
{
    public function __construct()
    {
        parent::__construct('The credit has already been repaid', Response::HTTP_CONFLICT);
    }
}
