<?php

namespace App\Entity;

use App\Repository\AccountRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: AccountRepository::class)]
class Account
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'accounts')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\Column(length: 7)]
    private ?string $number = null;

    #[ORM\Column]
    private ?float $balance = null;

    /**
     * @var Collection<int, Credit>
     */
    #[ORM\OneToMany(targetEntity: Credit::class, mappedBy: 'account', orphanRemoval: true)]
    private Collection $credits;

    /**
     * @var Collection<int, Transaction>
     */
    #[ORM\OneToMany(targetEntity: Transaction::class, mappedBy: 'toAccount')]
    private Collection $toTransactions;

    /**
     * @var Collection<int, Transaction>
     */
    #[ORM\OneToMany(targetEntity: Transaction::class, mappedBy: 'fromAccount')]
    private Collection $fromTransactions;

    public function __construct()
    {
        $this->credits = new ArrayCollection();
        $this->toTransactions = new ArrayCollection();
        $this->fromTransactions = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }

    public function getNumber(): ?string
    {
        return $this->number;
    }

    public function setNumber(string $number): static
    {
        $this->number = $number;

        return $this;
    }

    public function getBalance(): ?float
    {
        return $this->balance;
    }

    public function setBalance(float $balance): static
    {
        $this->balance = $balance;

        return $this;
    }

    /**
     * @return Collection<int, Credit>
     */
    public function getCredits(): Collection
    {
        return $this->credits;
    }

    public function addCredit(Credit $credit): static
    {
        if (!$this->credits->contains($credit)) {
            $this->credits->add($credit);
            $credit->setAccount($this);
        }

        return $this;
    }

    public function removeCredit(Credit $credit): static
    {
        if ($this->credits->removeElement($credit)) {
            // set the owning side to null (unless already changed)
            if ($credit->getAccount() === $this) {
                $credit->setAccount(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Transaction>
     */
    public function getToTransactions(): Collection
    {
        return $this->toTransactions;
    }

    public function addToTransaction(Transaction $toTransaction): static
    {
        if (!$this->toTransactions->contains($toTransaction)) {
            $this->toTransactions->add($toTransaction);
            $toTransaction->setToAccount($this);
        }

        return $this;
    }

    public function removeToTransaction(Transaction $toTransaction): static
    {
        if ($this->toTransactions->removeElement($toTransaction)) {
            // set the owning side to null (unless already changed)
            if ($toTransaction->getToAccount() === $this) {
                $toTransaction->setToAccount(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Transaction>
     */
    public function getFromTransactions(): Collection
    {
        return $this->fromTransactions;
    }

    public function addFromTransaction(Transaction $fromTransaction): static
    {
        if (!$this->fromTransactions->contains($fromTransaction)) {
            $this->fromTransactions->add($fromTransaction);
            $fromTransaction->setFromAccount($this);
        }

        return $this;
    }

    public function removeFromTransaction(Transaction $fromTransaction): static
    {
        if ($this->fromTransactions->removeElement($fromTransaction)) {
            // set the owning side to null (unless already changed)
            if ($fromTransaction->getFromAccount() === $this) {
                $fromTransaction->setFromAccount(null);
            }
        }

        return $this;
    }
}
