# Testing Guide - Vitest Setup

## Overview

This project uses **Vitest** as the testing framework, with **happy-dom** for DOM simulation and comprehensive coverage reporting.

---

## 🚀 Quick Start

### Run Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run tests with UI interface
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# Run tests with coverage and UI
npm run test:coverage:ui
```

---

## 📁 Project Structure

```
product-discount/
├── tests/
│   ├── setup.js                      # Global test setup
│   ├── discount-calculations.test.js # Calculation logic tests
│   └── api/
│       └── discount-api.test.js      # API endpoint tests
├── app/
│   └── **/*.test.js                  # Component/module tests
├── vitest.config.js                  # Vitest configuration
└── package.json                      # Test scripts
```

---

## ⚙️ Configuration

### Vitest Config (`vitest.config.js`)

Key configurations:

```javascript
{
  environment: 'happy-dom',           // DOM simulation
  globals: true,                       // Global test APIs
  setupFiles: ['./tests/setup.js'],   // Setup before tests

  coverage: {
    provider: 'v8',
    thresholds: {
      lines: 70,         // 70% line coverage required
      functions: 70,     // 70% function coverage
      branches: 65,      // 65% branch coverage
      statements: 70     // 70% statement coverage
    }
  }
}
```

### Aliases

Configured for Remix project structure:

- `~` → `./app`
- `@` → `./app`
- `app` → `./app`
- `tests` → `./tests`
- `extensions` → `./extensions`

**Usage in tests:**
```javascript
import { createDiscount } from '~/models/discount.server';
import { mockFetch } from 'tests/setup';
```

---

## ✍️ Writing Tests

### Basic Test Structure

```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it('should do something', () => {
    const result = someFunction();
    expect(result).toBe(expectedValue);
  });
});
```

### Example: Testing Discount Calculation

```javascript
describe('Discount Calculations', () => {
  it('should calculate 20% discount correctly', () => {
    const price = 50.0;
    const percent = 20;

    const discount = (price * percent) / 100;
    const final = price - discount;

    expect(discount).toBe(10.0);
    expect(final).toBe(40.0);
  });
});
```

### Example: Testing API Response

```javascript
describe('API Endpoint', () => {
  it('should return success response', async () => {
    const response = {
      success: true,
      data: { id: '123', name: 'Test' }
    };

    expect(response.success).toBe(true);
    expect(response.data).toMatchObject({
      id: expect.any(String),
      name: expect.any(String)
    });
  });
});
```

---

## 🧪 Testing Patterns

### 1. Unit Tests

Test individual functions in isolation:

```javascript
// tests/utils/calculations.test.js
import { calculateDiscount } from '~/utils/calculations';

describe('calculateDiscount', () => {
  it('should calculate percentage discount', () => {
    expect(calculateDiscount(100, 'percentage', 20)).toBe(20);
  });

  it('should calculate fixed discount', () => {
    expect(calculateDiscount(100, 'fixed', 15)).toBe(15);
  });
});
```

### 2. Integration Tests

Test multiple components working together:

```javascript
// tests/integration/discount-flow.test.js
import { createDiscount, getDiscountById } from '~/models/discount.server';

describe('Discount Flow', () => {
  it('should create and retrieve discount', async () => {
    const created = await createDiscount({
      name: 'Test',
      type: 'percentage',
      value: 20,
      productIds: ['123']
    });

    const retrieved = await getDiscountById(created.id);

    expect(retrieved.name).toBe('Test');
  });
});
```

### 3. API Tests

Test API endpoints:

```javascript
// tests/api/discounts.test.js
describe('POST /api/discounts', () => {
  it('should create discount', async () => {
    const request = {
      name: 'Summer Sale',
      type: 'percentage',
      value: 25,
      productIds: ['123']
    };

    const response = await createDiscountAPI(request);

    expect(response.success).toBe(true);
    expect(response.discount).toBeDefined();
  });
});
```

### 4. Component Tests (React)

Test React components:

```javascript
// app/components/DiscountBadge.test.jsx
import { render, screen } from '@testing-library/react';
import { DiscountBadge } from './DiscountBadge';

describe('DiscountBadge', () => {
  it('should render percentage discount', () => {
    render(<DiscountBadge type="percentage" value={20} />);
    expect(screen.getByText('20% OFF')).toBeInTheDocument();
  });
});
```

---

## 🎯 Best Practices

### 1. Test Naming

Use descriptive test names:

✅ **Good:**
```javascript
it('should calculate 20% discount on $50 item to be $10')
it('should return error when discount type is invalid')
```

❌ **Bad:**
```javascript
it('works')
it('test discount')
```

### 2. Arrange-Act-Assert Pattern

```javascript
it('should apply best discount', () => {
  // Arrange - Setup
  const price = 100;
  const discounts = [
    { type: 'percentage', value: 15 },
    { type: 'fixed', value: 20 }
  ];

  // Act - Execute
  const best = findBestDiscount(discounts, price);

  // Assert - Verify
  expect(best.type).toBe('fixed');
  expect(best.value).toBe(20);
});
```

### 3. Test One Thing

Each test should verify one specific behavior:

✅ **Good:**
```javascript
it('should calculate percentage discount', () => {
  expect(calculateDiscount(100, 'percentage', 20)).toBe(20);
});

it('should calculate fixed discount', () => {
  expect(calculateDiscount(100, 'fixed', 15)).toBe(15);
});
```

❌ **Bad:**
```javascript
it('should calculate discounts', () => {
  expect(calculateDiscount(100, 'percentage', 20)).toBe(20);
  expect(calculateDiscount(100, 'fixed', 15)).toBe(15);
  expect(calculateDiscount(50, 'percentage', 10)).toBe(5);
});
```

### 4. Use Meaningful Assertions

```javascript
// Good - Specific expectations
expect(response.success).toBe(true);
expect(response.discount.name).toBe('Summer Sale');
expect(response.discount.value).toBe(20);

// Also good - Match partial object
expect(response.discount).toMatchObject({
  name: 'Summer Sale',
  type: 'percentage',
  value: 20
});

// Good - Type checking
expect(response.discount.id).toEqual(expect.any(String));
```

---

## 🔍 Matchers Reference

### Equality

```javascript
expect(value).toBe(5);                    // Strict equality (===)
expect(value).toEqual({ a: 1 });          // Deep equality
expect(value).not.toBe(10);               // Negation
```

### Truthiness

```javascript
expect(value).toBeTruthy();               // !! value === true
expect(value).toBeFalsy();                // !! value === false
expect(value).toBeDefined();              // value !== undefined
expect(value).toBeNull();                 // value === null
```

### Numbers

```javascript
expect(value).toBeGreaterThan(10);
expect(value).toBeLessThan(100);
expect(value).toBeCloseTo(10.5, 1);       // Floating point
```

### Strings

```javascript
expect(string).toMatch(/pattern/);
expect(string).toContain('substring');
```

### Arrays

```javascript
expect(array).toContain('item');
expect(array).toHaveLength(3);
```

### Objects

```javascript
expect(obj).toMatchObject({ key: 'value' });
expect(obj).toHaveProperty('key');
```

### Async

```javascript
await expect(promise).resolves.toBe('value');
await expect(promise).rejects.toThrow('error');
```

---

## 🎨 Mocking

### Mock Functions

```javascript
import { vi } from 'vitest';

const mockFn = vi.fn();
mockFn.mockReturnValue('mocked value');
mockFn.mockResolvedValue('async value');

expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
expect(mockFn).toHaveBeenCalledTimes(2);
```

### Mock Modules

```javascript
vi.mock('~/models/discount.server', () => ({
  createDiscount: vi.fn(),
  getDiscountById: vi.fn()
}));
```

### Mock Fetch (Available in setup.js)

```javascript
import { mockFetch } from 'tests/setup';

it('should fetch data', async () => {
  mockFetch({ success: true, data: [] });

  const result = await fetchData();

  expect(result.success).toBe(true);
});
```

---

## 📊 Coverage

### View Coverage Report

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/index.html
```

### Coverage Thresholds

Configured in `vitest.config.js`:

- **Lines:** 70%
- **Functions:** 70%
- **Branches:** 65%
- **Statements:** 70%

Tests will fail if coverage drops below thresholds.

### Exclude from Coverage

Add to `vitest.config.js`:

```javascript
coverage: {
  exclude: [
    'node_modules/',
    'tests/',
    '**/*.config.js',
    '**/types/**'
  ]
}
```

---

## 🐛 Debugging Tests

### Using `console.log`

```javascript
it('should debug', () => {
  const value = calculateSomething();
  console.log('Value:', value);
  expect(value).toBe(10);
});
```

### Using Debugger

```javascript
it('should debug', () => {
  debugger; // Pause here
  const value = calculateSomething();
  expect(value).toBe(10);
});
```

Run with Node debugger:
```bash
node --inspect-brk node_modules/.bin/vitest run
```

### Focus on Single Test

```javascript
it.only('should run only this test', () => {
  // Only this test runs
});

