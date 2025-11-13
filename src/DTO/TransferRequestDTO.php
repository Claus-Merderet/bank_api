<?php
declare(strict_types=1);

namespace App\DTO;

use Symfony\Component\Validator\Constraints as Assert;

class TransferRequestDTO
{
    #[Assert\NotBlank(message: 'From account ID is required')]
    #[Assert\Positive(message: 'From account ID must be positive')]
    public ?int $fromAccountId = null;

    #[Assert\NotBlank(message: 'To account ID is required')]
    #[Assert\Positive(message: 'To account ID must be positive')]
    public ?int $toAccountId = null;

    #[Assert\NotBlank(message: 'Amount is required')]
    #[Assert\Positive(message: 'Amount must be greater than 0')]
    #[Assert\Range(
        notInRangeMessage: 'Amount must be between {{ min }} and {{ max }}',
        min: 500,
        max: 10000
    )]
    public ?float $amount = null;
}
