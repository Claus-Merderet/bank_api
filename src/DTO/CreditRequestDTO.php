<?php

declare(strict_types=1);

namespace App\DTO;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

class CreditRequestDTO
{
    public const MAX_CREDIT_AMOUNT = 15000.00;
    public const MIN_CREDIT_AMOUNT = 5000.00;
    public const MIN_TERM_MONTHS = 1;
    public const MAX_TERM_MONTHS = 60;

    public function __construct(
        #[OA\Property(type: 'integer', example: 1)]
        #[Assert\NotBlank(message: 'Account ID is required')]
        #[Assert\Positive(message: 'Account ID must be positive')]
        public int $accountId,
        #[OA\Property(type: 'number', format: 'float', example: 5000.00)]
        #[Assert\NotBlank(message: 'Amount is required')]
        #[Assert\Positive(message: 'Amount must be greater than 0')]
        #[Assert\Range(
            notInRangeMessage: 'Amount must be between {{ min }} and {{ max }}',
            min: self::MIN_CREDIT_AMOUNT,
            max: self::MAX_CREDIT_AMOUNT
        )]
        public float $amount,
        #[OA\Property(type: 'integer', example: 12)]
        #[Assert\NotBlank(message: 'Term months is required')]
        #[Assert\Range(
            notInRangeMessage: 'Term months must be between {{ min }} and {{ max }}',
            min: self::MIN_TERM_MONTHS,
            max: self::MAX_TERM_MONTHS
        )]
        public int $termMonths
    ) {
    }
}
