<!-- refreshed: 2026-07-04 -->
# Architecture

**Analysis Date:** 2026-07-04

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                    HTTP Request Layer                        │
│         Controllers: AccountController, CreditController,    │
│               AdminController                                │
│         `src/Controller/`                                    │
└─────────────────┬──────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                  Security & Auth Layer                       │
│    JWT Authentication, Role-based Access Control            │
│    `src/EventListener/`, `config/security.yaml`             │
└─────────────────┬──────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                  Business Logic Layer                        │
│     Services: AccountService, CreditService, UserService    │
│     `src/Service/`                                           │
└─────────────────┬──────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                  Data Access Layer                           │
│     Repositories & Doctrine ORM                              │
│     `src/Repository/`                                        │
└─────────────────┬──────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│        Database (PostgreSQL via Doctrine DBAL)               │
│     Entities: User, Account, Credit, Transaction             │
│     `src/Entity/`, database tables                           │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| AccountController | Handles account creation, deposits, transfers, transaction history | `src/Controller/AccountController.php` |
| CreditController | Manages credit requests and repayments | `src/Controller/CreditController.php` |
| AdminController | User creation and management (admin only) | `src/Controller/AdminController.php` |
| AccountService | Business logic for account operations, balance management | `src/Service/AccountService.php` |
| CreditService | Credit processing, validation, repayment logic | `src/Service/CreditService.php` |
| UserService | User registration, authentication, role management | `src/Service/UserService.php` |
| AccountRepository | Database queries for Account entities | `src/Repository/AccountRepository.php` |
| TransactionRepository | Custom SQL queries for transaction history | `src/Repository/TransactionRepository.php` |
| User Entity | User model with authentication interface | `src/Entity/User.php` |
| Account Entity | Bank account model with relationships to credits/transactions | `src/Entity/Account.php` |
| Transaction Entity | Transaction record linking from/to accounts | `src/Entity/Transaction.php` |
| Credit Entity | Credit/loan record for accounts | `src/Entity/Credit.php` |

## Pattern Overview

**Overall:** Multi-layer REST API architecture with clear separation of concerns

**Key Characteristics:**
- Stateless HTTP/REST API with JSON request/response
- JWT token-based authentication with role-based access control
- Doctrine ORM for object-relational mapping to PostgreSQL
- Service layer encapsulates business logic
- Repository pattern for data access
- DTO (Data Transfer Objects) for request/response payloads
- Exception hierarchy for domain-specific error handling
- Event listeners for security and authentication flows

## Layers

**HTTP Request Layer:**
- Purpose: Receive HTTP requests, route to appropriate controller methods
- Location: `src/Controller/`
- Contains: POST/GET route handlers with OpenAPI documentation
- Depends on: Service layer for business logic
- Used by: HTTP clients (REST API consumers)

**Security & Authentication Layer:**
- Purpose: Enforce JWT authentication and role-based authorization
- Location: `src/EventListener/`, `config/packages/security.yaml`, `config/packages/lexik_jwt_authentication.yaml`
- Contains: Event listeners for JWT authentication success/failure, access denied handling
- Depends on: Symfony Security component
- Used by: Controllers via `#[IsGranted]` attributes

**Service Layer:**
- Purpose: Implement business logic and coordinate data access
- Location: `src/Service/`
- Contains: AccountService, CreditService, UserService
- Depends on: Repositories, Doctrine EntityManager, DTOs, Entities, Exceptions
- Used by: Controllers (via dependency injection)

**Data Access Layer:**
- Purpose: Abstract database queries and transaction management
- Location: `src/Repository/`
- Contains: Repository classes extending ServiceEntityRepository
- Depends on: Doctrine ORM and DBAL
- Used by: Service layer

**Domain Model Layer:**
- Purpose: Represent business entities and their relationships
- Location: `src/Entity/`
- Contains: User, Account, Credit, Transaction entities with Doctrine mappings
- Depends on: Doctrine ORM attributes
- Used by: Repositories, Services

