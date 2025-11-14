# Performance Benchmarks

## Overview

Performance benchmarks for Shopify Product Discount App using Vitest Bench.

## Benchmark Files

### 1. discount-resolution.bench.js
**Tests:** Shopify Function discount rule resolution

**Scenarios:**
- Single discount matching
- Multiple discount priority (5, 10, 20 discounts)
- Large cart processing (10, 50, 100 items)
- Complex scenarios (100 items × 50 discounts)
- GID extraction performance
- JSON parsing
- Realistic e-commerce scenarios

**Run:**
```bash
npm run bench:discount
```

---

### 2. database-operations.bench.js
**Tests:** Prisma database operations

**Scenarios:**
- CRUD operations (create, read, update, delete)
- Bulk operations (10, 50, 100 records)
- Query performance (filters, pagination, sorting)
- Product discount lookup
- Transaction performance
- Connection pool utilization
- Raw SQL vs Prisma comparison

**Run:**
```bash
npm run bench:db
```

**Note:** Requires PostgreSQL database running

---

### 3. product-discount-lookup.bench.js
**Tests:** Theme extension discount calculator

**Scenarios:**
- Money formatting (100, 1000 iterations)
- Discount calculations (percentage and fixed)
- Message and badge generation
- UI visibility logic
- Complete UI building
- Product page scenarios
- Collection page (20 products)
- Edge cases and validation

**Run:**
```bash
npm run bench:lookup
```

---

## Quick Start

```bash
# Run all benchmarks
npm run bench

# Run specific benchmark
npm run bench:discount
npm run bench:db
npm run bench:lookup

# Generate JSON report
npm run bench:json
```

---

## Results Location

- **Console:** Real-time output
- **JSON:** `benchmarks/results.json`
- **HTML:** `benchmarks/results.html`
- **Baseline:** `benchmarks/BASELINE.md`

---

## Performance Targets

### Discount Resolution
- Single product: < 1ms
- 10 discounts priority: < 10ms
- 100 items cart: < 100ms
- Worst case (100×50): < 500ms

### Database Operations
- Single read: < 10ms
- Single write: < 50ms
- Bulk create (50): < 500ms
- Complex query: < 50ms

### Product Lookup
- Format money (1000x): < 10ms
- Calculate discount (100x): < 5ms
- Build UI (100x): < 10ms
- Product page load: < 5ms

---

## Writing Benchmarks

```javascript
import { bench, describe } from 'vitest';

describe('My Feature - Performance', () => {
  bench('my operation', () => {
    // Code to benchmark
    myFunction();
  });

  bench('async operation', async () => {
    await myAsyncFunction();
  });
});
```

---

## Best Practices

✅ **DO:**
- Test realistic scenarios
- Include setup/teardown
- Run operations multiple times
- Test edge cases
- Use descriptive names

❌ **DON'T:**
- Include setup in benchmark
- Test trivial operations
- Forget cleanup
- Use random data
- Benchmark I/O without mocking

---

## Monitoring

Run benchmarks regularly:
- Before major releases
- After optimizations
- Monthly maintenance
- When adding new features

Compare with baseline:
```bash
npm run bench > current.txt
diff benchmarks/baseline.txt current.txt
```

---

## Documentation

- [PERFORMANCE_TESTING.md](../../PERFORMANCE_TESTING.md) - Complete guide
- [BASELINE.md](../../benchmarks/BASELINE.md) - Performance baselines
- [Vitest Bench Docs](https://vitest.dev/guide/features.html#benchmarking-experimental)

---

**Keep your app fast! 🚀**
