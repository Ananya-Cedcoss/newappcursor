# Performance Testing Documentation

## Overview

Comprehensive performance testing suite for Shopify Product Discount App using **Vitest Bench**. Measures and monitors the performance of critical operations to ensure optimal user experience.

---

## 📊 What We Benchmark

### 1. Discount Rule Resolution
**File:** `tests/benchmarks/discount-resolution.bench.js`

**Scenarios:**
- Single discount matching (< 1ms target)
- Multiple discount priority resolution (< 10ms)
- Large cart processing (up to 100 items)
- Complex scenarios (100 items × 50 discounts)
- GID extraction performance
- JSON parsing performance
- Realistic e-commerce scenarios

**Why It Matters:** The discount function runs on every cart operation at checkout. Slow resolution directly impacts checkout speed and customer experience.

### 2. Database Operations
**File:** `tests/benchmarks/database-operations.bench.js`

**Scenarios:**
- CRUD operations (create, read, update, delete)
- Bulk operations (10, 50, 100 records)
- Query performance (filters, pagination)
- Product discount lookup
- Transaction performance
- Connection pool utilization
- Realistic admin and storefront queries

**Why It Matters:** Database performance affects admin dashboard responsiveness and storefront discount loading times.

### 3. Product Discount Lookup
**File:** `tests/benchmarks/product-discount-lookup.bench.js`

**Scenarios:**
- Money formatting (1000 operations)
- Discount calculations (percentage and fixed)
- Message and badge generation
- UI visibility logic
- Complete UI building
- Product page scenarios
- Collection page scenarios (20 products)
- Edge cases and validation

**Why It Matters:** Runs on every product page view. Performance directly affects page load times and Core Web Vitals.

### 4. Shopify Function Execution
**Covered in:** Discount Resolution benchmarks

**Scenarios:**
- Typical cart (3 items, 5 discounts)
- Holiday sale (10 items, 15 discounts)
- Bulk order (25 items, 3 discounts)
- Flash sale (1 item, 1 discount)

**Why It Matters:** Shopify Functions have strict execution time limits. Exceeding limits causes discounts to fail at checkout.

---

## 🚀 Running Benchmarks

### Quick Start

```bash
# Run all benchmarks
npm run bench

# Run specific benchmarks
npm run bench:discount    # Discount resolution
npm run bench:db          # Database operations
npm run bench:lookup      # Product discount lookup

# Generate JSON report
npm run bench:json
```

### Detailed Commands

```bash
# Run with verbose output
vitest bench --config vitest.bench.config.js --reporter=verbose

# Run single file
vitest bench tests/benchmarks/discount-resolution.bench.js

# Run specific test suite
vitest bench tests/benchmarks/discount-resolution.bench.js -t "Single Discount"

# Compare with baseline
npm run bench > current-results.txt
diff benchmarks/baseline.txt current-results.txt
```

---

## 📈 Understanding Results

### Vitest Bench Output Format

```
✓ tests/benchmarks/discount-resolution.bench.js
  ✓ Discount Rule Resolution - Performance
    ✓ Single Discount Resolution
      name                                      hz     min     max    mean     p75     p99    p995    p999     rme  samples
    · resolve single discount for single    xxx,xxx  x.xxms  x.xxms  x.xxms  x.xxms  x.xxms  x.xxms  x.xxms  ±x.xx%      xxx
      product
```

**Key Metrics:**
- **hz**: Operations per second (higher is better)
- **mean**: Average execution time (lower is better)
- **p95/p99**: 95th/99th percentile (lower is better)
- **rme**: Relative margin of error (lower is better)
- **samples**: Number of test runs

### Performance Targets

**Excellent:**
- Discount resolution: < 5ms per operation
- Database read: < 10ms
- Product lookup: < 1ms

**Good:**
- Discount resolution: 5-20ms
- Database read: 10-50ms
- Product lookup: 1-5ms

**Needs Improvement:**
- Discount resolution: > 20ms
- Database read: > 50ms
- Product lookup: > 5ms

---

## 📊 Benchmark Categories

### Discount Rule Resolution

#### Single Discount (Fastest)
```javascript
bench('resolve single discount for single product', () => {
  run(createFunctionInput(cart, discounts));
});
```
**Target:** < 1ms | **Typical:** 0.5ms

#### Multiple Discounts (Priority)
```javascript
bench('resolve highest among 10 discounts', () => {
  run(createFunctionInput(cart, 10Discounts));
});
```
**Target:** < 10ms | **Typical:** 5ms

#### Large Cart (Scalability)
```javascript
bench('process cart with 100 items', () => {
  run(createFunctionInput(largeCart, discounts));
});
```
**Target:** < 100ms | **Typical:** 50ms

