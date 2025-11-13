<?php

namespace App\EventListener;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;

class AccessDeniedListener
{
    public function onKernelException(ExceptionEvent $event): void
    {
        $exception = $event->getThrowable();

        if ($exception->getMessage() === 'Unauthorized') {
            $response = new JsonResponse(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
            $event->setResponse($response);
        } elseif ($exception->getMessage() === 'Forbidden: Admin access required') {
            $response = new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_UNAUTHORIZED);
            $event->setResponse($response);
        } elseif ($exception->getMessage() === 'User not found') {
            $response = new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_NOT_FOUND);
            $event->setResponse($response);
        }
    }
}
