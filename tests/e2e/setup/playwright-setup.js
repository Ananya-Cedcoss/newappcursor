/**
 * Playwright Setup and Configuration for E2E Tests
 * Provides browser context and helper utilities
 */

import { chromium } from '@playwright/test';

/**
 * E2E Test Configuration
 * Set via environment variables or defaults
 */
export const E2E_CONFIG = {
  // Shopify store URL (should be test/development store)
  STORE_URL: process.env.SHOPIFY_STORE_URL || 'https://your-test-store.myshopify.com',

  // Product URLs for testing
  TEST_PRODUCT_URL: process.env.TEST_PRODUCT_URL || '/products/test-product',
  TEST_PRODUCT_WITH_DISCOUNT_URL: process.env.TEST_PRODUCT_WITH_DISCOUNT_URL || '/products/discounted-product',

  // Cart and checkout URLs
  CART_URL: '/cart',
  CHECKOUT_URL: '/checkout',

  // Browser configuration
  HEADLESS: process.env.HEADLESS !== 'false', // Default to headless
  SLOW_MO: parseInt(process.env.SLOW_MO || '0'), // Slow down by ms for debugging
  TIMEOUT: parseInt(process.env.E2E_TIMEOUT || '30000'), // 30 seconds default

  // Screenshot configuration
  SCREENSHOT_ON_FAILURE: true,
  SCREENSHOT_DIR: 'tests/e2e/screenshots',
};

/**
 * Create a new browser instance
 */
export async function createBrowser() {
  return await chromium.launch({
    headless: E2E_CONFIG.HEADLESS,
    slowMo: E2E_CONFIG.SLOW_MO,
  });
}

/**
 * Create a new browser context (isolated session)
 */
export async function createContext(browser) {
  return await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
}

/**
 * Create a new page
 */
export async function createPage(context) {
  const page = await context.newPage();
  page.setDefaultTimeout(E2E_CONFIG.TIMEOUT);
  return page;
}

/**
 * Setup browser, context, and page
 * Returns all three for test usage
 */
export async function setupBrowser() {
  const browser = await createBrowser();
  const context = await createContext(browser);
  const page = await createPage(context);

  return { browser, context, page };
}

/**
 * Cleanup browser resources
 */
export async function cleanupBrowser(browser, context, page) {
  if (page) await page.close();
  if (context) await context.close();
  if (browser) await browser.close();
}

/**
 * Take screenshot on test failure
 */
export async function takeScreenshot(page, testName) {
  if (!E2E_CONFIG.SCREENSHOT_ON_FAILURE) return;

  const screenshotPath = `${E2E_CONFIG.SCREENSHOT_DIR}/${testName.replace(/\s+/g, '-')}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved: ${screenshotPath}`);
}

/**
 * Wait for network idle (useful after navigation)
 */
export async function waitForNetworkIdle(page, timeout = 5000) {
  try {
    await page.waitForLoadState('networkidle', { timeout });
  } catch (error) {
    console.warn('Network idle timeout - continuing anyway');
  }
}

/**
 * Clear cart (useful for test setup)
 */
export async function clearCart(page) {
  await page.goto(`${E2E_CONFIG.STORE_URL}/cart/clear`);
  await waitForNetworkIdle(page);
}

/**
 * Get full URL for path
 */
export function getFullUrl(path) {
  return `${E2E_CONFIG.STORE_URL}${path}`;
}

/**
 * Wait helper with error handling
 */
export async function waitFor(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