**Data Transfer Layer:**
- Purpose: Structure request payloads and API responses
- Location: `src/DTO/`
- Contains: Request DTOs (LoginRequestDTO, DepositRequestDTO, etc.) and Response DTOs (AccountTransactionsResponseDTO, etc.)
- Depends on: Symfony validation attributes
- Used by: Controllers for request mapping and serialization

## Data Flow

### Account Creation & Deposit Flow

1. HTTP POST to `/api/account/create` → `AccountController::createAccount()` (`src/Controller/AccountController.php:75`)
2. Controller extracts authenticated User via `#[CurrentUser]` attribute
3. Controller calls `AccountService::validateCountAccountForUser()` to check max 2 accounts limit
4. Service calls `entityManager->getRepository(Account::class)->count()` to query existing accounts
5. If valid, `AccountService::creatAccount()` is called to create new account
6. Service generates unique 7-digit account number via `generateUniqueAccountNumber()`
7. Service persists Account entity via `entityManager->persist()` and `entityManager->flush()`
8. On UniqueConstraintViolationException, retry up to 5 times
9. Controller returns JSON response with account id, number, and balance

### Deposit Flow

1. HTTP POST to `/api/account/deposit` with `DepositRequestDTO` → `AccountController::deposit()` (`src/Controller/AccountController.php:179`)
2. Controller maps request JSON to DepositRequestDTO via `#[MapRequestPayload]`
3. Controller validates current user is not admin, calls `AccountService::deposit()`
4. Service finds account owned by user via `findAccountOwnedByUser()` (throws AccountNotFoundException if mismatch)
5. Service increases account balance: `account->setBalance(balance + amount)`
6. Service creates Transaction record: `Transaction::createTransaction()`
7. Service persists transaction and flushes to database
8. Controller returns updated account id and balance

### Transfer Flow

1. HTTP POST to `/api/account/transfer` with `TransferRequestDTO` → `AccountController::transfer()` (`src/Controller/AccountController.php:308`)
2. Controller validates current user is not admin
3. Service `transfer()` validates both accounts exist (`src/Service/AccountService.php:50`)
4. Service checks sender owns from-account via `findAccountOwnedByUser()`
5. Service validates sufficient funds (throws InsufficientFundsException if insufficient)
6. Service begins database transaction: `entityManager->getConnection()->beginTransaction()`
7. Service decrements from-account balance, increments to-account balance
8. Service creates Transaction record with both from/to accounts
9. Service persists and flushes transaction
10. Service commits database transaction: `entityManager->getConnection()->commit()`
11. On exception, transaction is rolled back: `entityManager->getConnection()->rollBack()`
12. Controller returns both account ids and new from-account balance

### Credit Request Flow

1. HTTP POST to `/api/credit/request` with `CreditRequestDTO` → `CreditController::requestCredit()` (`src/Controller/CreditController.php:95`)
2. Controller validates user has ROLE_CREDIT, is not admin
3. Service `createCreditRequest()` checks no active credit exists for user
4. Service validates credit amount within limits (max 1,000,000 per CreditRequestDTO)
5. Service validates account ownership
6. Service creates Credit entity and deposits amount to account via Transaction
7. Service persists credit and transaction
8. Controller returns account id, credit amount, term months, updated balance, credit id

### Get Account Transactions

1. HTTP GET `/api/account/transactions/{id}` → `AccountController::getAccountTransactions()` (`src/Controller/AccountController.php:418`)
2. Controller validates account id > 0, extracts current User
3. Service calls `findAccountOwnedByUser()` for access control
4. Service calls `TransactionRepository::findTransactionsWithTypesByAccount()`
5. Repository executes custom SQL query (`src/Repository/TransactionRepository.php:24`) that:
   - Classifies transfers as 'transfer_in' or 'transfer_out' based on account perspective
   - Negates amount for outgoing transactions
   - Joins transaction types
   - Filters by account id and orders by created_at DESC
6. Service returns AccountTransactionsResponseDTO with account details and formatted transactions
7. Controller returns JSON with account info and transaction history

