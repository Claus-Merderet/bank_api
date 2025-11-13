<?php
declare(strict_types=1);

namespace App\Enum;

enum TransactionType: string
{
    case DEPOSIT = 'deposit';
    case TRANSFER = 'transfer';
    case CREDIT_ISSUANCE = 'credit_issuance';
    case CREDIT_REPAYMENT = 'credit_repayment';
}
