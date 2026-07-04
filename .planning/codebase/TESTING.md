# Testing Patterns

**Analysis Date:** 2026-07-04

## Current Testing Infrastructure

**Status:** Not detected. No automated testing framework configured.

- No `tests/` directory exists
- No `phpunit.xml` or `phpunit.xml.dist` configuration
- No PHPUnit in `composer.json` (require-dev section contains only PHP CS Fixer and Maker Bundle)
- No test commands in `Makefile`
- No test configuration files (pest.xml, etc.)

This is a critical gap. **The project currently has zero automated test coverage.**

## Recommended Test Framework

**Primary Recommendation: PHPUnit 11.x**

PHPUnit is the standard for Symfony projects and integrates with:
- Doctrine ORM testing utilities
- Symfony test utilities
- Code coverage reporting
- CI/CD pipelines

**Installation:**
```bash
composer require --dev phpunit/phpunit ^11.0
composer require --dev symfony/test-pack
```

**Configuration:** Create `phpunit.xml.dist` at project root:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="https://schema.phpunit.de/11.0/phpunit.xsd"
         bootstrap="tests/bootstrap.php"
         colors="true"
         beStrictAboutTestsThatDoNotTestAnything="true"
         beStrictAboutOutputDuringTests="true"
         beStrictAboutTodoTestsFalse="true">
    <testsuites>
        <testsuite name="Unit">
            <directory>tests/Unit</directory>
        </testsuite>
        <testsuite name="Functional">
            <directory>tests/Functional</directory>
        </testsuite>
        <testsuite name="Integration">
            <directory>tests/Integration</directory>
        </testsuite>
    </testsuites>
    <coverage processUncoveredFiles="true">
        <include>
            <directory suffix=".php">src</directory>
        </include>
        <exclude>
            <directory>src/Migrations</directory>
        </exclude>
    </coverage>
</phpunit>
```

## Test File Organization

**Location and Naming:**
- Mirror `src/` structure inside `tests/` directory
- Test class suffix: `Test`
- Test method prefix: `test`

**Directory Structure:**
```
tests/
├── Unit/                           # Unit tests - isolated logic
│   ├── Service/
│   │   ├── AccountServiceTest.php
│   │   ├── UserServiceTest.php
│   │   └── CreditServiceTest.php
│   ├── Entity/
│   │   ├── UserTest.php
│   │   ├── AccountTest.php
│   │   └── TransactionTest.php
│   └── Enum/
│       └── TransactionTypeTest.php
├── Functional/                     # Functional tests - Controller integration
│   └── Controller/
│       ├── AccountControllerTest.php
│       ├── AdminControllerTest.php
│       └── CreditControllerTest.php
├── Integration/                    # Integration tests - Database + Services
│   └── Service/
│       ├── AccountServiceIntegrationTest.php
│       └── TransferOperationIntegrationTest.php
├── Fixtures/                       # Test data
│   ├── UserFixture.php
│   └── AccountFixture.php
├── bootstrap.php                   # PHPUnit bootstrap
└── TestBase.php                    # Common test utilities
```

## Test Structure Pattern

**Base Class Pattern:**

All tests should extend from a common base providing Symfony/Doctrine utilities:

```php
<?php
namespace App\Tests;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;

abstract class TestBase extends WebTestCase
{
    protected KernelBrowser $client;
    protected EntityManagerInterface $entityManager;

    protected function setUp(): void
    {
        parent::setUp();
        $this->client = static::createClient();
        $this->entityManager = static::getContainer()->get(EntityManagerInterface::class);
    }

    protected function tearDown(): void
    {
        parent::tearDown();
        $this->entityManager->close();
    }
}
```

**Unit Test Pattern:**

Test service logic in isolation:

```php
<?php
namespace App\Tests\Unit\Service;

use App\Entity\User;
use App\Entity\Account;
use App\Service\AccountService;
use App\Exception\Account\InsufficientFundsException;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\MockObject\MockObject;

class AccountServiceTest extends TestCase
{
    private AccountService $accountService;
    private MockObject $entityManager;

    protected function setUp(): void
    {
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->accountService = new AccountService($this->entityManager);
    }

