/**
 * Shopify Product API utilities
 * Handles product operations and metafield management
 */

/**
 * Fetch all products from Shopify
 * @param {Object} admin - Shopify admin API instance
 * @param {number} limit - Number of products to fetch (default 250)
 * @returns {Promise<Array>} Array of products
 */
export async function fetchProducts(admin, limit = 250) {
  const response = await admin.graphql(
    `#graphql
      query fetchProducts($limit: Int!) {
        products(first: $limit) {
          edges {
            node {
              id
              title
              handle
              status
              featuredImage {
                url
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    price
                    sku
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }`,
    {
      variables: {
        limit,
      },
    },
  );

  const responseJson = await response.json();
  return responseJson.data.products.edges.map((edge) => edge.node);
}

/**
 * Sync discount metadata to Shopify products using metafields
 * @param {Object} admin - Shopify admin API instance
 * @param {Array<string>} productIds - Array of Shopify product IDs
 * @param {Object} discountData - Discount information to store
 * @param {string} discountData.id - Discount ID
 * @param {string} discountData.name - Discount name
 * @param {string} discountData.type - Discount type (percentage or fixed)
 * @param {number} discountData.value - Discount value
 * @returns {Promise<Object>} Result of the sync operation
 */
export async function syncDiscountToProducts(admin, productIds, discountData) {
  const results = {
    success: [],
    errors: [],
  };

  // Create metafield data
  const metafieldValue = JSON.stringify({
    discountId: discountData.id,
    name: discountData.name,
    type: discountData.type,
    value: discountData.value,
    updatedAt: new Date().toISOString(),
  });

  // Sync to each product
  for (const productId of productIds) {
    try {
      const response = await admin.graphql(
        `#graphql
          mutation SetProductMetafield($metafields: [MetafieldsSetInput!]!) {
            metafieldsSet(metafields: $metafields) {
              metafields {
                id
                namespace
                key
                value
              }
              userErrors {
                field
                message
              }
            }
          }`,
        {
          variables: {
            metafields: [
              {
                ownerId: productId,
                namespace: "custom",
                key: "discount_info",
                type: "json",
                value: metafieldValue,
              },
            ],
          },
        },
      );

      const responseJson = await response.json();

      if (responseJson.data.metafieldsSet.userErrors.length > 0) {
        results.errors.push({
          productId,
          errors: responseJson.data.metafieldsSet.userErrors,
        });
      } else {
        results.success.push(productId);
      }
    } catch (error) {
      results.errors.push({
        productId,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Remove discount metadata from products
 * @param {Object} admin - Shopify admin API instance
 * @param {Array<string>} productIds - Array of Shopify product IDs
 * @returns {Promise<Object>} Result of the removal operation
 */
export async function removeDiscountFromProducts(admin, productIds) {
  const results = {
    success: [],
    errors: [],
  };

  for (const productId of productIds) {
    try {
      // First, fetch the metafield ID
      const getResponse = await admin.graphql(
        `#graphql
          query GetProductMetafield($ownerId: ID!) {
            metafields(first: 10, ownerId: $ownerId, namespace: "custom", key: "discount_info") {
              edges {
                node {
                  id
                }
              }
            }
          }`,
        {
          variables: {
            ownerId: productId,
          },
        },
      );

      const getResponseJson = await getResponse.json();
      const metafields = getResponseJson.data.metafields.edges;

      if (metafields.length > 0) {
        const metafieldId = metafields[0].node.id;

        // Delete the metafield
        const deleteResponse = await admin.graphql(
          `#graphql
            mutation DeleteMetafield($input: MetafieldDeleteInput!) {
              metafieldDelete(input: $input) {
                deletedId
                userErrors {
                  field
                  message
                }
              }
            }`,
          {
            variables: {
              input: {
                id: metafieldId,
              },
            },
          },
        );

        const deleteResponseJson = await deleteResponse.json();

        if (deleteResponseJson.data.metafieldDelete.userErrors.length > 0) {
          results.errors.push({
            productId,
            errors: deleteResponseJson.data.metafieldDelete.userErrors,
          });
        } else {
          results.success.push(productId);
        }
      } else {
        results.success.push(productId);
      }
    } catch (error) {
      results.errors.push({
        productId,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Get discount metadata from a product
 * @param {Object} admin - Shopify admin API instance
 * @param {string} productId - Shopify product ID
 * @returns {Promise<Object|null>} Discount metadata or null
 */
export async function getProductDiscountMetadata(admin, productId) {
  try {
    const response = await admin.graphql(
      `#graphql
        query GetProductMetafield($ownerId: ID!) {
          metafields(first: 1, ownerId: $ownerId, namespace: "custom", key: "discount_info") {
            edges {
              node {
                id
                value
                createdAt
                updatedAt
              }
            }
          }
        }`,
      {
        variables: {
          ownerId: productId,
        },
      },
    );

    const responseJson = await response.json();
    const metafields = responseJson.data.metafields.edges;

    if (metafields.length > 0) {
      return JSON.parse(metafields[0].node.value);
    }

    return null;
  } catch (error) {
    console.error("Error fetching product discount metadata:", error);
    return null;
  }
}

/**
 * Bulk update discount metadata for multiple products
 * @param {Object} admin - Shopify admin API instance
 * @param {Array<string>} productIds - Array of Shopify product IDs
 * @param {Object} discountData - Discount information to store
 * @returns {Promise<Object>} Result of the bulk update
 */
export async function bulkUpdateDiscountMetadata(admin, productIds, discountData) {
  const metafieldValue = JSON.stringify({
    discountId: discountData.id,
    name: discountData.name,
    type: discountData.type,
    value: discountData.value,
    updatedAt: new Date().toISOString(),
  });

  const metafields = productIds.map((productId) => ({
    ownerId: productId,
    namespace: "custom",
    key: "discount_info",
    type: "json",
    value: metafieldValue,
  }));

  try {
    const response = await admin.graphql(
      `#graphql
        mutation SetProductMetafields($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields {
              id
              namespace
              key
              value
            }
            userErrors {
              field
              message
            }
          }
        }`,
      {
        variables: {
          metafields,
        },
      },
    );

    const responseJson = await response.json();

    return {
      success: responseJson.data.metafieldsSet.userErrors.length === 0,
      metafields: responseJson.data.metafieldsSet.metafields,
      errors: responseJson.data.metafieldsSet.userErrors,
    };
  } catch (error) {
    return {
      success: false,
      errors: [{ message: error.message }],
    };
  }
}
