<?php
declare(strict_types=1);

namespace App\Exception\User;

use App\Exception\AppException;
use Symfony\Component\HttpFoundation\Response;

class UserAlreadyHaveMaxCountAccountException extends AppException
{
    public function __construct()
    {
        parent::__construct('User already has maximum number of accounts(2)',Response::HTTP_CONFLICT);
    }
}
