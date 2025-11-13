<?php
declare(strict_types=1);

namespace App\DTO;

use Symfony\Component\Validator\Constraints as Assert;

class DepositRequestDTO
{
    #[Assert\NotBlank(message: 'Account accountId is required')]
    #[Assert\Positive(message: 'Account accountId must be positive')]
    public ?int $accountId = null;

    #[Assert\NotBlank(message: 'Amount is required')]
    #[Assert\Positive(message: 'Amount must be greater than 0')]
    #[Assert\Range(
        notInRangeMessage: 'Amount must be between {{ min }} and {{ max }}',
        min: 1000,
        max: 9000
    )]
    public ?float $amount = null;
}