describe.only('Focus on this suite', () => {
  // Only tests in this suite run
});
```

### Skip Tests

```javascript
it.skip('should skip this test', () => {
  // This test is skipped
});
```

---

## 📝 Example Test Suites

### Testing Discount Function Logic

```javascript
// extensions/product-discount-function/src/run.test.js
import { describe, it, expect } from 'vitest';
import { run } from './run';

describe('Discount Function', () => {
  it('should apply percentage discount', () => {
    const input = {
      cart: {
        lines: [{
          id: 'line-1',
          quantity: 1,
          merchandise: {
            __typename: 'ProductVariant',
            product: { id: 'gid://shopify/Product/123' },
            price: { amount: '50.00' }
          }
        }]
      },
      discountNode: {
        metafield: {
          value: JSON.stringify({
            discounts: [{
              id: '1',
              name: 'Test',
              type: 'percentage',
              value: 20,
              productIds: ['123']
            }]
          })
        }
      }
    };

    const result = run(input);

    expect(result.discounts).toHaveLength(1);
    expect(result.discounts[0].message).toBe('Test');
  });
});
```

---

## 🎯 Testing Checklist

Before committing code:

- [ ] All tests pass: `npm test`
- [ ] Coverage meets thresholds: `npm run test:coverage`
- [ ] No focused tests (`it.only`, `describe.only`)
- [ ] No skipped tests without reason
- [ ] Tests are descriptive and clear
- [ ] Edge cases are covered
- [ ] Mock dependencies properly
- [ ] Clean up after tests (no side effects)

---

## 🚦 CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

---

## 📚 Resources

### Vitest Documentation
- [Getting Started](https://vitest.dev/guide/)
- [API Reference](https://vitest.dev/api/)
- [Configuration](https://vitest.dev/config/)

### Testing Library
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## 🎉 Tips for Success

1. **Write tests as you code** - Don't leave testing for the end
2. **Test behavior, not implementation** - Focus on what it does, not how
3. **Keep tests simple** - Easy to read and understand
4. **Use descriptive names** - Tests are documentation
5. **Test edge cases** - Zero, negative, null, undefined, etc.
6. **Run tests often** - Catch issues early
7. **Maintain coverage** - Keep thresholds high
8. **Review test failures** - They're telling you something important

---

**Happy Testing! 🧪**

Need help? Check the example tests in `/tests` directory!
