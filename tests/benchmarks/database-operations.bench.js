/**
 * Performance Benchmarks for Database Operations
 * Tests the performance of Prisma database reads/writes
 */

import { bench, describe, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Setup and teardown
 */
beforeAll(async () => {
  // Ensure database is connected
  await prisma.$connect();

  // Clean up any existing test data
  await prisma.discount.deleteMany({
    where: {
      name: {
        startsWith: 'BENCH_',
      },
    },
  });
});

afterAll(async () => {
  // Clean up benchmark data
  await prisma.discount.deleteMany({
    where: {
      name: {
        startsWith: 'BENCH_',
      },
    },
  });

  await prisma.$disconnect();
});

/**
 * Helper: Create discount data
 */
function createDiscountData(index) {
  return {
    name: `BENCH_Discount_${index}`,
    type: 'percentage',
    value: 20,
    productIds: ['prod_1', 'prod_2'],
    active: true,
  };
}

describe('Database Operations - Performance', () => {
  /**
   * =================================================================
   * Single Record Operations
   * =================================================================
   */
  describe('Single Record Operations', () => {
    bench('create single discount', async () => {
      const discount = await prisma.discount.create({
        data: createDiscountData(Date.now()),
      });
      // Clean up immediately
      await prisma.discount.delete({ where: { id: discount.id } });
    });

    bench('read single discount by ID', async () => {
      // Create a discount first
      const discount = await prisma.discount.create({
        data: createDiscountData(Date.now()),
      });

      // Benchmark the read
      await prisma.discount.findUnique({
        where: { id: discount.id },
      });

      // Clean up
      await prisma.discount.delete({ where: { id: discount.id } });
    });

    bench('update single discount', async () => {
      // Create a discount first
      const discount = await prisma.discount.create({
        data: createDiscountData(Date.now()),
      });

      // Benchmark the update
      await prisma.discount.update({
        where: { id: discount.id },
        data: { value: 25 },
      });

      // Clean up
      await prisma.discount.delete({ where: { id: discount.id } });
    });

    bench('delete single discount', async () => {
      // Create a discount first
      const discount = await prisma.discount.create({
        data: createDiscountData(Date.now()),
      });

      // Benchmark the delete
      await prisma.discount.delete({
        where: { id: discount.id },
      });
    });
  });

  /**
   * =================================================================
   * Bulk Operations
   * =================================================================
   */
  describe('Bulk Operations', () => {
    bench('create 10 discounts', async () => {
      const discounts = [];
      for (let i = 0; i < 10; i++) {
        discounts.push(createDiscountData(`bulk_10_${Date.now()}_${i}`));
      }

      const created = await prisma.discount.createMany({
        data: discounts,
      });

      // Clean up
      await prisma.discount.deleteMany({
        where: {
          name: {
            startsWith: 'BENCH_Discount_bulk_10_',
          },
        },
      });
    });

    bench('create 50 discounts', async () => {
      const discounts = [];
      for (let i = 0; i < 50; i++) {
        discounts.push(createDiscountData(`bulk_50_${Date.now()}_${i}`));
      }

      await prisma.discount.createMany({
        data: discounts,
      });

      // Clean up
      await prisma.discount.deleteMany({
        where: {
          name: {
            startsWith: 'BENCH_Discount_bulk_50_',
          },
        },
      });
    });

    bench('create 100 discounts', async () => {
      const discounts = [];
      for (let i = 0; i < 100; i++) {
        discounts.push(createDiscountData(`bulk_100_${Date.now()}_${i}`));
      }

      await prisma.discount.createMany({
        data: discounts,
      });

      // Clean up
      await prisma.discount.deleteMany({
        where: {
          name: {
            startsWith: 'BENCH_Discount_bulk_100_',
          },
        },
      });
    });
  });

  /**
   * =================================================================
   * Query Operations
   * =================================================================
   */
  describe('Query Operations', () => {
    let testDiscounts = [];

    beforeAll(async () => {
      // Create test data
      const discounts = [];
      for (let i = 0; i < 20; i++) {
        discounts.push(createDiscountData(`query_test_${i}`));
      }
      await prisma.discount.createMany({ data: discounts });

      // Get created discounts
      testDiscounts = await prisma.discount.findMany({
        where: {
          name: {
            startsWith: 'BENCH_Discount_query_test_',
          },
        },
      });
    });

    afterAll(async () => {
      // Clean up test data
      await prisma.discount.deleteMany({
        where: {
          name: {
            startsWith: 'BENCH_Discount_query_test_',
          },
        },
      });
    });

    bench('find all discounts (no filter)', async () => {
      await prisma.discount.findMany();
    });

    bench('find active discounts only', async () => {
      await prisma.discount.findMany({
        where: { active: true },
      });
    });

    bench('find discounts by type', async () => {
      await prisma.discount.findMany({
        where: { type: 'percentage' },
      });
    });

    bench('find discounts with complex filter', async () => {
      await prisma.discount.findMany({
        where: {
          AND: [
            { active: true },
            { type: 'percentage' },
            { value: { gte: 10 } },
          ],
        },
      });
    });

    bench('count total discounts', async () => {
      await prisma.discount.count();
    });

    bench('count active discounts', async () => {
      await prisma.discount.count({
        where: { active: true },
      });
    });
  });

  /**
   * =================================================================
   * Pagination
   * =================================================================
   */
  describe('Pagination Performance', () => {
    beforeAll(async () => {
      // Create 100 test discounts for pagination
      const discounts = [];
      for (let i = 0; i < 100; i++) {
        discounts.push(createDiscountData(`pagination_${i}`));
      }
      await prisma.discount.createMany({ data: discounts });
    });

    afterAll(async () => {
      await prisma.discount.deleteMany({
        where: {
          name: {
            startsWith: 'BENCH_Discount_pagination_',
          },
        },
      });
    });

    bench('paginate: first 10 records', async () => {
      await prisma.discount.findMany({
        take: 10,
        skip: 0,
      });
    });

    bench('paginate: skip 50, take 10', async () => {
      await prisma.discount.findMany({
        take: 10,
        skip: 50,
      });
    });

    bench('paginate with sorting', async () => {
      await prisma.discount.findMany({
        take: 10,
        skip: 0,
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });

  /**
   * =================================================================
   * Product Discount Lookup
   * =================================================================
   */
  describe('Product Discount Lookup', () => {
    let testDiscounts = [];

    beforeAll(async () => {
      // Create discounts with different product IDs
      const discounts = [
        { ...createDiscountData('lookup_1'), productIds: ['prod_100'] },
        { ...createDiscountData('lookup_2'), productIds: ['prod_200'] },
        { ...createDiscountData('lookup_3'), productIds: ['prod_300'] },
        { ...createDiscountData('lookup_4'), productIds: ['prod_100', 'prod_200'] },
        { ...createDiscountData('lookup_5'), productIds: [] }, // Site-wide
      ];
      await prisma.discount.createMany({ data: discounts });
    });

    afterAll(async () => {
      await prisma.discount.deleteMany({
        where: {
          name: {
            startsWith: 'BENCH_Discount_lookup_',
          },
        },
      });
    });

    bench('find discounts for specific product', async () => {
      await prisma.discount.findMany({
        where: {
          OR: [
            { productIds: { has: 'prod_100' } },
            { productIds: { isEmpty: true } },
          ],
          active: true,
        },
      });
    });

    bench('find site-wide discounts only', async () => {
      await prisma.discount.findMany({
        where: {
          productIds: { isEmpty: true },
          active: true,
        },
      });
    });

    bench('find discounts for multiple products', async () => {
      const productIds = ['prod_100', 'prod_200', 'prod_300'];
      await prisma.discount.findMany({
        where: {
          OR: [
            { productIds: { hasSome: productIds } },
            { productIds: { isEmpty: true } },
          ],
          active: true,
        },
      });
    });
  });

  /**
   * =================================================================
   * Transaction Performance
   * =================================================================
   */
  describe('Transaction Performance', () => {
    bench('transaction: create 3 related records', async () => {
      const result = await prisma.$transaction(async (tx) => {
        const d1 = await tx.discount.create({
          data: createDiscountData(`tx_${Date.now()}_1`),
        });
        const d2 = await tx.discount.create({
          data: createDiscountData(`tx_${Date.now()}_2`),
        });
        const d3 = await tx.discount.create({
          data: createDiscountData(`tx_${Date.now()}_3`),
        });
        return [d1, d2, d3];
      });

      // Clean up
      await prisma.discount.deleteMany({
        where: {
          id: { in: result.map(d => d.id) },
        },
      });
    });

    bench('transaction: update multiple records', async () => {
      // Create test records
      const discounts = [];
      for (let i = 0; i < 5; i++) {
        discounts.push(createDiscountData(`tx_update_${Date.now()}_${i}`));
      }
      const created = await prisma.discount.createMany({ data: discounts });

      const toUpdate = await prisma.discount.findMany({
        where: {
          name: {
            startsWith: 'BENCH_Discount_tx_update_',
          },
        },
        take: 5,
      });

      // Benchmark the transaction
      await prisma.$transaction(
        toUpdate.map(d =>
          prisma.discount.update({
            where: { id: d.id },
            data: { value: 30 },
          })
        )
      );

      // Clean up
      await prisma.discount.deleteMany({
        where: {
          id: { in: toUpdate.map(d => d.id) },
        },
      });
    });
  });

  /**
   * =================================================================
   * Raw Query Performance
   * =================================================================
   */
  describe('Raw Query Performance', () => {
    bench('raw SQL: count discounts', async () => {
      await prisma.$queryRaw`SELECT COUNT(*) FROM "Discount"`;
    });

    bench('raw SQL: find active discounts', async () => {
      await prisma.$queryRaw`SELECT * FROM "Discount" WHERE active = true LIMIT 10`;
    });

    bench('Prisma vs Raw: count comparison (Prisma)', async () => {
      await prisma.discount.count();
    });

    bench('Prisma vs Raw: count comparison (Raw)', async () => {
      await prisma.$queryRaw`SELECT COUNT(*) FROM "Discount"`;
    });
  });

  /**
   * =================================================================
   * Connection Pool Performance
   * =================================================================
   */
  describe('Connection Pool', () => {
    bench('parallel queries: 5 concurrent reads', async () => {
      const queries = [];
      for (let i = 0; i < 5; i++) {
        queries.push(prisma.discount.findMany({ take: 10 }));
      }
      await Promise.all(queries);
    });

    bench('parallel queries: 10 concurrent reads', async () => {
      const queries = [];
      for (let i = 0; i < 10; i++) {
        queries.push(prisma.discount.findMany({ take: 10 }));
      }
      await Promise.all(queries);
    });

    bench('sequential queries: 10 reads', async () => {
      for (let i = 0; i < 10; i++) {
        await prisma.discount.findMany({ take: 10 });
      }
    });
  });

  /**
   * =================================================================
   * Realistic Scenarios
   * =================================================================
   */
  describe('Realistic E-commerce Scenarios', () => {
    bench('admin dashboard: load recent discounts', async () => {
      await prisma.discount.findMany({
        take: 20,
        orderBy: {
          createdAt: 'desc',
        },
        where: {
          active: true,
        },
      });
    });

    bench('storefront: find applicable discounts for product', async () => {
      await prisma.discount.findMany({
        where: {
          OR: [
            { productIds: { has: 'prod_123' } },
            { productIds: { isEmpty: true } },
          ],
          active: true,
        },
        orderBy: {
          value: 'desc',
        },
        take: 5,
      });
    });

    bench('cart processing: lookup discounts for 5 products', async () => {
      const productIds = ['p1', 'p2', 'p3', 'p4', 'p5'];
      await prisma.discount.findMany({
        where: {
          OR: [
            { productIds: { hasSome: productIds } },
            { productIds: { isEmpty: true } },
          ],
          active: true,
        },
      });
    });

    bench('admin search: find discount by name', async () => {
      await prisma.discount.findMany({
        where: {
          name: {
            contains: 'Sale',
            mode: 'insensitive',
          },
        },
        take: 10,
      });
    });
  });
});
