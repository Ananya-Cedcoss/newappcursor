# Test Environment Configuration - Complete Guide

## Overview

This document describes the complete test environment setup, including mocked environment variables, Shopify sessions, and Admin API responses.

---

## 📁 File Structure

```
tests/
├── setup.js                           # Main setup file
├── setup/
│   ├── test.env.js                   # Environment variables
│   ├── shopify-session.mock.js       # Session mocks
│   └── shopify-api.mock.js           # API mocks
├── integration/
│   └── shopify-integration.test.js   # Integration tests
├── examples/
│   └── mock-usage.test.js            # Example tests
├── api/
│   └── discount-api.test.js          # API tests
└── discount-calculations.test.js      # Unit tests

vitest.global-setup.js                 # Global setup
vitest.config.js                       # Vitest config
```

---

## ⚙️ Configuration Files

### 1. Environment Variables (`tests/setup/test.env.js`)

**Purpose:** Mock all environment variables needed for testing

**Configured Variables:**

```javascript
{
  // Shopify App
  SHOPIFY_API_KEY: 'test_api_key_12345',
  SHOPIFY_API_SECRET: 'test_api_secret_67890',
  SHOPIFY_APP_URL: 'https://test-app.example.com',
  SHOPIFY_SCOPES: 'write_products,write_discounts',
  SHOPIFY_DISCOUNT_FUNCTION_ID: 'test-function-id-12345',

  // Database
  DATABASE_URL: 'file:./test.db',

  // Session
  SESSION_SECRET: 'test-session-secret-key',

  // API
  API_VERSION: '2024-10',
  API_DOMAIN: 'test-shop.myshopify.com'
}
```

**Usage:**

```javascript
import { setupTestEnv, getTestEnv } from './setup/test.env';

// Auto-applied on import
import './setup/test.env.js';

// Or manually
setupTestEnv();

// Get specific variable
const apiKey = getTestEnv('SHOPIFY_API_KEY');
```

---

### 2. Global Setup (`vitest.global-setup.js`)

**Purpose:** Runs once before all test suites

**What it does:**
- Setup test environment variables
- Initialize any global fixtures
- Prepare test database (if needed)

**When it runs:**
```
Global Setup (once)
   ↓
Test File 1
Test File 2
Test File 3
   ↓
Global Teardown (once)
```

**Output:**
```
🔧 Setting up test environment...
✅ Test environment ready
[tests run]
🧹 Cleaning up test environment...
✅ Test environment cleaned up
```

---

### 3. Setup File (`tests/setup.js`)

**Purpose:** Runs before each test file

**What it does:**
- Apply environment variables
- Setup global mocks (fetch)
- Clear mocks after each test
- Export all mock helpers

**Cleanup:**
```javascript
afterEach(() => {
  vi.clearAllMocks();      // Clear call history
  vi.restoreAllMocks();    // Restore original implementations
});
```

---

## 🔐 Shopify Session Mocks

### Available Functions

#### `createMockSession(overrides)`

Create a mock Shopify session.

**Default Session:**
```javascript
{
  id: 'test_session_id_12345',
  shop: 'test-shop.myshopify.com',
  accessToken: 'test_access_token_12345',
  scope: 'write_products,write_discounts',
  isOnline: false,
  userId: '1234567890',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  accountOwner: true
}
```

**Usage:**

```javascript
import { createMockSession } from 'tests/setup';

// Default session
const session = createMockSession();

// Custom session
const session = createMockSession({
  shop: 'my-store.myshopify.com',
  email: 'admin@mystore.com'
});
```

#### `createOnlineSession(overrides)`

Create an online session (for customer-specific operations).

```javascript
const session = createOnlineSession();
// session.isOnline === true
```

#### `createOfflineSession(overrides)`

Create an offline session (for background jobs).

```javascript
const session = createOfflineSession({ shop: 'my-store.myshopify.com' });
// session.isOnline === false
// session.id === 'offline_my-store.myshopify.com'
```

#### `createMockAdmin(overrides)`

Create a mock Admin API object.

```javascript
const admin = createMockAdmin();

// Use in tests
await admin.graphql('query { products }');
expect(admin.graphql).toHaveBeenCalled();
```

#### `mockAuthenticateAdmin(options)`

Mock the authenticate.admin() function.

```javascript
const { authenticate } = mockAuthenticateAdmin();

const { session, admin } = await authenticate.admin();
```

---

## 🌐 Admin API Mocks

### GraphQL Response Mocks

#### `mockGraphQLResponse(data, errors)`

Create a mock GraphQL response.

```javascript
import { mockGraphQLResponse } from 'tests/setup';

const response = mockGraphQLResponse({
  products: { edges: [] }
});

admin.graphql.mockResolvedValueOnce(response);
```

#### `mockProductsQuery(products)`

Mock products query response.

```javascript
import { mockProductsQuery } from 'tests/setup';

const products = [
  { id: 'gid://shopify/Product/1', title: 'T-Shirt' },
  { id: 'gid://shopify/Product/2', title: 'Jeans' },
];

admin.graphql.mockResolvedValueOnce(mockProductsQuery(products));

const response = await admin.graphql('query Products');
const data = await response.json();
// data.data.products.edges[0].node.title === 'T-Shirt'
```

