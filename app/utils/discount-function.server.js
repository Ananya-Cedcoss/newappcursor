/**
 * Discount Function Management Utilities
 * Handles creation, updates, and activation of Shopify Functions for discounts
 */

/**
 * Create or update automatic discount with function
 * @param {Object} admin - Shopify Admin API client
 * @param {Object} discountConfig - Discount configuration
 * @returns {Promise<Object>} Result with discount ID and status
 */
export async function createDiscountFunction(admin, discountConfig) {
  const { id, name, discounts } = discountConfig;

  // Create metafield configuration for the function
  const functionConfiguration = {
    discounts: discounts,
  };

  // GraphQL mutation to create automatic discount with function
  const mutation = `
    mutation CreateAutomaticDiscount($discount: DiscountAutomaticAppInput!) {
      discountAutomaticAppCreate(automaticAppDiscount: $discount) {
        automaticAppDiscount {
          discountId
          title
          status
          functionId
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    discount: {
      title: name || "Product Discount",
      functionId: process.env.SHOPIFY_DISCOUNT_FUNCTION_ID, // Set during deployment
      startsAt: new Date().toISOString(),
      combinesWith: {
        productDiscounts: true,
        orderDiscounts: false,
        shippingDiscounts: false,
      },
      metafields: [
        {
          namespace: "product-discount",
          key: "function-configuration",
          type: "json",
          value: JSON.stringify(functionConfiguration),
        },
        {
          namespace: "product-discount",
          key: "internal-id",
          type: "single_line_text_field",
          value: id,
        },
      ],
    },
  };

  try {
    const response = await admin.graphql(mutation, { variables });
    const result = await response.json();

    if (result.data?.discountAutomaticAppCreate?.userErrors?.length > 0) {
      console.error(
        "Error creating discount:",
        result.data.discountAutomaticAppCreate.userErrors
      );
      return {
        success: false,
        errors: result.data.discountAutomaticAppCreate.userErrors,
      };
    }

    return {
      success: true,
      discount: result.data?.discountAutomaticAppCreate?.automaticAppDiscount,
    };
  } catch (error) {
    console.error("Error creating discount function:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update existing discount function configuration
 * @param {Object} admin - Shopify Admin API client
 * @param {string} discountId - Shopify discount ID
 * @param {Object} discountConfig - Updated discount configuration
 * @returns {Promise<Object>} Result with updated status
 */
export async function updateDiscountFunction(admin, discountId, discountConfig) {
  const { name, discounts } = discountConfig;

  const functionConfiguration = {
    discounts: discounts,
  };

  const mutation = `
    mutation UpdateAutomaticDiscount($id: ID!, $discount: DiscountAutomaticAppInput!) {
      discountAutomaticAppUpdate(id: $id, automaticAppDiscount: $discount) {
        automaticAppDiscount {
          discountId
          title
          status
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    id: discountId,
    discount: {
      title: name || "Product Discount",
      metafields: [
        {
          namespace: "product-discount",
          key: "function-configuration",
          type: "json",
          value: JSON.stringify(functionConfiguration),
        },
      ],
    },
  };

  try {
    const response = await admin.graphql(mutation, { variables });
    const result = await response.json();

    if (result.data?.discountAutomaticAppUpdate?.userErrors?.length > 0) {
      console.error(
        "Error updating discount:",
        result.data.discountAutomaticAppUpdate.userErrors
      );
      return {
        success: false,
        errors: result.data.discountAutomaticAppUpdate.userErrors,
      };
    }

    return {
      success: true,
      discount: result.data?.discountAutomaticAppUpdate?.automaticAppDiscount,
    };
  } catch (error) {
    console.error("Error updating discount function:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Delete automatic discount
 * @param {Object} admin - Shopify Admin API client
 * @param {string} discountId - Shopify discount ID to delete
 * @returns {Promise<Object>} Result with deletion status
 */
export async function deleteDiscountFunction(admin, discountId) {
  const mutation = `
    mutation DeleteAutomaticDiscount($id: ID!) {
      discountAutomaticDelete(id: $id) {
        deletedAutomaticDiscountId
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    id: discountId,
  };

  try {
    const response = await admin.graphql(mutation, { variables });
    const result = await response.json();

    if (result.data?.discountAutomaticDelete?.userErrors?.length > 0) {
      console.error(
        "Error deleting discount:",
        result.data.discountAutomaticDelete.userErrors
      );
      return {
        success: false,
        errors: result.data.discountAutomaticDelete.userErrors,
      };
    }

    return {
      success: true,
      deletedId: result.data?.discountAutomaticDelete?.deletedAutomaticDiscountId,
    };
  } catch (error) {
    console.error("Error deleting discount function:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get all active automatic discounts with functions
 * @param {Object} admin - Shopify Admin API client
 * @returns {Promise<Array>} List of automatic discounts
 */
export async function listDiscountFunctions(admin) {
  const query = `
    query GetAutomaticDiscounts {
      automaticDiscountNodes(first: 50) {
        edges {
          node {
            id
            automaticDiscount {
              ... on DiscountAutomaticApp {
                title
                status
                discountId
                combinesWith {
                  productDiscounts
                  orderDiscounts
                }
              }
            }
            metafield(namespace: "product-discount", key: "internal-id") {
              value
            }
          }
        }
      }
    }
  `;

  try {
    const response = await admin.graphql(query);
    const result = await response.json();

    const discounts =
      result.data?.automaticDiscountNodes?.edges?.map((edge) => ({
        shopifyId: edge.node.id,
        internalId: edge.node.metafield?.value,
        ...edge.node.automaticDiscount,
      })) || [];

    return {
      success: true,
      discounts,
    };
  } catch (error) {
    console.error("Error fetching discount functions:", error);
    return {
      success: false,
      error: error.message,
      discounts: [],
    };
  }
}

/**
 * Activate all discounts by syncing database discounts to Shopify Functions
 * @param {Object} admin - Shopify Admin API client
 * @param {Array} discounts - Array of discount objects from database
 * @returns {Promise<Object>} Sync results
 */
export async function syncDiscountsToFunction(admin, discounts) {
  const results = {
    created: [],
    updated: [],
    errors: [],
  };

  // Get existing function discounts
  const existing = await listDiscountFunctions(admin);
  const existingMap = new Map(
    existing.discounts.map((d) => [d.internalId, d])
  );

  for (const discount of discounts) {
    const discountConfig = {
      id: discount.id,
      name: discount.name,
      discounts: [
        {
          id: discount.id,
          name: discount.name,
          type: discount.type,
          value: discount.value,
          productIds: discount.productIds,
        },
      ],
    };

    const existingDiscount = existingMap.get(discount.id);

    if (existingDiscount) {
      // Update existing
      const result = await updateDiscountFunction(
        admin,
        existingDiscount.shopifyId,
        discountConfig
      );
      if (result.success) {
        results.updated.push(discount.id);
      } else {
        results.errors.push({ id: discount.id, error: result.error });
      }
    } else {
      // Create new
      const result = await createDiscountFunction(admin, discountConfig);
      if (result.success) {
        results.created.push(discount.id);
      } else {
        results.errors.push({ id: discount.id, error: result.error });
      }
    }
  }

  return results;
}
