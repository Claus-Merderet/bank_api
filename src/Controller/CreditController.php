<?php

declare(strict_types=1);

namespace App\Controller;

use App\DTO\CreditRepayRequestDTO;
use App\DTO\CreditRequestDTO;
use App\Entity\User;
use App\Enum\UserRole;
use App\Exception\AppException;
use App\Service\CreditService;
use Nelmio\ApiDocBundle\Attribute\Security;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[OA\Tag(name: 'Credit')]
class CreditController extends AbstractController
{
    public function __construct(
        private readonly CreditService $creditService,
    ) {
    }

    #[OA\Post(
        description: 'Запрос на получение кредита на указанный счет. Пользователь может иметь только один активный кредит.',
        summary: 'Запрос на получение кредита',
    )]
    #[OA\Response(
        response: 201,
        description: 'Кредит одобрен',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'accountId', type: 'integer', example: 1),
                new OA\Property(property: 'amount', type: 'number', format: 'float', example: 5000.00),
                new OA\Property(property: 'termMonths', type: 'integer', example: 12),
                new OA\Property(property: 'balance', type: 'number', format: 'float', example: 5000.00),
                new OA\Property(property: 'creditId', type: 'integer', example: 5),
            ]
        )
    )]
    #[OA\Response(
        response: 400,
        description: 'Некорректные данные в запросе',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(
                    property: 'error',
                    type: 'string',
                    enum: [
                        'Invalid credit request',
                        'Amount must be greater than 0',
                        'Term months must be between 1 and 60',
                    ]
                ),
            ]
        )
    )]
    #[OA\Response(
        response: 403,
        description: 'Уже есть активный кредит на этот или другой счет / Нет прав взять кредит',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'error', type: 'string', example: 'Only one active credit allowed per user'),
            ]
        )
    )]
    #[OA\Response(
        response: 404,
        description: 'Указанный id счета не найден',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'error', type: 'string', example: 'Account not found'),
            ]
        )
    )]
    #[OA\Response(
        response: 422,
        description: 'Превышен лимит суммы по кредиту',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'error', type: 'string', example: 'Credit amount cannot exceed '.CreditRequestDTO::MAX_CREDIT_AMOUNT),
            ]
        )
    )]
    #[Security(name: 'Bearer')]
    #[IsGranted(UserRole::ROLE_CREDIT->value, message: 'Forbidden: ROLE_CREDIT access required', statusCode: Response::HTTP_FORBIDDEN)]
    #[Route('/api/credit/request', name: 'credit_request', methods: ['POST'])]
    public function requestCredit(
        #[MapRequestPayload(
            acceptFormat: 'json',
            validationFailedStatusCode: Response::HTTP_BAD_REQUEST,
        )]
        CreditRequestDTO $creditRequestDTO,
        #[CurrentUser]
        User $user
    ): JsonResponse {
        try {
            // TODO тут тоже переделать нормально
            if (in_array('ROLE_ADMIN', $user->getRoles(), true)) {
                return new JsonResponse(['error' => 'Admins cannot request credits'], Response::HTTP_FORBIDDEN);
            }
            $result = $this->creditService->createCreditRequest($creditRequestDTO, $user);

            return new JsonResponse([
                'id' => $result['account']->getId(),
                'amount' => $result['credit']->getAmount(),
                'termMonths' => $result['credit']->getTermMonths(),
                'balance' => $result['account']->getBalance(),
                'creditId' => $result['credit']->getId(),
            ], Response::HTTP_CREATED);
        } catch (AppException $e) {
            return new JsonResponse(['error' => $e->getMessage()], Response::HTTP_NOT_FOUND);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Internal server error', 'message' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[OA\Post(
        description: 'Погашение кредита. Пользователь может погашать только свои кредиты.',
        summary: 'Погашение кредита',
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ['creditId', 'amount'],
            properties: [
                new OA\Property(property: 'creditId', type: 'integer', example: 1),
                new OA\Property(property: 'accountId', type: 'integer', example: 1),
                new OA\Property(property: 'amount', type: 'number', format: 'float', example: 1000.00),
            ]
        )
    )]
    #[OA\Response(
        response: 200,
        description: 'Кредит погашен',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'creditId', type: 'integer', example: 1),
                new OA\Property(property: 'amountDeposited', type: 'number', format: 'float', example: 1000.00),
            ]
        )
    )]
    #[OA\Response(
        response: 400,
        description: 'Неверное тело запроса',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(
                    property: 'error',
                    type: 'string',
                    enum: [
                        'Invalid request body',
                        'Credit ID is required',
                        'Credit ID must be positive',
                        'Amount is required',
                        'Amount must be greater than 0',
                    ]
                ),
            ]
        )
    )]
    #[OA\Response(
        response: 403,
        description: 'Кредит не принадлежит пользователю',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'error', type: 'string', example: 'Access denied for this credit'),
            ]
        )
    )]
    #[OA\Response(
        response: 404,
        description: 'Кредит не найден',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'error', type: 'string', example: 'Credit not found'),
            ]
        )
    )]
    #[OA\Response(
        response: 422,
        description: 'Сумма превышает остаток долга / Суммы недостаточно / Недостаточно средств',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(
                    property: 'error',
                    type: 'string',
                    enum: [
                        'Repayment amount exceeds remaining debt',
                        'The amount is not enough',
                        'Insufficient funds. Current balance: 5000, required: 5500',
                    ]
                ),
            ]
        )
    )]
    #[Security(name: 'Bearer')]
    #[IsGranted(UserRole::ROLE_CREDIT->value, message: 'Forbidden: ROLE_CREDIT access required', statusCode: Response::HTTP_FORBIDDEN)]
    #[Route('/api/credit/repay', name: 'credit_repay', methods: ['POST'])]
    public function repayCredit(
        #[MapRequestPayload(
            acceptFormat: 'json',
            validationFailedStatusCode: Response::HTTP_BAD_REQUEST,
        )]
        CreditRepayRequestDTO $creditRepayDTO,
        #[CurrentUser]
        User $user
    ): JsonResponse {
        try {
            // TODO тут тоже переделать
            if (in_array('ROLE_ADMIN', $user->getRoles(), true)) {
                return new JsonResponse(['error' => 'Admins cannot repay credits'], Response::HTTP_FORBIDDEN);
            }
            $result = $this->creditService->repayCredit($creditRepayDTO, $user);

            return new JsonResponse(['creditId' => $result['credit']->getId(), 'amountDeposited' => $result['amountDeposited']], Response::HTTP_OK);
        } catch (AppException $e) {
            return new JsonResponse(['error' => $e->getMessage()], $e->getCode());
        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Internal server error', 'message' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[OA\Get(
        description: 'Получение истории кредитов текущего пользователя',
        summary: 'История кредитов пользователя',
    )]
    #[OA\Response(
        response: 200,
        description: 'История успешно получена',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'userId', type: 'integer', example: 12),
                new OA\Property(
                    property: 'credits',
                    type: 'array',
                    items: new OA\Items(
                        properties: [
                            new OA\Property(property: 'creditId', type: 'integer', example: 101),
                            new OA\Property(property: 'accountId', type: 'integer', example: 42),
                            new OA\Property(property: 'amount', type: 'number', format: 'float', example: 50000.0),
                            new OA\Property(property: 'termMonths', type: 'integer', example: 12),
                            new OA\Property(property: 'balance', type: 'number', format: 'float', example: 25000.0),
                            new OA\Property(property: 'createdAt', type: 'string', format: 'date-time', example: '2024-01-15 10:30:00'),
                        ]
                    )
                ),
            ]
        )
    )]
    #[OA\Response(
        response: 403,
        description: 'Пользователь не авторизован',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'error', type: 'string', example: 'Access denied'),
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
    #[IsGranted(UserRole::ROLE_CREDIT->value, message: 'Forbidden: ROLE_CREDIT access required', statusCode: Response::HTTP_FORBIDDEN)]
    #[Route('/api/credit/history', name: 'credit_history', methods: ['GET'])]
    public function creditHistory(#[CurrentUser] User $user): JsonResponse
    {
        try {
            $creditHistory = $this->creditService->getUserCreditHistory($user);

            return new JsonResponse([
                'userId' => $creditHistory->userId,
                'credits' => $creditHistory->credits,
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Internal server error', 'message' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
