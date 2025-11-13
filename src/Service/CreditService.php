<?php

declare(strict_types=1);

namespace App\Service;

use App\DTO\CreditHistoryResponseDTO;
use App\DTO\CreditRepayRequestDTO;
use App\DTO\CreditRequestDTO;
use App\Entity\Account;
use App\Entity\Credit;
use App\Entity\Transaction;
use App\Entity\User;
use App\Enum\TransactionType;
use App\Exception\Account\AccountNotFoundException;
use App\Exception\Account\InsufficientFundsException;
use App\Exception\Credit\ActiveCreditExistsException;
use App\Exception\Credit\CreditAlreadyRepaid;
use App\Exception\Credit\CreditNotFoundException;
use App\Exception\Credit\InsufficientRepaymentAmountException;
use App\Exception\Credit\RepaymentAmountExceededException;
use App\Repository\CreditRepository;
use Doctrine\ORM\EntityManagerInterface;

readonly class CreditService
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private AccountService $accountService,
        private CreditRepository $creditRepository,
    ) {
    }

    public function createCreditRequest(CreditRequestDTO $creditRequestDTO, User $user): array
    {
        $account = $this->accountService->findAccountOwnedByUser($creditRequestDTO->accountId, $user);
        $this->checkActiveCredits($user);
        $credit = $this->createCredit($account, $creditRequestDTO->amount, $creditRequestDTO->termMonths);
        $this->accountService->deposit($creditRequestDTO->accountId, $creditRequestDTO->amount, $user, TransactionType::CREDIT_ISSUANCE);

        return [
            'account' => $account,
            'credit' => $credit,
        ];
    }

    private function checkActiveCredits(User $user): void
    {
        if (count($this->creditRepository->findActiveCreditsByUser($user)) > 0) {
            throw new ActiveCreditExistsException();
        }
    }

    private function createCredit(Account $account, float $amount, int $termMonths): Credit
    {
        $credit = Credit::createCredit($account, $amount, $termMonths);
        $this->entityManager->persist($credit);
        $this->entityManager->flush();

        return $credit;
    }

    /**
     * @throws RepaymentAmountExceededException
     * @throws \Doctrine\DBAL\Exception
     */
    public function repayCredit(CreditRepayRequestDTO $creditRepayDTO, User $user): array
    {
        $credit = $this->validateRepayCredit($creditRepayDTO, $user);
        $this->entityManager->getConnection()->beginTransaction();

        try {
            $account = $credit->getAccount();
            $account->setBalance($account->getBalance() - $creditRepayDTO->amount);
            $credit->setBalance($credit->getBalance() + $creditRepayDTO->amount);
            $transaction = Transaction::createTransaction(
                amount: $creditRepayDTO->amount,
                transactionType: TransactionType::CREDIT_REPAYMENT,
                fromAccount: $account,
                credit: $credit,
            );

            $this->entityManager->persist($transaction);
            $this->entityManager->flush();
            $this->entityManager->getConnection()->commit();

            return [
                'credit' => $credit,
                'amountDeposited' => $creditRepayDTO->amount,
            ];
        } catch (\Exception $e) {
            $this->entityManager->getConnection()->rollBack();

            throw $e;
        }
    }

    public function validateRepayCredit(CreditRepayRequestDTO $creditRepayDTO, User $user): Credit
    {
        $account = $user->getAccountById($creditRepayDTO->accountId);
        if ($account === null) {
            throw new AccountNotFoundException($creditRepayDTO->accountId, $user->getId());
        }
        if ($account->getBalance() < $creditRepayDTO->amount) {
            throw new InsufficientFundsException($account->getBalance(), $creditRepayDTO->amount);
        }
        $credit = $this->creditRepository->findOneBy(['id' => $creditRepayDTO->creditId, 'account' => $account]);
        if (!$credit) {
            throw new CreditNotFoundException($creditRepayDTO->creditId);
        }
        if (abs($credit->getBalance()) <= 0.0) {
            throw new CreditAlreadyRepaid();
        }
        if ($creditRepayDTO->amount > abs($credit->getBalance())) {
            throw new RepaymentAmountExceededException();
        }
        if ($creditRepayDTO->amount !== abs($credit->getBalance())) {
            throw new InsufficientRepaymentAmountException($credit->getBalance());
        }

        return $credit;
    }

    public function getUserCreditHistory(User $user): CreditHistoryResponseDTO
    {
        $credits = $this->creditRepository->findUserCredits($user);
        $formattedCredits = array_map(fn (Credit $credit) => [
            'creditId' => $credit->getId(),
            'accountId' => $credit->getAccount()->getId(),
            'amount' => $credit->getAmount(),
            'termMonths' => $credit->getTermMonths(),
            'balance' => $credit->getBalance(),
            'createdAt' => $credit->getCreatedAt()->format('Y-m-d H:i:s'),
        ], $credits);

        return new CreditHistoryResponseDTO($user->getId(), $formattedCredits);
    }
}