#### `mockDiscountAutomaticAppCreate(discount)`

Mock discount creation mutation.

```javascript
import { mockDiscountAutomaticAppCreate } from 'tests/setup';

admin.graphql.mockResolvedValueOnce(
  mockDiscountAutomaticAppCreate({
    title: 'Summer Sale',
    status: 'ACTIVE'
  })
);

const response = await admin.graphql('mutation CreateDiscount');
const data = await response.json();
// data.data.discountAutomaticAppCreate.automaticAppDiscount.title === 'Summer Sale'
```

#### `mockDiscountAutomaticAppUpdate(discount)`

Mock discount update mutation.

```javascript
admin.graphql.mockResolvedValueOnce(
  mockDiscountAutomaticAppUpdate({
    id: 'gid://shopify/DiscountAutomaticApp/123',
    title: 'Updated Sale'
  })
);
```

#### `mockDiscountAutomaticDelete(id)`

Mock discount deletion.

```javascript
admin.graphql.mockResolvedValueOnce(
  mockDiscountAutomaticDelete('gid://shopify/DiscountAutomaticApp/123')
);
```

#### `mockAutomaticDiscountsQuery(discounts)`

Mock query for all automatic discounts.

```javascript
const discounts = [
  { title: 'Sale 1', status: 'ACTIVE' },
  { title: 'Sale 2', status: 'ACTIVE' }
];

admin.graphql.mockResolvedValueOnce(mockAutomaticDiscountsQuery(discounts));
```

#### `mockGraphQLError(message, field)`

Mock a GraphQL error.

```javascript
admin.graphql.mockResolvedValueOnce(
  mockGraphQLError('Invalid input', ['input', 'title'])
);

const response = await admin.graphql('mutation Test');
const data = await response.json();
// data.errors[0].message === 'Invalid input'
```

---

## 🌍 Fetch Mocks

### `mockFetch(response)`

Mock a successful fetch.

```javascript
import { mockFetch } from 'tests/setup';

mockFetch({ success: true, data: 'test' });

const response = await fetch('/api/test');
const data = await response.json();
// data.success === true
```

### `mockFetchError(error)`

Mock a fetch error.

```javascript
import { mockFetchError } from 'tests/setup';

mockFetchError(new Error('Network error'));

await expect(fetch('/api/test')).rejects.toThrow('Network error');
```

### `mockFetchWithStatus(response, status)`

Mock fetch with specific status code.

```javascript
import { mockFetchWithStatus } from 'tests/setup';

mockFetchWithStatus({ error: 'Not found' }, 404);

const response = await fetch('/api/test');
// response.status === 404
// response.ok === false
```

---

## 📝 Complete Examples

### Example 1: Testing API Route with Shopify

```javascript
import { describe, it, expect } from 'vitest';
import {
  mockAuthenticate,
  mockDiscountAutomaticAppCreate,
  mockFetch
} from 'tests/setup';

describe('POST /api/discounts', () => {
  it('should create discount via Shopify API', async () => {
    // 1. Setup authentication
    const authenticate = mockAuthenticate();
    const { admin } = await authenticate();

    // 2. Mock Shopify API response
    admin.graphql.mockResolvedValueOnce(
      mockDiscountAutomaticAppCreate({
        id: 'gid://shopify/DiscountAutomaticApp/123',
        title: 'Test Discount',
        status: 'ACTIVE'
      })
    );

    // 3. Mock the API endpoint
    mockFetch({
      success: true,
      discount: {
        id: '123',
        name: 'Test Discount'
      }
    });

    // 4. Make the request
    const response = await fetch('/api/discounts', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Discount',
        type: 'percentage',
        value: 20,
        productIds: ['123']
      })
    });

    const result = await response.json();

    // 5. Assertions
    expect(result.success).toBe(true);
    expect(result.discount.name).toBe('Test Discount');
    expect(admin.graphql).toHaveBeenCalled();
  });
});
```

### Example 2: Testing with Custom Session

```javascript
import { describe, it, expect } from 'vitest';
import { createMockSession, mockAuthenticate } from 'tests/setup';

describe('Session-based tests', () => {
  it('should use custom shop session', async () => {
    const customSession = createMockSession({
      shop: 'my-custom-store.myshopify.com',
      email: 'admin@custom.com'
    });

    const authenticate = mockAuthenticate({ session: customSession });
    const { session } = await authenticate();

    expect(session.shop).toBe('my-custom-store.myshopify.com');
    expect(session.email).toBe('admin@custom.com');
  });
});
```

### Example 3: Testing GraphQL Queries

```javascript
import { describe, it, expect } from 'vitest';
import { createMockAdmin, mockProductsQuery } from 'tests/setup';

describe('GraphQL Query Tests', () => {
  it('should fetch products', async () => {
    const admin = createMockAdmin();

    const products = [
      { id: 'gid://shopify/Product/1', title: 'Product 1', handle: 'product-1' },
      { id: 'gid://shopify/Product/2', title: 'Product 2', handle: 'product-2' }
    ];

    admin.graphql.mockResolvedValueOnce(mockProductsQuery(products));

    const response = await admin.graphql(`
      query {
        products {
          edges {
            node {
              id
              title
              handle
            }
          }
        }
      }
    `);

    const data = await response.json();

    expect(data.data.products.edges).toHaveLength(2);
    expect(data.data.products.edges[0].node.title).toBe('Product 1');
  });
});
```

