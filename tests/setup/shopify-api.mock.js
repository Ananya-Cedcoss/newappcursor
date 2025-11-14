/**
 * Shopify Admin API Mocks
 * Provides mock responses for Shopify Admin API calls
 */

import { vi } from 'vitest';

/**
 * Mock GraphQL Response Helper
 * @param {Object} data - The data to return
 * @param {Array} errors - Optional errors array
 * @returns {Promise<Object>} Mock GraphQL response
 */
export function mockGraphQLResponse(data = {}, errors = null) {
  return {
    json: vi.fn().mockResolvedValue({
      data,
      errors,
    }),
  };
}

/**
 * Mock Product Query Response
 */
export function mockProductsQuery(products = []) {
  return mockGraphQLResponse({
    products: {
      edges: products.map((product) => ({
        node: {
          id: product.id || 'gid://shopify/Product/123',
          title: product.title || 'Test Product',
          handle: product.handle || 'test-product',
          status: product.status || 'ACTIVE',
          featuredImage: product.featuredImage || {
            url: 'https://cdn.shopify.com/test.jpg',
          },
          variants: {
            edges: [
              {
                node: {
                  id: 'gid://shopify/ProductVariant/123',
                  price: '50.00',
                  compareAtPrice: null,
                },
              },
            ],
          },
          ...product,
        },
      })),
    },
  });
}

/**
 * Mock Discount Automatic App Create Mutation
 */
export function mockDiscountAutomaticAppCreate(discount = {}) {
  return mockGraphQLResponse({
    discountAutomaticAppCreate: {
      automaticAppDiscount: {
        discountId: discount.id || 'gid://shopify/DiscountAutomaticApp/123',
        title: discount.title || 'Test Discount',
        status: discount.status || 'ACTIVE',
        functionId: discount.functionId || 'test-function-id',
        ...discount,
      },
      userErrors: [],
    },
  });
}

/**
 * Mock Discount Automatic App Update Mutation
 */
export function mockDiscountAutomaticAppUpdate(discount = {}) {
  return mockGraphQLResponse({
    discountAutomaticAppUpdate: {
      automaticAppDiscount: {
        discountId: discount.id || 'gid://shopify/DiscountAutomaticApp/123',
        title: discount.title || 'Updated Discount',
        status: discount.status || 'ACTIVE',
        ...discount,
      },
      userErrors: [],
    },
  });
}

/**
 * Mock Discount Delete Mutation
 */
export function mockDiscountAutomaticDelete(id) {
  return mockGraphQLResponse({
    discountAutomaticDelete: {
      deletedAutomaticDiscountId: id || 'gid://shopify/DiscountAutomaticApp/123',
      userErrors: [],
    },
  });
}

/**
 * Mock Automatic Discounts Query
 */
export function mockAutomaticDiscountsQuery(discounts = []) {
  return mockGraphQLResponse({
    automaticDiscountNodes: {
      edges: discounts.map((discount) => ({
        node: {
          id: discount.id || 'gid://shopify/DiscountAutomaticNode/123',
          automaticDiscount: {
            __typename: 'DiscountAutomaticApp',
            title: discount.title || 'Test Discount',
            status: discount.status || 'ACTIVE',
            discountId: discount.discountId || 'gid://shopify/DiscountAutomaticApp/123',
            combinesWith: {
              productDiscounts: true,
              orderDiscounts: false,
            },
          },
          metafield: discount.metafield || null,
        },
      })),
    },
  });
}

/**
 * Mock Metafield Set Mutation
 */
export function mockMetafieldSet(metafield = {}) {
  return mockGraphQLResponse({
    metafieldSet: {
      metafield: {
        id: metafield.id || 'gid://shopify/Metafield/123',
        namespace: metafield.namespace || 'product-discount',
        key: metafield.key || 'discount-info',
        value: metafield.value || '{}',
        type: metafield.type || 'json',
      },
      userErrors: [],
    },
  });
}

/**
 * Mock Product Update Mutation
 */
export function mockProductUpdate(product = {}) {
  return mockGraphQLResponse({
    productUpdate: {
      product: {
        id: product.id || 'gid://shopify/Product/123',
        title: product.title || 'Test Product',
        status: product.status || 'ACTIVE',
        ...product,
      },
      userErrors: [],
    },
  });
}

/**
 * Mock GraphQL Error Response
 */
export function mockGraphQLError(message = 'GraphQL Error', field = null) {
  return mockGraphQLResponse(null, [
    {
      message,
      field,
      extensions: {
        code: 'TEST_ERROR',
      },
    },
  ]);
}

/**
 * Create a fully mocked Admin API client
 * @param {Object} customResponses - Override specific responses
 * @returns {Object} Mocked Admin API
 */
export function createMockAdminAPI(customResponses = {}) {
  const api = {
    graphql: vi.fn(),
    rest: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
    },
  };

  // Setup default graphql responses
  api.graphql.mockImplementation(async (query, variables) => {
    // Check for custom responses first
    if (customResponses.graphql) {
      const customResponse = customResponses.graphql(query, variables);
      if (customResponse) return customResponse;
    }

    // Default responses based on query content
    if (query.includes('products')) {
      return mockProductsQuery();
    }
    if (query.includes('discountAutomaticAppCreate')) {
      return mockDiscountAutomaticAppCreate();
    }
    if (query.includes('discountAutomaticAppUpdate')) {
      return mockDiscountAutomaticAppUpdate();
    }
    if (query.includes('discountAutomaticDelete')) {
      return mockDiscountAutomaticDelete();
    }
    if (query.includes('automaticDiscountNodes')) {
      return mockAutomaticDiscountsQuery();
    }
    if (query.includes('metafieldSet')) {
      return mockMetafieldSet();
    }
    if (query.includes('productUpdate')) {
      return mockProductUpdate();
    }

    // Default empty response
    return mockGraphQLResponse({});
  });

  // Setup REST responses
  api.rest.get.mockResolvedValue({ body: {} });
  api.rest.post.mockResolvedValue({ body: {} });
  api.rest.put.mockResolvedValue({ body: {} });
  api.rest.delete.mockResolvedValue({ body: {} });

  return api;
}

/**
 * Mock the entire authenticate.admin function
 * @param {Object} options - Configuration options
 * @returns {Function} Mocked authenticate function
 */
export function mockAuthenticate(options = {}) {
  return vi.fn().mockResolvedValue({
    session: options.session || {
      shop: 'test-shop.myshopify.com',
      accessToken: 'test-token',
    },
    admin: options.admin || createMockAdminAPI(options.customResponses),
  });
}

export default {
  mockGraphQLResponse,
  mockProductsQuery,
  mockDiscountAutomaticAppCreate,
  mockDiscountAutomaticAppUpdate,
  mockDiscountAutomaticDelete,
  mockAutomaticDiscountsQuery,
  mockMetafieldSet,
  mockProductUpdate,
  mockGraphQLError,
  createMockAdminAPI,
  mockAuthenticate,
};
