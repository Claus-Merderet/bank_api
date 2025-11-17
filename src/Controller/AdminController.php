<?php

declare(strict_types=1);

namespace App\Controller;

use App\DTO\RegisterRequestDTO;
use App\Entity\User;
use App\Exception\AppException;
use App\Service\UserService;
use Nelmio\ApiDocBundle\Attribute\Security;
use OpenApi\Attributes as OA;
use Symfony\Bridge\Doctrine\Attribute\MapEntity;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Serializer\SerializerInterface;

#[OA\Tag(name: 'Admin')]
class AdminController extends AbstractController
{
    public function __construct(
        private readonly UserService         $userService,
        private readonly SerializerInterface $serializer,
    )
    {
    }

    #[OA\Post(summary: 'Создание нового пользователя')]
    #[Security(name: 'Bearer')]
    #[IsGranted('IS_AUTHENTICATED_FULLY', message: 'Unauthorized', statusCode: Response::HTTP_UNAUTHORIZED)]
    #[IsGranted('ROLE_ADMIN', message: 'Forbidden: Admin access required', statusCode: Response::HTTP_FORBIDDEN)]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ['username', 'password', 'role'],
            properties: [
                new OA\Property(property: 'username', type: 'string', example: 'Max'),
                new OA\Property(property: 'password', type: 'string', example: 'Pas!sw0rd'),
                new OA\Property(
                    property: 'role',
                    type: 'string',
                    enum: ['ROLE_USER', 'ROLE_ADMIN', 'ROLE_CREDIT'],
                    example: 'ROLE_USER'
                ),
            ]
        )
    )]
    #[OA\Response(
        response: Response::HTTP_BAD_REQUEST,
        description: 'Некорректный или не полный запрос',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'error', type: 'string', example: 'Validation failed'),
            ]
        )
    )]
    #[OA\Response(
        response: 401,
        description: 'Отсутствует или недействителен токен',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'error', type: 'string', example: 'Unauthorized'),
            ]
        )
    )]
    #[OA\Response(
        response: 403,
        description: 'Пользователь авторизован, но не админ',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'error', type: 'string', example: 'Forbidden: Admin access required'),
            ]
        )
    )]
    #[OA\Response(
        response: Response::HTTP_CONFLICT,
        description: 'Пользователь с таким именем уже существует',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'error', type: 'string', example: 'User already exists'),
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
    #[Route('/api/admin/create', name: 'admin_create_user', methods: ['POST'])]
    public function register(
        #[MapRequestPayload(
            acceptFormat: 'json',
            validationFailedStatusCode: Response::HTTP_BAD_REQUEST,
        )]
        RegisterRequestDTO $registerRequestDTO,
    ): JsonResponse
    {
        try {
            $this->userService->validateDTO($registerRequestDTO);
            $user = $this->userService->registerUser($registerRequestDTO);
            $userData = $this->serializer->normalize($user, null, ['groups' => 'user:create']);

            return new JsonResponse($userData, Response::HTTP_OK);
        } catch (AppException $e) {
            return new JsonResponse(['error' => $e->getMessage()], $e->getCode());
        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Internal server error', 'message' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[OA\Get(summary: 'Получить список всех пользователей')]
    #[OA\Response(
        response: 200,
        description: 'Список пользователей успешно получен',
        content: new OA\JsonContent(
            type: 'array',
            items: new OA\Items(
                properties: [
                    new OA\Property(property: 'id', type: 'integer', example: 1),
                    new OA\Property(property: 'username', type: 'string', example: 'john_doe'),
                    new OA\Property(property: 'role', type: 'string', example: 'ROLE_USER'),
                ]
            )
        )
    )]
    #[OA\Response(
        response: 401,
        description: 'Отсутствует или недействителен токен',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'error', type: 'string', example: 'Unauthorized'),
            ]
        )
    )]
    #[OA\Response(
        response: 403,
        description: 'Пользователь авторизован, но не админ',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'error', type: 'string', example: 'Forbidden: Admin access required'),
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
    #[IsGranted('IS_AUTHENTICATED_FULLY', message: 'Unauthorized', statusCode: Response::HTTP_UNAUTHORIZED)]
    #[IsGranted('ROLE_ADMIN', message: 'Forbidden: Admin access required', statusCode: Response::HTTP_FORBIDDEN)]
    #[Security(name: 'Bearer')]
    #[Route('/api/admin/users', name: 'admin_get_users', methods: ['GET'])]
    public function getUsers(): JsonResponse
    {
        try {
            $usersData = $this->userService->findAllUsers();

            return new JsonResponse($usersData, Response::HTTP_OK);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Internal server error', 'message' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[OA\Delete(description: 'Удаляет пользователя по ID (только для администраторов)', summary: 'Удаление пользователя',)]
    #[OA\Parameter(
        name: 'id',
        description: 'ID пользователя',
        in: 'path',
        required: true,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Response(
        response: Response::HTTP_OK,
        description: 'Пользователь успешно удален',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'message', type: 'string', example: 'User deleted successfully'),
            ]
        )
    )]
    #[OA\Response(
        response: Response::HTTP_BAD_REQUEST,
        description: 'Некорректный id, не число',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'error', type: 'string', example: 'Invalid user id'),
            ]
        )
    )]
    #[OA\Response(
        response: Response::HTTP_FORBIDDEN,
        description: 'Пользователь авторизован, но не админ',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'error', type: 'string', example: 'Forbidden: Admin access required'),
            ]
        )
    )]
    #[OA\Response(
        response: Response::HTTP_NOT_FOUND,
        description: 'Пользователь с указанным id не найден',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'error', type: 'string', example: 'User not found'),
            ]
        )
    )]
    #[OA\Response(
        response: Response::HTTP_INTERNAL_SERVER_ERROR,
        description: 'Сервер недоступен',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'error', type: 'string', example: 'Internal server error'),
            ]
        )
    )]
    #[IsGranted('IS_AUTHENTICATED_FULLY', message: 'Unauthorized', statusCode: Response::HTTP_UNAUTHORIZED)]
    #[IsGranted('ROLE_ADMIN', message: 'Forbidden: Admin access required', statusCode: Response::HTTP_FORBIDDEN)]
    #[Security(name: 'Bearer')]
    #[Route('/api/admin/users/{id}', name: 'admin_delete_user', methods: ['DELETE'])]
    public function deleteUser(#[MapEntity(id: 'id', message: 'User not found')] User $user): JsonResponse
    {
        try {
            if ($this->getUser() === $user) {
                return new JsonResponse(['error' => 'Cannot delete your own account'], Response::HTTP_BAD_REQUEST);
            }
            $this->userService->deleteUser($user);

            return new JsonResponse(['message' => 'User deleted successfully'], Response::HTTP_OK);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Internal server error', 'message' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
    #[OA\Delete(description: 'Удаляет всех пользователей кроме текущего администратора', summary: 'Удаление всех пользователей')]
    #[IsGranted('IS_AUTHENTICATED_FULLY', message: 'Unauthorized', statusCode: Response::HTTP_UNAUTHORIZED)]
    #[IsGranted('ROLE_ADMIN', message: 'Forbidden: Admin access required', statusCode: Response::HTTP_FORBIDDEN)]
    #[Security(name: 'Bearer')]
    #[Route('/api/admin/users', name: 'admin_delete_all_users', methods: ['DELETE'])]
    public function deleteAllUsersExceptCurrent(#[CurrentUser] User $user): JsonResponse
    {
        try {
            $deletedCount = $this->userService->deleteAllUsersExcept($user);

            return new JsonResponse([
                'message' => 'All users except current admin deleted successfully',
                'deleted_count' => $deletedCount
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return new JsonResponse([
                'error' => 'Internal server error',
                'message' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
