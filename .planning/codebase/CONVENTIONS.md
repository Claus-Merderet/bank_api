# Coding Conventions

**Analysis Date:** 2026-07-04

## Naming Patterns

**Files:**
- Class files: `PascalCase.php` matching class name exactly
  - Example: `AccountController.php`, `AccountService.php`, `User.php`
- Namespaces mirror directory structure: `App\Controller`, `App\Service`, `App\Entity`

**Classes and Types:**
- PascalCase: `AccountController`, `UserService`, `AccountNotFoundException`
- Interfaces: PascalCase (no `Interface` suffix)
- Traits: PascalCase (no `Trait` suffix)
- Enums: PascalCase, backing values SCREAMING_SNAKE_CASE
  - Example: `enum TransactionType: string { case DEPOSIT = 'deposit'; }`

**Functions and Methods:**
- camelCase: `createAccount()`, `getBalance()`, `setUser()`, `validateCountAccountForUser()`
- Getters: `get{PropertyName}()` → `getId()`, `getUser()`, `getBalance()`
- Setters: `set{PropertyName}()` → `setUser()`, `setBalance()`
- Boolean getters: `is{PropertyName}()` or `has{PropertyName}()` → may use `getRoles()`
- Private helper methods: camelCase with descriptive names → `generateUniqueAccountNumber()`, `findAccountOwnedByUser()`

**Properties and Variables:**
- Private properties: camelCase → `$accountId`, `$amount`, `$balance`
- Public DTO properties: camelCase → `$accountId`, `$amount`
- Class constants: SCREAMING_SNAKE_CASE (if any exist)
- Loop variables: single letter or meaningful abbreviations → `$a` in QueryBuilder, `$user` in collections

**Type Constants and Enums:**
- Enum cases: SCREAMING_SNAKE_CASE → `TransactionType::DEPOSIT`, `UserRole::ADMIN`
- HTTP status constants: `Response::HTTP_OK`, `Response::HTTP_NOT_FOUND`

## Code Style

**Formatting:**
- Indentation: 4 spaces (no tabs)
- Line endings: LF (Unix style)
- Charset: UTF-8
- Files end with newline: Yes
- Trim trailing whitespace: Yes

**Linting and Formatting:**
- Tool: PHP CS Fixer v3.91.3
- Config: `.php-cs-fixer.dist.php`
- Run: `composer cs-fix` (apply fixes), `composer cs-check` (dry-run)

**Key Rules Applied:**
- `@Symfony` and `@Symfony:risky` rule sets
- `@PHP80Migration` and `@PHP81Migration` compatibility
- Array syntax: short `[]` instead of `array()`
- No unused imports
- Imports ordered: class, function, const (alphabetical within groups)
- PHPDoc: ordered (`@param`, `@return`, `@throws`, etc.)
- No declare strict types (not enforced globally)
- No Yoda style (`$value === $var` not `$var === $value`)
- No native function invocation
- Blank lines before: return, throw, try statements

**Editor Config (`.editorconfig`):**
- YAML files: 2 spaces indent
- Markdown files: preserve trailing whitespace
- All other files: 4 spaces, LF, UTF-8

## Import Organization

