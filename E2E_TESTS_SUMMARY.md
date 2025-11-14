# End-to-End (E2E) Tests Summary

## Overview

Comprehensive End-to-End testing suite for Shopify Product Discount App using **Vitest + Playwright** hybrid approach. Tests cover the complete customer journey from viewing a product with a discount through to checkout, validating discount application at every step.

---

## 📊 Test Summary

### Test Coverage

| Test Suite | File | Tests | Description |
|------------|------|-------|-------------|
| **E2E Storefront** | `tests/e2e/storefront-discount-flow.e2e.test.js` | 17 | Complete discount flow testing |

**Total**: 17 comprehensive E2E tests covering 7 major scenarios

**Technology Stack**:
- **Vitest** - Test runner and assertion library
- **Playwright** - Browser automation and control
- **Chromium** - Headless browser for testing

---

## 🎯 Test Scenarios

### 1. Product Page - Discount Visibility (3 tests)
✅ **Validates discount display on product pages**

**Tests**:
1. Should display discount on product page when discount is configured
2. Should display discount badge on product page
3. Should NOT display discount on product without discount

**What's Tested**:
- Theme extension discount block renders
- Original price vs discounted price display
- Discount badge with percentage or fixed amount
- No discount shown for ineligible products

### 2. Add to Cart - Function Trigger (2 tests)
✅ **Validates Shopify Function activation**

**Tests**:
1. Should add discounted product to cart
2. Should trigger Shopify Function when adding discounted product

**What's Tested**:
- Product successfully added to cart
- Shopify Discount Function executes
- Discount applies automatically via function

### 3. Cart Page - Discount Display (3 tests)
✅ **Validates discount information in cart**

**Tests**:
1. Should display discount information in cart
2. Should apply discount to cart total
3. Should show discounted line item price

**What's Tested**:
- Discount details visible in cart
- Cart total reflects discount
- Line item prices show discount
- Discount amount calculation

### 4. Checkout - Discount Application (3 tests)
✅ **Validates discount at checkout**

**Tests**:
1. Should navigate to checkout page
2. Should display discount in checkout summary
3. Should apply discount to checkout total

**What's Tested**:
- Successful navigation to checkout
- Discount visible in order summary
- Checkout total includes discount
- Discount name and amount displayed

### 5. Cart - Remove Product and Discount (2 tests)
✅ **Validates discount removal**

**Tests**:
1. Should remove discount when product is removed from cart
2. Should update discount when quantity is reduced

**What's Tested**:
- Removing product removes discount
- Cart empties correctly
- Quantity reduction updates discount
- Discount recalculation

### 6. Cart - Multiple Products (3 tests)
✅ **Validates multi-product scenarios**

**Tests**:
1. Should apply discounts to multiple products
2. Should handle mix of discounted and non-discounted products
3. Should calculate correct total with multiple discounts

**What's Tested**:
- Multiple discounts apply simultaneously
- Mixed cart (discounted + non-discounted)
- Total calculation with multiple discounts
- Discount priority rules

### 7. Checkout - Discount Carryover (3 tests)
✅ **Validates discount persistence**

**Tests**:
1. Should persist discount from cart to checkout
2. Should maintain discount through checkout steps
3. Should include discount in order summary

**What's Tested**:
- Discount carries over from cart to checkout
- Discount amount matches across pages
- Discount persists during checkout progression
- Order summary includes discount

---

## 🚀 Running the Tests

### Prerequisites

1. **Shopify Test Store** - You need a development/test Shopify store
2. **Test Products** - Products configured with discounts
3. **Environment Variables** - Store URL and product paths

### Environment Setup

1. **Copy environment template**:
```bash
cp .env.e2e.example .env.e2e
```

2. **Configure test store details** in `.env.e2e`:
```bash
SHOPIFY_STORE_URL=https://your-test-store.myshopify.com
TEST_PRODUCT_WITH_DISCOUNT_URL=/products/discounted-product
TEST_PRODUCT_URL=/products/regular-product
HEADLESS=true
```

### Running Tests

#### Run All E2E Tests
```bash
npm run test:e2e
```

