/**
 * Storefront Helper Functions for E2E Tests
 * Common interactions with Shopify storefront elements
 */

import { waitForNetworkIdle, waitFor } from './playwright-setup.js';

/**
 * Product Page Helpers
 */

/**
 * Check if discount is visible on product page
 */
export async function isDiscountVisibleOnProductPage(page) {
  try {
    // Check for discount block (from theme extension)
    const discountBlock = await page.locator('.product-discount-block').isVisible({ timeout: 5000 });
    return discountBlock;
  } catch (error) {
    return false;
  }
}

/**
 * Get discount information from product page
 */
export async function getProductPageDiscount(page) {
  const discountBlock = page.locator('.product-discount-block');

  if (!(await discountBlock.isVisible())) {
    return null;
  }

  const discountText = await discountBlock.textContent();
  const originalPrice = await discountBlock.locator('.original-price').textContent();
  const discountedPrice = await discountBlock.locator('.discounted-price').textContent();
  const savingsText = await discountBlock.locator('.savings-text').textContent();

  return {
    text: discountText,
    originalPrice,
    discountedPrice,
    savingsText,
  };
}

/**
 * Get discount badge information
 */
export async function getDiscountBadge(page) {
  try {
    const badge = page.locator('.product-discount-badge-wrapper');
    if (!(await badge.isVisible({ timeout: 3000 }))) {
      return null;
    }

    const badgeText = await badge.textContent();
    return { text: badgeText.trim() };
  } catch (error) {
    return null;
  }
}

/**
 * Add product to cart from product page
 */
export async function addToCart(page, quantity = 1) {
  // Find quantity input and set value
  const quantityInput = page.locator('input[name="quantity"], input[type="number"]').first();
  if (await quantityInput.isVisible({ timeout: 2000 })) {
    await quantityInput.fill(quantity.toString());
  }

  // Find and click add to cart button
  const addToCartButton = page.locator(
    'button[name="add"], button[type="submit"]:has-text("Add to cart"), .add-to-cart-button'
  ).first();

  await addToCartButton.click();
  await waitFor(1000); // Wait for cart update
}

/**
 * Cart Page Helpers
 */

/**
 * Navigate to cart page
 */
export async function goToCart(page, storeUrl) {
  await page.goto(`${storeUrl}/cart`);
  await waitForNetworkIdle(page);
}

/**
 * Get cart items
 */
export async function getCartItems(page) {
  const items = await page.locator('.cart-item, .cart__item, [data-cart-item]').all();

  const cartItems = [];
  for (const item of items) {
    const title = await item.locator('.cart-item__name, .cart__item-name, [data-cart-item-title]').textContent();
    const price = await item.locator('.cart-item__price, .cart__item-price, [data-cart-item-price]').textContent();
    const quantity = await item.locator('.cart-item__quantity, input[name*="quantity"]').first().inputValue();

    cartItems.push({
      title: title?.trim(),
      price: price?.trim(),
      quantity: parseInt(quantity || '1'),
    });
  }

  return cartItems;
}

/**
 * Get cart total
 */
export async function getCartTotal(page) {
  try {
    const totalElement = page.locator('.cart__total, .cart-total, [data-cart-total]').first();
    const totalText = await totalElement.textContent();
    return totalText?.trim();
  } catch (error) {
    return null;
  }
}

/**
 * Get cart discount information
 */
export async function getCartDiscount(page) {
  try {
    const discountElement = page.locator('.cart__discount, .cart-discount, [data-cart-discount]').first();

    if (!(await discountElement.isVisible({ timeout: 5000 }))) {
      return null;
    }

    const discountText = await discountElement.textContent();
    const discountAmount = await page.locator('.cart__discount-amount, .discount-amount').first().textContent();

    return {
      text: discountText?.trim(),
      amount: discountAmount?.trim(),
    };
  } catch (error) {
    return null;
  }
}

/**
 * Check if discount is applied in cart
 */
export async function isDiscountAppliedInCart(page) {
  try {
    // Look for discount indicators
    const hasDiscountClass = await page.locator('.cart-item--discounted, .cart__item--discounted').count() > 0;
    const hasDiscountText = await page.locator('text=/discount|save|off/i').count() > 0;

    return hasDiscountClass || hasDiscountText;
  } catch (error) {
    return false;
  }
}

/**
 * Remove item from cart
 */
export async function removeCartItem(page, itemIndex = 0) {
  const removeButtons = page.locator(
    '.cart-item__remove, .cart__remove, button:has-text("Remove"), a:has-text("Remove")'
  );

  const button = removeButtons.nth(itemIndex);
  await button.click();
  await waitFor(1000); // Wait for cart update
}

