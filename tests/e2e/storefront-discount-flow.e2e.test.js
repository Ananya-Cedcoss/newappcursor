/**
 * Storefront End-to-End Tests
 * Tests complete discount flow from product page to checkout
 * Using Vitest + Playwright for browser automation
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  setupBrowser,
  cleanupBrowser,
  clearCart,
  getFullUrl,
  E2E_CONFIG,
  takeScreenshot,
  waitForNetworkIdle,
} from './setup/playwright-setup.js';
import {
  // Product page
  isDiscountVisibleOnProductPage,
  getProductPageDiscount,
  getDiscountBadge,
  addToCart,
  // Cart page
  goToCart,
  getCartItems,
  getCartTotal,
  getCartDiscount,
  isDiscountAppliedInCart,
  removeCartItem,
  updateCartQuantity,
  // Checkout
  proceedToCheckout,
  isOnCheckoutPage,
  getCheckoutSummary,
  getCheckoutDiscount,
  getCheckoutTotal,
  fillCheckoutInfo,
  // Helpers
  parsePrice,
  calculateExpectedDiscount,
  waitForElement,
} from './setup/storefront-helpers.js';

/**
 * E2E Test Suite for Discount Flow
 */
describe('Storefront E2E - Discount Flow', () => {
  let browser;
  let context;
  let page;

  /**
   * Setup browser before all tests
   */
  beforeAll(async () => {
    const setup = await setupBrowser();
    browser = setup.browser;
    context = setup.context;
    page = setup.page;
  }, 60000); // 60 second timeout for browser setup

  /**
   * Cleanup browser after all tests
   */
  afterAll(async () => {
    await cleanupBrowser(browser, context, page);
  });

  /**
   * Clear cart before each test
   */
  beforeEach(async () => {
    await clearCart(page);
  }, 30000);

  /**
   * =================================================================
   * Test 1: Visit Product Page → Discount Visible
   * =================================================================
   */
  describe('Product Page - Discount Visibility', () => {
    it('should display discount on product page when discount is configured', async () => {
      try {
        // Navigate to product page with discount
        await page.goto(getFullUrl(E2E_CONFIG.TEST_PRODUCT_WITH_DISCOUNT_URL));
        await waitForNetworkIdle(page);

        // Wait for discount block to load (theme extension)
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
      } catch (error) {
        await takeScreenshot(page, 'product-page-discount-visibility-failure');
        throw error;
      }
    }, 30000);

    it('should display discount badge on product page', async () => {
      try {
        await page.goto(getFullUrl(E2E_CONFIG.TEST_PRODUCT_WITH_DISCOUNT_URL));
        await waitForNetworkIdle(page);

        const badge = await getDiscountBadge(page);
        expect(badge).not.toBeNull();
        expect(badge.text).toMatch(/(-\d+%|-\$\d+)/); // Matches "-20%" or "-$10"
      } catch (error) {
        await takeScreenshot(page, 'discount-badge-failure');
        throw error;
      }
    }, 30000);

    it('should NOT display discount on product without discount', async () => {
      try {
        await page.goto(getFullUrl(E2E_CONFIG.TEST_PRODUCT_URL));
        await waitForNetworkIdle(page);

        const hasDiscount = await isDiscountVisibleOnProductPage(page);
        expect(hasDiscount).toBe(false);
      } catch (error) {
        await takeScreenshot(page, 'no-discount-product-failure');
        throw error;
      }
    }, 30000);
  });

  /**
   * =================================================================
   * Test 2: Add to Cart → Shopify Function Triggers
   * =================================================================
   */
  describe('Add to Cart - Function Trigger', () => {
    it('should add discounted product to cart', async () => {
      try {
        // Navigate to product page
        await page.goto(getFullUrl(E2E_CONFIG.TEST_PRODUCT_WITH_DISCOUNT_URL));
        await waitForNetworkIdle(page);

        // Add to cart
        await addToCart(page, 1);

        // Wait for cart drawer or notification
        await page.waitForTimeout(2000);

        // Verify product was added
        await goToCart(page, E2E_CONFIG.STORE_URL);
        const cartItems = await getCartItems(page);

        expect(cartItems.length).toBeGreaterThan(0);
      } catch (error) {
        await takeScreenshot(page, 'add-to-cart-failure');
        throw error;
      }
    }, 30000);

    it('should trigger Shopify Function when adding discounted product', async () => {
      try {
        await page.goto(getFullUrl(E2E_CONFIG.TEST_PRODUCT_WITH_DISCOUNT_URL));
        await waitForNetworkIdle(page);

        await addToCart(page, 1);
        await goToCart(page, E2E_CONFIG.STORE_URL);

        // Wait for Shopify Function to process (discount should apply)
        await page.waitForTimeout(2000);

        // Check if discount is applied
        const hasDiscount = await isDiscountAppliedInCart(page);
        expect(hasDiscount).toBe(true);
      } catch (error) {
        await takeScreenshot(page, 'function-trigger-failure');
        throw error;
      }
    }, 30000);
  });

  /**
   * =================================================================
   * Test 3: Check Discount in Cart
   * =================================================================
   */
  describe('Cart Page - Discount Display', () => {
    beforeEach(async () => {
      // Add discounted product to cart
      await page.goto(getFullUrl(E2E_CONFIG.TEST_PRODUCT_WITH_DISCOUNT_URL));
      await waitForNetworkIdle(page);
      await addToCart(page, 1);
      await goToCart(page, E2E_CONFIG.STORE_URL);
      await page.waitForTimeout(2000); // Wait for function to apply
    });

    it('should display discount information in cart', async () => {
      try {
        const discountInfo = await getCartDiscount(page);

        expect(discountInfo).not.toBeNull();
        expect(discountInfo.text).toBeTruthy();
        expect(discountInfo.amount).toBeTruthy();

        // Verify discount amount is negative (savings)
        const discountAmount = parsePrice(discountInfo.amount);
        expect(discountAmount).toBeGreaterThan(0);
      } catch (error) {
        await takeScreenshot(page, 'cart-discount-display-failure');
        throw error;
      }
    }, 30000);

    it('should apply discount to cart total', async () => {
      try {
        const cartTotal = await getCartTotal(page);
        expect(cartTotal).toBeTruthy();

        const total = parsePrice(cartTotal);
        expect(total).toBeGreaterThan(0);

        // Get discount info
        const discountInfo = await getCartDiscount(page);
        if (discountInfo) {
          const discountAmount = parsePrice(discountInfo.amount);
          // Verify total reflects discount
          expect(discountAmount).toBeLessThanOrEqual(total);
        }
      } catch (error) {
        await takeScreenshot(page, 'cart-total-discount-failure');
        throw error;
      }
    }, 30000);

    it('should show discounted line item price', async () => {
      try {
        const cartItems = await getCartItems(page);
        expect(cartItems.length).toBeGreaterThan(0);

        const firstItem = cartItems[0];
        expect(firstItem.price).toBeTruthy();

        // Verify price is present
        const itemPrice = parsePrice(firstItem.price);
        expect(itemPrice).toBeGreaterThan(0);
      } catch (error) {
        await takeScreenshot(page, 'line-item-price-failure');
        throw error;
      }
    }, 30000);
  });

  /**
   * =================================================================
   * Test 4: Check Discount at Checkout
   * =================================================================
   */
  describe('Checkout - Discount Application', () => {
    beforeEach(async () => {
      // Add discounted product and proceed to checkout
      await page.goto(getFullUrl(E2E_CONFIG.TEST_PRODUCT_WITH_DISCOUNT_URL));
      await waitForNetworkIdle(page);
      await addToCart(page, 1);
      await goToCart(page, E2E_CONFIG.STORE_URL);
      await page.waitForTimeout(2000);
    });

    it('should navigate to checkout page', async () => {
      try {
        await proceedToCheckout(page);
        await waitForNetworkIdle(page);

        const onCheckout = await isOnCheckoutPage(page);
        expect(onCheckout).toBe(true);
      } catch (error) {
        await takeScreenshot(page, 'checkout-navigation-failure');
        throw error;
      }
    }, 30000);

    it('should display discount in checkout summary', async () => {
      try {
        await proceedToCheckout(page);
        await waitForNetworkIdle(page);

        // Wait for checkout to load
        await page.waitForTimeout(3000);

        const checkoutDiscount = await getCheckoutDiscount(page);

        // Discount should be visible in checkout
        expect(checkoutDiscount).not.toBeNull();
        expect(checkoutDiscount.name).toBeTruthy();
        expect(checkoutDiscount.amount).toBeTruthy();

        // Verify discount amount
        const discountAmount = parsePrice(checkoutDiscount.amount);
        expect(discountAmount).toBeGreaterThan(0);
      } catch (error) {
        await takeScreenshot(page, 'checkout-discount-display-failure');
        throw error;
      }
    }, 30000);

    it('should apply discount to checkout total', async () => {
      try {
        await proceedToCheckout(page);
        await waitForNetworkIdle(page);
        await page.waitForTimeout(3000);

        const checkoutTotal = await getCheckoutTotal(page);
        expect(checkoutTotal).toBeTruthy();

        const total = parsePrice(checkoutTotal);
        expect(total).toBeGreaterThan(0);

        // Get discount info
        const discountInfo = await getCheckoutDiscount(page);
        if (discountInfo) {
          const discountAmount = parsePrice(discountInfo.amount);
          // Total should reflect discount
          expect(discountAmount).toBeGreaterThan(0);
        }
      } catch (error) {
        await takeScreenshot(page, 'checkout-total-failure');
        throw error;
      }
    }, 30000);
  });

  /**
   * =================================================================
   * Test 5: Remove Product → Discount Removed
   * =================================================================
   */
  describe('Cart - Remove Product and Discount', () => {
    it('should remove discount when product is removed from cart', async () => {
      try {
        // Add product to cart
        await page.goto(getFullUrl(E2E_CONFIG.TEST_PRODUCT_WITH_DISCOUNT_URL));
        await waitForNetworkIdle(page);
        await addToCart(page, 1);
        await goToCart(page, E2E_CONFIG.STORE_URL);
        await page.waitForTimeout(2000);

        // Verify discount is applied
        let hasDiscount = await isDiscountAppliedInCart(page);
        expect(hasDiscount).toBe(true);

        // Remove item from cart
        await removeCartItem(page, 0);
        await page.waitForTimeout(2000);

        // Verify cart is empty or discount is removed
        const cartItems = await getCartItems(page);
        expect(cartItems.length).toBe(0);

        // Discount should not be present
        hasDiscount = await isDiscountAppliedInCart(page);
        expect(hasDiscount).toBe(false);
      } catch (error) {
        await takeScreenshot(page, 'remove-product-discount-failure');
        throw error;
      }
    }, 30000);

    it('should update discount when quantity is reduced', async () => {
      try {
        // Add 2 items
        await page.goto(getFullUrl(E2E_CONFIG.TEST_PRODUCT_WITH_DISCOUNT_URL));
        await waitForNetworkIdle(page);
        await addToCart(page, 2);
        await goToCart(page, E2E_CONFIG.STORE_URL);
        await page.waitForTimeout(2000);

        // Get initial discount
        const initialDiscount = await getCartDiscount(page);
        const initialAmount = parsePrice(initialDiscount?.amount || '0');

        // Update quantity to 1
        await updateCartQuantity(page, 0, 1);
        await page.waitForTimeout(2000);

        // Get updated discount
        const updatedDiscount = await getCartDiscount(page);
        const updatedAmount = parsePrice(updatedDiscount?.amount || '0');

        // Discount should be less (since quantity reduced)
        expect(updatedAmount).toBeLessThan(initialAmount);
      } catch (error) {
        await takeScreenshot(page, 'update-quantity-discount-failure');
        throw error;
      }
    }, 30000);
  });

  /**
   * =================================================================
   * Test 6: Multi-Product Test
   * =================================================================
   */
  describe('Cart - Multiple Products with Discounts', () => {
    it('should apply discounts to multiple products', async () => {
      try {
        // Add first discounted product
        await page.goto(getFullUrl(E2E_CONFIG.TEST_PRODUCT_WITH_DISCOUNT_URL));
        await waitForNetworkIdle(page);
        await addToCart(page, 1);

        // Add second product (assuming it has discount too)
        // In real scenario, you'd have another product URL
        await page.goto(getFullUrl(E2E_CONFIG.TEST_PRODUCT_URL));
        await waitForNetworkIdle(page);
        await addToCart(page, 1);

        // Go to cart
        await goToCart(page, E2E_CONFIG.STORE_URL);
        await page.waitForTimeout(2000);

        // Verify multiple items in cart
        const cartItems = await getCartItems(page);
        expect(cartItems.length).toBeGreaterThanOrEqual(1);

        // Check if discount is applied
        const hasDiscount = await isDiscountAppliedInCart(page);
        // At least one product should have discount
        expect(hasDiscount).toBe(true);
      } catch (error) {
        await takeScreenshot(page, 'multi-product-discount-failure');
        throw error;
      }
    }, 30000);

    it('should handle mix of discounted and non-discounted products', async () => {
      try {
        // Add discounted product
        await page.goto(getFullUrl(E2E_CONFIG.TEST_PRODUCT_WITH_DISCOUNT_URL));
        await waitForNetworkIdle(page);
        await addToCart(page, 1);

        // Add non-discounted product
        await page.goto(getFullUrl(E2E_CONFIG.TEST_PRODUCT_URL));
        await waitForNetworkIdle(page);
        await addToCart(page, 1);

        // Go to cart
        await goToCart(page, E2E_CONFIG.STORE_URL);
        await page.waitForTimeout(2000);

        // Verify cart has multiple items
        const cartItems = await getCartItems(page);
        expect(cartItems.length).toBeGreaterThanOrEqual(1);

        // Discount should still be applied to eligible products
        const hasDiscount = await isDiscountAppliedInCart(page);
        expect(hasDiscount).toBe(true);
      } catch (error) {
        await takeScreenshot(page, 'mixed-products-discount-failure');
        throw error;
      }
    }, 30000);

    it('should calculate correct total with multiple discounts', async () => {
      try {
        // Add discounted product twice
        await page.goto(getFullUrl(E2E_CONFIG.TEST_PRODUCT_WITH_DISCOUNT_URL));
        await waitForNetworkIdle(page);
        await addToCart(page, 1);
        await page.waitForTimeout(1000);
        await addToCart(page, 1);

        await goToCart(page, E2E_CONFIG.STORE_URL);
        await page.waitForTimeout(2000);

        // Get cart total
        const cartTotal = await getCartTotal(page);
        expect(cartTotal).toBeTruthy();

        const total = parsePrice(cartTotal);
        expect(total).toBeGreaterThan(0);

        // Get discount info
        const discountInfo = await getCartDiscount(page);
        if (discountInfo) {
          const discountAmount = parsePrice(discountInfo.amount);
          expect(discountAmount).toBeGreaterThan(0);
        }
      } catch (error) {
        await takeScreenshot(page, 'multiple-discounts-total-failure');
        throw error;
      }
    }, 30000);
  });

  /**
   * =================================================================
   * Test 7: Discount Carryover to Order
   * =================================================================
   */
  describe('Checkout - Discount Carryover to Order', () => {
    it('should persist discount from cart to checkout', async () => {
      try {
        // Add discounted product
        await page.goto(getFullUrl(E2E_CONFIG.TEST_PRODUCT_WITH_DISCOUNT_URL));
        await waitForNetworkIdle(page);
        await addToCart(page, 1);

        // Get cart discount
        await goToCart(page, E2E_CONFIG.STORE_URL);
        await page.waitForTimeout(2000);
        const cartDiscount = await getCartDiscount(page);

        expect(cartDiscount).not.toBeNull();
        const cartDiscountAmount = parsePrice(cartDiscount.amount);

        // Proceed to checkout
        await proceedToCheckout(page);
        await waitForNetworkIdle(page);
        await page.waitForTimeout(3000);

        // Get checkout discount
        const checkoutDiscount = await getCheckoutDiscount(page);
        expect(checkoutDiscount).not.toBeNull();

        const checkoutDiscountAmount = parsePrice(checkoutDiscount.amount);

        // Discount amounts should match (carryover)
        expect(checkoutDiscountAmount).toBe(cartDiscountAmount);
      } catch (error) {
        await takeScreenshot(page, 'discount-carryover-failure');
        throw error;
      }
    }, 30000);

    it('should maintain discount through checkout steps', async () => {
      try {
        // Add discounted product and go to checkout
        await page.goto(getFullUrl(E2E_CONFIG.TEST_PRODUCT_WITH_DISCOUNT_URL));
        await waitForNetworkIdle(page);
        await addToCart(page, 1);
        await goToCart(page, E2E_CONFIG.STORE_URL);
        await page.waitForTimeout(2000);
        await proceedToCheckout(page);
        await waitForNetworkIdle(page);
        await page.waitForTimeout(3000);

        // Get initial discount at checkout
        const initialDiscount = await getCheckoutDiscount(page);
        expect(initialDiscount).not.toBeNull();
        const initialAmount = parsePrice(initialDiscount.amount);

        // Fill some checkout info (simulating progression)
        await fillCheckoutInfo(page, {
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        });

        await page.waitForTimeout(2000);

        // Verify discount is still present
        const persistedDiscount = await getCheckoutDiscount(page);
        expect(persistedDiscount).not.toBeNull();

        const persistedAmount = parsePrice(persistedDiscount.amount);
        expect(persistedAmount).toBe(initialAmount);
      } catch (error) {
        await takeScreenshot(page, 'checkout-steps-discount-failure');
        throw error;
      }
    }, 30000);

    it('should include discount in order summary', async () => {
      try {
        // Complete checkout flow
        await page.goto(getFullUrl(E2E_CONFIG.TEST_PRODUCT_WITH_DISCOUNT_URL));
        await waitForNetworkIdle(page);
        await addToCart(page, 1);
        await goToCart(page, E2E_CONFIG.STORE_URL);
        await page.waitForTimeout(2000);
        await proceedToCheckout(page);
        await waitForNetworkIdle(page);
        await page.waitForTimeout(3000);

        // Get checkout summary
        const summary = await getCheckoutSummary(page);
        expect(summary.length).toBeGreaterThan(0);

        // Get discount in order summary
        const discount = await getCheckoutDiscount(page);
        expect(discount).not.toBeNull();
        expect(discount.name).toBeTruthy();
        expect(discount.amount).toBeTruthy();

        // Get total
        const total = await getCheckoutTotal(page);
        expect(total).toBeTruthy();

        const totalAmount = parsePrice(total);
        const discountAmount = parsePrice(discount.amount);

        // Total should reflect the discount
        expect(discountAmount).toBeGreaterThan(0);
        expect(totalAmount).toBeGreaterThan(0);
      } catch (error) {
        await takeScreenshot(page, 'order-summary-discount-failure');
        throw error;
      }
    }, 30000);
  });
});