#### Run with Visible Browser (Debugging)
```bash
npm run test:e2e:headed
```

#### Run with Slow Motion (Debugging)
```bash
npm run test:e2e:debug
```

#### Watch Mode
```bash
npm run test:e2e:watch
```

#### Run Specific Test Suite
```bash
npm run test:e2e -- -t "Product Page"
```

---

## 📁 File Structure

```
tests/e2e/
├── setup/
│   ├── playwright-setup.js           # Playwright configuration and helpers
│   └── storefront-helpers.js         # Storefront interaction helpers
├── screenshots/                      # Screenshots on test failure
└── storefront-discount-flow.e2e.test.js  # Main E2E test suite (17 tests)

Configuration:
├── .env.e2e.example                  # Environment template
├── .env.e2e                          # Your local config (git-ignored)
└── playwright.config.js              # Playwright configuration
```

---

## 🧪 Test Examples

### Example 1: Product Page Discount Visibility

```javascript
it('should display discount on product page when discount is configured', async () => {
  // Navigate to product page
  await page.goto(getFullUrl(E2E_CONFIG.TEST_PRODUCT_WITH_DISCOUNT_URL));
  await waitForNetworkIdle(page);

  // Check if discount is visible
  const hasDiscount = await isDiscountVisibleOnProductPage(page);
  expect(hasDiscount).toBe(true);

  // Get discount details
  const discountInfo = await getProductPageDiscount(page);
  expect(discountInfo).not.toBeNull();
  expect(discountInfo.originalPrice).toBeTruthy();
  expect(discountInfo.discountedPrice).toBeTruthy();

  // Verify discounted price is less than original
  const originalPrice = parsePrice(discountInfo.originalPrice);
  const discountedPrice = parsePrice(discountInfo.discountedPrice);
  expect(discountedPrice).toBeLessThan(originalPrice);
});
```

### Example 2: Cart Discount Application

```javascript
it('should display discount information in cart', async () => {
  // Add product to cart
  await page.goto(getFullUrl(E2E_CONFIG.TEST_PRODUCT_WITH_DISCOUNT_URL));
  await addToCart(page, 1);

  // Go to cart
  await goToCart(page, E2E_CONFIG.STORE_URL);
  await page.waitForTimeout(2000); // Wait for function to apply

  // Get discount info
  const discountInfo = await getCartDiscount(page);
  expect(discountInfo).not.toBeNull();
  expect(discountInfo.text).toBeTruthy();
  expect(discountInfo.amount).toBeTruthy();

  // Verify discount amount
  const discountAmount = parsePrice(discountInfo.amount);
  expect(discountAmount).toBeGreaterThan(0);
});
```

### Example 3: Checkout Discount Carryover

```javascript
it('should persist discount from cart to checkout', async () => {
  // Add product and get cart discount
  await page.goto(getFullUrl(E2E_CONFIG.TEST_PRODUCT_WITH_DISCOUNT_URL));
  await addToCart(page, 1);
  await goToCart(page, E2E_CONFIG.STORE_URL);

  const cartDiscount = await getCartDiscount(page);
  const cartDiscountAmount = parsePrice(cartDiscount.amount);

  // Proceed to checkout
  await proceedToCheckout(page);
  await page.waitForTimeout(3000);

  // Get checkout discount
  const checkoutDiscount = await getCheckoutDiscount(page);
  const checkoutDiscountAmount = parsePrice(checkoutDiscount.amount);

  // Amounts should match
  expect(checkoutDiscountAmount).toBe(cartDiscountAmount);
});
```

### Example 4: Remove Product Removes Discount

```javascript
it('should remove discount when product is removed from cart', async () => {
  // Add product
  await page.goto(getFullUrl(E2E_CONFIG.TEST_PRODUCT_WITH_DISCOUNT_URL));
  await addToCart(page, 1);
  await goToCart(page, E2E_CONFIG.STORE_URL);

  // Verify discount is applied
  let hasDiscount = await isDiscountAppliedInCart(page);
  expect(hasDiscount).toBe(true);

  // Remove item
  await removeCartItem(page, 0);
  await page.waitForTimeout(2000);

  // Cart should be empty
  const cartItems = await getCartItems(page);
  expect(cartItems.length).toBe(0);

  // Discount should be removed
  hasDiscount = await isDiscountAppliedInCart(page);
  expect(hasDiscount).toBe(false);
});
```

