<?php

namespace App\Enum;

enum UserRole: string
{
    case USER = 'ROLE_USER';
    case ADMIN = 'ROLE_ADMIN';
    case ROLE_CREDIT = 'ROLE_CREDIT';

    public static function values(): array
    {
        return array_map(fn ($case) => $case->value, self::cases());
    }

    public static function isValid(string $role): bool
    {
        return in_array($role, self::values());
    }
}
