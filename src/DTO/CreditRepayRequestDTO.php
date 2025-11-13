<?php

declare(strict_types=1);

namespace App\DTO;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

class CreditRepayRequestDTO
{
    public function __construct(
        #[OA\Property(type: 'integer', example: 1)]
        #[Assert\NotBlank(message: 'Credit ID is required')]
        #[Assert\Positive(message: 'Credit ID must be positive')]
        public int $creditId,
        #[OA\Property(type: 'integer', example: 1)]
        #[Assert\NotBlank(message: 'Account ID is required')]
        #[Assert\Positive(message: 'Account ID must be positive')]
        public int $accountId,
        #[OA\Property(type: 'number', format: 'float', example: 1000.00)]
        #[Assert\NotBlank(message: 'Amount is required')]
        #[Assert\Positive(message: 'Amount must be greater than 0')]
        public float $amount
    ) {
    }
}