    public function testTransferWithInsufficientFunds(): void
    {
        // Arrange
        $fromAccount = new Account();
        $fromAccount->setBalance(50.00);
        
        $toAccount = new Account();
        $toAccount->setBalance(100.00);
        
        $user = new User();

        // Assert expectation
        $this->expectException(InsufficientFundsException::class);

        // Act
        $this->accountService->transfer(1, 2, 100.00, $user);
    }
}
```

**Functional Test Pattern:**

Test controllers with full kernel bootstrap:

```php
<?php
namespace App\Tests\Functional\Controller;

use App\Tests\TestBase;
use Symfony\Component\HttpFoundation\Response;

class AccountControllerTest extends TestBase
{
    public function testCreateAccountRequiresAuthentication(): void
    {
        // Act
        $this->client->request('POST', '/api/account/create');

        // Assert
        $this->assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testAdminCannotCreateAccount(): void
    {
        // Arrange
        $admin = $this->createAdminUser();
        $this->client->loginUser($admin);

        // Act
        $this->client->request('POST', '/api/account/create');

        // Assert
        $this->assertResponseStatusCodeSame(Response::HTTP_FORBIDDEN);
    }

    public function testDepositUpdatesBalance(): void
    {
        // Arrange
        $user = $this->createUser();
        $account = $this->createAccountForUser($user);
        $this->client->loginUser($user);

        // Act
        $this->client->request('POST', '/api/account/deposit', [], [], 
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['accountId' => $account->getId(), 'amount' => 500.00])
        );

        // Assert
        $this->assertResponseStatusCodeSame(Response::HTTP_OK);
        $response = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertEquals(500.00, $response['balance']);
    }
}
```

**Integration Test Pattern:**

Test workflows involving database and multiple services:

```php
<?php
namespace App\Tests\Integration\Service;

use App\Tests\TestBase;

class TransferOperationIntegrationTest extends TestBase
{
    public function testCompleteTransferFlow(): void
    {
        // Arrange - create users and accounts with real DB
        $sender = $this->createUser('sender@example.com');
        $recipient = $this->createUser('recipient@example.com');
        
        $senderAccount = $this->createAccountForUser($sender);
        $senderAccount->setBalance(1000.00);
        
        $recipientAccount = $this->createAccountForUser($recipient);
        $recipientAccount->setBalance(0.00);
        
        $this->entityManager->persist($sender);
        $this->entityManager->persist($recipient);
        $this->entityManager->persist($senderAccount);
        $this->entityManager->persist($recipientAccount);
        $this->entityManager->flush();

        $accountService = static::getContainer()->get(AccountService::class);

        // Act
        $result = $accountService->transfer(
            $senderAccount->getId(),
            $recipientAccount->getId(),
            250.00,
            $sender
        );

        // Assert
        $this->assertEquals(750.00, $result['fromAccount']->getBalance());
        $this->assertEquals(250.00, $result['toAccount']->getBalance());
        
        // Verify transactions were recorded
        $transactions = $this->entityManager
            ->getRepository(Transaction::class)
            ->findBy(['toAccount' => $recipientAccount]);
        $this->assertCount(1, $transactions);
    }
}
```

## Mocking

**Framework:** PHPUnit built-in mocking via `MockObject` and `TestDouble`

**What to Mock:**
- External services not in scope (payment gateways, third-party APIs)
- EntityManager in unit tests (keep tests fast, not hitting database)
- Repository methods when testing specific service behavior
- Symfony HttpClient when testing HTTP calls

**What NOT to Mock:**
- Entities (use real objects for clearer tests)
- Exceptions (throw real exceptions to test error paths)
- Database/Doctrine in integration tests (that's the point)
- Controllers in functional tests (use kernel and real HTTP)

**Mocking Pattern:**

```php
// Unit test - mock EntityManager
$entityManager = $this->createMock(EntityManagerInterface::class);
$entityManager->method('getRepository')
    ->willReturn($this->createMock(AccountRepository::class));

// Functional test - use kernel, no mocking
$this->client = static::createClient();
$this->client->request('POST', '/api/account/deposit', ...);
```

## Fixtures and Test Data

**Location:** `tests/Fixtures/`

**Factory Pattern:**

Create helper methods in `TestBase` or separate factory classes:

```php
// In TestBase
protected function createUser(string $username = 'testuser', string $password = 'password123'): User
{
    $user = new User();
    $user->setUsername($username);
    $user->setPassword(password_hash($password, PASSWORD_BCRYPT));
    $user->setRole('ROLE_USER');
    $this->entityManager->persist($user);
    $this->entityManager->flush();
    return $user;
}

