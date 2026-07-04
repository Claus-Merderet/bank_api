# Codebase Concerns

**Analysis Date:** 2026-07-04

## Tech Debt

**Controller Code Duplication:**
- Issue: Identical role check pattern repeated in multiple controller methods (checking `in_array('ROLE_ADMIN', ...)`)
- Files: `src/Controller/AccountController.php` (lines 78-79, 190-191, 318-319), `src/Controller/CreditController.php` (lines 106-108, 218-220)
- Impact: Code maintenance burden, inconsistent error responses, violates DRY principle
- Fix approach: Extract admin role validation into a reusable method or use Symfony security voters/attributes

**Method Naming Typo:**
- Issue: `creatAccount()` method should be `createAccount()`
- Files: `src/Service/AccountService.php` (line 90)
- Impact: Confuses developers, breaks naming conventions
- Fix approach: Rename method to `createAccount()` and update all references

**Credit Balance Design Confusion:**
- Issue: Credit balance is stored as negative value (line 87 in `src/Entity/Credit.php`), documented with comment "Возвращает отрицательное значение!!!" (Returns negative value!!!), then code uses `abs()` to work with it
- Files: `src/Entity/Credit.php`, `src/Service/CreditService.php` (line 111, 114, 117)
- Impact: Confusing business logic, error-prone calculations, hard to understand intent
- Fix approach: Store credit balance as positive value and adjust logic accordingly to clarify semantics

**Exception Details Exposed in API Responses:**
- Issue: Raw exception messages with internal details sent to clients (contains `$e->getMessage()` in catch blocks)
- Files: `src/Controller/AccountController.php` (lines 92, 201, 338, 438), `src/Controller/CreditController.php` (lines 121, 227, 289)
- Impact: Information disclosure risk, leaks internal structure, poor UX for clients
- Fix approach: Log full errors server-side, return generic messages to clients with correlation IDs

**Type Inconsistency in Account Creation:**
- Issue: Account balance set as string `'0.00'` instead of float
- Files: `src/Service/AccountService.php` (line 99)
- Impact: Type confusion, implicit casting, potential calculation errors
- Fix approach: Use float type: `$account->setBalance(0.0)`

**Null Return Value Handling:**
- Issue: `creatAccount()` method can return null (line 113 in `src/Service/AccountService.php`) but callers don't check for it
- Files: `src/Service/AccountService.php` (lines 90-113), `src/Controller/AccountController.php` (line 82)
- Impact: Potential null pointer exceptions if method returns null
- Fix approach: Either throw exception on failure or handle null in caller

**Overly Strict Credit Repayment Logic:**
- Issue: Credit must be repaid with exact amount (line 117 in `src/Service/CreditService.php`), can't pay more or less
- Files: `src/Service/CreditService.php` (line 117-119)
- Impact: Poor user experience, inflexible payment handling, users can't pay off slightly more
- Fix approach: Allow paying up to full remaining balance, adjust balance accordingly

**Password Validation Regex Complexity:**
- Issue: Multiple separate regex constraints for single password field instead of combined pattern
- Files: `src/DTO/RegisterRequestDTO.php` (lines 29-48)
- Impact: Maintenance burden, difficult to read, slow validation
- Fix approach: Use single comprehensive regex or create dedicated password validator

---

## Security Concerns

**Hardcoded Database Credentials:**
- Risk: Database credentials exposed in docker-compose.yml with weak password "password"
- Files: `docker-compose.yml` (lines 24, 35)
- Current mitigation: None
- Recommendations: Use environment variables for all credentials, never commit them to git, use strong random passwords, don't expose database port 5432 to external access

**Hardcoded Default Admin Password:**
- Risk: Default admin password '123456' hardcoded in fixtures and available in git history
- Files: `src/DataFixtures/UserFixtures.php` (line 22)
- Current mitigation: None
- Recommendations: Remove fixtures with hardcoded passwords, use strong random initial password, force password change on first login

**No Audit Logging:**
- Risk: No logging of financial transactions, account modifications, or login attempts - critical for banking system compliance
- Files: All services and controllers lack logging
- Current mitigation: None
- Recommendations: Add comprehensive logging for: user login/logout, account creation, deposits, transfers, credit requests/repayments, all errors

