<?php

namespace App\Controller;

use App\DTO\DepositRequestDTO;
use App\DTO\TransferRequestDTO;
use App\Entity\User;
use App\Enum\TransactionType;
use App\Exception\AppException;
use App\Service\AccountService;
use Nelmio\ApiDocBundle\Attribute\Security;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Finder\Exception\AccessDeniedException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[OA\Tag(name: 'Accounts')]
class AccountController extends AbstractController
{
    public function __construct(
        private readonly AccountService $accountService,
    ) {
    }

    #[OA\Post(
        description: 'Создает новый банковский счет для текущего пользователя (максимум 2 счета)',
        summary: 'Создание банковского счета',
    )]
    #[OA\Response(
        response: 201,
        description: 'Аккаунт успешно создан',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'id', type: 'integer', example: 1),
                new OA\Property(property: 'number', type: 'string', example: '1234567'),
                new OA\Property(property: 'balance', type: 'number', format: 'float', example: 0.0),
            ]
        )
    )]
    #[OA\Response(
        response: 403,
        description: 'Пользователь не имеет прав создавать счет',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'error', type: 'string', example: 'Admins cannot create bank accounts'),
            ]
        )
    )]
    #[OA\Response(
        response: 409,
        description: 'Пользователь уже имеет максимальное число аккаунтов (2)',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'error', type: 'string', example: 'User already has maximum number of accounts'),
            ]
        )
    )]
    #[OA\Response(
        response: 500,
        description: 'Сервер недоступен',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'error', type: 'string', example: 'Internal server error'),
            ]
        )
    )]
    #[Security(name: 'Bearer')]
    #[IsGranted('IS_AUTHENTICATED_FULLY', message: 'Unauthorized', statusCode: Response::HTTP_UNAUTHORIZED)]
    #[Route('/api/account/create', name: 'account_create', methods: ['POST'])]
    public function createAccount(#[CurrentUser] User $user): JsonResponse
    {
        try {
            if (in_array('ROLE_ADMIN', $user->getRoles(), true)) {
                return new JsonResponse(['error' => 'Admins cannot create bank accounts'], Response::HTTP_FORBIDDEN);
            }
            $this->accountService->validateCountAccountForUser($user);
            $account = $this->accountService->creatAccount($user);

            return new JsonResponse([
                'id' => $account->getId(),
                'number' => $account->getNumber(),
                'balance' => $account->getBalance(),
            ], Response::HTTP_CREATED);
        } catch (AppException $e) {
            return new JsonResponse(['error' => $e->getMessage()], $e->getCode());
        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Internal server error', 'message' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[OA\Post(
        description: 'Пополняет баланс указанного счета. Только владелец счета может пополнять его.',
        summary: 'Пополнение счета',
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ['accountId', 'amount'],
            properties: [
                new OA\Property(property: 'accountId', type: 'integer', example: 1),
                new OA\Property(property: 'amount', type: 'number', format: 'float', example: 1000.50),
            ]
        )
    )]
    #[OA\Response(
        response: 200,
        description: 'Сумма зачислена',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'id', type: 'integer', example: 1),
                new OA\Property(property: 'balance', type: 'number', format: 'float', example: 1500.75),
            ]
        )
    )]
    #[OA\Response(
        response: 400,
        description: 'Некорректное тело запроса',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(
                    property: 'error',
                    type: 'string',
                    enum: [
                        'Amount is required',
                        'Amount must be greater than 0',
                        'Amount cannot exceed 1,000,000',
                        'Account accountId is required',
                        'Account accountId must be positive',
                    ]
                ),
            ]
        )
    )]
    #[OA\Response(
        response: 401,
        description: 'Пользователь не авторизован',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'error', type: 'string', example: 'JWT Token not found'),
                new OA\Property(property: 'code', type: 'string', example: '401'),
            ]
        )
    )]
    #[OA\Response(
        response: 403,
        description: 'У пользователя нет прав для осуществления операции',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'error', type: 'string', example: 'Admins cannot deposit'),
            ]
        ),
    )]
    #[OA\Response(
        response: 404,
        description: 'Счет с указанным id не найден',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'error', type: 'string', example: 'Account (1) not found or does not belong to userId (24)'),
            ]
        )
    )]
    #[OA\Response(
        response: 500,
        description: 'Сервер недоступен',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'error', type: 'string', example: 'Internal server error'),
            ]
        )
    )]
    #[Security(name: 'Bearer')]
    #[IsGranted('IS_AUTHENTICATED_FULLY', message: 'Unauthorized', statusCode: Response::HTTP_UNAUTHORIZED)]
    #[Route('/api/account/deposit', name: 'account_deposit', methods: ['POST'])]
    public function deposit(
        #[MapRequestPayload(
            acceptFormat: 'json',
            validationFailedStatusCode: Response::HTTP_BAD_REQUEST,
        )]
        DepositRequestDTO $depositRequestDTO,
        #[CurrentUser]
        User $user
    ): JsonResponse {
        try {
            // TODO переделать нормально здесь и выше и потом еще похоже ниже
            if (in_array('ROLE_ADMIN', $user->getRoles(), true)) {
                return new JsonResponse(['error' => 'Admins cannot deposit'], Response::HTTP_FORBIDDEN);
            }
            $account = $this->accountService->deposit($depositRequestDTO->accountId, $depositRequestDTO->amount, $user, TransactionType::DEPOSIT);

            return new JsonResponse(['id' => $account->getId(), 'balance' => $account->getBalance()], Response::HTTP_OK);
        } catch (AppException $e) {
            return new JsonResponse(['error' => $e->getMessage()], $e->getCode());
        } catch (AccessDeniedException $e) {
            return new JsonResponse(['error' => $e->getMessage()], $e->getCode());
        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Internal server error', 'message' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[OA\Post(
        description: 'Переводит деньги с одного счета на другой. Отправитель должен быть владельцем счета списания.',
        summary: 'Перевод между счетами',
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ['fromAccountId', 'toAccountId', 'amount'],
            properties: [
                new OA\Property(property: 'fromAccountId', type: 'integer', example: 1),
                new OA\Property(property: 'toAccountId', type: 'integer', example: 2),
                new OA\Property(property: 'amount', type: 'number', format: 'float', example: 500.75),
            ]
        )
    )]
    #[OA\Response(
        response: 200,
        description: 'Успешный перевод',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'fromAccountId', type: 'integer', example: 1),
                new OA\Property(property: 'toAccountId', type: 'integer', example: 2),
                new OA\Property(property: 'fromAccountIdBalance', type: 'number', format: 'float', example: 1500.75),
            ]
        )
    )]
    #[OA\Response(
        response: 400,
        description: 'Некорректное тело запроса',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(
                    property: 'error',
                    type: 'string',
                    enum: [
                        'Invalid request body',
                        'From account ID is required',
                        'From account ID must be positive',
                        'To account ID is required',
                        'To account ID must be positive',
                        'Amount is required',
                        'Amount must be greater than 0',
                        'Amount cannot exceed 1,000,000',
                    ]
                ),
            ]
        )
    )]
    #[OA\Response(
        response: 401,
        description: 'Пользователь не авторизован',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'error', type: 'string', example: 'JWT Token not found'),
                new OA\Property(property: 'code', type: 'string', example: '401'),
            ]
        )
    )]
    #[OA\Response(
        response: 403,
        description: 'У пользователя нет прав для осуществления операции',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'error', type: 'string', example: 'Admins cannot deposit'),
            ]
        ),
    )]
    #[OA\Response(
        response: 404,
        description: 'Один из счетов не существует',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(
                    property: 'error',
                    type: 'string',
                    enum: [
                        'Account with ID 9 not found',
                        'Account 9 not found or does not belong to userId 1',
                    ]
                ),
            ]
        )
    )]
    #[OA\Response(
        response: 422,
        description: 'Недостаточно средств или сумма перевода превышена',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'error', type: 'string', example: 'Insufficient funds. Current balance: 95.00, required: 100000.00'),
            ]
        )
    )]
    #[OA\Response(
        response: 500,
        description: 'Сервер недоступен',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'error', type: 'string', example: 'Internal server error'),
            ]
        )
    )]
    #[Security(name: 'Bearer')]
    #[Route('/api/account/transfer', name: 'account_transfer', methods: ['POST'])]
    public function transfer(
        #[MapRequestPayload(
            acceptFormat: 'json',
            validationFailedStatusCode: Response::HTTP_BAD_REQUEST,
        )]
        TransferRequestDTO $transferRequestDTO,
        #[CurrentUser]
        User $user
    ): JsonResponse {
        try {
            if (\in_array('ROLE_ADMIN', $user->getRoles(), true)) {
                return new JsonResponse(['error' => 'Admins cannot deposit'], Response::HTTP_FORBIDDEN);
            }
            $result = $this->accountService->transfer(
                $transferRequestDTO->fromAccountId,
                $transferRequestDTO->toAccountId,
                $transferRequestDTO->amount,
                $user
            );

            return new JsonResponse([
                'fromAccountId' => $result['fromAccount']->getId(),
                'toAccountId' => $result['toAccount']->getId(),
                'fromAccountIdBalance' => $result['fromAccount']->getBalance(),
            ], Response::HTTP_OK);
        } catch (AppException $e) {
            return new JsonResponse(['error' => $e->getMessage()], $e->getCode());
        } catch (\InvalidArgumentException $e) {
            return new JsonResponse(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Internal server error', 'message' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[OA\Get(
        description: 'Получает историю транзакций для указанного счета. Только владелец счета может просматривать его историю.',
        summary: 'Получение истории транзакций счета',
    )]
    #[OA\Parameter(
        name: 'id',
        description: 'ID счета',
        in: 'path',
        required: true,
        schema: new OA\Schema(type: 'integer', example: 1)
    )]
    #[OA\Response(
        response: 200,
        description: 'История транзакций успешно получена',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'id', type: 'integer', example: 42),
                new OA\Property(property: 'number', type: 'string', example: '4524538'),
                new OA\Property(property: 'balance', type: 'number', format: 'float', example: 1250.75),
                new OA\Property(
                    property: 'transactions',
                    type: 'array',
                    items: new OA\Items(
                        properties: [
                            new OA\Property(property: 'transactionId', type: 'integer', example: 101),
                            new OA\Property(property: 'type', type: 'string', example: 'deposit'),
                            new OA\Property(property: 'amount', type: 'number', format: 'float', example: 500.00),
                            new OA\Property(property: 'fromAccountId', type: 'integer', example: 58),
                            new OA\Property(property: 'toAccountId', type: 'integer', example: 87),
                            new OA\Property(property: 'createdAt', type: 'string', example: '2025-11-09 20:58:09'),
                        ]
                    )
                ),
            ]
        )
    )]
    #[OA\Response(
        response: 400,
        description: 'Неверный формат ID',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'error', type: 'string', example: 'Invalid account ID format'),
            ]
        )
    )]
    #[OA\Response(
        response: 401,
        description: 'Пользователь не авторизован',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'error', type: 'string', example: 'JWT Token not found'),
                new OA\Property(property: 'code', type: 'string', example: '401'),
            ]
        )
    )]
    #[OA\Response(
        response: 404,
        description: 'Аккаунт с указанным id не найден или не принадлежит пользователю',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'error', type: 'string', example: 'Account 3 not found or does not belong to userId 3'),
            ]
        )
    )]
    #[OA\Response(
        response: 500,
        description: 'Сервер недоступен',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'error', type: 'string', example: 'Internal server error'),
            ]
        )
    )]
    #[Security(name: 'Bearer')]
    #[IsGranted('IS_AUTHENTICATED_FULLY', message: 'Unauthorized', statusCode: Response::HTTP_UNAUTHORIZED)]
    #[Route('/api/account/transactions/{id}', name: 'account_transactions', methods: ['GET'])]
    public function getAccountTransactions(int $id, #[CurrentUser] User $user): JsonResponse
    {
        try {
            if ($id <= 0) {
                return new JsonResponse(['error' => 'Invalid account ID format'], Response::HTTP_BAD_REQUEST);
            }

            $accountTransactions = $this->accountService->getAccountTransactions($id, $user);

            return new JsonResponse([
                'id' => $accountTransactions->id,
                'number' => $accountTransactions->number,
                'balance' => $accountTransactions->balance,
                'transactions' => $accountTransactions->transactions,
            ], Response::HTTP_OK);
        } catch (AppException $e) {
            return new JsonResponse(['error' => $e->getMessage()], $e->getCode());
        } catch (AccessDeniedException $e) {
            return new JsonResponse(['error' => $e->getMessage()], Response::HTTP_FORBIDDEN);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Internal server error', 'message' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
