# Bank API Project – проект для банковской системы

Монолитный образ: SPA (React/Vite) и Symfony API/swagger отдаются из одного nginx на порту **4111**. Тестировщику нужен только `docker pull` + `docker run` — без сборки фронта и без docker compose.

## Быстрый старт

### 1. Скачать docker-образ

```bash
docker pull clausmerderet/bank_api:latest
```

### 2. Запустить контейнер

```bash
docker run -d -p 4111:4111 --name bank_api clausmerderet/bank_api:latest
```

Первый старт занимает ~10–15с (миграции + фикстуры). Данные эфемерны by design: при каждом старте контейнера БД пересоздаётся к сиду `admin/123456` (созданные админом пользователи исчезают после пересоздания — это ожидаемое поведение полигона).

### 3. Открыть в браузере

- **SPA (банк):** http://localhost:4111
- **Документация API (swagger):** http://localhost:4111/api/swagger

**🔐 Тестовый доступ:**
- **Логин:** `admin`
- **Пароль:** `123456`
- **Роль:** `ROLE_ADMIN`

Демо-пользователей (`user1` / `credit1`) создаёт админ в админке.

## Доступ к базе данных (опционально)

PostgreSQL внутри образа. Чтобы достучаться до БД снаружи, добавьте проброс порта:

```bash
docker run -d -p 4111:4111 -p 5432:5432 --name bank_api clausmerderet/bank_api:latest
```

- **Хост:** `localhost`
- **Порт:** `5432`
- **База данных:** `symfony_db`
- **Пользователь:** `symfony`
- **Пароль:** `password`

## Локальная сборка образа (для мейнтейнера)

```bash
git clone https://github.com/Claus-Merderet/bank_api
cd bank_api
docker build -t clausmerderet/bank_api:latest .
```

Сборка multi-stage: node-stage собирает фронт (`npm ci` + `vite build`) в `dist`, php-fpm stage копирует его в `/var/www/frontend` и отдаёт через nginx вместе с Symfony API. Публикация образа на Docker Hub (`docker login` + `docker push`) — ручной шаг мейнтейнера.
