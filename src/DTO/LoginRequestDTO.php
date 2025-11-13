<?php

declare(strict_types=1);

namespace App\DTO;

use Symfony\Component\Validator\Constraints as Assert;

class LoginRequestDTO
{
    #[Assert\NotBlank]
    public string $username;

    #[Assert\NotBlank]
    public string $password;
}
