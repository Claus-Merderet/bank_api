<?php

namespace App\EventListener;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class AuthBadRequestListener
{
    public function onKernelException(ExceptionEvent $event)
    {
        $exception = $event->getThrowable();
        if ($exception instanceof BadRequestHttpException) {
            if ($exception->getMessage() === 'The key "username" must be provided.'
                || $exception->getMessage() === 'The key "password" must be provided.'
            ) {
                $response = new JsonResponse(['error' => 'Missing username or password',], Response::HTTP_BAD_REQUEST);
            } else {
                $response = new JsonResponse(['error' => $exception->getMessage(),], Response::HTTP_BAD_REQUEST);
            }


            $event->setResponse($response);
        }
    }
}
