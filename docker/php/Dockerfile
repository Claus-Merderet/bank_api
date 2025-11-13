FROM php:8.4-fpm-alpine

# Установка системных зависимостей
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    libxml2-dev \
    zip \
    unzip \
    postgresql-dev \
    libzip-dev

# Установка PHP расширений
RUN docker-php-ext-install \
    pdo_pgsql \
    pgsql \
    gd \
    soap \
    zip \
    bcmath

# Установка Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Создание пользователя для приложения
RUN addgroup -g 1000 symfony && adduser -u 1000 -G symfony -s /bin/sh -D symfony

# Рабочая директория
WORKDIR /var/www/html

# Копируем ВЕСЬ проект сначала
COPY . .

RUN composer install --optimize-autoloader --ignore-platform-req=ext-http

# Установка прав
RUN chown -R symfony:symfony /var/www/html
USER symfony
