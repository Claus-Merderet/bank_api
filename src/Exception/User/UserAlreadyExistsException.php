<?php
declare(strict_types=1);

namespace App\Exception\User;

use App\Exception\AppException;
use RuntimeException;

class UserAlreadyExistsException extends AppException
{
    public function __construct(string $username)
    {
        parent::__construct("User with username '{$username}' already exists");
    }
}
