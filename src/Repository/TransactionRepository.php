<?php

namespace App\Repository;

use App\Entity\Account;
use App\Entity\Transaction;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Transaction>
 */
class TransactionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Transaction::class);
    }

    public function findTransactionsWithTypesByAccount(Account $account): array
    {
        $conn = $this->getEntityManager()->getConnection();

        $sql = <<<SQL
                SELECT
                    t.id as "transactionId",
                    CASE
                        WHEN t.to_account_id = :accountId AND t.transaction_type = 'transfer' THEN 'transfer_in'
                        WHEN t.from_account_id = :accountId AND t.transaction_type = 'transfer' THEN 'transfer_out'
                        ELSE t.transaction_type
                    END as "type",
                    CASE
                        WHEN t.from_account_id = :accountId THEN -t.amount
                        ELSE t.amount
                    END as "amount",
                    t.from_account_id as "fromAccountId",
                    t.to_account_id as "toAccountId",
                    t.created_at as "createdAt",
                    t.credit_id as "creditId"
                FROM transaction t
                WHERE t.to_account_id = :accountId OR t.from_account_id = :accountId
                ORDER BY t.created_at DESC, t.id DESC
            SQL;

        $stmt = $conn->prepare($sql);
        $result = $stmt->executeQuery([
            'accountId' => $account->getId(),
        ]);

        return $result->fetchAllAssociative();
    }
}
