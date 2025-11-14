/**
 * Shopify Function: Product Discount Application
 *
 * This function applies product-specific discounts to cart items.
 * It reads discount configuration from the function metafield and applies
 * discounts to qualifying products.
 */

// @ts-nocheck

/**
 * Type definitions would normally be imported from generated files
 * For now, we're using plain JavaScript without TypeScript validation
 */

/**
 * Empty discount result
 */
const EMPTY_DISCOUNT = {
  discounts: [],
};

/**
 * Main function that processes cart and applies discounts
 * @param {object} input - The input from Shopify
 * @returns {object} The discount result
 */
export function run(input) {
  // Parse discount configuration from metafield
  const configuration = JSON.parse(
    input?.discountNode?.metafield?.value ?? "{}"
  );

  if (!configuration.discounts || configuration.discounts.length === 0) {
    console.error("No discounts configured");
    return EMPTY_DISCOUNT;
  }

  const discounts = [];

  // Process each cart line
  for (const line of input.cart.lines) {
    // Only process ProductVariant merchandise
    if (line.merchandise.__typename !== "ProductVariant") {
      continue;
    }

    const productId = extractNumericId(line.merchandise.product.id);
    const variantPrice = parseFloat(line.merchandise.price.amount);

    // Find applicable discount for this product
    const applicableDiscount = findApplicableDiscount(
      configuration.discounts,
      productId
    );

    if (applicableDiscount) {
      const discountAmount = calculateDiscountAmount(
        variantPrice,
        applicableDiscount
      );

      if (discountAmount > 0) {
        discounts.push({
          targets: [
            {
              cartLine: {
                id: line.id,
              },
            },
          ],
          value: {
            percentage: {
              value: calculatePercentage(variantPrice, discountAmount).toString(),
            },
          },
          message: applicableDiscount.name || "Product Discount",
        });
      }
    }
  }

  if (discounts.length === 0) {
    return EMPTY_DISCOUNT;
  }

  return {
    discounts,
  };
}

/**
 * Extract numeric ID from Shopify GID
 * @param {string} gid - Shopify Global ID
 * @returns {string} Numeric ID
 */
function extractNumericId(gid) {
  const parts = gid.split("/");
  return parts[parts.length - 1];
}

/**
 * Find the best applicable discount for a product
 * @param {Array} discounts - Array of discount configurations
 * @param {string} productId - Product ID to match
 * @returns {object|null} The best applicable discount or null
 */
function findApplicableDiscount(discounts, productId) {
  const applicableDiscounts = discounts.filter((discount) => {
    // Empty productIds means applies to all products
    if (!discount.productIds || discount.productIds.length === 0) {
      return true;
    }
    // Check if product is in the discount's product list
    return discount.productIds.includes(productId);
  });

  if (applicableDiscounts.length === 0) {
    return null;
  }

  // If multiple discounts apply, return the one with highest percentage value
  // For percentage discounts, use the value directly
  // For fixed discounts, we can't compare without price context, so just return first match
  return applicableDiscounts.reduce((best, current) => {
    // Prefer percentage discounts, as they're easier to compare
    if (current.type === "percentage" && best.type === "fixed") {
      return current;
    }
    if (best.type === "percentage" && current.type === "fixed") {
      return best;
    }
    // Both same type, compare values
    return current.value > best.value ? current : best;
  });
}

/**
 * Calculate discount amount based on type
 * @param {number} price - Item price
 * @param {object} discount - Discount configuration
 * @returns {number} Discount amount
 */
function calculateDiscountAmount(price, discount) {
  if (discount.type === "percentage") {
    return (price * discount.value) / 100;
  } else if (discount.type === "fixed") {
    return Math.min(discount.value, price); // Don't exceed item price
  }
  return 0;
}

/**
 * Calculate percentage from absolute discount
 * @param {number} price - Original price
 * @param {number} discountAmount - Discount amount
 * @returns {number} Percentage value
 */
function calculatePercentage(price, discountAmount) {
  if (price === 0) return 0;
  return (discountAmount / price) * 100;
}
