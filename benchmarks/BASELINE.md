# Performance Baseline

## Overview

This document establishes performance baselines for the Shopify Product Discount App. These benchmarks should be run regularly to ensure performance doesn't degrade over time.

---

## Test Environment

**Hardware:**
- CPU: [Your CPU Model]
- RAM: [Your RAM]
- Disk: [SSD/HDD Type]

**Software:**
- Node.js: v20.x
- Database: PostgreSQL 15
- OS: [Your OS]

**Last Updated:** [Date]

---

## Baseline Metrics

### 1. Discount Rule Resolution

| Scenario | Operations/sec | Avg Time (ms) | Target |
|----------|----------------|---------------|--------|
| Single discount, single product | TBD | TBD | < 1ms |
| 5 discounts, priority resolution | TBD | TBD | < 5ms |
| 10 discounts, priority resolution | TBD | TBD | < 10ms |
| Cart with 10 items | TBD | TBD | < 10ms |
| Cart with 50 items | TBD | TBD | < 50ms |
| Cart with 100 items | TBD | TBD | < 100ms |
| 10 items × 10 discounts | TBD | TBD | < 50ms |
| 50 items × 20 discounts | TBD | TBD | < 200ms |
| 100 items × 50 discounts (worst case) | TBD | TBD | < 500ms |

**Performance Goals:**
- ✅ Linear scalability with cart size
- ✅ Sub-linear scalability with discount count
- ✅ < 1ms for typical single product scenario
- ✅ < 100ms for realistic cart (3-10 items, 5-15 discounts)

---

### 2. Database Operations

| Operation | Operations/sec | Avg Time (ms) | Target |
|-----------|----------------|---------------|--------|
| Create single discount | TBD | TBD | < 50ms |
| Read single discount by ID | TBD | TBD | < 10ms |
| Update single discount | TBD | TBD | < 30ms |
| Delete single discount | TBD | TBD | < 20ms |
| Find all active discounts | TBD | TBD | < 50ms |
| Find discounts for product | TBD | TBD | < 30ms |
| Create 10 discounts (bulk) | TBD | TBD | < 100ms |
| Create 50 discounts (bulk) | TBD | TBD | < 500ms |
| Paginate (10 records) | TBD | TBD | < 20ms |
| Complex query with filters | TBD | TBD | < 50ms |

**Performance Goals:**
- ✅ Single record operations < 50ms
- ✅ Bulk operations scale linearly
- ✅ Queries return within 100ms
- ✅ Pagination doesn't degrade with offset

---

### 3. Product Discount Lookup

| Scenario | Operations/sec | Avg Time (ms) | Target |
|----------|----------------|---------------|--------|
| Format money (100 times) | TBD | TBD | < 1ms |
| Calculate discount (100 times) | TBD | TBD | < 5ms |
| Generate message (100 times) | TBD | TBD | < 2ms |
| Generate badge HTML (100 times) | TBD | TBD | < 3ms |
| Check visibility (100 times) | TBD | TBD | < 1ms |
| Build complete UI | TBD | TBD | < 1ms |
| Product page load (full workflow) | TBD | TBD | < 5ms |
| Collection page (20 products) | TBD | TBD | < 20ms |

**Performance Goals:**
- ✅ Money formatting < 0.01ms per call
- ✅ Discount calculation < 0.05ms per call
- ✅ Product page load < 10ms total
- ✅ Collection page < 50ms for 20 products

---

### 4. Shopify Function Execution

| Scenario | Avg Time (ms) | P95 Time (ms) | Target |
|----------|---------------|---------------|--------|
| Typical cart (3 items, 5 discounts) | TBD | TBD | < 10ms |
| Holiday sale (10 items, 15 discounts) | TBD | TBD | < 30ms |
| Bulk order (25 items, 3 discounts) | TBD | TBD | < 50ms |
| Flash sale (1 item, 1 discount) | TBD | TBD | < 5ms |

**Performance Goals:**
- ✅ P95 response time < 50ms
- ✅ P99 response time < 100ms
- ✅ No timeouts under normal load
- ✅ Graceful degradation under high load

---

## Performance Trends

### Discount Resolution Trends

```
Date        | 1 Discount | 10 Discounts | 50 Discounts | Notes
------------|------------|--------------|--------------|-------
2024-01-01  | TBD        | TBD          | TBD          | Initial baseline
```

### Database Operations Trends

```
Date        | Single Read | Bulk Create (10) | Complex Query | Notes
------------|-------------|------------------|---------------|-------
2024-01-01  | TBD         | TBD              | TBD           | Initial baseline
```

### Product Lookup Trends

```
Date        | Money Format | Calculate | Build UI | Notes
------------|--------------|-----------|----------|-------
2024-01-01  | TBD          | TBD       | TBD      | Initial baseline
```

---

## Running Benchmarks

### Initial Baseline

```bash
# Run all benchmarks
npm run bench

# Run specific benchmarks
npm run bench:discount
npm run bench:db
npm run bench:lookup

# Generate JSON report
npm run bench:json
```

### Regular Monitoring

**Frequency:** Run benchmarks:
- Before major releases
- After performance optimizations
- Monthly as part of maintenance
- When adding new features that might impact performance

**Process:**
1. Run benchmarks on clean database
2. Record results in this document
3. Compare with previous baselines
4. Investigate any regressions > 20%
5. Update targets if needed

---

## Performance Regression Detection

### Acceptable Ranges

- ✅ **< 10% slower**: Normal variation, acceptable
- ⚠️ **10-20% slower**: Worth investigating, may be acceptable with justification
- ❌ **> 20% slower**: Investigate and fix before merging

### Investigation Checklist

When performance regresses:

- [ ] Check what code changed since last baseline
- [ ] Profile the slow operations
- [ ] Review database query plans
- [ ] Check for N+1 queries
- [ ] Review algorithm complexity
- [ ] Consider caching opportunities
- [ ] Verify test environment is consistent

---

## Optimization Opportunities

### Identified Areas for Improvement

**Discount Resolution:**
- Consider caching frequently accessed discount rules
- Optimize product ID matching with indexed lookups
- Batch process large carts in chunks

**Database Operations:**
- Add indexes on frequently queried fields
- Use connection pooling effectively
- Consider read replicas for high traffic

**Product Lookup:**
- Memoize expensive calculations
- Consider pre-computing common scenarios
- Use CDN for static discount data

---

## Notes

- Benchmarks should be run on a consistent environment
- Database should be in a clean state (no unrelated data)
- Run multiple times and take average for stability
- Watch for memory leaks in long-running benchmarks
- Consider warming up JIT compiler with a few runs

---

## Next Steps

1. **Run initial benchmarks** to establish baseline
2. **Record results** in the trend tables above
3. **Set up automated monitoring** in CI/CD
4. **Create alerts** for performance regressions
5. **Review quarterly** and adjust targets as needed

---

**Performance testing is continuous - keep this document updated!** 📊
