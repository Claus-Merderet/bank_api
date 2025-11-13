<?php

namespace App\Entity;

use App\DTO\RegisterRequestDTO;
use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: '`user`')]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['user:create'])]
    private ?int $id = null;

    #[ORM\Column(length: 50)]
    #[Groups(['user:create'])]
    private ?string $username = null;

    #[ORM\Column(length: 255)]
    #[Groups(['user:create'])]
    private ?string $password = null;

    #[ORM\Column(length: 20)]
    #[Groups(['user:create'])]
    private ?string $role = null;

    /**
     * @var Collection<int, Account>
     */
    #[ORM\OneToMany(targetEntity: Account::class, mappedBy: 'user', orphanRemoval: true)]
    private Collection $accounts;

    public function __construct()
    {
        $this->accounts = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUsername(): ?string
    {
        return $this->username;
    }

    public function setUsername(string $username): static
    {
        $this->username = $username;

        return $this;
    }

    public function getPassword(): ?string
    {
        return $this->password;
    }

    public function setPassword(string $password): static
    {
        $this->password = $password;

        return $this;
    }

    public function getRole(): ?string
    {
        return $this->role;
    }

    public function setRole(string $role): static
    {
        $this->role = $role;

        return $this;
    }

    /**
     * @return Collection<int, Account>
     */
    public function getAccounts(): Collection
    {
        return $this->accounts;
    }


    public function getRoles(): array
    {
        return [$this->role];
    }

    public function eraseCredentials(): void
    {
        // TODO: Implement eraseCredentials() method.
    }

    public function getUserIdentifier(): string
    {
        return $this->username;
    }

    public static function createUserFromRegisterRequestDTO(registerRequestDTO $registerRequestDTO, UserPasswordHasherInterface $passwordHasher): self
    {
        $user = new self();
        $user->username = $registerRequestDTO->username;
        $user->password = $passwordHasher->hashPassword($user, $registerRequestDTO->password);
        $user->role = $registerRequestDTO->role;

        return $user;
    }
    public function getAccountById(int $accountId): ?Account
    {
        return $this->accounts->filter(
            fn(Account $account) => $account->getId() === $accountId
        )->first() ?: null;
    }
}