protected function createAccountForUser(User $user, float $balance = 0.00): Account
{
    $account = new Account();
    $account->setUser($user);
    $account->setNumber(sprintf('%07d', random_int(1000000, 9999999)));
    $account->setBalance($balance);
    $this->entityManager->persist($account);
    $this->entityManager->flush();
    return $account;
}
```

**Doctrine Fixtures Bundle:**

Already installed: `doctrine/doctrine-fixtures-bundle: ^4.3.1`

Existing fixtures at:
- `src/DataFixtures/AppFixtures.php`
- `src/DataFixtures/UserFixtures.php`

These can be used in tests via:
```bash
php bin/console doctrine:fixtures:load --env=test
```

## Coverage

**Requirements:** Not enforced (no CI/CD detected)

**View Coverage:**

After installing PHPUnit:
```bash
vendor/bin/phpunit --coverage-html coverage/
vendor/bin/phpunit --coverage-text
```

**Coverage Goals (Recommended):**
- Services: 80%+ (business logic critical)
- Controllers: 60%+ (routing/HTTP testing valuable)
- Entities: 40%+ (mostly getters/setters)
- Exceptions: 100% (small, critical classes)

## Test Types

**Unit Tests:**
- Scope: Single class/method in isolation
- Dependencies: Mocked
- Database: No
- Location: `tests/Unit/`
- Example: Test `AccountService::transfer()` without database
- Speed: < 1ms per test

**Functional Tests:**
- Scope: Controller + Symfony kernel, partial integration
- Dependencies: Real services from container, mocked external services
- Database: Test database (sqlite in-memory)
- Location: `tests/Functional/`
- Example: Test `AccountController::deposit()` with real validation, mocked EntityManager
- Speed: 10-100ms per test

**Integration Tests:**
- Scope: Full stack including database
- Dependencies: All real
- Database: Test database (migrations run)
- Location: `tests/Integration/`
- Example: Test complete transfer flow with multiple services and real transactions
- Speed: 100ms-1s per test

## Common Patterns

**Arrange-Act-Assert (AAA):**

All tests follow this pattern:

```php
public function testAccountCannotTransferToSelf(): void
{
    // Arrange - Set up test data
    $user = $this->createUser();
    $account = $this->createAccountForUser($user, 1000.00);
    $accountService = new AccountService($this->entityManager);

    // Act - Execute code being tested
    // Assert - Verify outcome
    $this->expectException(\InvalidArgumentException::class);
    $accountService->transfer($account->getId(), $account->getId(), 100.00, $user);
}
```

**Async Testing:**

PHPUnit handles synchronous PHP code. For async Symfony operations (if needed):

```php
public function testEventIsDispatched(): void
{
    $this->client->request('POST', '/api/account/create');
    // Event listeners execute synchronously in tests
    $this->assertEmailCount(1); // if using Symfony Messenger
}
```

**Error Testing:**

Test exceptions and error responses:

```php
public function testDepositWithNegativeAmountFails(): void
{
    // Expect validation to catch this
    $this->expectException(ValidationException::class);
    
    // Or for controller-level errors
    $this->client->request('POST', '/api/account/deposit', [], [],
        ['CONTENT_TYPE' => 'application/json'],
        json_encode(['accountId' => 1, 'amount' => -100.00])
    );
    
    $this->assertResponseStatusCodeSame(Response::HTTP_BAD_REQUEST);
}
```

## Missing Test Infrastructure

**Critical Gaps:**
1. No test database configuration (SQLite for tests recommended)
2. No test fixtures beyond `DataFixtures/` (need factory methods)
3. No test bootstrap or kernel initialization
4. No CI/CD test execution (no GitHub Actions, GitLab CI, etc.)

**Recommended Setup:**

```bash
# 1. Add PHPUnit and test utilities
composer require --dev phpunit/phpunit symfony/test-pack symfony/browser-kit

# 2. Create test environment config
mkdir -p tests
echo '<?php require dirname(__DIR__) . "/vendor/autoload.php";' > tests/bootstrap.php

# 3. Create phpunit.xml.dist (template provided above)

# 4. Add test commands to Makefile
echo "test:" >> Makefile
echo "	docker-compose exec php vendor/bin/phpunit" >> Makefile

# 5. Run first test
make test
```

---

*Testing analysis: 2026-07-04*
