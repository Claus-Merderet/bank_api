<?php
declare(strict_types=1);

namespace App\DTO;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

class CreditHistoryResponseDTO
{
    public function __construct(
        public int $userId,
        public array $credits
    ) {}
}