#### Worst Case (Stress Test)
```javascript
bench('100 items × 50 discounts (worst case)', () => {
  run(createFunctionInput(largeCart, manyDiscounts));
});
```
**Target:** < 500ms | **Typical:** 200-300ms

---

### Database Operations

#### Single Record CRUD
```javascript
bench('create single discount', async () => {
  await prisma.discount.create({ data: discountData });
});
```
**Target:** < 50ms | **Typical:** 10-20ms

#### Bulk Operations
```javascript
bench('create 50 discounts', async () => {
  await prisma.discount.createMany({ data: discounts });
});
```
**Target:** < 500ms | **Typical:** 100-200ms

#### Query Performance
```javascript
bench('find discounts for specific product', async () => {
  await prisma.discount.findMany({ where: {...} });
});
```
**Target:** < 30ms | **Typical:** 10-15ms

---

### Product Discount Lookup

#### Money Formatting (Most Frequent)
```javascript
bench('format money: 1000 times', () => {
  for (let i = 0; i < 1000; i++) formatMoney(10000);
});
```
**Target:** < 10ms for 1000 ops | **Typical:** 2-5ms

#### Discount Calculation
```javascript
bench('calculate discount: 100 times', () => {
  for (let i = 0; i < 100; i++) calculateDiscount(price, discount);
});
```
**Target:** < 5ms for 100 ops | **Typical:** 1-2ms

#### Complete UI Building
```javascript
bench('build complete UI: 100 times', () => {
  for (let i = 0; i < 100; i++) buildDiscountUI(price, discount);
});
```
**Target:** < 10ms for 100 ops | **Typical:** 3-5ms

---

## 🔍 Performance Analysis

### Identifying Bottlenecks

1. **Run benchmarks**
   ```bash
   npm run bench > results.txt
   ```

2. **Identify slow operations**
   - Look for operations > target time
   - Check p99 percentile (worst case)
   - High RME indicates instability

3. **Profile the code**
   ```bash
   node --prof app.js
   node --prof-process isolate-*.log > processed.txt
   ```

4. **Compare with baseline**
   ```bash
   diff benchmarks/baseline.txt results.txt
   ```

### Common Performance Issues

**Discount Resolution:**
- ❌ Nested loops (O(n²) complexity)
- ❌ Repeated GID extraction
- ❌ Inefficient array operations
- ✅ Use Map for O(1) lookups
- ✅ Extract GID once and cache
- ✅ Filter before iteration

**Database:**
- ❌ N+1 query problem
- ❌ Missing indexes
- ❌ Fetching unnecessary data
- ✅ Use includes for relations
- ✅ Add indexes on common queries
- ✅ Select only needed fields

**Product Lookup:**
- ❌ Recalculating on every render
- ❌ Heavy string concatenation
- ❌ Unnecessary object creation
- ✅ Memoize expensive calculations
- ✅ Use template literals
- ✅ Reuse objects when possible

---

## 🎯 Performance Optimization Guide

### Step 1: Establish Baseline

```bash
# Clean database
npm run prisma:reset

# Run benchmarks
npm run bench > benchmarks/baseline.txt

# Commit baseline
git add benchmarks/baseline.txt
git commit -m "Add performance baseline"
```

### Step 2: Make Changes

```javascript
// Example: Optimize discount resolution
// Before (O(n²))
discounts.forEach(d => {
  cartLines.forEach(line => {
    if (matches(d, line)) apply(d, line);
  });
});

// After (O(n))
const discountMap = new Map(discounts.map(d => [d.id, d]));
cartLines.forEach(line => {
  const discount = discountMap.get(line.discountId);
  if (discount) apply(discount, line);
});
```

### Step 3: Measure Impact

```bash
# Run benchmarks again
npm run bench > benchmarks/after-optimization.txt

# Compare results
diff benchmarks/baseline.txt benchmarks/after-optimization.txt
```

### Step 4: Document & Monitor

```bash
# Update BASELINE.md with results
# Add entry to performance trend table
# Commit improvements

git add benchmarks/BASELINE.md
git commit -m "Improve discount resolution performance by 50%"
```

---

## 📝 Writing Benchmarks

### Basic Benchmark Structure

```javascript
import { bench, describe } from 'vitest';

describe('My Feature - Performance', () => {
  bench('operation name', () => {
    // Code to benchmark
    myFunction();
  });

  bench('async operation', async () => {
    // Async code
    await myAsyncFunction();
  });
});
```

### Best Practices

**DO:**
- ✅ Test realistic scenarios
- ✅ Include setup/teardown
- ✅ Run operations multiple times
- ✅ Test edge cases
- ✅ Name benchmarks descriptively