---

## 🔧 Helper Functions

### Playwright Setup Helpers

**`setupBrowser()`**
- Creates browser, context, and page instances
- Returns all three for test usage

**`cleanupBrowser(browser, context, page)`**
- Closes browser resources
- Call in `afterAll()` hook

**`clearCart(page)`**
- Empties the cart before tests
- Ensures clean test state

**`takeScreenshot(page, testName)`**
- Captures screenshot on failure
- Saves to `screenshots/` directory

### Storefront Interaction Helpers

#### Product Page
- `isDiscountVisibleOnProductPage(page)` - Check if discount block is visible
- `getProductPageDiscount(page)` - Get discount details
- `getDiscountBadge(page)` - Get badge information
- `addToCart(page, quantity)` - Add product to cart

#### Cart Page
- `goToCart(page, storeUrl)` - Navigate to cart
- `getCartItems(page)` - Get all cart items
- `getCartTotal(page)` - Get cart total
- `getCartDiscount(page)` - Get discount info
- `isDiscountAppliedInCart(page)` - Check if discount is applied
- `removeCartItem(page, index)` - Remove item from cart
- `updateCartQuantity(page, index, quantity)` - Update quantity

#### Checkout
- `proceedToCheckout(page)` - Go to checkout
- `isOnCheckoutPage(page)` - Verify on checkout
- `getCheckoutSummary(page)` - Get order summary
- `getCheckoutDiscount(page)` - Get discount info
- `getCheckoutTotal(page)` - Get checkout total
- `fillCheckoutInfo(page, customerInfo)` - Fill checkout form

#### Utilities
- `parsePrice(priceString)` - Convert price string to number
- `formatPrice(amount)` - Format number to price string
- `calculateExpectedDiscount(price, type, value)` - Calculate expected discount
- `waitForElement(page, selector, timeout)` - Wait for element
- `elementExists(page, selector)` - Check if element exists

---

## 📊 Test Configuration

### Browser Configuration

```javascript
export const E2E_CONFIG = {
  STORE_URL: process.env.SHOPIFY_STORE_URL,
  TEST_PRODUCT_URL: process.env.TEST_PRODUCT_URL,
  TEST_PRODUCT_WITH_DISCOUNT_URL: process.env.TEST_PRODUCT_WITH_DISCOUNT_URL,
  HEADLESS: process.env.HEADLESS !== 'false',
  SLOW_MO: parseInt(process.env.SLOW_MO || '0'),
  TIMEOUT: parseInt(process.env.E2E_TIMEOUT || '30000'),
  SCREENSHOT_ON_FAILURE: true,
  SCREENSHOT_DIR: 'tests/e2e/screenshots',
};
```

### Viewport Settings

- **Width**: 1280px
- **Height**: 720px
- **User Agent**: Chrome Desktop

### Timeouts

- **Default**: 30 seconds
- **Expect**: 10 seconds
- **Navigation**: 30 seconds

---

## 🐛 Debugging E2E Tests

### Run with Visible Browser

```bash
npm run test:e2e:headed
```

This opens the browser so you can see what's happening.

### Run with Slow Motion

```bash
npm run test:e2e:debug
```

This slows down browser actions by 500ms, making it easier to follow.

### View Screenshots

Failed tests automatically save screenshots to:
```
tests/e2e/screenshots/
```

Each screenshot is named after the test that failed.

### Console Logging

Add console.log statements in tests:

```javascript
it('should debug issue', async () => {
  const discount = await getCartDiscount(page);
  console.log('Discount info:', discount); // Visible in terminal
  expect(discount).not.toBeNull();
});
```

### Playwright Inspector

Use Playwright's built-in inspector:

```bash
PWDEBUG=1 npm run test:e2e
```

This opens an inspector that lets you step through tests.

---

## ⚠️ Common Issues and Solutions

### Issue 1: Tests timing out

