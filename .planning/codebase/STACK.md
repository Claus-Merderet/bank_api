# Technology Stack

**Analysis Date:** 2026-07-04

## Languages

**Primary:**
- PHP 8.4 - Server-side API logic
  - Minimum requirement: PHP 8.2 (specified in `composer.json`)
  - Extensions required: ctype, http, iconv, pdo_pgsql, gd, soap, zip, bcmath

**Build/Configuration:**
- YAML - Symfony configuration
- SQL - Database migrations and queries

## Runtime

**Environment:**
- PHP-FPM 8.4 (Alpine Linux base)
- Location: `Dockerfile`

**Package Manager:**
- Composer 2.x
- Lockfile: `composer.lock` (305KB)
- Configuration: `composer.json`

## Frameworks

**Core:**
- Symfony 7.3.* - Full-stack web framework
  - Framework Bundle: Request routing, controllers, services
  - Security Bundle: Authentication and authorization
  - Console: CLI commands
  - Runtime: Application lifecycle management
  - Validator: Request/payload validation
  - Serializer: Object serialization
  - Property Info: Property introspection
  - Asset: Static asset management
  - Twig: Template engine
  - YAML: Configuration parsing

**Database:**
- Doctrine ORM 3.5.8 - Object-relational mapping
  - Location: `src/Entity/`, `src/Repository/`
  - Configuration: `config/packages/doctrine.yaml`
  - Features: Auto-mapping, lazy ghost objects, soft deleteable filter (via Stof extension)
- Doctrine DBAL 3.10.4 - Database abstraction layer
- Doctrine Migrations 3.7 - Schema versioning
  - Location: `migrations/`
  - Config: `config/packages/doctrine_migrations.yaml`

**API Documentation:**
- NelmiO API Doc Bundle 5.8.2 - OpenAPI/Swagger documentation
  - Config: `config/packages/nelmio_api_doc.yaml`
  - Routes: `config/routes/nelmio_api_doc.yaml`
  - Endpoint: `/api/doc`

**Authentication:**
- Lexik JWT Authentication Bundle 3.1.1 - JWT token handling
  - Config: `config/packages/lexik_jwt_authentication.yaml`
  - Keys: `config/jwt/private.pem`, `config/jwt/public.pem`

**Database Extensions:**
- Stof Doctrine Extensions Bundle 1.14 - Doctrine feature enhancements
  - Enabled: Soft deleteable (timestamp-based soft deletes)
  - Config: `config/packages/stof_doctrine_extensions.yaml`

**Testing/Development:**
- Doctrine Fixtures Bundle 4.3.1 - Test data generation
  - Location: `src/DataFixtures/`
- Symfony Maker Bundle 1.65.1 - Code generation helpers
- PHP CS Fixer 3.91.3 - Code style formatting
  - Config: `.php-cs-fixer.dist.php`
  - Rules: Symfony PSR-12, PHP 8.0+ migration, no strict types, ordered imports

## Key Dependencies

**Critical:**
- symfony/framework-bundle 7.3 - Core Symfony functionality
- doctrine/orm 3.5.8 - Data persistence and querying
- lexik/jwt-authentication-bundle 3.1.1 - Stateless API authentication
- symfony/security-bundle 7.3 - User authentication and authorization
- symfony/validator 7.3 - Input validation and constraint handling
- symfony/serializer 7.3 - Request/response serialization (JSON)

**Infrastructure:**
- symfony/console 7.3 - CLI command interface
- symfony/dotenv 7.3 - .env file loading
- symfony/runtime 7.3 - Application runtime management
- symfony/property-access 7.3 - Object property manipulation
- symfony/property-info 7.3 - Property metadata extraction
- doctrine/dbal 3.10.4 - Low-level database access
- doctrine/deprecations 1.1 - Deprecation warnings
- twig/twig 3.22.1 - Template rendering
- twig/extra-bundle - Additional Twig filters and functions
- phpdocumentor/reflection-docblock 5.6.5 - Docblock parsing
- phpstan/phpdoc-parser 2.3 - PHPDoc syntax parsing

## Configuration

**Environment:**
- Configuration via environment variables (see `config/packages/framework.yaml`)
  - `APP_SECRET` - Application secret key
  - `DATABASE_URL` - PostgreSQL connection string
  - `JWT_SECRET_KEY` - Private key for JWT signing
  - `JWT_PUBLIC_KEY` - Public key for JWT verification
  - `JWT_PASSPHRASE` - Passphrase for JWT keys
  - `JWT_TOKEN_TTL` - Token time-to-live (seconds)

**Build:**
- `symfony.lock` - Symfony-specific package manifest
- `composer.json` - Root PHP dependencies
- `docker-compose.yml` - Development container orchestration
  - Services: nginx, php, postgres
  - Port mapping: 4111 (Nginx), 5432 (PostgreSQL)
- `Dockerfile` - Production image definition
  - Base: `php:8.4-fpm-alpine`
  - Includes: nginx, postgresql client, supervisor

**Code Style:**
- `.php-cs-fixer.dist.php` - Automated code formatting rules
  - Standard: Symfony + PHP 8.1 migration rules
  - Alphabetical import ordering
  - Short array syntax (`[]`)
  - No strict types declaration

## Platform Requirements

**Development:**
- Docker & Docker Compose (containerized environment)
- PHP 8.2+ (for non-containerized development)
- Composer 2.x
- PostgreSQL client libraries (in Docker)

**Production:**
- Docker with Alpine Linux base
- PostgreSQL 15+ (external or containerized)
- Nginx 1.24 as reverse proxy
- PHP 8.4-FPM runtime
- Supervisor for process management (configured in Dockerfile)

## Deployment Targets

**Current:**
- Docker containers (development and production)
- Development: `docker-compose.yml` (Nginx + PHP-FPM + PostgreSQL in containers)
- Production: Dockerfile with Supervisor for process management

**Exposed Ports:**
- Port 4111: Nginx HTTP
- Port 5432: PostgreSQL (development only)

**Storage:**
- PostgreSQL data volume: `postgres_data` (Docker volume)
- Application files: Bind mount to `/var/www/html`

---

*Stack analysis: 2026-07-04*
