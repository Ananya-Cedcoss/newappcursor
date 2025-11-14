/**
 * Performance Benchmarks for Discount Rule Resolution
 * Tests the performance of discount matching and selection logic
 */

import { bench, describe } from 'vitest';
import { run } from '../../extensions/product-discount-function/src/run.js';

/**
 * Helper: Create mock cart with N items
 */
function createLargeCart(itemCount) {
  const lines = [];
  for (let i = 1; i <= itemCount; i++) {
    lines.push({
      id: `gid://shopify/CartLine/${i}`,
      quantity: 1,
      merchandise: {
        __typename: 'ProductVariant',
        id: `gid://shopify/ProductVariant/${i}`,
        product: {
          id: `gid://shopify/Product/${i}`,
        },
        price: {
          amount: '100.00',
        },
      },
    });
  }
  return { lines };
}

/**
 * Helper: Create N discounts
 */
function createManyDiscounts(count) {
  const discounts = [];
  for (let i = 1; i <= count; i++) {
    discounts.push({
      id: `discount_${i}`,
      name: `Discount ${i}`,
      type: 'percentage',
      value: 10 + (i % 20), // 10-30%
      productIds: [(i * 10).toString()], // Different product IDs
    });
  }
  return discounts;
}

/**
 * Helper: Create input with discounts
 */
function createFunctionInput(cart, discounts) {
  return {
    cart,
    discountNode: {
      metafield: {
        value: JSON.stringify({ discounts }),
      },
    },
  };
}

