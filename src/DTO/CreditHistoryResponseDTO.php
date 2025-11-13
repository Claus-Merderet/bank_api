<?php

declare(strict_types=1);

namespace App\DTO;

class CreditHistoryResponseDTO
{
    public function __construct(
        public int $userId,
        public array $credits
    ) {
    }
}