**Order:**
1. Standard PHP classes (`DateTime`, `Throwable`, etc.)
2. Symfony framework classes (`Symfony\Bundle\`, `Symfony\Component\`, etc.)
3. Application classes (`App\Entity\`, `App\Service\`, `App\DTO\`, etc.)
4. Library/vendor classes (all others)

**Within Each Group:**
- Alphabetical order
- All imports in single `use` statements (one per line)

**Path Aliases:**
- None detected; full namespace paths used throughout
- Autoload: PSR-4 with `App\` namespace mapping to `src/` directory

## Error Handling

**Patterns:**
- Custom exception hierarchy with base class `AppException` in `src/Exception/AppException.php`
  - Extends `\Exception`
  - Default code: 400 (Bad Request)
  - Domain-specific exceptions extend `AppException` with custom codes matching HTTP status
- Domain-specific exceptions: `src/Exception/{Domain}/{SpecificException}.php`
  - Example: `AccountNotFoundException` → HTTP 404
  - Example: `InsufficientFundsException` → HTTP 422
- Controllers wrap business logic in try-catch:
  - Catch `AppException` first → extract message and code
  - Catch specific built-in exceptions: `AccessDeniedException`, `InvalidArgumentException`
  - Catch generic `\Exception` last → return 500 Internal Server Error
- Return format: `JsonResponse(['error' => $message], $httpCode)`
- Database transactions: explicit `beginTransaction()`, `commit()`, `rollBack()` with try-catch
  - Example in `AccountService::transfer()` (lines 67-87)

## Logging

**Framework:** Console output and event listeners
- No dedicated logging package detected
- Output via `JsonResponse` for API responses
- Event listeners handle exception transformation: `src/EventListener/`

**Patterns:**
- Log via exception messages
- Event listeners convert exceptions to JSON responses

## Comments

**When to Comment:**
- Method-level: Rare; code is self-documenting via clear naming
- Complex logic: Inline comments where business logic requires explanation
- TODOs: Found at lines 189 (AccountController), 105/217 (CreditController), 109 (User.php)
  - Example: `// TODO переделать нормально здесь` (refactor this properly)

**Documentation:**
- OpenAPI/NelmIO documentation via attributes (extensive)
  - Example: `#[OA\Post(...)]`, `#[OA\Response(...)]`
- PHPDoc: Minimal; mostly on collection return types
  - Example: `@var Collection<int, Account>`
- JSDoc/TSDoc: Not applicable (PHP project)

## Function Design

**Size:**
- No strict limit; typical methods 15-50 lines
- Longest method: ~60 lines (with extensive try-catch and error handling)

**Parameters:**
- Constructor injection preferred over method parameters
- Attributes for mapping: `#[MapRequestPayload]`, `#[CurrentUser]`
- Private methods take scalar and object parameters
- Example: `public function transfer(int $fromAccountId, int $toAccountId, float $amount, User $currentUser): array`

**Return Values:**
- Typed returns: `?int`, `?string`, `?float`, `Collection`, `array`, `JsonResponse`
- Nullable return types: `?Account` when entity lookup may fail
- Fluent interface: Setters return `static` for method chaining
- Array returns: Used for complex results (e.g., `['fromAccount' => $from, 'toAccount' => $to]`)
- DTOs for structured responses: `AccountTransactionsResponseDTO(id, number, balance, transactions)`

## Module Design

**Exports:**
- Services: Singleton autowired via Symfony DI (`config/services.yaml`)
- Controllers: Extend `AbstractController`
- Entities: Auto-registered repositories
- Exceptions: Thrown by services, caught by event listeners or controllers

**Barrel Files:**
- Not used; no `index.php` export files

**Service Registration:**
- Automatic autowiring: `config/services.yaml` line 16 registers all `App\` classes
- Explicit tags for event listeners (lines 19-30)

## Architecture Patterns

**Layers:**
1. Controller → receives HTTP request
2. Service → business logic (validation, entity management, transactions)
3. Repository → database queries
4. Entity → domain model
5. DTO → request/response mapping
6. Exception → error representation

**Example Flow:**
- Request → `AccountController::deposit()` → `AccountService::deposit()` → `EntityManager::persist()` → `JsonResponse`

**Key Patterns:**
- Readonly services: `readonly class AccountService { public function __construct(...) {} }`
- Constructor property promotion: `public function __construct(public int $id, public string $number) {}`
- Factory methods: Static methods on entities → `User::createUserFromRegisterRequestDTO()`
- Validation: DTO attributes + MapRequestPayload validation
- Transactional operations: Explicit transaction control in services

---

*Convention analysis: 2026-07-04*
