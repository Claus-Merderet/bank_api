<?php

declare(strict_types=1);

namespace App\DTO;

use Symfony\Component\Validator\Constraints as Assert;

class RegisterRequestDTO
{
    #[Assert\NotBlank(message: 'Username cannot be blank')]
    #[Assert\Length(
        min: 3,
        max: 15,
        minMessage: 'Username must be at least {{ limit }} characters long',
        maxMessage: 'Username cannot be longer than {{ limit }} characters'
    )]
    #[Assert\Regex(
        pattern: '/^[a-zA-Z0-9]+$/',
        message: 'Username can only contain Latin letters and numbers'
    )]
    public ?string $username = null;

    #[Assert\NotBlank(message: 'Password cannot be blank')]
    #[Assert\Length(
        min: 8,
        minMessage: 'Password must be at least {{ limit }} characters long'
    )]
    #[Assert\Regex(
        pattern: '/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]+$/',
        message: 'Password can only contain Latin letters, numbers and special characters'
    )]
    #[Assert\Regex(
        pattern: '/[A-Z]/',
        message: 'Password must contain at least one uppercase letter'
    )]
    #[Assert\Regex(
        pattern: '/[a-z]/',
        message: 'Password must contain at least one lowercase letter'
    )]
    #[Assert\Regex(
        pattern: '/[0-9]/',
        message: 'Password must contain at least one number'
    )]
    #[Assert\Regex(
        pattern: '/[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]/',
        message: 'Password must contain at least one special character'
    )]
    public ?string $password = null;

    #[Assert\NotBlank(message: 'Role cannot be blank')]
    #[Assert\Choice(
        choices: ['ROLE_USER', 'ROLE_ADMIN', 'ROLE_CREDIT_SECRET'],
        message: 'The role must be: ROLE_USER or ROLE_ADMIN'
    )]
    public string $role;
}
