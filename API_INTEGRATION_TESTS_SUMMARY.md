# API Integration Tests Summary (Supertest + Vitest)

## Overview

A comprehensive suite of **41 integration tests** has been implemented using **Vitest** and **Supertest** to test all API endpoints with real HTTP requests.

## Test File Location

```
tests/integration/api-endpoints.supertest.test.js
```

## Test Coverage

### ✅ GET /api/discounts (6 tests)
- Returns empty array when no discounts exist
- Returns all discounts
- Returns specific discount by ID
- Returns 404 for non-existent discount ID
- Requires authentication
- Handles database errors gracefully

### ✅ POST /api/discounts (10 tests)
- Creates new discount with valid data
- Creates fixed discount
- Parses string value to float
- Returns 400 when name is missing
- Returns 400 when type is invalid
- Returns 400 when value is missing
- Returns 400 when productIds is missing
- Accepts empty productIds array
- Requires authentication
- Handles malformed JSON

### ✅ PATCH /api/discounts (3 tests)
- Updates existing discount
- Returns 400 when ID is missing
- Returns 400 for invalid type in update

### ✅ DELETE /api/discounts (2 tests)
- Deletes existing discount
- Returns 400 when ID is missing

### ✅ POST /api/apply-cart-discount (8 tests)
- Calculates cart total with no discounts
- Applies percentage discount to cart items
- Applies fixed discount to cart items
- Handles Shopify GID format
- Returns 400 when items array is missing
- Returns 400 when items array is empty
- Returns 404 for GET method (no loader defined)
- Requires authentication

### ✅ Discount Rule Resolution (4 tests)
- Selects the best percentage discount when multiple exist
- Selects the best fixed discount when multiple exist
- Compares percentage vs fixed and chooses the better one
- Applies different discounts to different products

### ✅ Invalid Data and Edge Cases (6 tests)
- Handles missing required fields in cart item
- Handles zero price items
- Handles 100% discount
- Handles very large quantities
- Handles special characters in discount name
- Handles decimal prices correctly

### ✅ Complete Integration Flows (2 tests)
- Handles full CRUD lifecycle with HTTP requests
- Creates discount and applies to cart in full flow

## Running the Tests

### Run all integration tests:
```bash
npm test -- tests/integration/api-endpoints.supertest.test.js
```

### Run all tests:
```bash
npm test
```

### Run tests in watch mode:
```bash
npm run test:watch
```

### Run tests with coverage:
```bash
npm run test:coverage
```

## Test Results

```
Test Files  1 passed (1)
Tests       41 passed (41)
Duration    ~1.5s
```

## Key Features

### 1. **Real HTTP Requests**
Tests use Supertest to make actual HTTP requests to the API endpoints, testing the full request/response cycle.

### 2. **Authentication Testing**
- Mocks Shopify admin authentication
- Tests both authenticated and unauthenticated scenarios
- Validates authentication is required for all endpoints

### 3. **Database Integration**
- Uses real database operations (not mocked)
- Cleans database before and after each test
- Verifies data persistence

### 4. **Comprehensive Validation**
- Tests all required field validations
- Tests invalid data handling
- Tests edge cases (100% discount, zero prices, large quantities, etc.)

### 5. **Discount Rule Resolution**
- Tests best discount selection logic
- Tests percentage vs fixed discount comparison
- Tests multiple discounts on different products

## Shopify Admin Context Mocking

The tests mock the Shopify authentication using Vitest's `vi.mock()`:

```javascript
vi.mock('../../app/shopify.server.js', () => ({
  authenticate: {
    admin: vi.fn(async (req) => {
      if (!authenticationEnabled) {
        throw new Error('Unauthorized: Authentication required');
      }
      return {
        session: {
          shop: 'test-shop.myshopify.com',
          accessToken: 'test_access_token',
          isOnline: false,
        },
        admin: {
          graphql: vi.fn(),
        },
      };
    }),
  },
}));
```

This allows us to:
- Toggle authentication on/off for testing
- Simulate authenticated requests
- Test unauthorized scenarios

## Test Structure

Each test follows this pattern:

```javascript
it('should test something', async () => {
  // Arrange: Set up test data
  await discountService.createDiscount({...});

  // Act: Make HTTP request
  const response = await request(app)
    .post('/api/discounts')
    .send(data)
    .expect(201);

  // Assert: Verify response
  expect(response.body.success).toBe(true);
  expect(response.body.discount).toBeDefined();

  // Verify in database
  const saved = await discountService.getDiscountById(id);
  expect(saved).toBeDefined();
});
```

## Integration with Existing Tests

The existing integration tests (`api-discounts.integration.test.js`, `cart-discount.integration.test.js`) use mock Request objects and directly call loader/action functions.

The new Supertest tests (`api-endpoints.supertest.test.js`) make actual HTTP requests through a test server, providing true end-to-end integration testing.

Both approaches are valuable:
- **Mock Request tests**: Faster, unit-test style testing of route handlers
- **Supertest tests**: True integration testing through HTTP layer

## Dependencies

- `vitest`: Test framework
- `supertest`: HTTP assertion library (already installed)
- `happy-dom`: DOM environment for tests

## Next Steps

You can extend these tests by:
1. Adding performance/load tests
2. Testing concurrent request handling
3. Adding tests for webhook endpoints
4. Testing GraphQL integration with Shopify
5. Adding E2E tests with real Shopify store

## Troubleshooting

If tests fail:
1. Ensure database is running and accessible
2. Check that all dependencies are installed (`npm install`)
3. Verify Prisma schema is migrated (`npx prisma migrate dev`)
4. Check test database configuration in `tests/setup/test.env.js`

## Summary

✅ **41 comprehensive integration tests** covering:
- All CRUD operations for discounts
- Cart discount calculations
- Discount rule resolution
- Authentication and authorization
- Input validation and error handling
- Edge cases and invalid data
- Complete integration flows

All tests use **Supertest for real HTTP requests** and **Vitest** as the test runner, with proper **Shopify admin context mocking**.
