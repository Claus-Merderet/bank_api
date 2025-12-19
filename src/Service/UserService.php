<?php

namespace App\Service;

use App\DTO\RegisterRequestDTO;
use App\DTO\UserListDTO;
use App\Entity\User;
use App\Exception\User\UserAlreadyHaveMaxCountAccountException;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

readonly class UserService
{
    public function __construct(
        private UserRepository $userRepository,
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher,
    ) {
    }

    public function registerUser(RegisterRequestDTO $registerRequestDTO): User
    {
        $user = User::createUserFromRegisterRequestDTO($registerRequestDTO, $this->passwordHasher);
        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }

    public function validateDTO(RegisterRequestDTO $registerUserDTO): void
    {
        if ($this->userRepository->findOneByUsername($registerUserDTO->username)) {
            throw new UserAlreadyHaveMaxCountAccountException($registerUserDTO->username);
        }
    }

    public function deleteUser(User $user): void
    {
        $user->softDeleted(new \DateTime());
        $this->entityManager->persist($user);
        $this->entityManager->flush();
    }

    /**
     * @return UserListDTO[] List of all users with basic info
     */
    public function findAllUsers(): array
    {
        return $this->userRepository->findAllAsDTO();
    }
    public function deleteAllUsersExcept(User $currentUser): int
    {
        $users = $this->userRepository->findAll();
        $deletedCount = 0;

        foreach ($users as $user) {
            if ($user->getId() !== $currentUser->getId()) {
                $user->softDeleted(new \DateTime());
                $deletedCount++;
            }
        }

        $this->entityManager->flush();

        return $deletedCount;
    }
}
