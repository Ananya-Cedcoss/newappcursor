/**
 * True Integration Tests using Supertest
 * Makes actual HTTP requests to API endpoints
 * Tests full request/response cycle including authentication
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../setup/test-server.js';
import * as discountsRoute from '../../app/routes/api.discounts.jsx';
import * as cartDiscountRoute from '../../app/routes/api.apply-cart-discount.jsx';
import * as discountService from '../../app/models/discount.server.js';
import * as shopifyServer from '../../app/shopify.server.js';
import { cleanAllTables } from '../setup/db.helper.js';

/**
 * Mock Shopify Authentication
 * This allows us to test authenticated and unauthenticated scenarios
 */
let authenticationEnabled = true;

vi.mock('../../app/shopify.server.js', () => ({
  authenticate: {
    admin: vi.fn(async (req) => {
      if (!authenticationEnabled) {
        throw new Error('Unauthorized: Authentication required');
      }
      return {
        session: {
          shop: 'test-shop.myshopify.com',
          accessToken: 'test_access_token',
          isOnline: false,
        },
        admin: {
          graphql: vi.fn(),
        },
      };
    }),
  },
  shopify: {
    config: {
      apiKey: 'test_api_key',
      apiSecretKey: 'test_secret',
    },
  },
}));

describe('API Endpoints - Supertest Integration Tests', () => {
  let discountsApp;
  let cartDiscountApp;

  beforeAll(() => {
    // Create test servers for each route
    discountsApp = createTestApp(discountsRoute);
    cartDiscountApp = createTestApp(cartDiscountRoute);
  });

  beforeEach(async () => {
    await cleanAllTables();
    authenticationEnabled = true;
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await cleanAllTables();
  });

  /**
   * =================================================================
   * GET /api/discounts Tests
   * =================================================================
   */
  describe('GET /api/discounts', () => {
    it('should return empty array when no discounts exist', async () => {
      const response = await request(discountsApp)
        .get('/api/discounts')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.discounts).toEqual([]);
      expect(response.body.count).toBe(0);
    });

    it('should return all discounts', async () => {
      // Seed test data
      await discountService.createDiscount({
        name: 'Summer Sale',
        type: 'percentage',
        value: 20,
        productIds: ['prod_1', 'prod_2'],
      });
      await discountService.createDiscount({
        name: 'Winter Discount',
        type: 'fixed',
        value: 10,
        productIds: ['prod_3'],
      });

      const response = await request(discountsApp)
        .get('/api/discounts')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.discounts).toHaveLength(2);
      expect(response.body.count).toBe(2);

      // Verify response structure
      const discount = response.body.discounts[0];
      expect(discount).toHaveProperty('id');
      expect(discount).toHaveProperty('name');
      expect(discount).toHaveProperty('type');
      expect(discount).toHaveProperty('value');
      expect(discount).toHaveProperty('productIds');
    });

    it('should return specific discount by ID', async () => {
      const created = await discountService.createDiscount({
        name: 'Specific Discount',
        type: 'percentage',
        value: 25,
        productIds: ['prod_100'],
      });

      const response = await request(discountsApp)
        .get(`/api/discounts?id=${created.id}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.discount).toBeDefined();
      expect(response.body.discount.id).toBe(created.id);
      expect(response.body.discount.name).toBe('Specific Discount');
      expect(response.body.discount.value).toBe(25);
    });

    it('should return 404 for non-existent discount ID', async () => {
      const response = await request(discountsApp)
        .get('/api/discounts?id=non_existent_id_12345')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.error).toBe('Discount not found');
    });

    it('should require authentication', async () => {
      authenticationEnabled = false;

      await request(discountsApp)
        .get('/api/discounts')
        .expect(500); // Will throw error in route handler

      expect(shopifyServer.authenticate.admin).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      vi.spyOn(discountService, 'getAllDiscounts').mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(discountsApp)
        .get('/api/discounts')
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch discounts');
      expect(response.body.message).toBe('Database connection failed');

      vi.restoreAllMocks();
    });
  });

  /**
   * =================================================================
   * POST /api/discounts Tests
   * =================================================================
   */
  describe('POST /api/discounts', () => {
    it('should create a new discount with valid data', async () => {
      const discountData = {
        name: 'Black Friday Sale',
        type: 'percentage',
        value: 30,
        productIds: ['prod_1', 'prod_2', 'prod_3'],
      };

      const response = await request(discountsApp)
        .post('/api/discounts')
        .send(discountData)
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Discount created successfully');
      expect(response.body.discount).toBeDefined();
      expect(response.body.discount.name).toBe('Black Friday Sale');
      expect(response.body.discount.type).toBe('percentage');
      expect(response.body.discount.value).toBe(30);
      expect(response.body.discount.id).toBeDefined();

      // Verify it was actually saved to database
      const allDiscounts = await discountService.getAllDiscounts();
      expect(allDiscounts).toHaveLength(1);
      expect(allDiscounts[0].name).toBe('Black Friday Sale');
    });

    it('should create a fixed discount', async () => {
      const discountData = {
        name: '$15 Off',
        type: 'fixed',
        value: 15,
        productIds: ['prod_999'],
      };

      const response = await request(discountsApp)
        .post('/api/discounts')
        .send(discountData)
        .set('Content-Type', 'application/json')
        .expect(201);

      expect(response.body.discount.type).toBe('fixed');
      expect(response.body.discount.value).toBe(15);
    });

    it('should parse string value to float', async () => {
      const discountData = {
        name: 'String Value Test',
        type: 'percentage',
        value: '22.5',
        productIds: [],
      };

      const response = await request(discountsApp)
        .post('/api/discounts')
        .send(discountData)
        .expect(201);

      expect(response.body.discount.value).toBe(22.5);
    });

    it('should return 400 when name is missing', async () => {
      const invalidData = {
        type: 'percentage',
        value: 20,
        productIds: [],
      };

      const response = await request(discountsApp)
        .post('/api/discounts')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing required fields');
      expect(response.body.required).toContain('name');
    });

    it('should return 400 when type is invalid', async () => {
      const invalidData = {
        name: 'Invalid Type',
        type: 'invalid_type',
        value: 20,
        productIds: [],
      };

      const response = await request(discountsApp)
        .post('/api/discounts')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Invalid discount type');
      expect(response.body.allowed).toEqual(['percentage', 'fixed']);
    });

    it('should return 400 when value is missing', async () => {
      const invalidData = {
        name: 'No Value',
        type: 'percentage',
        productIds: [],
      };

      const response = await request(discountsApp)
        .post('/api/discounts')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Missing required fields');
    });

    it('should return 400 when productIds is missing', async () => {
      const invalidData = {
        name: 'No Products',
        type: 'percentage',
        value: 10,
      };

      const response = await request(discountsApp)
        .post('/api/discounts')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Missing required fields');
    });

    it('should accept empty productIds array', async () => {
      const validData = {
        name: 'Empty Products',
        type: 'percentage',
        value: 10,
        productIds: [],
      };

      const response = await request(discountsApp)
        .post('/api/discounts')
        .send(validData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should require authentication', async () => {
      authenticationEnabled = false;

      const discountData = {
        name: 'Unauthorized Test',
        type: 'percentage',
        value: 10,
        productIds: [],
      };

      await request(discountsApp)
        .post('/api/discounts')
        .send(discountData)
        .expect(500);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(discountsApp)
        .post('/api/discounts')
        .send('invalid json{')
        .set('Content-Type', 'application/json')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  /**
   * =================================================================
   * PATCH /api/discounts Tests
   * =================================================================
   */
  describe('PATCH /api/discounts', () => {
    it('should update an existing discount', async () => {
      const created = await discountService.createDiscount({
        name: 'Original Name',
        type: 'percentage',
        value: 10,
        productIds: ['prod_1'],
      });

      const updateData = {
        id: created.id,
        name: 'Updated Name',
        value: 25,
      };

      const response = await request(discountsApp)
        .patch('/api/discounts')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Discount updated successfully');
      expect(response.body.discount.name).toBe('Updated Name');
      expect(response.body.discount.value).toBe(25);

      // Verify in database
      const updated = await discountService.getDiscountById(created.id);
      expect(updated.name).toBe('Updated Name');
      expect(updated.value).toBe(25);
    });

    it('should return 400 when ID is missing', async () => {
      const response = await request(discountsApp)
        .patch('/api/discounts')
        .send({ name: 'Updated' })
        .expect(400);

      expect(response.body.error).toBe('Discount ID is required');
    });

    it('should return 400 for invalid type in update', async () => {
      const created = await discountService.createDiscount({
        name: 'Test',
        type: 'percentage',
        value: 10,
        productIds: [],
      });

      const response = await request(discountsApp)
        .patch('/api/discounts')
        .send({
          id: created.id,
          type: 'invalid_type',
        })
        .expect(400);

      expect(response.body.error).toBe('Invalid discount type');
    });
  });

  /**
   * =================================================================
   * DELETE /api/discounts Tests
   * =================================================================
   */
  describe('DELETE /api/discounts', () => {
    it('should delete an existing discount', async () => {
      const created = await discountService.createDiscount({
        name: 'To Delete',
        type: 'percentage',
        value: 15,
        productIds: [],
      });

      const response = await request(discountsApp)
        .delete('/api/discounts')
        .send({ id: created.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Discount deleted successfully');

      // Verify deletion
      const found = await discountService.getDiscountById(created.id);
      expect(found).toBeNull();
    });

    it('should return 400 when ID is missing', async () => {
      const response = await request(discountsApp)
        .delete('/api/discounts')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Discount ID is required');
    });
  });

  /**
   * =================================================================
   * POST /api/apply-cart-discount Tests
   * =================================================================
   */
  describe('POST /api/apply-cart-discount', () => {
    it('should calculate cart total with no discounts', async () => {
      const cartData = {
        items: [
          { productId: 'prod_1', quantity: 2, price: 29.99 },
          { productId: 'prod_2', quantity: 1, price: 49.99 },
        ],
      };

      const response = await request(cartDiscountApp)
        .post('/api/apply-cart-discount')
        .send(cartData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.cart).toBeDefined();
      expect(response.body.cart.subtotal).toBe(109.97);
      expect(response.body.cart.totalDiscount).toBe(0);
      expect(response.body.cart.total).toBe(109.97);
      expect(response.body.cart.discountsApplied).toBe(0);
    });

    it('should apply percentage discount to cart items', async () => {
      // Create a 20% discount for prod_1
      await discountService.createDiscount({
        name: '20% Off Electronics',
        type: 'percentage',
        value: 20,
        productIds: ['prod_1'],
      });

      const cartData = {
        items: [
          { productId: 'prod_1', quantity: 2, price: 100 },
          { productId: 'prod_2', quantity: 1, price: 50 },
        ],
      };

      const response = await request(cartDiscountApp)
        .post('/api/apply-cart-discount')
        .send(cartData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.cart.subtotal).toBe(250);
      expect(response.body.cart.totalDiscount).toBe(40); // 20% of 200
      expect(response.body.cart.total).toBe(210);
      expect(response.body.cart.discountsApplied).toBe(1);

      // Verify discount details
      const item = response.body.cart.items[0];
      expect(item.discount).toBeDefined();
      expect(item.discount.type).toBe('percentage');
      expect(item.discount.value).toBe(20);
    });

    it('should apply fixed discount to cart items', async () => {
      await discountService.createDiscount({
        name: '$10 Off',
        type: 'fixed',
        value: 10,
        productIds: ['prod_1'],
      });

      const cartData = {
        items: [
          { productId: 'prod_1', quantity: 3, price: 50 },
        ],
      };

      const response = await request(cartDiscountApp)
        .post('/api/apply-cart-discount')
        .send(cartData)
        .expect(200);

      expect(response.body.cart.subtotal).toBe(150);
      expect(response.body.cart.totalDiscount).toBe(30); // $10 x 3
      expect(response.body.cart.total).toBe(120);
    });

    it('should handle Shopify GID format', async () => {
      await discountService.createDiscount({
        name: 'GID Discount',
        type: 'percentage',
        value: 15,
        productIds: ['123'],
      });

      const cartData = {
        items: [
          { productId: 'gid://shopify/Product/123', quantity: 1, price: 100 },
        ],
      };

      const response = await request(cartDiscountApp)
        .post('/api/apply-cart-discount')
        .send(cartData)
        .expect(200);

      expect(response.body.cart.discountsApplied).toBe(1);
      expect(response.body.cart.totalDiscount).toBe(15);
    });

    it('should return 400 when items array is missing', async () => {
      const response = await request(cartDiscountApp)
        .post('/api/apply-cart-discount')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Invalid request');
      expect(response.body.message).toContain('items array is required');
    });

    it('should return 400 when items array is empty', async () => {
      const response = await request(cartDiscountApp)
        .post('/api/apply-cart-discount')
        .send({ items: [] })
        .expect(400);

      expect(response.body.error).toBe('Invalid request');
    });

    it('should return 404 for GET method (no loader defined)', async () => {
      // The test server returns 404 for GET requests when there's no loader
      const response = await request(cartDiscountApp)
        .get('/api/apply-cart-discount')
        .expect(404);

      // This is expected behavior from the test server setup
      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      authenticationEnabled = false;

      const cartData = {
        items: [
          { productId: 'prod_1', quantity: 1, price: 100 },
        ],
      };

      await request(cartDiscountApp)
        .post('/api/apply-cart-discount')
        .send(cartData)
        .expect(500);
    });
  });

  /**
   * =================================================================
   * Discount Rule Resolution Tests
   * =================================================================
   */
  describe('Discount Rule Resolution', () => {
    it('should select the best percentage discount when multiple exist', async () => {
      await discountService.createDiscount({
        name: '10% Off',
        type: 'percentage',
        value: 10,
        productIds: ['prod_1'],
      });
      await discountService.createDiscount({
        name: '25% Off',
        type: 'percentage',
        value: 25,
        productIds: ['prod_1'],
      });

      const cartData = {
        items: [
          { productId: 'prod_1', quantity: 1, price: 100 },
        ],
      };

      const response = await request(cartDiscountApp)
        .post('/api/apply-cart-discount')
        .send(cartData)
        .expect(200);

      // Should apply 25% discount (better)
      expect(response.body.cart.totalDiscount).toBe(25);
      expect(response.body.cart.items[0].discount.name).toBe('25% Off');
    });

    it('should select the best fixed discount when multiple exist', async () => {
      await discountService.createDiscount({
        name: '$5 Off',
        type: 'fixed',
        value: 5,
        productIds: ['prod_1'],
      });
      await discountService.createDiscount({
        name: '$20 Off',
        type: 'fixed',
        value: 20,
        productIds: ['prod_1'],
      });

      const cartData = {
        items: [
          { productId: 'prod_1', quantity: 1, price: 100 },
        ],
      };

      const response = await request(cartDiscountApp)
        .post('/api/apply-cart-discount')
        .send(cartData)
        .expect(200);

      // Should apply $20 discount (better)
      expect(response.body.cart.totalDiscount).toBe(20);
      expect(response.body.cart.items[0].discount.name).toBe('$20 Off');
    });

    it('should compare percentage vs fixed and choose the better one', async () => {
      // 30% of $100 = $30 (better than $20 fixed)
      await discountService.createDiscount({
        name: '30% Off',
        type: 'percentage',
        value: 30,
        productIds: ['prod_1'],
      });
      await discountService.createDiscount({
        name: '$20 Off',
        type: 'fixed',
        value: 20,
        productIds: ['prod_1'],
      });

      const cartData = {
        items: [
          { productId: 'prod_1', quantity: 1, price: 100 },
        ],
      };

      const response = await request(cartDiscountApp)
        .post('/api/apply-cart-discount')
        .send(cartData)
        .expect(200);

      // Should apply percentage ($30 > $20)
      expect(response.body.cart.totalDiscount).toBe(30);
      expect(response.body.cart.items[0].discount.type).toBe('percentage');
    });

    it('should apply different discounts to different products', async () => {
      await discountService.createDiscount({
        name: '25% Off Product 1',
        type: 'percentage',
        value: 25,
        productIds: ['prod_1'],
      });
      await discountService.createDiscount({
        name: '$15 Off Product 2',
        type: 'fixed',
        value: 15,
        productIds: ['prod_2'],
      });

      const cartData = {
        items: [
          { productId: 'prod_1', quantity: 2, price: 100 },
          { productId: 'prod_2', quantity: 1, price: 60 },
        ],
      };

      const response = await request(cartDiscountApp)
        .post('/api/apply-cart-discount')
        .send(cartData)
        .expect(200);

      expect(response.body.cart.subtotal).toBe(260);
      expect(response.body.cart.totalDiscount).toBe(65); // $50 + $15
      expect(response.body.cart.total).toBe(195);
      expect(response.body.cart.discountsApplied).toBe(2);
    });
  });

  /**
   * =================================================================
   * Invalid Data and Edge Cases
   * =================================================================
   */
  describe('Invalid Data and Edge Cases', () => {
    it('should handle missing required fields in cart item', async () => {
      const cartData = {
        items: [
          { productId: 'prod_1', quantity: 2 }, // Missing price
        ],
      };

      const response = await request(cartDiscountApp)
        .post('/api/apply-cart-discount')
        .send(cartData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('productId, quantity, and price');
    });

    it('should handle zero price items', async () => {
      const cartData = {
        items: [
          { productId: 'prod_1', quantity: 1, price: 0 },
        ],
      };

      const response = await request(cartDiscountApp)
        .post('/api/apply-cart-discount')
        .send(cartData)
        .expect(200);

      expect(response.body.cart.subtotal).toBe(0);
      expect(response.body.cart.total).toBe(0);
    });

    it('should handle 100% discount', async () => {
      await discountService.createDiscount({
        name: '100% Free',
        type: 'percentage',
        value: 100,
        productIds: ['prod_1'],
      });

      const cartData = {
        items: [
          { productId: 'prod_1', quantity: 1, price: 50 },
        ],
      };

      const response = await request(cartDiscountApp)
        .post('/api/apply-cart-discount')
        .send(cartData)
        .expect(200);

      expect(response.body.cart.totalDiscount).toBe(50);
      expect(response.body.cart.total).toBe(0);
    });

    it('should handle very large quantities', async () => {
      await discountService.createDiscount({
        name: 'Bulk Discount',
        type: 'percentage',
        value: 10,
        productIds: ['prod_1'],
      });

      const cartData = {
        items: [
          { productId: 'prod_1', quantity: 1000, price: 10 },
        ],
      };

      const response = await request(cartDiscountApp)
        .post('/api/apply-cart-discount')
        .send(cartData)
        .expect(200);

      expect(response.body.cart.subtotal).toBe(10000);
      expect(response.body.cart.totalDiscount).toBe(1000);
      expect(response.body.cart.total).toBe(9000);
    });

    it('should handle special characters in discount name', async () => {
      const discountData = {
        name: 'Test & "Special" <Chars> \'Discount\'',
        type: 'percentage',
        value: 10,
        productIds: [],
      };

      const response = await request(discountsApp)
        .post('/api/discounts')
        .send(discountData)
        .expect(201);

      expect(response.body.discount.name).toBe(discountData.name);
    });

    it('should handle decimal prices correctly', async () => {
      await discountService.createDiscount({
        name: '12.5% Off',
        type: 'percentage',
        value: 12.5,
        productIds: ['prod_1'],
      });

      const cartData = {
        items: [
          { productId: 'prod_1', quantity: 3, price: 29.99 },
        ],
      };

      const response = await request(cartDiscountApp)
        .post('/api/apply-cart-discount')
        .send(cartData)
        .expect(200);

      expect(response.body.cart.subtotal).toBeCloseTo(89.97, 2);
      expect(response.body.cart.totalDiscount).toBeGreaterThan(0);
    });
  });

  /**
   * =================================================================
   * Complete Integration Flow Tests
   * =================================================================
   */
  describe('Complete Integration Flows', () => {
    it('should handle full CRUD lifecycle with HTTP requests', async () => {
      // CREATE
      const createResponse = await request(discountsApp)
        .post('/api/discounts')
        .send({
          name: 'Lifecycle Test',
          type: 'percentage',
          value: 15,
          productIds: ['prod_1'],
        })
        .expect(201);

      const discountId = createResponse.body.discount.id;

      // READ (Single)
      const readResponse = await request(discountsApp)
        .get(`/api/discounts?id=${discountId}`)
        .expect(200);

      expect(readResponse.body.discount.name).toBe('Lifecycle Test');

      // UPDATE
      const updateResponse = await request(discountsApp)
        .patch('/api/discounts')
        .send({
          id: discountId,
          name: 'Updated Lifecycle',
          value: 25,
        })
        .expect(200);

      expect(updateResponse.body.discount.name).toBe('Updated Lifecycle');

      // READ (All)
      const listResponse = await request(discountsApp)
        .get('/api/discounts')
        .expect(200);

      expect(listResponse.body.discounts).toHaveLength(1);

      // DELETE
      await request(discountsApp)
        .delete('/api/discounts')
        .send({ id: discountId })
        .expect(200);

      // VERIFY DELETED
      await request(discountsApp)
        .get(`/api/discounts?id=${discountId}`)
        .expect(404);
    });

    it('should create discount and apply to cart in full flow', async () => {
      // Step 1: Create a discount via API
      const createResponse = await request(discountsApp)
        .post('/api/discounts')
        .send({
          name: 'Full Flow 20% Off',
          type: 'percentage',
          value: 20,
          productIds: ['electronics_1', 'electronics_2'],
        })
        .expect(201);

      expect(createResponse.body.success).toBe(true);

      // Step 2: Apply discount to cart via API
      const cartResponse = await request(cartDiscountApp)
        .post('/api/apply-cart-discount')
        .send({
          items: [
            { productId: 'electronics_1', quantity: 2, price: 100 },
            { productId: 'electronics_2', quantity: 1, price: 200 },
          ],
        })
        .expect(200);

      // Verify discount was applied
      expect(cartResponse.body.cart.subtotal).toBe(400);
      expect(cartResponse.body.cart.totalDiscount).toBe(80); // 20% of 400
      expect(cartResponse.body.cart.total).toBe(320);
      expect(cartResponse.body.cart.discountsApplied).toBe(2);

      // Step 3: Update the discount
      await request(discountsApp)
        .patch('/api/discounts')
        .send({
          id: createResponse.body.discount.id,
          value: 30, // Increase to 30%
        })
        .expect(200);

      // Step 4: Apply again with updated discount
      const updatedCartResponse = await request(cartDiscountApp)
        .post('/api/apply-cart-discount')
        .send({
          items: [
            { productId: 'electronics_1', quantity: 2, price: 100 },
          ],
        })
        .expect(200);

      // Should now use 30% discount
      expect(updatedCartResponse.body.cart.totalDiscount).toBe(60); // 30% of 200
    });
  });
});