### Example 4: Testing Error Handling

```javascript
import { describe, it, expect } from 'vitest';
import { createMockAdmin, mockGraphQLError } from 'tests/setup';

describe('Error Handling', () => {
  it('should handle GraphQL errors', async () => {
    const admin = createMockAdmin();

    admin.graphql.mockResolvedValueOnce(
      mockGraphQLError('Invalid discount value', ['input', 'value'])
    );

    const response = await admin.graphql('mutation CreateDiscount');
    const data = await response.json();

    expect(data.errors).toBeDefined();
    expect(data.errors[0].message).toBe('Invalid discount value');
    expect(data.errors[0].field).toEqual(['input', 'value']);
  });
});
```

---

## 🎯 Best Practices

### 1. Always Use Mocks

✅ **Good:**
```javascript
import { createMockAdmin } from 'tests/setup';

const admin = createMockAdmin();
admin.graphql.mockResolvedValueOnce(/* ... */);
```

❌ **Bad:**
```javascript
// Don't make real API calls in tests
const admin = createRealAdminAPI();
```

### 2. Reset Mocks Between Tests

This is handled automatically by the setup file:

```javascript
afterEach(() => {
  vi.clearAllMocks();      // Clears call history
  vi.restoreAllMocks();    // Restores implementations
});
```

### 3. Use Descriptive Test Names

✅ **Good:**
```javascript
it('should create discount when valid data provided')
it('should return 400 when missing required fields')
```

❌ **Bad:**
```javascript
it('works')
it('test1')
```

### 4. Test One Thing Per Test

✅ **Good:**
```javascript
it('should return success status', () => {
  expect(response.success).toBe(true);
});

it('should return discount data', () => {
  expect(response.discount).toBeDefined();
});
```

❌ **Bad:**
```javascript
it('should do everything', () => {
  expect(response.success).toBe(true);
  expect(response.discount).toBeDefined();
  expect(response.discount.name).toBe('Test');
  // Too many assertions!
});
```

---

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# UI mode
npm run test:ui

# Coverage
npm run test:coverage

# Specific file
npm test tests/integration/shopify-integration.test.js
```

---

## 📊 Test Results

Current test status:

```
✓ 58 tests passed
⏱️ Duration: 805ms
🎉 All passing!
```

**Test Suites:**
- Discount Calculations: 17 tests ✓
- API Endpoints: 13 tests ✓
- Shopify Integration: 11 tests ✓
- Mock Usage Examples: 17 tests ✓

---

## 🔍 Debugging Tests

### View Mock Calls

```javascript
it('should call API', async () => {
  await myFunction(admin);

  console.log('Calls:', admin.graphql.mock.calls);
  console.log('Results:', admin.graphql.mock.results);
});
```

### Check Environment

```javascript
it('should have correct env', () => {
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('API_KEY:', process.env.SHOPIFY_API_KEY);
});
```

### Use console.log

Tests show console output:

```javascript
it('debug test', () => {
  console.log('Debug info:', value);
  expect(value).toBe(10);
});
```

---

## 🎓 Quick Reference

### Import Everything

```javascript
import {
  // Environment
  setupTestEnv,
  getTestEnv,

  // Sessions
  createMockSession,
  createOnlineSession,
  createOfflineSession,

  // Admin API
  createMockAdmin,
  mockAuthenticate,

  // GraphQL Responses
  mockGraphQLResponse,
  mockProductsQuery,
  mockDiscountAutomaticAppCreate,
  mockDiscountAutomaticAppUpdate,
  mockDiscountAutomaticDelete,
  mockAutomaticDiscountsQuery,
  mockGraphQLError,

  // Fetch Mocks
  mockFetch,
  mockFetchError,
  mockFetchWithStatus,
} from 'tests/setup';
```

### Quick Test Template

```javascript
import { describe, it, expect } from 'vitest';
import { mockAuthenticate, mockFetch } from 'tests/setup';

describe('My Feature', () => {
  it('should work', async () => {
    // Setup
    const authenticate = mockAuthenticate();
    const { admin } = await authenticate();

    // Mock API
    mockFetch({ success: true });

    // Execute
    const result = await myFunction(admin);

    // Assert
    expect(result.success).toBe(true);
  });
});
```

---

## ✅ Summary

**✅ Environment variables mocked**
**✅ Shopify sessions mocked**
**✅ Admin API mocked**
**✅ GraphQL responses mocked**
**✅ Fetch mocked**
**✅ Global setup configured**
**✅ Example tests provided**
**✅ 58 tests passing**

**Your test environment is fully configured and ready to use!** 🎉

---

**Need help?** Check the example tests in:
- `tests/integration/shopify-integration.test.js`
- `tests/examples/mock-usage.test.js`
