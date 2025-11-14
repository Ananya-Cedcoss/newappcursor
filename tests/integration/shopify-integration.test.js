/**
 * Shopify Integration Tests
 * Tests using Shopify session and API mocks
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createMockSession,
  createMockAdmin,
  mockAuthenticate,
  mockGraphQLResponse,
  mockDiscountAutomaticAppCreate,
  mockProductsQuery,
} from '../setup.js';

describe('Shopify Integration Tests', () => {
  let mockAdmin;
  let mockSession;

  beforeEach(() => {
    mockSession = createMockSession();
    mockAdmin = createMockAdmin();
  });

  describe('Session Management', () => {
    it('should create a mock session with default values', () => {
      expect(mockSession).toBeDefined();
      expect(mockSession.shop).toBe('test-shop.myshopify.com');
      expect(mockSession.accessToken).toBe('test_access_token_12345');
      expect(mockSession.isOnline).toBe(false);
    });

    it('should create a mock session with overrides', () => {
      const customSession = createMockSession({
        shop: 'custom-shop.myshopify.com',
        isOnline: true,
      });

      expect(customSession.shop).toBe('custom-shop.myshopify.com');
      expect(customSession.isOnline).toBe(true);
    });

    it('should have required session properties', () => {
      expect(mockSession).toHaveProperty('id');
      expect(mockSession).toHaveProperty('shop');
      expect(mockSession).toHaveProperty('accessToken');
      expect(mockSession).toHaveProperty('scope');
    });
  });

  describe('Admin API GraphQL', () => {
    it('should mock GraphQL queries', async () => {
      const response = await mockAdmin.graphql('query { products { edges { node { id } } } }');
      const data = await response.json();

      expect(data).toBeDefined();
      expect(mockAdmin.graphql).toHaveBeenCalled();
    });

    it('should mock product query response', async () => {
      const products = [
        { id: 'gid://shopify/Product/1', title: 'Product 1' },
        { id: 'gid://shopify/Product/2', title: 'Product 2' },
      ];

      mockAdmin.graphql.mockResolvedValueOnce(mockProductsQuery(products));

      const response = await mockAdmin.graphql('query Products');
      const data = await response.json();

      expect(data.data.products.edges).toHaveLength(2);
      expect(data.data.products.edges[0].node.title).toBe('Product 1');
    });

    it('should mock discount creation', async () => {
      const discount = {
        id: 'gid://shopify/DiscountAutomaticApp/123',
        title: 'Test Discount',
        status: 'ACTIVE',
      };

      mockAdmin.graphql.mockResolvedValueOnce(mockDiscountAutomaticAppCreate(discount));

      const response = await mockAdmin.graphql('mutation CreateDiscount');
      const data = await response.json();

      expect(data.data.discountAutomaticAppCreate.automaticAppDiscount.title).toBe('Test Discount');
      expect(data.data.discountAutomaticAppCreate.userErrors).toHaveLength(0);
    });
  });

  describe('Authentication Mock', () => {
    it('should mock authenticate.admin', async () => {
      const authenticate = mockAuthenticate({
        session: mockSession,
        admin: mockAdmin,
      });

      const result = await authenticate();

      expect(result.session).toBeDefined();
      expect(result.admin).toBeDefined();
      expect(result.session.shop).toBe('test-shop.myshopify.com');
    });

    it('should work with custom responses', async () => {
      const customAdmin = createMockAdmin();
      const customResponse = mockGraphQLResponse({
        custom: { data: 'value' },
      });

      customAdmin.graphql.mockResolvedValueOnce(customResponse);

      const response = await customAdmin.graphql('query Custom');
      const data = await response.json();

      expect(data.data.custom.data).toBe('value');
    });
  });

  describe('Environment Variables', () => {
    it('should have test environment variables set', () => {
      expect(process.env.NODE_ENV).toBe('test');
      expect(process.env.SHOPIFY_API_KEY).toBe('test_api_key_12345');
      expect(process.env.SHOPIFY_API_SECRET).toBe('test_api_secret_67890');
    });

    it('should have Shopify function ID configured', () => {
      expect(process.env.SHOPIFY_DISCOUNT_FUNCTION_ID).toBe('test-function-id-12345');
    });
  });

  describe('API Error Handling', () => {
    it('should handle GraphQL errors', async () => {
      const errorResponse = mockGraphQLResponse(null, [
        {
          message: 'Test error',
          field: ['test'],
        },
      ]);

      mockAdmin.graphql.mockResolvedValueOnce(errorResponse);

      const response = await mockAdmin.graphql('query Test');
      const data = await response.json();

      expect(data.errors).toBeDefined();
      expect(data.errors[0].message).toBe('Test error');
    });
  });
});
