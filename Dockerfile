FROM ubuntu:latest
LABEL authors="maksimgolosubov"

ENTRYPOINT ["top", "-b"]
FROM php:8.4-fpm-alpine

WORKDIR /var/www/html

# Копируем только необходимые для установки зависимостей файлы
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader
RUN docker-php-ext-install http
# Копируем весь проект
COPY . .

# Запускаем установку
RUN composer dump-autoload --optimize
