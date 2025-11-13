<?php

declare(strict_types=1);

namespace App\DTO;

class AccountTransactionsResponseDTO
{
    public function __construct(
        public int $id,
        public string $number,
        public float $balance,
        public array $transactions
    ) {
    }
}
