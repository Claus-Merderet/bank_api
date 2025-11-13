<?php

namespace App\Repository;

use App\DTO\UserListDTO;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\User\UserProviderInterface;

/**
 * @extends ServiceEntityRepository<User>
 */
class UserRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    public function findOneByUsername(string $username): User|null
    {
        return $this->findOneBy(['username' => $username]);
    }

    /**
     * Get all users as DTO objects with selected fields
     *
     * @return UserListDTO[] Array of UserListDTO objects
     */
    public function findAllAsDTO(): array
    {
        return $this->createQueryBuilder('u')
            ->select('NEW App\DTO\UserListDTO(u.id, u.username, u.role)')
            ->orderBy('u.id', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
