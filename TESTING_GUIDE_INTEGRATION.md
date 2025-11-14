# Integration Testing Guide - Discount API

## 📋 Overview

This guide covers the comprehensive integration tests for the Discount API endpoints using **Vitest** and **Supertest-style** testing with Remix Request/Response objects.

## 🎯 What Was Tested

### ✅ Core API Endpoints
- `GET /api/discounts` - Fetch all discounts or specific discount by ID
- `POST /api/discounts` - Create new discount
- `PATCH /api/discounts` - Update existing discount
- `DELETE /api/discounts` - Delete discount
- `POST /api/apply-cart-discount` - Calculate and apply discounts to cart

### ✅ Discount Rule Resolution
- Best discount selection when multiple discounts apply
- Percentage vs Fixed discount comparison
- Product-specific discount application
- Multi-product cart discount calculation

### ✅ Authentication & Security
- Shopify Admin authentication validation
- Unauthenticated request rejection
- Session validation
- Concurrent request handling

### ✅ Validation & Error Handling
- Missing required fields
- Invalid data types
- Malformed JSON requests
- Database errors
- Edge cases

## 📁 Test Files

### 1. API Discounts Integration Tests
**File:** `tests/integration/api-discounts.integration.test.js`
**Tests:** 20
**Focus:** CRUD operations on discount endpoints

```javascript
describe('Discount API Integration Tests', () => {
  // GET /api/discounts
  // POST /api/discounts
  // PATCH /api/discounts
  // DELETE /api/discounts
  // Complex integration scenarios
});
```

### 2. Cart Discount Integration Tests
**File:** `tests/integration/cart-discount.integration.test.js`
**Tests:** 24
**Focus:** Cart discount calculations and rule resolution

```javascript
describe('Cart Discount Integration Tests', () => {
  // Basic functionality
  // Discount rule resolution
  // Validation and error handling
  // Complex cart scenarios
  // Edge cases
});
```

### 3. Authentication Integration Tests
**File:** `tests/integration/authentication.integration.test.js`
**Tests:** 22
**Focus:** Authentication, security, and concurrent operations

```javascript
describe('Authentication and Security Integration Tests', () => {
  // Unauthenticated requests
  // Authenticated requests
  // Session validation
  // Concurrent request handling
  // Error recovery
});
```

## 🚀 Running Tests

### Run All Integration Tests
```bash
npm test -- tests/integration/api-discounts.integration.test.js tests/integration/cart-discount.integration.test.js tests/integration/authentication.integration.test.js
```

### Run Individual Test Suites
```bash
# API Discount Tests (20 tests)
npm test -- tests/integration/api-discounts.integration.test.js

# Cart Discount Tests (24 tests)
npm test -- tests/integration/cart-discount.integration.test.js

# Authentication Tests (22 tests)
npm test -- tests/integration/authentication.integration.test.js
```

### Run with Coverage
```bash
npm test -- --coverage tests/integration/
```

### Watch Mode (for development)
```bash
npm run test:watch -- tests/integration/api-discounts.integration.test.js
```

## ✅ Test Results

```
✅ api-discounts.integration.test.js: 20/20 passed
✅ cart-discount.integration.test.js: 24/24 passed
✅ authentication.integration.test.js: 22/22 passed

Total: 66/66 tests passed ✅
```

## 🧪 Test Examples

### Example 1: Testing Discount Creation
```javascript
it('should create a new discount with valid data', async () => {
  const discountData = {
    name: 'Black Friday Sale',
    type: 'percentage',
    value: 25,
    productIds: ['prod_100', 'prod_200'],
  };

  const mockRequest = createMockRequest('/api/discounts', {
    method: 'POST',
    body: discountData,
  });
  const response = await action({ request: mockRequest });
  const { status, data } = await parseResponse(response);

  expect(status).toBe(201);
  expect(data.success).toBe(true);
  expect(data.discount.name).toBe('Black Friday Sale');
});
```

### Example 2: Testing Discount Rule Resolution
```javascript
it('should select the best percentage discount when multiple exist', async () => {
  // Create two percentage discounts for same product
  await discountService.createDiscount({
    name: '10% Off',
    type: 'percentage',
    value: 10,
    productIds: ['prod_1'],
  });
  await discountService.createDiscount({
    name: '25% Off',
    type: 'percentage',
    value: 25,
    productIds: ['prod_1'],
  });

  const cartData = {
    items: [{ productId: 'prod_1', quantity: 1, price: 100 }],
  };

  const response = await action({
    request: createMockRequest('/api/apply-cart-discount', {
      method: 'POST',
      body: cartData,
    })
  });
  const { data } = await parseResponse(response);

  // Should apply the 25% discount (better)
  expect(data.cart.totalDiscount).toBe(25);
  expect(data.cart.items[0].discount.name).toBe('25% Off');
});
```

### Example 3: Testing Authentication
```javascript
it('should reject unauthenticated GET /api/discounts request', async () => {
  // Mock authentication to reject requests
  vi.spyOn(shopifyServer.authenticate, 'admin').mockRejectedValue(
    new Error('Authentication failed: Invalid session')
  );

  const mockRequest = createMockRequest('/api/discounts');

  await expect(discountsLoader({ request: mockRequest })).rejects.toThrow(
    'Authentication failed'
  );

  expect(shopifyServer.authenticate.admin).toHaveBeenCalledWith(mockRequest);
});
```

## 🔧 Test Helpers

### createMockRequest(url, options)
Creates a mock Remix Request object for testing.

