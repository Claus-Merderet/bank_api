# Codebase Structure

**Analysis Date:** 2026-07-04

## Directory Layout

```
bank_api/
├── .git/                    # Git repository
├── .planning/               # GSD planning and analysis documents
├── bin/                     # Executable entry points
├── config/                  # Application configuration
│   ├── bundles.php          # Symfony bundles registration
│   ├── packages/            # Package-specific configs (doctrine, security, jwt, etc.)
│   ├── preload.php          # PHP preload hints for opcache
│   ├── routes.yaml          # Main routing configuration
│   ├── routes/              # Route definitions by feature
│   ├── services.yaml        # Service container configuration
│   ├── jwt/                 # JWT private/public keys
│   └── packages/
│       ├── doctrine.yaml
│       ├── security.yaml
│       ├── framework.yaml
│       └── [other bundles]
├── docker/                  # Docker-related files
├── migrations/              # Doctrine database migrations
├── public/                  # Web server document root
│   └── index.php            # Symfony kernel bootstrap
├── src/                     # Application source code
│   ├── Controller/          # HTTP controllers
│   ├── Service/             # Business logic services
│   ├── Repository/          # Database access layer
│   ├── Entity/              # Doctrine ORM entities
│   ├── DTO/                 # Data transfer objects
│   ├── Enum/                # PHP enums for domain types
│   ├── Exception/           # Custom exception hierarchy
│   ├── EventListener/       # Symfony event listeners
│   ├── DataFixtures/        # Test data fixtures
│   └── Kernel.php           # Symfony application kernel
├── templates/               # Twig templates (minimal API)
├── .editorconfig            # Editor configuration
├── .env                     # Environment variables (contains secrets)
├── .env.dev                 # Development environment file
├── .gitignore               # Git ignore rules
├── .php-cs-fixer.dist.php   # PHP CS Fixer configuration
├── composer.json            # PHP package dependencies
├── composer.lock            # Locked dependency versions
├── docker-compose.yml       # Docker Compose dev configuration
├── docker-compose.prod.yml  # Docker Compose prod configuration
├── Dockerfile               # Container image definition
├── Makefile                 # Build/dev commands
├── readme.md                # Project README
├── start.sh                 # Startup script
└── symfony.lock             # Symfony version lock
```

## Directory Purposes

**src/Controller/:**
- Purpose: HTTP request handlers and route entry points
- Contains: Three controller classes with route definitions as PHP attributes
- Key files: `AccountController.php`, `CreditController.php`, `AdminController.php`
- Pattern: Extends `AbstractController`, uses `#[Route]` attributes for path binding, `#[IsGranted]` for auth, `#[MapRequestPayload]` for request deserialization
- Each method: Returns `JsonResponse` with HTTP status codes

**src/Service/:**
- Purpose: Business logic and domain operations
- Contains: Service classes that implement banking operations
- Key files: `AccountService.php`, `CreditService.php`, `UserService.php`
- Pattern: Read-only constructor injection of dependencies (EntityManager, repositories, password hasher), public methods for business operations
- Responsibilities: Validation, state changes, transaction management, exception throwing

**src/Repository/:**
- Purpose: Database query abstraction and entity persistence
- Contains: Repository classes for each entity type
- Key files: `AccountRepository.php`, `TransactionRepository.php`, `UserRepository.php`, `CreditRepository.php`
- Pattern: Extend `ServiceEntityRepository<T>`, pass ManagerRegistry and entity class to parent constructor
- Methods: Basic CRUD inherited from parent, custom query methods (e.g., `findTransactionsWithTypesByAccount()` in TransactionRepository with raw SQL)

**src/Entity/:**
- Purpose: Domain model representation as Doctrine ORM entities
- Contains: PHP classes mapped to database tables via attributes
- Key files: `User.php`, `Account.php`, `Credit.php`, `Transaction.php`
- Pattern: Doctrine `#[ORM\Entity]` attributes define schema, relationship attributes (`#[ORM\ManyToOne]`, `#[ORM\OneToMany]`), private properties with public getters/setters
- Relationships: User has many Accounts, Account has many Credits and Transactions, Transaction links from/to Accounts

**src/DTO/:**
- Purpose: Structure request payloads and response data
- Contains: Simple PHP classes with public properties
- Key files: Request DTOs (`LoginRequestDTO`, `DepositRequestDTO`, `TransferRequestDTO`, `CreditRequestDTO`, `RegisterRequestDTO`), Response DTOs (`AccountTransactionsResponseDTO`, `CreditHistoryResponseDTO`, `UserListDTO`)
- Pattern: No logic, only property declarations. Used by controllers with `#[MapRequestPayload]` for automatic deserialization and validation
- Validation: Symfony Validator attributes on properties (e.g., `#[Assert\Positive]` on amount fields)

