<?php

declare(strict_types=1);

namespace App\DTO;

class UserListDTO
{
    public function __construct(
        public int $id,
        public string $username,
        public string $role
    ) {
    }
}