```javascript
const mockRequest = createMockRequest('/api/discounts', {
  method: 'POST',
  body: { name: 'Test', type: 'percentage', value: 20, productIds: [] },
  headers: { 'Content-Type': 'application/json' },
});
```

### parseResponse(response)
Parses Response and extracts status and data.

```javascript
const { status, data } = await parseResponse(response);
```

## 🎭 Mocking Strategy

### Shopify Authentication Mock
```javascript
vi.mock('../../app/shopify.server.js', () => ({
  authenticate: {
    admin: vi.fn().mockResolvedValue({
      session: {
        shop: 'test-shop.myshopify.com',
        accessToken: 'test_token',
      },
      admin: {
        graphql: vi.fn(),
      },
    }),
  },
}));
```

### Custom Mock for Unauthenticated Tests
```javascript
vi.spyOn(shopifyServer.authenticate, 'admin').mockRejectedValue(
  new Error('Authentication failed: Invalid session')
);
```

## 📊 Coverage Areas

### 1. HTTP Methods
- ✅ GET
- ✅ POST
- ✅ PATCH
- ✅ DELETE
- ✅ Unsupported methods (405 errors)

### 2. Status Codes
- ✅ 200 OK
- ✅ 201 Created
- ✅ 400 Bad Request
- ✅ 404 Not Found
- ✅ 405 Method Not Allowed
- ✅ 500 Internal Server Error

### 3. Discount Types
- ✅ Percentage discounts
- ✅ Fixed amount discounts
- ✅ Best discount selection

### 4. Cart Scenarios
- ✅ Empty cart
- ✅ Single item
- ✅ Multiple items
- ✅ Mixed discounted/non-discounted items
- ✅ High-value carts
- ✅ Decimal prices
- ✅ Large quantities

### 5. Edge Cases
- ✅ Zero prices
- ✅ Negative values
- ✅ 100% discounts
- ✅ Discounts greater than item price
- ✅ Very large quantities (1000+)
- ✅ Special characters in names
- ✅ Malformed JSON
- ✅ Missing required fields

### 6. Authentication
- ✅ Valid authentication
- ✅ Missing authentication
- ✅ Expired tokens
- ✅ Invalid shop domain
- ✅ Malformed tokens
- ✅ Session timeouts

### 7. Concurrency
- ✅ Multiple concurrent reads
- ✅ Multiple concurrent writes
- ✅ Mixed concurrent operations
- ✅ Rapid successive requests

### 8. Error Recovery
- ✅ Database errors
- ✅ Network errors
- ✅ Partial failures
- ✅ Recovery after errors

## 🛠️ Test Structure

```javascript
describe('Feature Group', () => {
  beforeEach(async () => {
    // Clean database
    await cleanAllTables();
    // Clear mocks
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Cleanup
    await cleanAllTables();
  });

  describe('Specific Feature', () => {
    it('should do something specific', async () => {
      // Arrange
      const testData = { ... };

      // Act
      const response = await action({ request: mockRequest });

      // Assert
      expect(response.status).toBe(200);
    });
  });
});
```

## 🎯 Key Testing Principles

1. **Isolation** - Each test starts with a clean database
2. **Independence** - Tests don't depend on each other
3. **Completeness** - Test success and failure paths
4. **Realism** - Use actual Request/Response objects
5. **Maintainability** - Clear, descriptive test names
6. **Speed** - Fast execution with mocked external dependencies

## 📈 Test Metrics

```
Total Integration Tests: 66
├── API Endpoints: 20 tests
├── Cart Discounts: 24 tests
└── Authentication: 22 tests

Test Categories:
├── Success Paths: 40 tests (61%)
├── Error Handling: 18 tests (27%)
└── Edge Cases: 8 tests (12%)

Coverage Areas:
├── HTTP Methods: 100%
├── Status Codes: 100%
├── Discount Types: 100%
├── Authentication: 100%
└── Validation: 100%
```

## 🐛 Common Issues & Solutions

### Issue 1: Database not cleaned between tests
```javascript
// Solution: Use beforeEach and afterEach
beforeEach(async () => {
  await cleanAllTables();
});
```

### Issue 2: Mock not working
```javascript
// Solution: Clear mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});
```

### Issue 3: Concurrent test failures
```javascript
// Solution: Run tests sequentially or use proper isolation
npm test -- --no-threads tests/integration/
```

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Remix Testing Guide](https://remix.run/docs/en/main/guides/testing)
- [Shopify App Development](https://shopify.dev/docs/apps)

## 🎓 Best Practices

1. ✅ **Test business logic, not implementation details**
2. ✅ **Use descriptive test names**
3. ✅ **Keep tests focused and small**
4. ✅ **Mock external dependencies**
5. ✅ **Clean up after tests**
6. ✅ **Test both success and failure scenarios**
7. ✅ **Use realistic test data**
8. ✅ **Document complex test scenarios**

## 🔍 Debugging Tests

### Run specific test
```bash
npm test -- -t "should create a new discount"
```

### Run with verbose output
```bash
npm test -- --reporter=verbose tests/integration/
```

### Run in debug mode
```bash
node --inspect-brk ./node_modules/vitest/vitest.mjs run tests/integration/api-discounts.integration.test.js
```

## 🎉 Success Criteria

All integration tests verify:
- ✅ API endpoints respond correctly
- ✅ Data is validated properly
- ✅ Errors are handled gracefully
- ✅ Authentication is enforced
- ✅ Discount rules work correctly
- ✅ Cart calculations are accurate
- ✅ Concurrent requests are handled
- ✅ Edge cases are covered

---

**Total Test Coverage: 66 Integration Tests - 100% Passing ✅**