describe('Discount Rule Resolution - Performance', () => {
  /**
   * =================================================================
   * Single Discount Matching
   * =================================================================
   */
  describe('Single Discount Resolution', () => {
    bench('resolve single discount for single product', () => {
      const cart = createLargeCart(1);
      const discounts = [
        {
          id: 'discount_1',
          name: 'Test Discount',
          type: 'percentage',
          value: 20,
          productIds: ['1'],
        },
      ];
      const input = createFunctionInput(cart, discounts);
      run(input);
    });

    bench('resolve percentage discount calculation', () => {
      const cart = createLargeCart(1);
      const discounts = [
        {
          id: 'discount_1',
          name: 'Percentage Discount',
          type: 'percentage',
          value: 25,
          productIds: ['1'],
        },
      ];
      const input = createFunctionInput(cart, discounts);
      run(input);
    });

    bench('resolve fixed discount calculation', () => {
      const cart = createLargeCart(1);
      const discounts = [
        {
          id: 'discount_1',
          name: 'Fixed Discount',
          type: 'fixed',
          value: 10,
          productIds: ['1'],
        },
      ];
      const input = createFunctionInput(cart, discounts);
      run(input);
    });
  });

  /**
   * =================================================================
   * Multiple Discount Priority
   * =================================================================
   */
  describe('Multiple Discount Priority Resolution', () => {
    bench('resolve highest among 5 discounts', () => {
      const cart = createLargeCart(1);
      const discounts = [
        { id: 'd1', name: '10%', type: 'percentage', value: 10, productIds: ['1'] },
        { id: 'd2', name: '15%', type: 'percentage', value: 15, productIds: ['1'] },
        { id: 'd3', name: '20%', type: 'percentage', value: 20, productIds: ['1'] },
        { id: 'd4', name: '25%', type: 'percentage', value: 25, productIds: ['1'] },
        { id: 'd5', name: '30%', type: 'percentage', value: 30, productIds: ['1'] },
      ];
      const input = createFunctionInput(cart, discounts);
      run(input);
    });

    bench('resolve highest among 10 discounts', () => {
      const cart = createLargeCart(1);
      const discounts = createManyDiscounts(10).map(d => ({
        ...d,
        productIds: ['1'], // All match same product
      }));
      const input = createFunctionInput(cart, discounts);
      run(input);
    });

    bench('resolve highest among 20 discounts', () => {
      const cart = createLargeCart(1);
      const discounts = createManyDiscounts(20).map(d => ({
        ...d,
        productIds: ['1'],
      }));
      const input = createFunctionInput(cart, discounts);
      run(input);
    });

    bench('resolve mixed type discounts (percentage vs fixed)', () => {
      const cart = createLargeCart(1);
      const discounts = [
        { id: 'd1', name: '20%', type: 'percentage', value: 20, productIds: ['1'] },
        { id: 'd2', name: '$15', type: 'fixed', value: 15, productIds: ['1'] },
        { id: 'd3', name: '25%', type: 'percentage', value: 25, productIds: ['1'] },
        { id: 'd4', name: '$20', type: 'fixed', value: 20, productIds: ['1'] },
      ];
      const input = createFunctionInput(cart, discounts);
      run(input);
    });
  });

  /**
   * =================================================================
   * Large Cart Processing
   * =================================================================
   */
  describe('Large Cart Performance', () => {
    bench('process cart with 10 items', () => {
      const cart = createLargeCart(10);
      const discounts = [
        {
          id: 'discount_all',
          name: 'Site-wide 20%',
          type: 'percentage',
          value: 20,
          productIds: [], // Applies to all
        },
      ];
      const input = createFunctionInput(cart, discounts);
      run(input);
    });

    bench('process cart with 50 items', () => {
      const cart = createLargeCart(50);
      const discounts = [
        {
          id: 'discount_all',
          name: 'Site-wide 20%',
          type: 'percentage',
          value: 20,
          productIds: [],
        },
      ];
      const input = createFunctionInput(cart, discounts);
    });

    bench('process cart with 100 items', () => {
      const cart = createLargeCart(100);
      const discounts = [
        {
          id: 'discount_all',
          name: 'Site-wide 20%',
          type: 'percentage',
          value: 20,
          productIds: [],
        },
      ];
      const input = createFunctionInput(cart, discounts);
    });
  });

  /**
   * =================================================================
   * Complex Scenarios
   * =================================================================
   */
  describe('Complex Discount Scenarios', () => {
    bench('10 items × 10 discounts (product-specific)', () => {
      const cart = createLargeCart(10);
      const discounts = [];
      for (let i = 1; i <= 10; i++) {
        discounts.push({
          id: `discount_${i}`,
          name: `Product ${i} Discount`,
          type: 'percentage',
          value: 15 + i,
          productIds: [i.toString()],
        });
      }
      const input = createFunctionInput(cart, discounts);
      run(input);
    });

    bench('50 items × 20 discounts (mixed matching)', () => {
      const cart = createLargeCart(50);
      const discounts = createManyDiscounts(20);
      // Some discounts match, some don't
      discounts.forEach((d, i) => {
        d.productIds = [((i * 3) + 1).toString()]; // Sparse matching
      });
      const input = createFunctionInput(cart, discounts);
      run(input);
    });

    bench('100 items × 50 discounts (worst case)', () => {
      const cart = createLargeCart(100);
      const discounts = createManyDiscounts(50);
      const input = createFunctionInput(cart, discounts);
      run(input);
    });

    bench('empty cart (edge case)', () => {
      const cart = { lines: [] };
      const discounts = createManyDiscounts(10);
      const input = createFunctionInput(cart, discounts);
      run(input);
    });

    bench('no discounts configured (edge case)', () => {
      const cart = createLargeCart(10);
      const discounts = [];
      const input = createFunctionInput(cart, discounts);
      run(input);
    });
  });

  /**
   * =================================================================
   * GID Extraction Performance
   * =================================================================
   */
  describe('GID Extraction', () => {
    bench('extract numeric ID from standard GID (1000 times)', () => {
      const gid = 'gid://shopify/Product/123456789';
      for (let i = 0; i < 1000; i++) {
        gid.split('/').pop();
      }
    });

    bench('extract ID from varied GID formats (1000 times)', () => {
      const gids = [
        'gid://shopify/Product/123',
        'gid://shopify/ProductVariant/456',
        'gid://shopify/CartLine/789',
      ];
      for (let i = 0; i < 1000; i++) {
        gids[i % 3].split('/').pop();
      }
    });
  });

  /**
   * =================================================================
   * JSON Parsing Performance
   * =================================================================
   */
  describe('Configuration Parsing', () => {
    bench('parse small discount config (5 discounts)', () => {
      const config = JSON.stringify({ discounts: createManyDiscounts(5) });
      JSON.parse(config);
    });

    bench('parse medium discount config (20 discounts)', () => {
      const config = JSON.stringify({ discounts: createManyDiscounts(20) });
      JSON.parse(config);
    });

    bench('parse large discount config (100 discounts)', () => {
      const config = JSON.stringify({ discounts: createManyDiscounts(100) });
      JSON.parse(config);
    });

    bench('handle invalid JSON gracefully', () => {
      try {
        JSON.parse('INVALID JSON{');
      } catch (e) {
        // Expected to fail
      }
    });
  });

  /**
   * =================================================================
   * Realistic Scenarios
   * =================================================================
   */
  describe('Realistic E-commerce Scenarios', () => {
    bench('typical cart: 3 items, 5 active discounts', () => {
      const cart = createLargeCart(3);
      const discounts = createManyDiscounts(5);
      discounts[0].productIds = ['1']; // One matches
      const input = createFunctionInput(cart, discounts);
      run(input);
    });

    bench('holiday sale: 10 items, 15 active discounts', () => {
      const cart = createLargeCart(10);
      const discounts = createManyDiscounts(15);
      // Mix of site-wide and product-specific
      discounts[0].productIds = []; // Site-wide
      const input = createFunctionInput(cart, discounts);
      run(input);
    });

    bench('flash sale: 1 item, 1 high-value discount', () => {
      const cart = createLargeCart(1);
      const discounts = [
        {
          id: 'flash',
          name: 'Flash Sale 50%',
          type: 'percentage',
          value: 50,
          productIds: ['1'],
        },
      ];
      const input = createFunctionInput(cart, discounts);
      run(input);
    });

    bench('bulk order: 25 items, 3 tiered discounts', () => {
      const cart = createLargeCart(25);
      const discounts = [
        { id: 'd1', name: '10% Bulk', type: 'percentage', value: 10, productIds: [] },
        { id: 'd2', name: '15% VIP', type: 'percentage', value: 15, productIds: [] },
        { id: 'd3', name: '20% Special', type: 'percentage', value: 20, productIds: [] },
      ];
      const input = createFunctionInput(cart, discounts);
      run(input);
    });
  });
});