**No Rate Limiting:**
- Risk: API endpoints vulnerable to brute force attacks (especially login), DDoS attacks, and malicious API scraping
- Files: No rate limiting configuration found
- Current mitigation: None
- Recommendations: Implement rate limiting on all endpoints, especially `/api/auth/token/login`, consider IP-based and user-based limits

**Weak Account Number Generation:**
- Risk: Account numbers are simple 7-digit numbers (1000000-9999999), not cryptographically random, potentially predictable/guessable
- Files: `src/Service/AccountService.php` (line 131)
- Current mitigation: None
- Recommendations: Use cryptographically secure account number generation (UUID or crypto random), or incorporate user hash

**Incomplete `eraseCredentials()` Implementation:**
- Risk: Sensitive data may not be properly cleared from User entity after authentication
- Files: `src/Entity/User.php` (line 109)
- Current mitigation: None
- Recommendations: Implement proper credential erasure for security best practices

**Single Role per User Design:**
- Risk: User can only have one role, but code checks for multiple roles (`in_array('ROLE_ADMIN', ...)`), inconsistent with Symfony role hierarchy
- Files: `src/Entity/User.php` (line 104), controllers throughout
- Current mitigation: Role hierarchy partially defined in security.yaml
- Recommendations: Support multiple roles per user, use Symfony's role hierarchy consistently

**No CSRF Protection Verification:**
- Risk: No explicit CSRF token handling seen in API routes
- Files: API routes in controllers
- Current mitigation: May be handled at framework level for stateless JWT
- Recommendations: Verify CSRF protection is not needed for stateless JWT API, or add CSRF token rotation for sensitive operations

---

## Test Coverage Gaps

**Zero Test Coverage:**
- What's not tested: All business logic, controllers, services, entities
- Files: No test files found (autoload-dev configured for `tests/` but directory empty)
- Risk: Regressions in financial operations undetected, untested edge cases, no confidence in refactoring
- Priority: **CRITICAL** - For a banking API, test coverage is essential

**No Integration Tests:**
- What's not tested: Multi-step transaction flows, concurrent account operations, database transaction handling
- Risk: Race conditions undetected, transaction isolation issues missed
- Priority: **HIGH**

**No E2E Tests:**
- What's not tested: End-to-end user workflows (register → create account → deposit → transfer)
- Risk: API contract changes undetected, authentication flow issues
- Priority: **HIGH**

---

## Performance Bottlenecks

**N+1 Query Problem Potential:**
- Problem: Account transactions query (line 119 in `src/Service/AccountService.php`) may not eager-load related data
- Files: `src/Service/AccountService.php`, `src/Repository/TransactionRepository.php`
- Cause: Repository method `findTransactionsWithTypesByAccount()` implementation unclear
- Improvement path: Verify eager loading in repository query, use SQL joins or Doctrine fetch modes

**UUID vs Integer Primary Keys:**
- Problem: Integer IDs (1, 2, 3...) used for account/credit IDs are sequential and guessable
- Files: `src/Entity/Account.php`, `src/Entity/Credit.php`
- Cause: Doctrine default auto-increment strategy
- Improvement path: Consider using UUID or obfuscated IDs for public-facing resources

**Retry Loop in Account Creation:**
- Problem: Max 5 retries for unique constraint violation adds latency
- Files: `src/Service/AccountService.php` (lines 92-113)
- Cause: Account number collision handling with simple retry loop
- Improvement path: Use better account number generation to avoid collisions, or use database-level retry

---

## Fragile Areas

**AccountController Complexity:**
- Files: `src/Controller/AccountController.php` (441 lines)
- Why fragile: Large class handling create, deposit, transfer, and history operations with repetitive error handling
- Safe modification: Extract logic into separate handlers, use consistent response formatting
- Test coverage: Missing - should have comprehensive unit and integration tests

**CreditController Complexity:**
- Files: `src/Controller/CreditController.php` (292 lines)
- Why fragile: Complex business logic mixed with HTTP handling, inline exception handling
- Safe modification: Extract credit operations into separate service methods
- Test coverage: Missing - especially for repayment edge cases

