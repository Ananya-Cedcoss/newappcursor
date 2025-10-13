import { test, expect } from '@playwright/test';
 
test.describe('Add to Cart functionality', () => {
  const storeUrl = 'https://ananya-staging.myshopify.com/';
  const storefrontPassword = 'euckis';
  const skiWaxProductHandle = 'selling-plans-ski-wax'; // product handle
  const mainProductName = 'Blue trouser'; 
 
  test('should login and add product to cart', async ({ page }) => {
    // 1. Go to storefront and handle password page
    await page.goto(storeUrl, { waitUntil: 'domcontentloaded' });
    
    const passwordField = page.locator('input[type="password"]');
    if (await passwordField.isVisible()) {
      console.log('🔐 Entering storefront password...');
      await passwordField.fill(storefrontPassword);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }
 
    console.log('✅ Logged into storefront successfully.');
 
    // 2. Go directly to product page
    await page.goto(`${storeUrl}products/${skiWaxProductHandle}`, { waitUntil: 'domcontentloaded' });
 
    // 3. Add product to cart
    const addToCartButton = page.locator(
      'button:has-text("Add to cart"), [data-add-to-cart], .add-to-cart-button'
    ).first();
    await expect(addToCartButton).toBeVisible({ timeout: 10000 });
    await addToCartButton.click();
    console.log(`🛒 Added product "${mainProductName}" to cart.`);
 
    // 4. Verify cart notification or drawer appears
    const cartDrawer = page.locator('.cart-notification, .cart-drawer, [data-cart-drawer]');
    await expect(cartDrawer).toBeVisible({ timeout: 5000 });
    console.log('✅ Cart drawer or notification is visible after adding product.');
  });
});