**State Management:**
- Account balances are mutable fields in the Account entity
- Doctrine tracks changes and flushes to database
- Transactions create an audit trail of all balance changes
- Database transactions ensure consistency for multi-step operations like transfers
- No in-memory caching; all state is in PostgreSQL

## Key Abstractions

**AppException:**
- Purpose: Base exception class for all domain-specific exceptions
- Examples: `src/Exception/Account/AccountNotFoundException.php`, `src/Exception/Account/InsufficientFundsException.php`, `src/Exception/User/UserAlreadyExistsException.php`
- Pattern: Extends PHP Exception with HTTP status codes as exception codes
- Usage: Service layer throws AppException subclasses, controllers catch and map to JSON responses

**Entity Models:**
- Purpose: Represent domain concepts (User, Account, Credit, Transaction)
- Examples: `src/Entity/User.php`, `src/Entity/Account.php`
- Pattern: Doctrine ORM mapped classes with private properties and public getter/setter methods
- Relationships: User→Accounts (1:M), Account→Transactions (1:M), Account→Credits (1:M)

**Data Transfer Objects (DTOs):**
- Purpose: Decouple request/response structures from entities
- Examples: `src/DTO/DepositRequestDTO.php`, `src/DTO/TransferRequestDTO.php`, `src/DTO/AccountTransactionsResponseDTO.php`
- Pattern: Simple PHP classes with public properties, used for validation and serialization
- Validation: Symfony validator attributes on DTO properties

**Repository Pattern:**
- Purpose: Encapsulate database query logic
- Examples: `src/Repository/AccountRepository.php`, `src/Repository/TransactionRepository.php`
- Pattern: Extend ServiceEntityRepository for basic CRUD, add custom methods for complex queries
- Usage: Services call repositories to fetch/persist entities

**Enums:**
- Purpose: Type-safe representation of domain constants
- Examples: `src/Enum/TransactionType.php` (DEPOSIT, TRANSFER, CREDIT_REPAY, CREDIT_ISSUED), `src/Enum/UserRole.php` (ROLE_USER, ROLE_ADMIN, ROLE_CREDIT)
- Pattern: PHP Enums with backed values
- Usage: Transactions store transaction type, services validate against allowed enums

**Authentication/Authorization:**
- Purpose: Enforce security rules
- Pattern: Symfony Security with JWT tokens via LexikJWTAuthenticationBundle
- Roles: ROLE_USER (default), ROLE_ADMIN (user management), ROLE_CREDIT (credit access)
- Attributes: `#[IsGranted()]` on controller methods, `#[CurrentUser]` for authenticated user

## Entry Points

**API Entry Point:**
- Location: `public/index.php`
- Triggers: HTTP request to `/api/*` paths
- Responsibilities: Bootstrap Symfony kernel, route request to appropriate controller

**Authentication Entry Point:**
- Location: `/api/auth/token/login` → `src/Config/security.yaml`
- Triggers: POST request with username/password JSON
- Responsibilities: Validate credentials, generate JWT token, return token in response

**Controller Methods:**
- AccountController::createAccount() - Create new bank account
- AccountController::deposit() - Deposit funds into account
- AccountController::transfer() - Transfer funds between accounts
- AccountController::getAccountTransactions() - Retrieve account transaction history
- CreditController::requestCredit() - Request credit/loan
- CreditController::repayCredit() - Repay credit with funds
- AdminController::register() - Create new user (admin only)
- AdminController::getUserList() - List all users (admin only)

## Architectural Constraints

- **Threading:** Single-threaded synchronous PHP execution model; no background workers or async jobs currently
- **Global state:** Symfony service container acts as singleton registry; Doctrine EntityManager is request-scoped singleton
- **Circular imports:** No circular dependencies detected (verified by layered architecture)
- **Account limits:** Users can have maximum 2 active accounts per business rule in `AccountService::validateCountAccountForUser()`
- **Credit limits:** Users can have only 1 active credit per business rule in `CreditService::createCreditRequest()`
- **Transaction isolation:** Database transactions used for multi-step operations (transfer) to ensure consistency
- **Doctrine change tracking:** EntityManager tracks changes to fetched entities and auto-persists on flush

