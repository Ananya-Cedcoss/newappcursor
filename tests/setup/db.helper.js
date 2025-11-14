/**
 * Database Test Helpers
 * Utilities for managing test database
 */

import { PrismaClient } from '@prisma/client';

// Create a singleton Prisma client for tests
let prisma;

/**
 * Get or create Prisma client instance
 * @returns {PrismaClient}
 */
export function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

/**
 * Reset the entire database
 * Deletes all records from all tables
 * Use this before each test suite
 */
export async function resetDatabase() {
  const client = getPrismaClient();

  try {
    // Delete in reverse order to handle foreign keys
    await client.discount.deleteMany();
    await client.session.deleteMany();

    console.log('✅ Database reset complete');
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    throw error;
  }
}

/**
 * Clean specific table
 * @param {string} tableName - Name of the table to clean
 */
export async function cleanTable(tableName) {
  const client = getPrismaClient();

  try {
    switch (tableName.toLowerCase()) {
      case 'discount':
      case 'discounts':
        await client.discount.deleteMany();
        break;
      case 'session':
      case 'sessions':
        await client.session.deleteMany();
        break;
      default:
        throw new Error(`Unknown table: ${tableName}`);
    }

    console.log(`✅ Table "${tableName}" cleaned`);
  } catch (error) {
    console.error(`❌ Failed to clean table "${tableName}":`, error);
    throw error;
  }
}

/**
 * Clean all tables
 * Use this after each test
 */
export async function cleanAllTables() {
  const client = getPrismaClient();

  try {
    await client.discount.deleteMany();
    await client.session.deleteMany();
  } catch (error) {
    console.error('❌ Failed to clean tables:', error);
    throw error;
  }
}

/**
 * Seed test discounts
 * @param {Array} discounts - Array of discount objects
 * @returns {Promise<Array>} Created discounts
 */
export async function seedDiscounts(discounts = []) {
  const client = getPrismaClient();

  const defaultDiscounts = [
    {
      name: 'Summer Sale',
      type: 'percentage',
      value: 20,
      productIds: JSON.stringify(['123', '456']),
    },
    {
      name: 'Winter Discount',
      type: 'fixed',
      value: 10,
      productIds: JSON.stringify(['789']),
    },
    {
      name: 'Special Offer',
      type: 'percentage',
      value: 15,
      productIds: JSON.stringify(['111', '222', '333']),
    },
  ];

  const discountsToSeed = discounts.length > 0 ? discounts : defaultDiscounts;

  try {
    const created = [];
    for (const discount of discountsToSeed) {
      const result = await client.discount.create({
        data: discount,
      });
      created.push(result);
    }

    console.log(`✅ Seeded ${created.length} discounts`);
    return created;
  } catch (error) {
    console.error('❌ Failed to seed discounts:', error);
    throw error;
  }
}

/**
 * Seed test sessions
 * @param {Array} sessions - Array of session objects
 * @returns {Promise<Array>} Created sessions
 */
export async function seedSessions(sessions = []) {
  const client = getPrismaClient();

  const defaultSessions = [
    {
      id: 'test_session_1',
      shop: 'test-shop-1.myshopify.com',
      state: 'test_state_1',
      isOnline: false,
      accessToken: 'test_token_1',
      scope: 'write_products,write_discounts',
    },
    {
      id: 'test_session_2',
      shop: 'test-shop-2.myshopify.com',
      state: 'test_state_2',
      isOnline: true,
      accessToken: 'test_token_2',
      scope: 'write_products,write_discounts',
      userId: BigInt(12345),
      email: 'test@example.com',
    },
  ];

  const sessionsToSeed = sessions.length > 0 ? sessions : defaultSessions;

  try {
    const created = [];
    for (const session of sessionsToSeed) {
      const result = await client.session.create({
        data: session,
      });
      created.push(result);
    }

    console.log(`✅ Seeded ${created.length} sessions`);
    return created;
  } catch (error) {
    console.error('❌ Failed to seed sessions:', error);
    throw error;
  }
}

/**
 * Seed all test data
 * Seeds both discounts and sessions with default data
 * @returns {Promise<Object>} Created data
 */
export async function seedAll() {
  try {
    const discounts = await seedDiscounts();
    const sessions = await seedSessions();

    console.log('✅ All test data seeded');
    return { discounts, sessions };
  } catch (error) {
    console.error('❌ Failed to seed all data:', error);
    throw error;
  }
}

/**
 * Get all discounts
 * @returns {Promise<Array>}
 */
export async function getAllDiscounts() {
  const client = getPrismaClient();
  return await client.discount.findMany();
}

/**
 * Get discount by ID
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function getDiscountById(id) {
  const client = getPrismaClient();
  return await client.discount.findUnique({
    where: { id },
  });
}

/**
 * Create a discount
 * @param {Object} data - Discount data
 * @returns {Promise<Object>}
 */
export async function createDiscount(data) {
  const client = getPrismaClient();
  return await client.discount.create({
    data,
  });
}

/**
 * Update a discount
 * @param {string} id - Discount ID
 * @param {Object} data - Update data
 * @returns {Promise<Object>}
 */
export async function updateDiscount(id, data) {
  const client = getPrismaClient();
  return await client.discount.update({
    where: { id },
    data,
  });
}

/**
 * Delete a discount
 * @param {string} id - Discount ID
 * @returns {Promise<Object>}
 */
export async function deleteDiscount(id) {
  const client = getPrismaClient();
  return await client.discount.delete({
    where: { id },
  });
}

/**
 * Get all sessions
 * @returns {Promise<Array>}
 */
export async function getAllSessions() {
  const client = getPrismaClient();
  return await client.session.findMany();
}

/**
 * Get session by ID
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function getSessionById(id) {
  const client = getPrismaClient();
  return await client.session.findUnique({
    where: { id },
  });
}

/**
 * Create a session
 * @param {Object} data - Session data
 * @returns {Promise<Object>}
 */
export async function createSession(data) {
  const client = getPrismaClient();
  return await client.session.create({
    data,
  });
}

/**
 * Disconnect Prisma client
 * Call this in global teardown
 */
export async function disconnectDatabase() {
  if (prisma) {
    await prisma.$disconnect();
    console.log('✅ Database disconnected');
  }
}

/**
 * Count records in a table
 * @param {string} tableName
 * @returns {Promise<number>}
 */
export async function countRecords(tableName) {
  const client = getPrismaClient();

  switch (tableName.toLowerCase()) {
    case 'discount':
    case 'discounts':
      return await client.discount.count();
    case 'session':
    case 'sessions':
      return await client.session.count();
    default:
      throw new Error(`Unknown table: ${tableName}`);
  }
}

/**
 * Verify database is empty
 * Useful for testing cleanup
 * @returns {Promise<boolean>}
 */
export async function isDatabaseEmpty() {
  const discountCount = await countRecords('discount');
  const sessionCount = await countRecords('session');

  return discountCount === 0 && sessionCount === 0;
}

// Export default object with all helpers
export default {
  getPrismaClient,
  resetDatabase,
  cleanTable,
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
  getSessionById,
  createSession,
  disconnectDatabase,
  countRecords,
  isDatabaseEmpty,
};
