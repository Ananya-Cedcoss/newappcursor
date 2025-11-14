# E2E Tests

End-to-End tests for Shopify Product Discount App using Vitest + Playwright.

## Quick Start

1. **Setup environment**:
   ```bash
   cp ../../.env.e2e.example ../../.env.e2e
   # Edit .env.e2e with your test store URL
   ```

2. **Run tests**:
   ```bash
   npm run test:e2e
   ```

3. **Debug with visible browser**:
   ```bash
   npm run test:e2e:headed
   ```

## What's Tested

✅ Product page discount visibility
✅ Add to cart → Shopify Function triggers
✅ Cart discount display
✅ Checkout discount application
✅ Remove product → discount removed
✅ Multi-product scenarios
✅ Discount carryover to order

## Files

- `storefront-discount-flow.e2e.test.js` - Main E2E test suite (17 tests)
- `setup/playwright-setup.js` - Browser setup and configuration
- `setup/storefront-helpers.js` - Helper functions for storefront interaction
- `screenshots/` - Screenshots from failed tests

## Documentation

See `E2E_TESTS_SUMMARY.md` in the project root for complete documentation.

## Environment Variables

Required in `.env.e2e`:

```bash
SHOPIFY_STORE_URL=https://your-test-store.myshopify.com
TEST_PRODUCT_WITH_DISCOUNT_URL=/products/discounted-product
TEST_PRODUCT_URL=/products/regular-product
HEADLESS=true
```

## Commands

```bash
# Run all E2E tests
npm run test:e2e

# Watch mode
npm run test:e2e:watch

# With visible browser (debugging)
npm run test:e2e:headed

# With slow motion (debugging)
npm run test:e2e:debug

# Run specific test
npm run test:e2e -- -t "Product Page"
```

## Troubleshooting

**Tests timing out?**
- Increase timeout: `E2E_TIMEOUT=60000 npm run test:e2e`

**Elements not found?**
- Update CSS selectors in `setup/storefront-helpers.js` to match your theme

**Discount not applying?**
- Ensure products are configured with discounts in admin
- Check Shopify Function is deployed

**Screenshots**
- Failed tests save screenshots to `screenshots/` directory
- Use these to debug visual issues

## Notes

- Tests require a real Shopify store (test/development)
- Products must be set up with discount configurations
- Shopify Functions must be deployed
- Each test starts with an empty cart