## Anti-Patterns

### Role Check Repetition in Controllers

**What happens:** Role validation is performed twice - once via `#[IsGranted('ROLE_ADMIN')]` attribute and again with inline `if (in_array('ROLE_ADMIN', $user->getRoles(), true))` check in controller methods (`src/Controller/AccountController.php:78`, `src/Controller/CreditController.php:106`)

**Why it's wrong:** Redundant checks create maintenance burden - if role names change, both locations must be updated. Authorization logic should be centralized at the security layer, not repeated in business code.

**Do this instead:** Remove inline role checks from controller methods (lines 78-80, 190-192, 318-320 in `src/Controller/AccountController.php`, line 106-108 in `src/Controller/CreditController.php`). Use only the declarative `#[IsGranted()]` attribute - Symfony will enforce it before method execution.

### Direct EntityManager Usage in Services

**What happens:** Services directly call `entityManager->getRepository()` and `entityManager->persist/flush()` instead of using injected repository classes (`src/Service/AccountService.php:24`, `src/Service/AccountService.php:31`)

**Why it's wrong:** Tight coupling to Doctrine implementation details. Hard to unit test without database. Makes it difficult to swap out persistence layer or mock repositories in tests.

**Do this instead:** Inject specific `AccountRepository` and `TransactionRepository` into services. Move repository access patterns to repository classes. Use repositories for all entity queries, not EntityManager directly.

### Missing Input Validation in DTOs

**What happens:** Request DTOs like `DepositRequestDTO` exist but validation constraints are absent from observable code. Validation relies on Symfony's request deserialization with default rules.

**Why it's wrong:** No explicit validation rules in DTO classes makes requirements unclear. Edge cases (negative amounts, zero amounts, max amounts) are validated inline in services rather than declaratively.

**Do this instead:** Add Symfony Validator attributes (`#[Assert\Positive]`, `#[Assert\LessThanOrEqual]`, etc.) to all DTO properties. Define validation groups for different request types. Keep validation rules visible in DTO definitions.

## Error Handling

**Strategy:** Exception-based error handling with domain-specific exception hierarchy

**Patterns:**
- Services throw domain exceptions (AppException subclasses) with semantic error messages
- Controllers catch exceptions and map to HTTP status codes (400, 404, 409, 422, 500)
- Event listeners (AccessDeniedListener, AuthBadRequestListener) catch framework exceptions and convert to JSON responses
- All error responses include 'error' field with user-friendly message
- 500 errors may include 'message' field with technical details in non-production environments

**Exception Hierarchy:**
- `AppException` (base, HTTP 400) → `AccountNotFoundException`, `InsufficientFundsException`, `UserAlreadyHaveMaxCountAccountException`
- `AppException` (base, HTTP 400) → `CreditLimitException`, `ActiveCreditExistsException`, `CreditAlreadyRepaid`
- `InvalidArgumentException` (PHP standard) → mapped to HTTP 400
- `AccessDeniedException` → mapped to HTTP 403

## Cross-Cutting Concerns

**Logging:** No explicit logging framework detected; error responses include exception messages to clients. Production should add structured logging (Monolog) for audit trails and debugging.

**Validation:** Symfony Validator framework validates DTO properties during request deserialization via `#[MapRequestPayload]`. Custom validation logic in services (e.g., account ownership checks, balance sufficiency).

**Authentication:** JWT tokens generated on successful login, included in Authorization header for subsequent requests. Token validation happens in security firewall before controller execution.

**Authorization:** Role-based access control via `#[IsGranted]` attributes. Role hierarchy defined in `config/packages/security.yaml` (ROLE_ADMIN inherits ROLE_USER). Request scope access checks in services (e.g., account ownership verification).

---

*Architecture analysis: 2026-07-04*
