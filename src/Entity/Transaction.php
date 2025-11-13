<?php

namespace App\Entity;

use App\Enum\TransactionType;
use App\Repository\TransactionRepository;
use DateTime;
use DateTimeInterface;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: TransactionRepository::class)]
class Transaction
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'toTransactions')]
    #[ORM\JoinColumn(name: 'to_account_id', nullable: true)]
    private ?Account $toAccount = null;

    #[ORM\Column]
    private ?float $amount = null;

    #[ORM\ManyToOne(inversedBy: 'fromTransactions')]
    #[ORM\JoinColumn(name: 'from_account_id', nullable: true)]
    private ?Account $fromAccount = null;
    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true)]
    private ?Credit $credit = null;

    #[ORM\Column(length: 20, enumType: TransactionType::class)]
    private ?TransactionType $transactionType = null;
    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private DateTimeInterface $createdAt;

    public function __construct()
    {
        $this->createdAt = new DateTime();
    }

    public function getCreatedAt(): DateTimeInterface
    {
        return $this->createdAt;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getToAccount(): ?Account
    {
        return $this->toAccount;
    }

    public function setToAccount(?Account $toAccount): static
    {
        $this->toAccount = $toAccount;

        return $this;
    }

    public function getAmount(): ?float
    {
        return $this->amount;
    }

    public function setAmount(float $amount): static
    {
        $this->amount = $amount;

        return $this;
    }

    public function getFromAccount(): ?Account
    {
        return $this->fromAccount;
    }

    public function setFromAccount(?Account $fromAccount): static
    {
        $this->fromAccount = $fromAccount;

        return $this;
    }
    public function getCredit(): ?Credit
    {
        return $this->credit;
    }

    public function setCredit(?Credit $credit): static
    {
        $this->credit = $credit;

        return $this;
    }

    public function getTransactionType(): ?TransactionType
    {
        return $this->transactionType;
    }

    public function setTransactionType(TransactionType $transactionType): static
    {
        $this->transactionType = $transactionType;

        return $this;
    }

    public static function createTransaction(
        float $amount,
        TransactionType $transactionType,
        ?Account $toAccount = null,
        ?Account $fromAccount = null,
        ?Credit $credit = null
    ): Transaction
    {
        $transaction = new self();
        $transaction->amount = $amount;
        $transaction->transactionType = $transactionType;
        if ($toAccount !== null){
            $transaction->toAccount = $toAccount;
        }
        if ($fromAccount !== null){
            $transaction->fromAccount = $fromAccount;
        }
        if ($credit !== null){
            $transaction->credit = $credit;
        }

        return $transaction;
    }
}
