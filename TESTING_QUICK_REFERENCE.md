# Testing Quick Reference Card

## 🚀 Quick Commands

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- tests/integration/api-endpoints.supertest.test.js  # API (41 tests)
npm test -- tests/ui/                                           # UI (83+ tests)
npm test -- tests/extensions/discount-calculator.test.js       # JS Logic (49 tests)
npm test -- tests/extensions/liquid-templates.test.js          # Liquid (48 tests)
npm test -- tests/functions/discount-function.test.js          # Function (36 tests)
npm run test:e2e                                                # E2E (17 tests)

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Update snapshots
npm test -- -u

# Performance benchmarks
npm run bench                # All benchmarks
npm run bench:discount       # Discount resolution
npm run bench:db             # Database operations
npm run bench:lookup         # Product lookup
```

---

## 📊 Test Suite Overview

| Suite | Location | Tests | Duration |
|-------|----------|-------|----------|
| **API Integration** | `tests/integration/` | 41 | ~1.5s |
| **UI Components** | `tests/ui/` | 83+ | N/A |
| **Extension JS** | `tests/extensions/discount-calculator.test.js` | 49 | ~1.3s |
| **Extension Liquid** | `tests/extensions/liquid-templates.test.js` | 48 | ~870ms |
| **Shopify Function** | `tests/functions/discount-function.test.js` | 36 | ~1.4s |
| **E2E Storefront** | `tests/e2e/storefront-discount-flow.e2e.test.js` | 17 | Varies |

**Total: 350+ tests**

---

## 🎯 What to Test When

### When you modify API endpoints:
```bash
npm test -- tests/integration/api-endpoints.supertest.test.js
```

### When you modify UI components:
```bash
npm test -- tests/ui/
```

### When you modify discount calculations:
```bash
npm test -- tests/extensions/discount-calculator.test.js
```

### When you modify Liquid templates:
```bash
npm test -- tests/extensions/liquid-templates.test.js
npm test -- -u  # Update snapshots if needed
```

### When you modify Shopify Functions:
```bash
npm test -- tests/functions/discount-function.test.js
```

### When you modify storefront flow:
```bash
npm run test:e2e  # Requires test store setup
```

### Before committing:
```bash
npm test  # Run all tests (excluding E2E)
```

---

## 📁 Test File Locations

```
tests/
├── integration/
│   └── api-endpoints.supertest.test.js     ✅ 41 API tests
├── ui/
│   ├── discount-form.ui.test.jsx           ✅ 48 UI tests
│   └── discount-snapshots.ui.test.jsx      ✅ 35 snapshot tests
├── extensions/
│   ├── discount-calculator.test.js         ✅ 49 JS tests
│   └── liquid-templates.test.js            ✅ 48 Liquid tests
├── functions/
│   └── discount-function.test.js           ✅ 36 Function tests
└── e2e/
    ├── storefront-discount-flow.e2e.test.js ✅ 17 E2E tests
    └── setup/
        ├── playwright-setup.js              Browser configuration
        └── storefront-helpers.js            Storefront utilities

extensions/product-discount-display/lib/
└── discount-calculator.js                  ✅ Testable JS module
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `API_INTEGRATION_TESTS_SUMMARY.md` | API testing guide |
| `UI_COMPONENT_TESTS_SUMMARY.md` | UI testing guide |
| `THEME_EXTENSION_TESTS_SUMMARY.md` | Extension testing guide |
| `SHOPIFY_FUNCTION_TESTS_SUMMARY.md` | Function testing guide |
| `E2E_TESTS_SUMMARY.md` | E2E testing guide |
| `COMPLETE_TESTING_OVERVIEW.md` | Complete overview |
| `ALL_TESTS_FINAL_SUMMARY.md` | Final summary |
| `TESTING_QUICK_REFERENCE.md` | This file |

---

## ✅ Test Coverage Checklist

### API Endpoints ✅
- [x] GET /api/discounts
- [x] POST /api/discounts
- [x] PATCH /api/discounts
- [x] DELETE /api/discounts
- [x] POST /api/apply-cart-discount
- [x] Discount rule resolution
- [x] Authentication
- [x] Error cases

### UI Components ✅
- [x] Form rendering
- [x] Product selection
- [x] Field validation
- [x] Form submission
- [x] Success messages
- [x] Edit/Delete
- [x] Accessibility
- [x] Snapshots

### Theme Extensions ✅
**JavaScript:**
- [x] Money formatting
- [x] Discount calculations
- [x] Fetch logic
- [x] UI visibility
- [x] Error handling

**Liquid:**
- [x] Template structure
- [x] Schema validation
- [x] Embedded JS
- [x] Snapshots
- [x] CLI build

---

## 🔧 Common Tasks

### Add a new test
```bash
# Create test file
touch tests/extensions/new-feature.test.js

# Write test
# Run test
npm test -- tests/extensions/new-feature.test.js
```

### Debug failing test
```bash
# Run single test
npm test -- -t "test name"

# Show verbose output
npm test -- --reporter=verbose
```

### Update snapshots
```bash
# All snapshots
npm test -- -u

# Specific file
npm test -- tests/extensions/liquid-templates.test.js -u
```

### Generate coverage
```bash
npm run test:coverage
```

### Run performance benchmarks
```bash
# All benchmarks
npm run bench

# Specific benchmarks
npm run bench:discount
npm run bench:db
npm run bench:lookup

# Generate JSON report
npm run bench:json
```

---

## 💡 Tips

1. **Run tests before committing** - Catch issues early
2. **Update snapshots carefully** - Review changes
3. **Mock external calls** - Don't hit real APIs in tests
4. **Test edge cases** - Null, zero, negative values
5. **Write descriptive test names** - Make failures clear

---

## 🐛 Troubleshooting

### Tests timing out
- Check for missing `await` keywords
- Verify mocks are properly set up
- Increase timeout if needed

### Snapshots failing
- Review changes to understand why
- Update with `npm test -- -u` if intentional

### Fetch errors
- Ensure `global.fetch` is mocked
- Check mock setup in `beforeEach`

### React component errors
- Check Polaris provider setup
- Verify `window.matchMedia` is mocked

---

## 📞 Getting Help

1. Check documentation files
2. Review test examples in existing files
3. Check error messages carefully
4. Use `--reporter=verbose` for more details

---

**Quick tip**: Keep this file bookmarked for easy reference! 📌
