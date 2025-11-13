import db from "../db.server";

/**
 * Calculate discount amount based on cart total
 * @param {Object} discount - Discount object from database
 * @param {number} cartTotal - Total cart value
 * @returns {number} - Discount amount
 */
export function calculateDiscountAmount(discount, cartTotal) {
  let discountAmount = 0;

  if (discount.type === "percentage") {
    discountAmount = cartTotal * (discount.value / 100);
  } else if (discount.type === "fixed") {
    discountAmount = discount.value;
  }

  // Apply max discount limit
  if (discount.maxDiscountAmount && discountAmount > discount.maxDiscountAmount) {
    discountAmount = discount.maxDiscountAmount;
  }

  // Discount cannot exceed cart total
  if (discountAmount > cartTotal) {
    discountAmount = cartTotal;
  }

  return discountAmount;
}

/**
 * Check if discount is valid for application
 * @param {Object} discount - Discount object from database
 * @param {number} cartTotal - Total cart value
 * @returns {Object} - { valid: boolean, reason: string }
 */
export function validateDiscount(discount, cartTotal) {
  const now = new Date();

  if (!discount.active) {
    return { valid: false, reason: "Discount is not active" };
  }

  if (discount.startDate > now) {
    return { valid: false, reason: "Discount is not yet active" };
  }

  if (discount.endDate && discount.endDate < now) {
    return { valid: false, reason: "Discount has expired" };
  }

  if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
    return { valid: false, reason: "Discount has reached usage limit" };
  }

  if (discount.minPurchaseAmount && cartTotal < discount.minPurchaseAmount) {
    return {
      valid: false,
      reason: `Minimum purchase amount of $${discount.minPurchaseAmount} required`
    };
  }

  return { valid: true };
}

/**
 * Get best available discount for cart
 * @param {string} shop - Shop domain
 * @param {number} cartTotal - Total cart value
 * @returns {Promise<Object|null>} - Best discount or null
 */
export async function getBestDiscount(shop, cartTotal) {
  const discounts = await db.discount.findMany({
    where: {
      shop,
      active: true,
      startDate: {
        lte: new Date(),
      },
      OR: [
        { endDate: null },
        { endDate: { gte: new Date() } },
      ],
    },
    orderBy: {
      priority: "desc",
    },
  });

  let bestDiscount = null;
  let maxSavings = 0;

  for (const discount of discounts) {
    const validation = validateDiscount(discount, cartTotal);
    if (!validation.valid) {
      continue;
    }

    const savings = calculateDiscountAmount(discount, cartTotal);
    if (savings > maxSavings) {
      maxSavings = savings;
      bestDiscount = { ...discount, savings };
    }
  }

  return bestDiscount;
}

/**
 * Apply discount code via Shopify Admin API
 * @param {Object} admin - Shopify admin API client
 * @param {string} discountCode - Discount code to create
 * @param {Object} discountData - Discount configuration
 * @returns {Promise<Object>} - Created discount from Shopify
 */
export async function createShopifyDiscount(admin, discountCode, discountData) {
  const { type, value, description, startDate, endDate, minPurchaseAmount } = discountData;

  const mutation = `
    mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
      discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
        codeDiscountNode {
          id
          codeDiscount {
            ... on DiscountCodeBasic {
              title
              codes(first: 1) {
                edges {
                  node {
                    code
                  }
                }
              }
              startsAt
              endsAt
              customerSelection {
                ... on DiscountCustomerAll {
                  allCustomers
                }
              }
              customerGets {
                value {
                  ... on DiscountPercentage {
                    percentage
                  }
                  ... on DiscountAmount {
                    amount {
                      amount
                    }
                  }
                }
                items {
                  ... on AllDiscountItems {
                    allItems
                  }
                }
              }
            }
          }
        }
        userErrors {
          field
          code
          message
        }
      }
    }
  `;

  const variables = {
    basicCodeDiscount: {
      title: discountCode,
      code: discountCode,
      startsAt: startDate.toISOString(),
      endsAt: endDate ? endDate.toISOString() : null,
      customerSelection: {
        all: true,
      },
      customerGets: {
        value:
          type === "percentage"
            ? {
                percentage: value / 100,
              }
            : {
                discountAmount: {
                  amount: value,
                  appliesOnEachItem: false,
                },
              },
        items: {
          all: true,
        },
      },
      minimumRequirement: minPurchaseAmount
        ? {
            subtotal: {
              greaterThanOrEqualToSubtotal: minPurchaseAmount.toString(),
            },
          }
        : null,
    },
  };

  const response = await admin.graphql(mutation, { variables });
  const result = await response.json();

  if (result.data?.discountCodeBasicCreate?.userErrors?.length > 0) {
    throw new Error(
      result.data.discountCodeBasicCreate.userErrors[0].message
    );
  }

  return result.data?.discountCodeBasicCreate?.codeDiscountNode;
}

/**
 * Sync local discount to Shopify
 * @param {Object} admin - Shopify admin API client
 * @param {Object} discount - Local discount object
 * @returns {Promise<void>}
 */
export async function syncDiscountToShopify(admin, discount) {
  try {
    await createShopifyDiscount(admin, discount.code, {
      type: discount.type,
      value: discount.value,
      description: discount.description,
      startDate: discount.startDate,
      endDate: discount.endDate,
      minPurchaseAmount: discount.minPurchaseAmount,
    });
  } catch (error) {
    console.error(`Failed to sync discount ${discount.code} to Shopify:`, error);
    throw error;
  }
}
