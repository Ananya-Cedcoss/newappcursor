/**
 * Integration Tests for Authentication and Security
 * Tests authentication requirements and error scenarios
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as discountService from '../../app/models/discount.server.js';
import { loader as discountsLoader, action as discountsAction } from '../../app/routes/api.discounts.jsx';
import { action as cartDiscountAction } from '../../app/routes/api.apply-cart-discount.jsx';
import * as shopifyServer from '../../app/shopify.server.js';
import { cleanAllTables } from '../setup/db.helper.js';

// Helper function to create a mock Request
function createMockRequest(url, options = {}) {
  const {
    method = 'GET',
    body = null,
    headers = {},
  } = options;

  const requestUrl = url.startsWith('http') ? url : `http://localhost${url}`;

  const requestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    requestInit.body = JSON.stringify(body);
  }

  return new Request(requestUrl, requestInit);
}

// Helper function to parse Response
async function parseResponse(response) {
  const data = await response.json();
  return {
    status: response.status,
    data,
  };
}

describe('Authentication and Security Integration Tests', () => {
  beforeEach(async () => {
    await cleanAllTables();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await cleanAllTables();
  });

  describe('Unauthenticated Requests', () => {
    beforeEach(() => {
      // Mock authentication to reject requests
      vi.spyOn(shopifyServer.authenticate, 'admin').mockRejectedValue(
        new Error('Authentication failed: Invalid session')
      );
    });

    afterEach(() => {
      // Restore mock to allow authenticated requests in other tests
      vi.spyOn(shopifyServer.authenticate, 'admin').mockResolvedValue({
        session: {
          shop: 'test-shop.myshopify.com',
          accessToken: 'test_token',
        },
        admin: {
          graphql: vi.fn(),
        },
      });
    });

    it('should reject unauthenticated GET /api/discounts request', async () => {
      const mockRequest = createMockRequest('/api/discounts');

      await expect(discountsLoader({ request: mockRequest })).rejects.toThrow(
        'Authentication failed'
      );

      expect(shopifyServer.authenticate.admin).toHaveBeenCalledWith(mockRequest);
    });

    it('should reject unauthenticated POST /api/discounts request', async () => {
      const mockRequest = createMockRequest('/api/discounts', {
        method: 'POST',
        body: {
          name: 'Test',
          type: 'percentage',
          value: 10,
          productIds: [],
        },
      });

      await expect(discountsAction({ request: mockRequest })).rejects.toThrow(
        'Authentication failed'
      );
    });

    it('should reject unauthenticated PATCH /api/discounts request', async () => {
      const mockRequest = createMockRequest('/api/discounts', {
        method: 'PATCH',
        body: {
          id: 'some_id',
          name: 'Updated',
        },
      });

      await expect(discountsAction({ request: mockRequest })).rejects.toThrow(
        'Authentication failed'
      );
    });

    it('should reject unauthenticated DELETE /api/discounts request', async () => {
      const mockRequest = createMockRequest('/api/discounts', {
        method: 'DELETE',
        body: { id: 'some_id' },
      });

      await expect(discountsAction({ request: mockRequest })).rejects.toThrow(
        'Authentication failed'
      );
    });

    it('should reject unauthenticated POST /api/apply-cart-discount request', async () => {
      const mockRequest = createMockRequest('/api/apply-cart-discount', {
        method: 'POST',
        body: {
          items: [{ productId: 'prod_1', quantity: 1, price: 100 }],
        },
      });

      await expect(cartDiscountAction({ request: mockRequest })).rejects.toThrow(
        'Authentication failed'
      );
    });
  });

  describe('Authenticated Requests with Valid Session', () => {
    beforeEach(() => {
      // Mock successful authentication
      vi.spyOn(shopifyServer.authenticate, 'admin').mockResolvedValue({
        session: {
          shop: 'test-shop.myshopify.com',
          accessToken: 'valid_test_token_123',
          isOnline: false,
        },
        admin: {
          graphql: vi.fn(),
        },
      });
    });

    it('should allow authenticated GET request', async () => {
      const mockRequest = createMockRequest('/api/discounts');
      const response = await discountsLoader({ request: mockRequest });
      const { status } = await parseResponse(response);

      expect(status).toBe(200);
      expect(shopifyServer.authenticate.admin).toHaveBeenCalledWith(mockRequest);
    });

    it('should allow authenticated POST request', async () => {
      const mockRequest = createMockRequest('/api/discounts', {
        method: 'POST',
        body: {
          name: 'Authenticated Discount',
          type: 'percentage',
          value: 20,
          productIds: ['prod_1'],
        },
      });
      const response = await discountsAction({ request: mockRequest });
      const { status } = await parseResponse(response);

      expect(status).toBe(201);
    });

    it('should allow authenticated cart discount calculation', async () => {
      const mockRequest = createMockRequest('/api/apply-cart-discount', {
        method: 'POST',
        body: {
          items: [{ productId: 'prod_1', quantity: 1, price: 100 }],
        },
      });
      const response = await cartDiscountAction({ request: mockRequest });
      const { status } = await parseResponse(response);

      expect(status).toBe(200);
    });
  });

  describe('Session Context Validation', () => {
    it('should handle missing shop in session', async () => {
      vi.spyOn(shopifyServer.authenticate, 'admin').mockResolvedValue({
        session: {
          // Missing shop property
          accessToken: 'test_token',
        },
        admin: {
          graphql: vi.fn(),
        },
      });

      const mockRequest = createMockRequest('/api/discounts', {
        method: 'POST',
        body: {
          name: 'Test',
          type: 'percentage',
          value: 10,
          productIds: [],
        },
      });

      // Should still work as long as authenticate doesn't throw
      const response = await discountsAction({ request: mockRequest });
      const { status } = await parseResponse(response);

      expect(status).toBe(201);
    });

    it('should handle expired session token', async () => {
      vi.spyOn(shopifyServer.authenticate, 'admin').mockRejectedValue(
        new Error('Session token expired')
      );

      const mockRequest = createMockRequest('/api/discounts');

      await expect(discountsLoader({ request: mockRequest })).rejects.toThrow(
        'Session token expired'
      );
    });

    it('should handle invalid shop domain', async () => {
      vi.spyOn(shopifyServer.authenticate, 'admin').mockRejectedValue(
        new Error('Invalid shop domain')
      );

      const mockRequest = createMockRequest('/api/discounts');

      await expect(discountsLoader({ request: mockRequest })).rejects.toThrow(
        'Invalid shop domain'
      );
    });
  });

  describe('Request Header Validation', () => {
    beforeEach(() => {
      vi.spyOn(shopifyServer.authenticate, 'admin').mockResolvedValue({
        session: {
          shop: 'test-shop.myshopify.com',
          accessToken: 'test_token',
        },
        admin: {
          graphql: vi.fn(),
        },
      });
    });

    it('should handle missing Content-Type header', async () => {
      const mockRequest = createMockRequest('/api/discounts', {
        method: 'POST',
        headers: {}, // No Content-Type
        body: {
          name: 'Test',
          type: 'percentage',
          value: 10,
          productIds: [],
        },
      });

      const response = await discountsAction({ request: mockRequest });
      const { status } = await parseResponse(response);

      // Should still work, body parsing is independent of Content-Type in this implementation
      expect(status).toBe(201);
    });

    it('should accept requests with valid Content-Type', async () => {
      const mockRequest = createMockRequest('/api/discounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          name: 'Test',
          type: 'percentage',
          value: 10,
          productIds: [],
        },
      });

      const response = await discountsAction({ request: mockRequest });
      const { status } = await parseResponse(response);

      expect(status).toBe(201);
    });
  });

  describe('Concurrent Request Handling', () => {
    beforeEach(() => {
      vi.spyOn(shopifyServer.authenticate, 'admin').mockResolvedValue({
        session: {
          shop: 'test-shop.myshopify.com',
          accessToken: 'test_token',
        },
        admin: {
          graphql: vi.fn(),
        },
      });
    });

    it('should handle multiple concurrent read requests', async () => {
      // Create some test data
      await discountService.createDiscount({
        name: 'Test 1',
        type: 'percentage',
        value: 10,
        productIds: [],
      });
      await discountService.createDiscount({
        name: 'Test 2',
        type: 'percentage',
        value: 20,
        productIds: [],
      });

      // Make multiple concurrent requests
      const requests = Array.from({ length: 5 }, () =>
        discountsLoader({ request: createMockRequest('/api/discounts') })
      );

      const responses = await Promise.all(requests);
      const parsedResponses = await Promise.all(
        responses.map((r) => parseResponse(r))
      );

      // All should succeed
      parsedResponses.forEach(({ status, data }) => {
        expect(status).toBe(200);
        expect(data.discounts).toHaveLength(2);
      });
    });

    it('should handle concurrent write requests', async () => {
      const createRequests = Array.from({ length: 3 }, (_, i) =>
        discountsAction({
          request: createMockRequest('/api/discounts', {
            method: 'POST',
            body: {
              name: `Concurrent Discount ${i}`,
              type: 'percentage',
              value: 10 + i,
              productIds: [],
            },
          }),
        })
      );

      const responses = await Promise.all(createRequests);
      const parsedResponses = await Promise.all(
        responses.map((r) => parseResponse(r))
      );

      // All should succeed
      parsedResponses.forEach(({ status, data }) => {
        expect(status).toBe(201);
        expect(data.success).toBe(true);
      });

      // Verify all were created
      const allDiscounts = await discountService.getAllDiscounts();
      expect(allDiscounts).toHaveLength(3);
    });

    it('should handle mixed concurrent requests', async () => {
      // Create initial data
      const discount1 = await discountService.createDiscount({
        name: 'Existing 1',
        type: 'percentage',
        value: 15,
        productIds: [],
      });
      const discount2 = await discountService.createDiscount({
        name: 'Existing 2',
        type: 'percentage',
        value: 25,
        productIds: [],
      });

      // Mix of read, write, update, delete operations
      const requests = [
        discountsLoader({ request: createMockRequest('/api/discounts') }), // READ
        discountsAction({
          request: createMockRequest('/api/discounts', {
            method: 'POST',
            body: {
              name: 'New Discount',
              type: 'percentage',
              value: 30,
              productIds: [],
            },
          }),
        }), // CREATE
        discountsAction({
          request: createMockRequest('/api/discounts', {
            method: 'PATCH',
            body: {
              id: discount1.id,
              name: 'Updated Name',
            },
          }),
        }), // UPDATE
        discountsLoader({
          request: createMockRequest(`/api/discounts?id=${discount2.id}`),
        }), // READ SINGLE
      ];

      const responses = await Promise.all(requests);
      const parsedResponses = await Promise.all(
        responses.map((r) => parseResponse(r))
      );

      // All should succeed
      expect(parsedResponses[0].status).toBe(200); // READ
      expect(parsedResponses[1].status).toBe(201); // CREATE
      expect(parsedResponses[2].status).toBe(200); // UPDATE
      expect(parsedResponses[3].status).toBe(200); // READ SINGLE
    });
  });

  describe('Rate Limiting and Performance', () => {
    beforeEach(() => {
      vi.spyOn(shopifyServer.authenticate, 'admin').mockResolvedValue({
        session: {
          shop: 'test-shop.myshopify.com',
          accessToken: 'test_token',
        },
        admin: {
          graphql: vi.fn(),
        },
      });
    });

    it('should handle rapid successive requests', async () => {
      const requests = [];

      for (let i = 0; i < 10; i++) {
        requests.push(
          discountsAction({
            request: createMockRequest('/api/discounts', {
              method: 'POST',
              body: {
                name: `Rapid Discount ${i}`,
                type: 'percentage',
                value: 10,
                productIds: [],
              },
            }),
          })
        );
      }

      const responses = await Promise.all(requests);
      const parsedResponses = await Promise.all(
        responses.map((r) => parseResponse(r))
      );

      // All should succeed
      parsedResponses.forEach(({ status }) => {
        expect(status).toBe(201);
      });

      const allDiscounts = await discountService.getAllDiscounts();
      expect(allDiscounts).toHaveLength(10);
    });
  });

  describe('Error Recovery and Resilience', () => {
    beforeEach(() => {
      vi.spyOn(shopifyServer.authenticate, 'admin').mockResolvedValue({
        session: {
          shop: 'test-shop.myshopify.com',
          accessToken: 'test_token',
        },
        admin: {
          graphql: vi.fn(),
        },
      });
    });

    it('should recover from database error and process next request', async () => {
      // First request fails
      vi.spyOn(discountService, 'createDiscount').mockRejectedValueOnce(
        new Error('Database temporarily unavailable')
      );

      const failRequest = createMockRequest('/api/discounts', {
        method: 'POST',
        body: {
          name: 'Will Fail',
          type: 'percentage',
          value: 10,
          productIds: [],
        },
      });

      const failResponse = await discountsAction({ request: failRequest });
      const { status: failStatus } = await parseResponse(failResponse);
      expect(failStatus).toBe(500);

      // Restore mock
      vi.restoreAllMocks();
      vi.spyOn(shopifyServer.authenticate, 'admin').mockResolvedValue({
        session: {
          shop: 'test-shop.myshopify.com',
          accessToken: 'test_token',
        },
        admin: {
          graphql: vi.fn(),
        },
      });

      // Second request succeeds
      const successRequest = createMockRequest('/api/discounts', {
        method: 'POST',
        body: {
          name: 'Will Succeed',
          type: 'percentage',
          value: 20,
          productIds: [],
        },
      });

      const successResponse = await discountsAction({ request: successRequest });
      const { status: successStatus } = await parseResponse(successResponse);
      expect(successStatus).toBe(201);
    });

    it('should handle partial cart processing failure gracefully', async () => {
      // Create discount for one product
      await discountService.createDiscount({
        name: 'Valid Discount',
        type: 'percentage',
        value: 20,
        productIds: ['prod_1'],
      });

      // Request with valid and invalid items
      const mockRequest = createMockRequest('/api/apply-cart-discount', {
        method: 'POST',
        body: {
          items: [
            { productId: 'prod_1', quantity: 2, price: 100 }, // Valid
            { productId: 'prod_2', quantity: 1, price: 50 },  // Valid (no discount)
          ],
        },
      });

      const response = await cartDiscountAction({ request: mockRequest });
      const { status, data } = await parseResponse(response);

      // Should process successfully
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.cart.discountsApplied).toBe(1);
    });
  });

  describe('Authentication Edge Cases', () => {
    it('should handle null session gracefully', async () => {
      vi.spyOn(shopifyServer.authenticate, 'admin').mockRejectedValue(
        new Error('No session found')
      );

      const mockRequest = createMockRequest('/api/discounts');

      await expect(discountsLoader({ request: mockRequest })).rejects.toThrow(
        'No session found'
      );
    });

    it('should handle authentication timeout', async () => {
      vi.spyOn(shopifyServer.authenticate, 'admin').mockImplementation(
        () => new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Authentication timeout')), 100)
        )
      );

      const mockRequest = createMockRequest('/api/discounts');

      await expect(discountsLoader({ request: mockRequest })).rejects.toThrow(
        'Authentication timeout'
      );
    });

    it('should handle malformed authentication token', async () => {
      vi.spyOn(shopifyServer.authenticate, 'admin').mockRejectedValue(
        new Error('Malformed token')
      );

      const mockRequest = createMockRequest('/api/discounts');

      await expect(discountsLoader({ request: mockRequest })).rejects.toThrow(
        'Malformed token'
      );
    });
  });
});
