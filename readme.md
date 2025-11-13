# Bank API Project

Symfony API проект для банковской системы

## Быстрый старт

### 1. Клонирование и запуск
```bash
git clone <https://github.com/Claus-Merderet/bank_api>
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
### 2. Настройка базы данных
```bash
docker compose exec php sh
php bin/console doctrine:migrations:migrate --no-interaction
php bin/console doctrine:fixtures:load --no-interaction
```

### 3. Проверка работы

**📚 Документация API:** http://localhost/api/swagger

**🔐 Тестовый доступ:**
- **Логин:** `admin`
- **Пароль:** `123456`
- **Роль:** `ROLE_ADMIN`