**Cause**: Network slow, or elements not loading

**Solution**:
```bash
# Increase timeout
E2E_TIMEOUT=60000 npm run test:e2e
```

### Issue 2: Element not found

**Cause**: CSS selectors don't match your theme

**Solution**: Update selectors in `storefront-helpers.js` to match your theme's structure.

### Issue 3: Discount not applying

**Cause**: Shopify Function may take time to process

**Solution**: Increase wait time after adding to cart:
```javascript
await addToCart(page, 1);
await page.waitForTimeout(3000); // Increase from 2000 to 3000
```

### Issue 4: Store URL not configured

**Cause**: Missing environment variables

**Solution**: Create `.env.e2e` file with your store URL.

---

## 🎓 Testing Best Practices

### 1. Test Independence

Each test should be independent and not rely on other tests:

```javascript
beforeEach(async () => {
  await clearCart(page); // Start fresh
});
```

### 2. Wait for Network Idle

Always wait for page to finish loading:

```javascript
await page.goto(url);
await waitForNetworkIdle(page); // Wait for all network requests
```

### 3. Error Handling

Wrap tests in try-catch for better error reporting:

```javascript
try {
  // Test logic
} catch (error) {
  await takeScreenshot(page, 'test-name-failure');
  throw error;
}
```

### 4. Descriptive Assertions

Use clear assertion messages:

```javascript
expect(hasDiscount).toBe(true); // Good
expect(discountAmount).toBeGreaterThan(0); // Better
```

### 5. Test Data Management

Use environment variables for test data:

```javascript
const productUrl = E2E_CONFIG.TEST_PRODUCT_WITH_DISCOUNT_URL;
```

---

## 📈 Coverage Goals

E2E tests should cover:

- ✅ **User Journeys**: Complete flows from start to finish
- ✅ **Critical Paths**: Discount application at all stages
- ✅ **Error Scenarios**: Product removal, quantity changes
- ✅ **Multi-product**: Multiple items with different discounts
- ✅ **Persistence**: Discount carryover between pages

---

## 🔮 Future Enhancements

### Short Term
1. Add visual regression testing with screenshot comparison
2. Test on multiple browsers (Firefox, Safari)
3. Test mobile viewport scenarios
4. Add performance metrics

### Medium Term
1. Test with different discount types (BOGO, quantity discounts)
2. Test customer group-specific discounts
3. Test date-based discount activation/expiration
4. Cross-device testing

### Long Term
1. Full checkout completion tests (requires test payment)
2. Post-order discount verification
3. Discount analytics validation
4. Email notification testing

---

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Shopify Theme Development](https://shopify.dev/docs/themes)
- [Shopify Functions](https://shopify.dev/docs/apps/functions)
- [Shopify Checkout](https://shopify.dev/docs/api/checkout-ui-extensions)

---

## ✅ Summary

**Complete E2E Testing Infrastructure** with:

### Coverage
- ✅ 17 comprehensive E2E tests
- ✅ 7 major test scenarios
- ✅ Product page to checkout flow
- ✅ Discount visibility and application
- ✅ Cart and checkout validation
- ✅ Multi-product scenarios
- ✅ Discount persistence

### Technology
- ✅ Vitest + Playwright hybrid
- ✅ Browser automation
- ✅ Headless testing
- ✅ Screenshot on failure
- ✅ Configurable environment

### Helper Functions
- ✅ 20+ helper functions
- ✅ Reusable page objects
- ✅ Price parsing utilities
- ✅ Wait/navigation helpers

### Documentation
- ✅ Comprehensive guide
- ✅ Setup instructions
- ✅ Test examples
- ✅ Debugging tips
- ✅ Best practices

---

## 🎯 Quick Start Checklist

- [ ] Install Playwright: `npm install` (already done)
- [ ] Copy `.env.e2e.example` to `.env.e2e`
- [ ] Configure your test store URL
- [ ] Set up test products with discounts
- [ ] Run tests: `npm run test:e2e`
- [ ] View results and screenshots
- [ ] Debug failures with headed mode

---

**E2E testing ensures your discount flow works perfectly for real customers! 🚀**
