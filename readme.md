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