**src/Enum/:**
- Purpose: Type-safe enumeration of domain constants
- Contains: PHP Enums with backed string values
- Key files: `TransactionType.php` (DEPOSIT, TRANSFER, CREDIT_REPAY, CREDIT_ISSUED), `UserRole.php` (ROLE_USER, ROLE_ADMIN, ROLE_CREDIT)
- Pattern: Enum cases map to database values and role names used in security

**src/Exception/:**
- Purpose: Domain-specific exceptions with semantic meanings
- Contains: Exception class hierarchy with base AppException
- Key files: `AppException.php` (base, code 400), subdirectories `Account/`, `Credit/`, `User/` with specific exceptions
- Pattern: Each exception extends AppException, defines its own HTTP status code in constructor
- Examples: `AccountNotFoundException` (404), `InsufficientFundsException` (422), `UserAlreadyExistsException` (409)

**src/EventListener/:**
- Purpose: Hook into Symfony event lifecycle for cross-cutting concerns
- Contains: Event listener classes implementing security and error handling
- Key files: `AuthenticationSuccessListener`, `AuthenticationFailureListener`, `AuthBadRequestListener`, `AccessDeniedListener`
- Pattern: Implement kernel event listeners (tagged in `config/services.yaml`), modify response data or status codes
- Responsibility: Format authentication responses, convert exceptions to JSON error responses

**src/DataFixtures/:**
- Purpose: Test data and database seeding
- Contains: Doctrine fixture classes for populating test data
- Key files: `AppFixtures.php`, `UserFixtures.php`
- Pattern: Extend `Fixture` class, implement `load()` method, use ObjectManager to persist entities
- Usage: Loaded via `php bin/console doctrine:fixtures:load`

**config/:**
- Purpose: Application configuration and setup
- Contains: Symfony bundle configuration, routing, services, JWT keys
- Key files: `services.yaml` (service container), `routes.yaml` (routing entry point), `packages/security.yaml` (auth config), `packages/doctrine.yaml` (database)
- Pattern: YAML configuration for bundles, PHP attributes in code for routes/attributes

**config/packages/:**
- Purpose: Separate configuration files per Symfony bundle
- Contains: `doctrine.yaml`, `security.yaml`, `framework.yaml`, `lexik_jwt_authentication.yaml`, `nelmio_api_doc.yaml`, `validator.yaml`, etc.
- Pattern: Each bundle has its own config file in packages/ directory

**migrations/:**
- Purpose: Database schema version control
- Contains: Doctrine migration files (PHP classes)
- Pattern: Each migration file auto-generated with up/down methods to modify schema
- Usage: Applied via `php bin/console doctrine:migrations:migrate`

**public/:**
- Purpose: Web server document root (minimal for API)
- Contains: `index.php` - Symfony kernel entry point
- Pattern: index.php instantiates Kernel class, creates Request from PHP $_SERVER, gets Response, sends it

**templates/:**
- Purpose: Twig template files (minimal usage in API)
- Contains: `base.html.twig` - base template
- Pattern: Not heavily used in REST API; mainly for any HTML responses or documentation

**bin/:**
- Purpose: Console command entry points
- Contains: `console` - Symfony CLI entry point for commands (migrations, fixtures, etc.)
- Pattern: PHP executable that instantiates Kernel and runs console commands

## Key File Locations

**Entry Points:**
- `public/index.php`: HTTP request entry point for web server (nginx/Apache)
- `bin/console`: CLI entry point for Symfony commands
- `src/Kernel.php`: Symfony kernel bootstrap class using MicroKernelTrait

**Configuration:**
- `config/services.yaml`: Service container configuration, autowiring setup
- `config/routes.yaml`: Main routing configuration (references src/Controller attributes)
- `config/packages/security.yaml`: Authentication/authorization configuration, JWT setup
- `config/packages/doctrine.yaml`: Database connection and ORM mapping
- `.env`: Environment variables (connection strings, JWT secrets, app mode)
- `.env.dev`: Development-specific environment overrides

**Core Logic:**
- `src/Service/AccountService.php`: Account operations (create, deposit, transfer)
- `src/Service/CreditService.php`: Credit operations (request, repay)
- `src/Service/UserService.php`: User operations (register, authenticate)
- `src/Repository/TransactionRepository.php`: Custom SQL for formatted transaction history

**Data Models:**
- `src/Entity/User.php`: User entity with Symfony security interface implementation
- `src/Entity/Account.php`: Bank account entity with relationships
- `src/Entity/Credit.php`: Credit/loan entity
- `src/Entity/Transaction.php`: Transaction audit log entity

**Testing:**
- `src/DataFixtures/UserFixtures.php`: Test data setup
- `src/DataFixtures/AppFixtures.php`: General test fixtures

## Naming Conventions

