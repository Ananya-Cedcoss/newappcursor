/**
 * Database Operations Tests
 * Demonstrates how to use DB helpers in tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetDatabase,
  cleanAllTables,
  seedDiscounts,
  seedSessions,
  seedAll,
  getAllDiscounts,
  getDiscountById,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  getAllSessions,
  countRecords,
  isDatabaseEmpty,
} from '../setup.js';

describe('Database Operations', () => {
  // Reset database before each test
  beforeEach(async () => {
    await resetDatabase();
  });

  describe('Seeding Data', () => {
    it('should seed default discounts', async () => {
      const discounts = await seedDiscounts();

      expect(discounts).toBeDefined();
      expect(discounts.length).toBe(3);
      expect(discounts[0]).toHaveProperty('id');
      expect(discounts[0]).toHaveProperty('name');
      expect(discounts[0]).toHaveProperty('type');
    });

    it('should seed custom discounts', async () => {
      const customDiscounts = [
        {
          name: 'Custom Sale',
          type: 'percentage',
          value: 25,
          productIds: JSON.stringify(['999']),
        },
      ];

      const discounts = await seedDiscounts(customDiscounts);

      expect(discounts.length).toBe(1);
      expect(discounts[0].name).toBe('Custom Sale');
      expect(discounts[0].value).toBe(25);
    });

    it('should seed default sessions', async () => {
      const sessions = await seedSessions();

      expect(sessions).toBeDefined();
      expect(sessions.length).toBe(2);
      expect(sessions[0]).toHaveProperty('id');
      expect(sessions[0]).toHaveProperty('shop');
      expect(sessions[0]).toHaveProperty('accessToken');
    });

    it('should seed all test data', async () => {
      const data = await seedAll();

      expect(data.discounts).toBeDefined();
      expect(data.sessions).toBeDefined();
      expect(data.discounts.length).toBeGreaterThan(0);
      expect(data.sessions.length).toBeGreaterThan(0);
    });
  });

  describe('CRUD Operations - Discounts', () => {
    it('should create a discount', async () => {
      const discount = await createDiscount({
        name: 'Test Discount',
        type: 'percentage',
        value: 10,
        productIds: JSON.stringify(['123']),
      });

      expect(discount).toBeDefined();
      expect(discount.id).toBeDefined();
      expect(discount.name).toBe('Test Discount');
      expect(discount.value).toBe(10);
    });

    it('should get all discounts', async () => {
      await seedDiscounts();

      const discounts = await getAllDiscounts();

      expect(discounts.length).toBe(3);
    });

    it('should get discount by ID', async () => {
      const created = await createDiscount({
        name: 'Test Discount',
        type: 'percentage',
        value: 15,
        productIds: JSON.stringify(['456']),
      });

      const discount = await getDiscountById(created.id);

      expect(discount).toBeDefined();
      expect(discount.id).toBe(created.id);
      expect(discount.name).toBe('Test Discount');
    });

    it('should update a discount', async () => {
      const created = await createDiscount({
        name: 'Original Name',
        type: 'percentage',
        value: 10,
        productIds: JSON.stringify(['123']),
      });

      const updated = await updateDiscount(created.id, {
        name: 'Updated Name',
        value: 20,
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.value).toBe(20);
    });

    it('should delete a discount', async () => {
      const created = await createDiscount({
        name: 'To Delete',
        type: 'percentage',
        value: 10,
        productIds: JSON.stringify(['123']),
      });

      await deleteDiscount(created.id);

      const discount = await getDiscountById(created.id);
      expect(discount).toBeNull();
    });
  });

  describe('Database Cleanup', () => {
    it('should clean all tables', async () => {
      await seedAll();

      let discountCount = await countRecords('discount');
      let sessionCount = await countRecords('session');

      expect(discountCount).toBeGreaterThan(0);
      expect(sessionCount).toBeGreaterThan(0);

      await cleanAllTables();

      discountCount = await countRecords('discount');
      sessionCount = await countRecords('session');

      expect(discountCount).toBe(0);
      expect(sessionCount).toBe(0);
    });

    it('should verify database is empty', async () => {
      await seedAll();

      let empty = await isDatabaseEmpty();
      expect(empty).toBe(false);

      await cleanAllTables();

      empty = await isDatabaseEmpty();
      expect(empty).toBe(true);
    });

    it('should count records correctly', async () => {
      await seedDiscounts();

      const count = await countRecords('discount');
      expect(count).toBe(3);
    });
  });

  describe('Database Reset', () => {
    it('should reset database completely', async () => {
      await seedAll();

      await resetDatabase();

      const empty = await isDatabaseEmpty();
      expect(empty).toBe(true);
    });
  });

  describe('Working with Sessions', () => {
    it('should get all sessions', async () => {
      await seedSessions();

      const sessions = await getAllSessions();

      expect(sessions.length).toBe(2);
    });

    it('should handle BigInt userId', async () => {
      const sessions = await seedSessions();

      const sessionWithUserId = sessions.find((s) => s.userId !== null);

      expect(sessionWithUserId).toBeDefined();
      expect(typeof sessionWithUserId.userId).toBe('bigint');
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('Scenario: Test discount application logic', async () => {
      // Seed test data
      await seedDiscounts([
        {
          name: '20% Off T-Shirts',
          type: 'percentage',
          value: 20,
          productIds: JSON.stringify(['tshirt-123']),
        },
      ]);

      // Get the discount
      const discounts = await getAllDiscounts();
      const discount = discounts[0];

      // Test your logic
      const productId = 'tshirt-123';
      const productIds = JSON.parse(discount.productIds);

      expect(productIds).toContain(productId);
      expect(discount.value).toBe(20);
    });

    it('Scenario: Test discount CRUD workflow', async () => {
      // Create
      const created = await createDiscount({
        name: 'Flash Sale',
        type: 'percentage',
        value: 30,
        productIds: JSON.stringify(['product-1', 'product-2']),
      });

      expect(created.id).toBeDefined();

      // Read
      const fetched = await getDiscountById(created.id);
      expect(fetched.name).toBe('Flash Sale');

      // Update
      const updated = await updateDiscount(created.id, {
        value: 40,
      });
      expect(updated.value).toBe(40);

      // Delete
      await deleteDiscount(created.id);
      const deleted = await getDiscountById(created.id);
      expect(deleted).toBeNull();
    });

    it('Scenario: Test with multiple products', async () => {
      // Create discount for multiple products
      const productIds = ['prod-1', 'prod-2', 'prod-3'];

      await createDiscount({
        name: 'Multi Product Sale',
        type: 'percentage',
        value: 15,
        productIds: JSON.stringify(productIds),
      });

      const discounts = await getAllDiscounts();
      const discount = discounts[0];

      const parsedIds = JSON.parse(discount.productIds);
      expect(parsedIds).toHaveLength(3);
      expect(parsedIds).toEqual(productIds);
    });
  });
});
