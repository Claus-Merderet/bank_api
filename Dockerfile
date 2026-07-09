# ---- frontend build stage ----
# Node 22.12-alpine is mandatory: Vite 8 requires Node 22.12+.
# Manifests first so the `npm ci` layer stays cached independently of src changes.
FROM node:22.12-alpine AS frontend-build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- backend runtime stage ----
FROM php:8.4-fpm-alpine

RUN apk add --no-cache \
    nginx \
    postgresql \
    postgresql-contrib \
    postgresql-dev \
    git \
    curl \
    libpng-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev \
    supervisor \
    netcat-openbsd

RUN docker-php-ext-install \
    pdo_pgsql \
    pgsql \
    gd \
    soap \
    zip \
    bcmath

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

RUN mkdir -p /etc/supervisor/conf.d

COPY docker/nginx/default.conf /etc/nginx/http.d/default.conf
COPY docker/supervisor/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

COPY start.sh /start.sh
RUN chmod +x /start.sh

WORKDIR /var/www/html

COPY . .

# Built SPA from the frontend-build stage — path must match `root /var/www/frontend` in nginx conf.
COPY --from=frontend-build /app/dist /var/www/frontend

RUN git config --global --add safe.directory /var/www/html

RUN composer install --optimize-autoloader --ignore-platform-req=ext-http

RUN mkdir -p /var/log/nginx /var/log/supervisor /var/run/nginx /var/lib/postgresql/data

RUN chown -R postgres:postgres /var/lib/postgresql/data
RUN su postgres -c "initdb -D /var/lib/postgresql/data"

RUN echo "host all all 0.0.0.0/0 md5" >> /var/lib/postgresql/data/pg_hba.conf
RUN echo "listen_addresses='*'" >> /var/lib/postgresql/data/postgresql.conf

RUN chown -R www-data:www-data /var/www/html/var

RUN mkdir -p /run/postgresql
RUN chown -R postgres:postgres /run/postgresql

COPY docker/supervisor/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY config/jwt/private.pem config/jwt/private.pem
COPY config/jwt/public.pem config/jwt/public.pem
RUN chmod 644 config/jwt/*.pem

EXPOSE 4111

CMD ["/start.sh"]
