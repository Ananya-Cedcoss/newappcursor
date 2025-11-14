import prisma from "../db.server.js";

/**
 * Create a new discount
 * @param {Object} data - Discount data
 * @param {string} data.name - Discount name
 * @param {string} data.type - Discount type: "percentage" or "fixed"
 * @param {number} data.value - Discount value
 * @param {string[]} data.productIds - Array of product IDs
 * @returns {Promise<Object>} Created discount
 */
export async function createDiscount({ name, type, value, productIds }) {
  return await prisma.discount.create({
    data: {
      name,
      type,
      value,
      productIds: JSON.stringify(productIds),
    },
  });
}

/**
 * Get a discount by ID
 * @param {string} id - Discount ID
 * @returns {Promise<Object|null>} Discount object or null
 */
export async function getDiscountById(id) {
  const discount = await prisma.discount.findUnique({
    where: { id },
  });

  if (discount) {
    discount.productIds = JSON.parse(discount.productIds);
  }

  return discount;
}

/**
 * Get all discounts
 * @param {Object} options - Query options
 * @param {number} options.skip - Number of records to skip
 * @param {number} options.take - Number of records to take
 * @returns {Promise<Object[]>} Array of discounts
 */
export async function getAllDiscounts({ skip = 0, take = 100 } = {}) {
  const discounts = await prisma.discount.findMany({
    skip,
    take,
    orderBy: { createdAt: "desc" },
  });

  return discounts.map((discount) => ({
    ...discount,
    productIds: JSON.parse(discount.productIds),
  }));
}

/**
 * Update a discount
 * @param {string} id - Discount ID
 * @param {Object} data - Updated discount data
 * @returns {Promise<Object>} Updated discount
 */
export async function updateDiscount(id, data) {
  const updateData = { ...data };

  if (data.productIds) {
    updateData.productIds = JSON.stringify(data.productIds);
  }

  const discount = await prisma.discount.update({
    where: { id },
    data: updateData,
  });

  if (discount) {
    discount.productIds = JSON.parse(discount.productIds);
  }

  return discount;
}

/**
 * Delete a discount
 * @param {string} id - Discount ID
 * @returns {Promise<Object>} Deleted discount
 */
export async function deleteDiscount(id) {
  return await prisma.discount.delete({
    where: { id },
  });
}

/**
 * Get discounts by product ID
 * @param {string} productId - Product ID
 * @returns {Promise<Object[]>} Array of discounts applicable to the product
 */
export async function getDiscountsByProductId(productId) {
  const allDiscounts = await prisma.discount.findMany();

  return allDiscounts
    .filter((discount) => {
      const productIds = JSON.parse(discount.productIds);
      return productIds.includes(productId);
    })
    .map((discount) => ({
      ...discount,
      productIds: JSON.parse(discount.productIds),
    }));
}

/**
 * Get discounts by type
 * @param {string} type - Discount type: "percentage" or "fixed"
 * @returns {Promise<Object[]>} Array of discounts
 */
export async function getDiscountsByType(type) {
  const discounts = await prisma.discount.findMany({
    where: { type },
    orderBy: { createdAt: "desc" },
  });

  return discounts.map((discount) => ({
    ...discount,
    productIds: JSON.parse(discount.productIds),
  }));
}

/**
 * Count total discounts
 * @returns {Promise<number>} Total number of discounts
 */
export async function countDiscounts() {
  return await prisma.discount.count();
}