/**
 * Update cart item quantity
 */
export async function updateCartQuantity(page, itemIndex, newQuantity) {
  const quantityInputs = page.locator('.cart-item__quantity input, input[name*="quantity"]');
  const input = quantityInputs.nth(itemIndex);

  await input.fill(newQuantity.toString());
  await input.press('Enter');
  await waitFor(1000); // Wait for cart update
}

/**
 * Checkout Helpers
 */

/**
 * Proceed to checkout from cart
 */
export async function proceedToCheckout(page) {
  const checkoutButton = page.locator(
    'button[name="checkout"], button:has-text("Checkout"), .cart__checkout, a[href*="checkout"]'
  ).first();

  await checkoutButton.click();
  await waitForNetworkIdle(page);
}

/**
 * Check if on checkout page
 */
export async function isOnCheckoutPage(page) {
  const url = page.url();
  return url.includes('/checkout') || url.includes('/checkouts');
}

/**
 * Get checkout summary items
 */
export async function getCheckoutSummary(page) {
  try {
    const summaryItems = await page.locator('.order-summary__section__content .product, [data-product-row]').all();

    const items = [];
    for (const item of summaryItems) {
      const title = await item.locator('.product__description__name, [data-product-title]').textContent();
      const price = await item.locator('.product__price, [data-product-price]').textContent();

      items.push({
        title: title?.trim(),
        price: price?.trim(),
      });
    }

    return items;
  } catch (error) {
    return [];
  }
}

/**
 * Get checkout discount information
 */
export async function getCheckoutDiscount(page) {
  try {
    // Wait for discount to appear
    const discountRow = page.locator('.order-summary__section--discount, [data-discount-row]').first();

    if (!(await discountRow.isVisible({ timeout: 10000 }))) {
      return null;
    }

    const discountName = await discountRow.locator('.reduction-code__text, [data-discount-name]').textContent();
    const discountAmount = await discountRow.locator('.order-summary__emphasis, [data-discount-amount]').textContent();

    return {
      name: discountName?.trim(),
      amount: discountAmount?.trim(),
    };
  } catch (error) {
    return null;
  }
}

/**
 * Get checkout total
 */
export async function getCheckoutTotal(page) {
  try {
    const totalElement = page.locator('.payment-due__price, [data-checkout-total]').first();
    const totalText = await totalElement.textContent();
    return totalText?.trim();
  } catch (error) {
    return null;
  }
}

/**
 * Fill checkout information (for testing)
 */
export async function fillCheckoutInfo(page, customerInfo) {
  // Email
  if (customerInfo.email) {
    await page.locator('input[name="email"], #email').fill(customerInfo.email);
  }

  // Shipping address
  if (customerInfo.firstName) {
    await page.locator('input[name="firstName"], #TextField0').fill(customerInfo.firstName);
  }
  if (customerInfo.lastName) {
    await page.locator('input[name="lastName"], #TextField1').fill(customerInfo.lastName);
  }
  if (customerInfo.address) {
    await page.locator('input[name="address1"], #TextField2').fill(customerInfo.address);
  }
  if (customerInfo.city) {
    await page.locator('input[name="city"], #TextField3').fill(customerInfo.city);
  }
  if (customerInfo.postalCode) {
    await page.locator('input[name="postalCode"], #TextField5').fill(customerInfo.postalCode);
  }

  await waitFor(500);
}

/**
 * General Helpers
 */

/**
 * Parse price string to number
 */
export function parsePrice(priceString) {
  if (!priceString) return 0;
  // Remove currency symbols and convert to number
  return parseFloat(priceString.replace(/[^0-9.]/g, ''));
}

/**
 * Format price to currency string
 */
export function formatPrice(amount) {
  return `$${amount.toFixed(2)}`;
}

/**
 * Calculate expected discount amount
 */
export function calculateExpectedDiscount(price, discountType, discountValue) {
  if (discountType === 'percentage') {
    return (price * discountValue) / 100;
  } else if (discountType === 'fixed') {
    return Math.min(price, discountValue);
  }
  return 0;
}

/**
 * Wait for element to appear
 */
export async function waitForElement(page, selector, timeout = 10000) {
  try {
    await page.locator(selector).waitFor({ state: 'visible', timeout });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if element exists
 */
export async function elementExists(page, selector) {
  try {
    return await page.locator(selector).count() > 0;
  } catch (error) {
    return false;
  }
}