**DON'T:**
- ❌ Include setup in benchmark
- ❌ Test trivial operations
- ❌ Forget to clean up resources
- ❌ Use random data (inconsistent results)
- ❌ Benchmark I/O without mocking

### Example: Good Benchmark

```javascript
describe('Discount Calculation', () => {
  // Setup once
  const testData = createTestData();

  bench('calculate 20% discount on $100', () => {
    // Only benchmark the actual work
    calculateDiscount(10000, { type: 'percentage', value: 20 });
  });

  bench('calculate discount: 100 iterations', () => {
    // Test at scale
    for (let i = 0; i < 100; i++) {
      calculateDiscount(10000, testData.discounts[i % 10]);
    }
  });
});
```

---

## 🔧 Configuration

### Vitest Bench Config

**File:** `vitest.bench.config.js`

```javascript
export default defineConfig({
  test: {
    benchmark: {
      include: ['tests/benchmarks/**/*.bench.js'],
      reporters: ['default', 'verbose'],
      outputFile: {
        json: './benchmarks/results.json',
        html: './benchmarks/results.html',
      },
    },
    testTimeout: 60000, // 60 seconds
    hookTimeout: 30000, // 30 seconds
  },
});
```

### Customizing Benchmarks

```javascript
bench('my benchmark', () => {
  // benchmark code
}, {
  iterations: 1000,    // Number of iterations
  time: 1000,          // Time to run (ms)
  warmup: true,        // Run warmup iterations
  warmupTime: 100,     // Warmup time (ms)
  warmupIterations: 5, // Warmup iterations
});
```

---

## 📊 CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Performance Tests

on:
  pull_request:
    branches: [main]

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run bench:json
      - uses: benchmark-action/github-action-benchmark@v1
        with:
          tool: 'vitest'
          output-file-path: benchmarks/results.json
```

### Performance Regression Detection

```bash
# In CI, compare with main branch
git fetch origin main
git checkout main
npm run bench > main-results.txt
git checkout -
npm run bench > pr-results.txt

# Compare and fail if > 20% slower
./scripts/compare-performance.sh main-results.txt pr-results.txt
```

---

## 🎓 Performance Tips

### For Developers

1. **Profile before optimizing**
   - Measure first, optimize later
   - Focus on hot paths
   - Don't guess bottlenecks

2. **Use appropriate data structures**
   - Map for O(1) lookups
   - Set for unique values
   - Array for ordered data

3. **Minimize iterations**
   - Avoid nested loops
   - Filter before processing
   - Use early returns

4. **Cache expensive operations**
   - Memoize pure functions
   - Cache database queries
   - Reuse computed values

5. **Consider algorithmic complexity**
   - O(1) > O(log n) > O(n) > O(n²)
   - Watch for hidden complexity
   - Profile actual performance

### For Reviewers

1. **Check benchmarks on PRs**
   - Run benchmarks locally
   - Compare with baseline
   - Question regressions > 10%

2. **Review algorithm complexity**
   - Look for nested loops
   - Check database query patterns
   - Verify efficient data structures

3. **Consider scale**
   - Will it work with 1000 items?
   - How about 10,000 discounts?
   - What's the worst case?

---

## 📚 Resources

- [Vitest Bench Documentation](https://vitest.dev/guide/features.html#benchmarking-experimental)
- [JavaScript Performance Tips](https://developer.mozilla.org/en-US/docs/Web/Performance)
- [Database Performance Tuning](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Shopify Function Performance](https://shopify.dev/docs/apps/functions/performance)

---

## 🆘 Troubleshooting

### Benchmarks are unstable (high RME)

**Causes:**
- Background processes
- Inconsistent test data
- I/O operations
- Memory pressure

**Solutions:**
- Close other applications
- Use fixed test data
- Mock I/O operations
- Increase sample size

### Benchmarks take too long

**Causes:**
- Too many iterations
- Expensive operations
- Large test data

**Solutions:**
- Reduce iteration count
- Test smaller scenarios
- Use smaller test data
- Run specific benchmarks only

### Database benchmarks fail

**Causes:**
- Database not running
- Connection issues
- Data conflicts

**Solutions:**
- Start database: `docker-compose up -d postgres`
- Reset database: `npm run prisma:reset`
- Clean test data in afterAll

---

## ✅ Performance Checklist

Before merging performance-sensitive code:

- [ ] Run all benchmarks
- [ ] Compare with baseline
- [ ] No regressions > 20%
- [ ] Document any intentional changes
- [ ] Update baseline if targets change
- [ ] Consider edge cases
- [ ] Test with realistic data volumes
- [ ] Profile if performance is critical
- [ ] Add new benchmarks for new features

---

**Performance testing ensures your app stays fast as it grows! 🚀**