**CreditService Validation:**
- Files: `src/Service/CreditService.php` (lines 98-122)
- Why fragile: Complex repayment validation with strict exact-amount requirement and confusing balance semantics
- Safe modification: Separate validation from business logic, clarify negative balance handling
- Test coverage: Missing

**Transaction Handling:**
- Files: `src/Service/AccountService.php` (lines 67-87), `src/Service/CreditService.php` (lines 70-95)
- Why fragile: Manual transaction management with try-catch-rollback, re-throws same exception
- Safe modification: Consider Symfony transaction helpers or ensure proper exception hierarchy
- Test coverage: Missing - concurrent transaction scenarios untested

---

## Known Bugs

**TODO Comments in Critical Paths:**
- Symptoms: Code marked as "needs rework" in production flows
- Files: `src/Controller/AccountController.php` (line 189), `src/Controller/CreditController.php` (lines 105, 217)
- Trigger: Any deposit, transfer, or credit repayment operation
- Workaround: None - these are acknowledged issues in active code paths

**Unimplemented `eraseCredentials()` Method:**
- Symptoms: Security method does nothing (empty implementation)
- Files: `src/Entity/User.php` (line 109)
- Trigger: User authentication/logout operations
- Workaround: None

---

## Missing Critical Features

**Audit Trail for Financial Transactions:**
- Problem: No logging of who did what when for regulatory compliance
- Blocks: Cannot satisfy banking compliance requirements (PCI-DSS, local banking regulations)
- Current state: Zero logging implementation

**Rate Limiting / Throttling:**
- Problem: No protection against brute force or abuse
- Blocks: Cannot be safely deployed to production
- Current state: No configuration exists

**Request Logging and Correlation IDs:**
- Problem: Cannot trace requests through system for debugging
- Blocks: Difficult to diagnose production issues
- Current state: No logging infrastructure

**Comprehensive Input Validation:**
- Problem: DTO validation exists but no consistent validation at service layer
- Blocks: Invalid data can reach database
- Current state: Partial validation via DTOs only

---

## Scaling Limits

**No Database Indexes Strategy:**
- Current capacity: Works for small datasets; unknown without profiling
- Limit: Linear query performance as data grows
- Scaling path: Profile queries, add indexes on foreign keys and frequently filtered columns

**Account Number Collision Handling:**
- Current capacity: 9 million possible account numbers with retry mechanism
- Limit: At scale, retries increase latency significantly
- Scaling path: Use UUID or incremental account number scheme with less collision risk

**Transaction History Query Performance:**
- Current capacity: Unknown pagination strategy
- Limit: Loading all transactions for an account in single query will degrade with history size
- Scaling path: Implement pagination, archive old transactions, add indexes

---

## Dependencies at Risk

**Old Testing Infrastructure:**
- Risk: No test framework installed despite `require-dev` containing fixtures
- Impact: Cannot add tests without installing phpunit/testing framework
- Migration plan: Add `symfony/test-pack` or `phpunit` to require-dev, create test suite

---

## Code Quality Issues

**Inconsistent Error Response Format:**
- Observation: Some responses include both 'error' and 'message', others only 'error'
- Files: `src/Controller/AccountController.php` (lines 85, 92, 195, 201, 338)
- Fix: Standardize error response structure across all endpoints

**Inconsistent Use of `in_array()` vs Symfony Security:**
- Observation: Manual role checking in controllers using `in_array()` instead of security voters/attributes
- Files: `src/Controller/AccountController.php`, `src/Controller/CreditController.php`
- Fix: Use Symfony `#[IsGranted]` attributes or custom security voters

**Magic Numbers in Code:**
- Observation: Hardcoded limits (2 accounts max, 60 month max term, 1M max amount) scattered throughout
- Files: Controllers, services, DTOs
- Fix: Move all business rules to configuration or constants

**DTO Validation Message Inconsistency:**
- Observation: Choice constraint message says "ROLE_USER or ROLE_ADMIN" but includes "ROLE_CREDIT_SECRET"
- Files: `src/DTO/RegisterRequestDTO.php` (lines 52-55)
- Fix: Update message to match actual choices

---

*Concerns audit: 2026-07-04*
