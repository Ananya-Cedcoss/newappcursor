/**
 * Discount Calculator Module
 * Extracted from Liquid templates for testability
 * Handles all discount calculation logic
 */

/**
 * Format cents to money string
 * @param {number} cents - Amount in cents
 * @returns {string} Formatted money string
 */
export function formatMoney(cents) {
  if (typeof cents !== 'number') {
    throw new Error('cents must be a number');
  }
  return '$' + (cents / 100).toFixed(2);
}

/**
 * Calculate discount amount and final price
 * @param {number} originalPrice - Original price in cents
 * @param {Object} discount - Discount object
 * @param {string} discount.type - 'percentage' or 'fixed'
 * @param {number} discount.value - Discount value (percentage or dollars)
 * @returns {Object} Calculation result
 */
export function calculateDiscount(originalPrice, discount) {
  if (typeof originalPrice !== 'number' || originalPrice < 0) {
    throw new Error('originalPrice must be a non-negative number');
  }

  if (!discount || !discount.type || typeof discount.value !== 'number') {
    throw new Error('Invalid discount object');
  }

  let discountAmount = 0;
  let discountedPrice = originalPrice;

  if (discount.type === 'percentage') {
    // Percentage discount
    if (discount.value < 0 || discount.value > 100) {
      throw new Error('Percentage value must be between 0 and 100');
    }
    discountAmount = Math.round((originalPrice * discount.value) / 100);
    discountedPrice = originalPrice - discountAmount;
  } else if (discount.type === 'fixed') {
    // Fixed discount (value in dollars, convert to cents)
    discountAmount = discount.value * 100;
    discountedPrice = Math.max(0, originalPrice - discountAmount);
  } else {
    throw new Error('Invalid discount type. Must be "percentage" or "fixed"');
  }

  return {
    originalPrice,
    discountAmount,
    discountedPrice,
    discountType: discount.type,
    discountValue: discount.value,
    savingsPercentage: Math.round((discountAmount / originalPrice) * 100),
  };
}

/**
 * Generate discount message
 * @param {Object} discount - Discount object
 * @param {number} discountAmount - Calculated discount amount in cents
 * @returns {string} Discount message
 */
export function generateDiscountMessage(discount, discountAmount) {
  if (!discount || !discount.type) {
    throw new Error('Invalid discount object');
  }

  if (discount.type === 'percentage') {
    return `Save ${discount.value}% today!`;
  } else if (discount.type === 'fixed') {
    return `Save ${formatMoney(discountAmount)} today!`;
  }

  return '';
}

/**
 * Generate badge HTML based on discount type
 * @param {Object} discount - Discount object
 * @param {number} discountAmount - Calculated discount amount in cents
 * @returns {string} Badge HTML
 */
export function generateBadgeHTML(discount, discountAmount) {
  if (!discount || !discount.type) {
    throw new Error('Invalid discount object');
  }

  if (discount.type === 'percentage') {
    return `<div class="discount-badge discount-badge--percentage">
              <span class="discount-badge__value">-${discount.value}%</span>
            </div>`;
  } else if (discount.type === 'fixed') {
    return `<div class="discount-badge discount-badge--fixed">
              <span class="discount-badge__value">-${formatMoney(discountAmount)}</span>
            </div>`;
  }

  return '';
}

/**
 * Check if discount should be visible
 * @param {Object} data - API response data
 * @returns {boolean} Whether discount should be displayed
 */
export function shouldShowDiscount(data) {
  return !!(data && data.success && data.discount);
}

/**
 * Fetch discount data for a product
 * @param {string} productId - Shopify product ID
 * @param {string} baseUrl - Base URL for API (defaults to app proxy)
 * @returns {Promise<Object>} Discount data
 */
export async function fetchDiscountData(productId, baseUrl = '/apps/discount-proxy') {
  if (!productId) {
    throw new Error('productId is required');
  }

  const url = `${baseUrl}/product-discount?productId=${productId}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching discount data:', error);
    throw error;
  }
}

/**
 * Build complete discount UI HTML
 * @param {Object} discount - Discount object
 * @param {number} originalPrice - Original price in cents
 * @param {string} badgeText - Badge label text
 * @returns {string} Complete discount UI HTML
 */
export function buildDiscountUI(discount, originalPrice, badgeText = 'Special Offer') {
  const calculation = calculateDiscount(originalPrice, discount);
  const discountMessage = generateDiscountMessage(discount, calculation.discountAmount);

  return `
    <div class="discount-badge">
      <span class="discount-badge__icon">🎉</span>
      <span class="discount-badge__label">${badgeText}</span>
    </div>

    <div class="discount-info">
      <h3 class="discount-info__name">${discount.name}</h3>

      <div class="discount-info__message">
        <p class="discount-highlight">${discountMessage}</p>
      </div>

      <div class="discount-info__amount">
        ${discount.type === 'percentage'
          ? `<span class="discount-percentage">${discount.value}% OFF</span>`
          : `<span class="discount-fixed">${formatMoney(calculation.discountAmount)} OFF</span>`
        }
      </div>

      <div class="discount-pricing">
        <span class="original-price">
          <s>${formatMoney(calculation.originalPrice)}</s>
        </span>
        <span class="discounted-price">
          ${formatMoney(calculation.discountedPrice)}
        </span>
        <span class="savings">
          Save ${formatMoney(calculation.discountAmount)}
        </span>
      </div>

      <div class="discount-info__footer">
        <p class="discount-auto-apply">
          ✓ Discount applied automatically at checkout
        </p>
      </div>
    </div>
  `;
}

/**
 * Build price display HTML
 * @param {Object} discount - Discount object
 * @param {number} variantPrice - Variant price in cents
 * @returns {string} Price display HTML
 */
export function buildPriceDisplay(discount, variantPrice) {
  const calculation = calculateDiscount(variantPrice, discount);

  return `
    <div class="product-discount-price">
      <div class="price-wrapper">
        <span class="price price--original">
          <s>${formatMoney(calculation.originalPrice)}</s>
        </span>
        <span class="price price--discounted">
          ${formatMoney(calculation.discountedPrice)}
        </span>
      </div>
      <div class="discount-savings">
        <span class="savings-label">You save:</span>
        <span class="savings-amount">${formatMoney(calculation.discountAmount)} (${discount.value}${discount.type === 'percentage' ? '%' : ''})</span>
      </div>
    </div>
  `;
}
