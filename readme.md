# Bank API Project – проект для банковской системы

## Быстрый старт
### 1. Скачать докер образ
```bash
docker pull clausmerderet/bank_api:latest
```
### 1.2 Запустить докер контейнер
```bash
docker run -d -p 4111:4111 -p 5432:5432 --name bank_api clausmerderet/bank_api:latest
```
### 📚 Документация API: http://localhost:4111/api/swagger

### 2.1 Загрузка для автотестировщиков
```bash
git clone https://github.com/Claus-Merderet/bank_api
```
```bash
cd bank_api
```
```bash
docker compose build
```
```bash
docker compose up -d
```
```bash
docker compose exec php composer install --optimize-autoloader --ignore-platform-req=ext-http
```
### 2.2 Настройка базы данных
```bash
docker compose exec php sh
php bin/console doctrine:migrations:migrate --no-interaction
php bin/console doctrine:fixtures:load --no-interaction
```

#### 3. Проверка работы

**📚 Документация API:** http://localhost/api/swagger

**🔐 Тестовый доступ:**
- **Логин:** `admin`
- **Пароль:** `123456`
- **Роль:** `ROLE_ADMIN`

**🗄️ Доступ к базе данных:**
- **Хост:** `localhost`
- **Порт:** `5432`
- **База данных:** `symfony_db`
- **Пользователь:** `symfony`
- **Пароль:** `password`

## Запуск всего стека (Docker) — фронтенд + бэкенд

Одна команда на чистой машине поднимает бэкенд-полигон и фронтенд SPA и открывает работающий банк в браузере:

```bash
docker compose -f docker-compose.app.yml up --build
```

Затем открыть в браузере: **http://localhost:8080**

**🔐 Вход:**
- **Логин:** `admin`
- **Пароль:** `123456`
- **Роль:** `ROLE_ADMIN`

**Как это работает:** фронтенд собирается в multi-stage docker-образ (Vite build → nginx) и публикуется на порту `8080`. nginx фронта отдаёт SPA и проксирует `/api` на бэкенд по внутренней сети (сервис `backend:4111`) — один origin, CORS не нужен. Бэкенд-образ автономен: PostgreSQL, миграции и фикстуры (сид `admin/123456`) внутри образа; порт `4111` наружу не публикуется, поэтому стек не конфликтует с отдельно запущенным контейнером `bank_api`.

**Примечания:**
- Первый `up --build` требует интернета (pull образов `node:22-alpine`, `nginx:alpine`, `clausmerderet/bank_api:latest` + `npm ci`). В **рантайме интернет не нужен** — шрифты self-hosted в бандле.
- **Данные эфемерны by design.** При каждом старте бэкенд-контейнера БД пересоздаётся к сиду `admin/123456` (фикстуры purge на старте). Созданные админом пользователи (например `user1`, `credit1`) исчезают после пересоздания контейнера — это ожидаемое поведение полигона.
- Демо-пользователей (`user1` / `credit1`) создаёт админ в админке.
- На первом старте бэкенд ~10–15с прогоняет миграции и фикстуры; healthcheck держит фронт до готовности бэкенда, поэтому 502 на первых запросах не возникает.

