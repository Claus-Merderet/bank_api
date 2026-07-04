# External Integrations

**Analysis Date:** 2026-07-04

## APIs & External Services

**None detected** - This is a standalone banking API with no external service dependencies. All operations are internal to the application.

## Data Storage

**Databases:**
- PostgreSQL 15 (Alpine-based image in development)
  - Connection string format: `postgresql://[user]:[password]@[host]:[port]/[database]`
  - Environment variable: `DATABASE_URL`
  - Development default: `postgresql://symfony:password@postgres:5432/symfony_db`
  - Client: Doctrine DBAL via PDO driver
  - ORM: Doctrine ORM 3.5.8
  - Location: `config/packages/doctrine.yaml`
  - Migrations: `migrations/` directory (Doctrine Migrations)
  - Tables:
    - `user` - User accounts with roles and passwords
    - `account` - Bank accounts associated with users
    - `credit` - Credit products and balances
    - `transaction` - All transactions (deposits, transfers, credit operations)

**File Storage:**
- Local filesystem only
  - Public files: `public/` directory
  - Application files: Bind-mounted in Docker
  - No S3, cloud storage, or external file services

**Caching:**
- Filesystem-based (default, no backend configured)
  - Configuration: `config/packages/cache.yaml`
  - Redis: Commented out, available as option
  - APCu: Mentioned but not configured
  - Doctrine result cache: Uses `cache.app` in production
  - Doctrine system cache: Uses `cache.system` in production

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based (no external OAuth/SAML)
- Implementation: Lexik JWT Authentication Bundle 3.1.1
  - Configuration: `config/packages/lexik_jwt_authentication.yaml`
  - Keys: `config/jwt/private.pem`, `config/jwt/public.pem` (asymmetric RSA)
  - Passphrase: From `JWT_PASSPHRASE` environment variable
  - Token TTL: Configurable via `JWT_TOKEN_TTL` environment variable
  - Endpoint: `POST /api/auth/token/login` - Returns JWT token and user info
  - User provider: Entity-based (App\Entity\User, matches by username)
  - Authentication flow:
    - POST username/password to `/api/auth/token/login`
    - Returns JSON with `token` and `user` object
    - Subsequent requests include `Authorization: Bearer [token]`
  - Firewall configuration: `config/packages/security.yaml`
    - Login firewall: json_login handler with JWT success/failure handlers
    - API firewall: stateless JWT validation for all `/api/*` routes
  - Password hashing: Symfony's auto password hasher (bcrypt/argon2)

**User Roles:**
- ROLE_USER - Standard user (can create accounts, make transfers)
- ROLE_ADMIN - Administrative user (cannot create bank accounts)
- ROLE_CREDIT_SECRET - Special role for credit operations
- ROLE_SUPER_ADMIN - Full system access

**User Data:**
- `app_user_provider` loads users from `App\Entity\User`
- Username-based authentication
- Password stored hashed in database

## Monitoring & Observability

**Error Tracking:**
- Not configured - Application logs only
- Event listeners for error handling: `src/EventListener/`
  - `AccessDeniedListener.php`
  - `AuthBadRequestListener.php`
  - `AuthenticationFailureListener.php`
  - `AuthenticationSuccessListener.php`

**Logs:**
- Nginx access logs: `/var/log/nginx/project_access.log`
- Nginx error logs: `/var/log/nginx/project_error.log`
- Application logs: No external logging configured
- Log management: Docker container logs only
- Stdout/stderr: Captured by Docker daemon

## CI/CD & Deployment

**Hosting:**
- Docker containers (self-hosted or container orchestration platform)
- Development: `docker-compose.yml` - Single-machine multi-container
- Production: `docker-compose.prod.yml` - Minimal production compose
- Dockerfile: Alpine Linux base with PHP-FPM, Nginx, PostgreSQL client, Supervisor
- Port exposure: 4111 (Nginx HTTP)

**CI Pipeline:**
- Not configured - No GitHub Actions, GitLab CI, Jenkins, etc. detected
- Build: Manual Docker build via `docker build` or compose
- Deploy: Manual container startup via compose or orchestration platform

**Container Orchestration:**
- Docker Compose for local development
- Could be deployed to Kubernetes, Docker Swarm, ECS, etc., but not configured

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - PostgreSQL connection string (e.g., `postgresql://user:pass@postgres:5432/db`)
- `JWT_SECRET_KEY` - Private key for JWT signing (multi-line PEM format)
- `JWT_PUBLIC_KEY` - Public key for JWT verification (multi-line PEM format)
- `JWT_PASSPHRASE` - Passphrase protecting the private key
- `JWT_TOKEN_TTL` - Token validity duration in seconds (e.g., 3600)
- `APP_SECRET` - Symfony application secret (used for CSRF, etc.)
- `APP_ENV` - Environment: `dev`, `test`, or `prod`
- `APP_DEBUG` - Boolean: enable debug mode in dev/test

**Optional env vars:**
- `TEST_TOKEN` - For ParaTest parallel testing (appended to test database name)

**Secrets location:**
- `.env` file (development, .gitignored)
- `.env.dev` file (development overrides, .gitignored)
- Environment variables in container/deployment platform
- JWT key files: `config/jwt/private.pem`, `config/jwt/public.pem` (committed to repo)

## Webhooks & Callbacks

**Incoming:**
- None configured - This is a RESTful API without webhook receivers

**Outgoing:**
- None configured - No external service callbacks

## Database Schema Summary

**User Table:**
```
user (id, username, password, role, deleted_at)
  - Soft deleteable via deleted_at timestamp
  - One-to-many relationship: user → account
```

**Account Table:**
```
account (id, user_id, number, balance)
  - FK: user_id → user.id
  - One-to-many relationship: account → transaction
  - One-to-many relationship: account → credit
```

**Credit Table:**
```
credit (id, account_id, amount, term_months, balance, created_at)
  - FK: account_id → account.id
  - One-to-many relationship: credit → transaction
```

**Transaction Table:**
```
transaction (id, to_account_id, from_account_id, credit_id, amount, transaction_type, created_at)
  - FK: to_account_id → account.id (optional)
  - FK: from_account_id → account.id (optional)
  - FK: credit_id → credit.id (optional)
  - Types: deposit, transfer, credit_repayment, credit_issue
```

## API Documentation

**Format:** OpenAPI 3.0 (Swagger)
- Documentation endpoint: `/api/doc`
- Generator: NelmiO API Doc Bundle 5.8.2
- Config: `config/packages/nelmio_api_doc.yaml`
- Attributes: PHP 8 Attributes for endpoint documentation (see `src/Controller/`)
- Security scheme: HTTP Bearer with JWT
- Language: Russian (descriptions and examples in Russian)

---

*Integration audit: 2026-07-04*
