<?php

namespace App\Service;

use App\DTO\AccountTransactionsResponseDTO;
use App\Entity\Account;
use App\Entity\Transaction;
use App\Entity\User;
use App\Enum\TransactionType;
use App\Exception\Account\AccountNotFoundException;
use App\Exception\Account\InsufficientFundsException;
use App\Exception\User\UserAlreadyHaveMaxCountAccountException;
use Doctrine\ORM\EntityManagerInterface;

readonly class AccountService
{
    public function __construct(
        private EntityManagerInterface $entityManager,
    ) {
    }

    public function validateCountAccountForUser(User $user): void
    {
        if ($this->entityManager->getRepository(Account::class)->count(['user' => $user]) >= 2) {
            throw new UserAlreadyHaveMaxCountAccountException();
        }
    }

    public function findAccountOwnedByUser(int $accountId, User $user): Account
    {
        $toAccount = $this->entityManager->getRepository(Account::class)->findOneBy(['id' => $accountId, 'user' => $user]);
        if ($toAccount === null) {
            throw new AccountNotFoundException($accountId, $user->getId());
        }

        return $toAccount;
    }

    public function deposit(int $accountId, float $amount, User $currentUser, TransactionType $transactionType): Account
    {
        $toAccount = $this->findAccountOwnedByUser($accountId, $currentUser);
        $toAccount->setBalance($toAccount->getBalance() + $amount);
        $outgoingTransaction = Transaction::createTransaction($amount, $transactionType, $toAccount);
        $this->entityManager->persist($outgoingTransaction);
        $this->entityManager->flush();

        return $toAccount;
    }

    public function transfer(int $fromAccountId, int $toAccountId, float $amount, User $currentUser): array
    {
        $fromAccount = $this->findAccountOwnedByUser($fromAccountId, $currentUser);
        $toAccount = $this->entityManager->getRepository(Account::class)->find($toAccountId);
        if ($toAccount === null) {
            throw new AccountNotFoundException($toAccountId);
        }

        if ($fromAccount->getId() === $toAccount->getId()) {
            throw new \InvalidArgumentException('Cannot transfer to the same account');
        }

        $fromBalance = $fromAccount->getBalance();
        if ($fromBalance < $amount) {
            throw new InsufficientFundsException($fromBalance, $amount);
        }

        $this->entityManager->getConnection()->beginTransaction();

        try {
            $fromAccount->setBalance($fromBalance - $amount);
            $toBalance = (float) $toAccount->getBalance();
            $toAccount->setBalance($toBalance + $amount);
            $transaction = Transaction::createTransaction($amount, TransactionType::TRANSFER, $toAccount, $fromAccount);

            $this->entityManager->persist($transaction);
            $this->entityManager->flush();
            $this->entityManager->getConnection()->commit();

            return [
                'fromAccount' => $fromAccount,
                'toAccount' => $toAccount,
            ];
        } catch (\Exception $e) {
            $this->entityManager->getConnection()->rollBack();

            throw $e;
        }
    }

    public function creatAccount(User $user): ?Account
    {
        $maxRetries = 5;
        $retryCount = 0;
        while ($retryCount < $maxRetries) {
            try {
                $account = new Account();
                $account->setUser($user);
                $account->setNumber($this->generateUniqueAccountNumber());
                $account->setBalance('0.00');

                $this->entityManager->persist($account);
                $this->entityManager->flush();

                return $account;
            } catch (\Doctrine\DBAL\Exception\UniqueConstraintViolationException $e) {
                ++$retryCount;
                if ($retryCount === $maxRetries) {
                    throw new \RuntimeException('Failed to generate unique account number after '.$maxRetries.' attempts');
                }
            }
        }

        return null;
    }

    public function getAccountTransactions(int $accountId, User $currentUser): AccountTransactionsResponseDTO
    {
        $account = $this->findAccountOwnedByUser($accountId, $currentUser);
        $formattedTransactions = $this->entityManager->getRepository(Transaction::class)->findTransactionsWithTypesByAccount($account);

        return new AccountTransactionsResponseDTO(
            $account->getId(),
            $account->getNumber(),
            (float) $account->getBalance(),
            $formattedTransactions
        );
    }

    private function generateUniqueAccountNumber(): string
    {
        return sprintf('%07d', random_int(1000000, 9999999));
    }
}
