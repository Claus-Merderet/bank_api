<?php

namespace App\Repository;

use App\Entity\Credit;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Credit>
 */
class CreditRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Credit::class);
    }

    /**
     * Находит активный кредит по пользователю у которых баланс > 0).
     *
     * @return Credit[]|array Массив кредитов или пустой массив, если активных кредитов нет
     */
    public function findActiveCreditsByUser(User $user): array
    {
        return $this->createQueryBuilder('c')
            ->join('c.account', 'a')
            ->where('a.user = :user')
            ->andWhere('c.balance < 0')
            ->setParameter('user', $user)
            ->getQuery()
            ->getResult();
    }

    /**
     * Находит все кредиты пользователя.
     *
     * @return Credit[]
     */
    public function findUserCredits(User $user): array
    {
        return $this->createQueryBuilder('c')
            ->join('c.account', 'a')
            ->where('a.user = :user')
            ->orderBy('c.createdAt', 'DESC')
            ->setParameter('user', $user)
            ->getQuery()
            ->getResult();
    }
}