**Files:**
- Controllers: `*Controller.php` (e.g., `AccountController.php`)
- Services: `*Service.php` (e.g., `AccountService.php`)
- Repositories: `*Repository.php` (e.g., `AccountRepository.php`)
- Entities: `*.php` (e.g., `Account.php`)
- DTOs: `*DTO.php` or `*RequestDTO.php` / `*ResponseDTO.php` (e.g., `DepositRequestDTO.php`)
- Exceptions: `*Exception.php` (e.g., `AccountNotFoundException.php`)
- Event Listeners: `*Listener.php` (e.g., `AuthenticationSuccessListener.php`)
- Enums: `*.php` (e.g., `TransactionType.php`)

**Directories:**
- Plural for collections: `Controller`, `Service`, `Repository`, `Entity`, `Exception`
- Exception subdirectories by domain: `Exception/Account/`, `Exception/Credit/`, `Exception/User/`
- Configuration by concern: `config/packages/` groups bundle configs

**Classes:**
- PascalCase for all PHP classes (e.g., `AccountController`, `AccountService`)
- Namespaces follow directory structure: `App\Controller`, `App\Service`, `App\Repository`, `App\Entity`
- DTO classes may include `Request`/`Response` suffix for clarity (e.g., `DepositRequestDTO`)

**Properties & Methods:**
- camelCase for properties: `$accountId`, `$balance`, `$transactionType`
- camelCase for methods: `getBalance()`, `setBalance()`, `validateCountAccountForUser()`
- Setter methods return `$this` for fluent interface
- Getter methods return property type (e.g., `?Account`, `Collection<int, Transaction>`)

**Constants:**
- UPPERCASE_WITH_UNDERSCORES for constants (followed in Enums via backed values)
- Enums use uppercase case names: `TransactionType::DEPOSIT`, `UserRole::ROLE_ADMIN`

## Where to Add New Code

**New Feature (e.g., withdraw operation):**
- Primary code: `src/Service/AccountService.php` - add public method `withdraw()`
- Controller: `src/Controller/AccountController.php` - add new route method
- DTO: `src/DTO/WithdrawRequestDTO.php` - create new request DTO
- Exception: `src/Exception/Account/WithdrawalLimitException.php` - if new error scenario
- Tests: Create test fixtures and test cases (when tests directory is created)

**New Entity/Feature (e.g., Loan management):**
- Entity: `src/Entity/Loan.php` - create new Doctrine entity
- Repository: `src/Repository/LoanRepository.php` - create repository
- Service: `src/Service/LoanService.php` - create service with business logic
- Controller: `src/Controller/LoanController.php` - create new controller
- DTOs: `src/DTO/LoanRequestDTO.php`, `src/DTO/LoanHistoryResponseDTO.php`
- Exceptions: `src/Exception/Loan/*.php` - create exception hierarchy
- Migration: `migrations/Version*.php` - run `php bin/console make:migration` to auto-generate

**Utilities & Helpers:**
- Shared helpers: Create in `src/Service/` as utility services or static helper classes
- Email/SMS services: Create in `src/Service/` (NotificationService, EmailService, etc.)
- Value objects: Create in `src/Entity/` directory or new `src/ValueObject/` if many
- Formatters: Create in `src/Formatter/` for consistent data formatting

**New Exception Types:**
- Domain-specific exceptions: `src/Exception/[Domain]/SpecificException.php`
- Extend base `AppException` with semantic HTTP code
- Reference in service layer and catch in controllers

**Validation Rules:**
- Add validation attributes to DTOs in `src/DTO/` classes
- Custom validators: Create `src/Validator/` with Symfony validator classes if reusable
- Inline validation in services for business rules (e.g., account ownership)

## Special Directories

**src/DataFixtures/:**
- Purpose: Test data population
- Generated: No (manually written)
- Committed: Yes
- Usage: `php bin/console doctrine:fixtures:load --append`

**migrations/:**
- Purpose: Database schema versioning
- Generated: Yes (via `php bin/console make:migration`)
- Committed: Yes (migrations are code)
- Usage: Applied in deployment via `php bin/console doctrine:migrations:migrate`

**config/jwt/:**
- Purpose: JWT signing keys (RSA private/public pair)
- Generated: Already present (private.pem, public.pem)
- Committed: Only public.pem should be committed (private.pem is secret)
- File contents: PEM-encoded RSA keys, never shown in output

**.planning/:**
- Purpose: GSD planning and codebase analysis documents
- Generated: Yes (by analysis agents)
- Committed: Yes (project documentation)
- Contents: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md

**docker/:**
- Purpose: Docker-related configuration and scripts
- Generated: No (manually written)
- Committed: Yes
- Contents: Dockerfile, docker-compose files for dev/prod

---

*Structure analysis: 2026-07-04*
