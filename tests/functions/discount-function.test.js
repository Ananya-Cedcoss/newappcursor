/**
 * Shopify Function Tests - Product Discount Application
 * Comprehensive tests for the discount function handler
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { run } from '../../extensions/product-discount-function/src/run.js';

/**
 * =================================================================
 * Mock Data Helpers
 * =================================================================
 */

/**
 * Create mock cart line item
 */
function createMockCartLine(overrides = {}) {
  return {
    id: overrides.id || 'gid://shopify/CartLine/1',
    quantity: overrides.quantity || 1,
    merchandise: {
      __typename: 'ProductVariant',
      id: overrides.variantId || 'gid://shopify/ProductVariant/123',
      product: {
        id: overrides.productId || 'gid://shopify/Product/789',
      },
      price: {
        amount: overrides.price || '100.00',
      },
      ...overrides.merchandise,
    },
  };
}

/**
 * Create mock discount configuration
 */
function createMockDiscount(overrides = {}) {
  return {
    id: overrides.id || 'discount_1',
    name: overrides.name || 'Test Discount',
    type: overrides.type || 'percentage',
    value: overrides.value || 20,
    productIds: overrides.productIds || [],
    ...overrides,
  };
}

/**
 * Create mock input for the function
 */
function createMockInput(cartLines = [], discountConfig = {}) {
  return {
    cart: {
      lines: cartLines,
    },
    discountNode: {
      metafield: {
        value: JSON.stringify(discountConfig),
      },
    },
  };
}

/**
 * =================================================================
 * Basic Function Tests
 * =================================================================
 */
describe('Shopify Discount Function - Basic Tests', () => {
  it('should export run function', () => {
    expect(run).toBeDefined();
    expect(typeof run).toBe('function');
  });

  it('should return empty discounts for empty configuration', () => {
    const input = createMockInput([]);
    const result = run(input);

    expect(result).toEqual({ discounts: [] });
  });

  it('should return empty discounts when metafield is empty', () => {
    const input = {
      cart: { lines: [] },
      discountNode: { metafield: { value: '{}' } },
    };
    const result = run(input);

    expect(result).toEqual({ discounts: [] });
  });

  it('should return empty discounts when no discounts configured', () => {
    const input = createMockInput([], { discounts: [] });
    const result = run(input);

    expect(result).toEqual({ discounts: [] });
  });
});

/**
 * =================================================================
 * Product Matching Tests
 * =================================================================
 */
describe('Product Matching Logic', () => {
  it('should apply discount when product matches', () => {
    const cartLines = [
      createMockCartLine({
        productId: 'gid://shopify/Product/123',
        price: '100.00',
      }),
    ];

    const discountConfig = {
      discounts: [
        createMockDiscount({
          type: 'percentage',
          value: 20,
          productIds: ['123'],
        }),
      ],
    };

    const input = createMockInput(cartLines, discountConfig);
    const result = run(input);

    expect(result.discounts).toHaveLength(1);
    expect(result.discounts[0].targets[0].cartLine.id).toBe('gid://shopify/CartLine/1');
    expect(result.discounts[0].value.percentage.value).toBe('20');
  });

  it('should NOT apply discount when product does not match', () => {
    const cartLines = [
      createMockCartLine({
        productId: 'gid://shopify/Product/999',
        price: '100.00',
      }),
    ];

    const discountConfig = {
      discounts: [
        createMockDiscount({
          type: 'percentage',
          value: 20,
          productIds: ['123'], // Different product ID
        }),
      ],
    };

    const input = createMockInput(cartLines, discountConfig);
    const result = run(input);

    expect(result.discounts).toHaveLength(0);
  });

  it('should apply discount to all products when productIds is empty', () => {
    const cartLines = [
      createMockCartLine({
        id: 'gid://shopify/CartLine/1',
        productId: 'gid://shopify/Product/123',
        price: '100.00',
      }),
      createMockCartLine({
        id: 'gid://shopify/CartLine/2',
        productId: 'gid://shopify/Product/456',
        price: '50.00',
      }),
    ];

    const discountConfig = {
      discounts: [
        createMockDiscount({
          type: 'percentage',
          value: 10,
          productIds: [], // Applies to all products
        }),
      ],
    };

    const input = createMockInput(cartLines, discountConfig);
    const result = run(input);

    expect(result.discounts).toHaveLength(2);
  });

  it('should apply discount to multiple matching products', () => {
    const cartLines = [
      createMockCartLine({
        id: 'gid://shopify/CartLine/1',
        productId: 'gid://shopify/Product/123',
        price: '100.00',
      }),
      createMockCartLine({
        id: 'gid://shopify/CartLine/2',
        productId: 'gid://shopify/Product/456',
        price: '50.00',
      }),
      createMockCartLine({
        id: 'gid://shopify/CartLine/3',
        productId: 'gid://shopify/Product/789',
        price: '75.00',
      }),
    ];

    const discountConfig = {
      discounts: [
        createMockDiscount({
          type: 'percentage',
          value: 15,
          productIds: ['123', '456'], // Matches first two products
        }),
      ],
    };

    const input = createMockInput(cartLines, discountConfig);
    const result = run(input);

    expect(result.discounts).toHaveLength(2);
    expect(result.discounts[0].targets[0].cartLine.id).toBe('gid://shopify/CartLine/1');
    expect(result.discounts[1].targets[0].cartLine.id).toBe('gid://shopify/CartLine/2');
  });

  it('should skip non-ProductVariant merchandise', () => {
    const cartLines = [
      {
        id: 'gid://shopify/CartLine/1',
        quantity: 1,
        merchandise: {
          __typename: 'GiftCard', // Not a ProductVariant
          id: 'gid://shopify/GiftCard/123',
        },
      },
      createMockCartLine({
        id: 'gid://shopify/CartLine/2',
        productId: 'gid://shopify/Product/456',
        price: '100.00',
      }),
    ];

    const discountConfig = {
      discounts: [
        createMockDiscount({
          type: 'percentage',
          value: 20,
          productIds: [],
        }),
      ],
    };

    const input = createMockInput(cartLines, discountConfig);
    const result = run(input);

    // Should only apply to ProductVariant, not GiftCard
    expect(result.discounts).toHaveLength(1);
    expect(result.discounts[0].targets[0].cartLine.id).toBe('gid://shopify/CartLine/2');
  });
});

/**
 * =================================================================
 * Percentage Discount Logic Tests
 * =================================================================
 */
describe('Percentage Discount Logic', () => {
  it('should apply 20% percentage discount correctly', () => {
    const cartLines = [
      createMockCartLine({
        productId: 'gid://shopify/Product/123',
        price: '100.00',
      }),
    ];

    const discountConfig = {
      discounts: [
        createMockDiscount({
          type: 'percentage',
          value: 20,
          productIds: ['123'],
        }),
      ],
    };

    const input = createMockInput(cartLines, discountConfig);
    const result = run(input);

    expect(result.discounts).toHaveLength(1);
    expect(result.discounts[0].value.percentage.value).toBe('20');
  });

  it('should apply 50% percentage discount correctly', () => {
    const cartLines = [
      createMockCartLine({
        productId: 'gid://shopify/Product/123',
        price: '200.00',
      }),
    ];

    const discountConfig = {
      discounts: [
        createMockDiscount({
          type: 'percentage',
          value: 50,
          productIds: ['123'],
        }),
      ],
    };

    const input = createMockInput(cartLines, discountConfig);
    const result = run(input);

    expect(result.discounts[0].value.percentage.value).toBe('50');
  });

  it('should apply 100% percentage discount (free item)', () => {
    const cartLines = [
      createMockCartLine({
        productId: 'gid://shopify/Product/123',
        price: '100.00',
      }),
    ];

    const discountConfig = {
      discounts: [
        createMockDiscount({
          type: 'percentage',
          value: 100,
          productIds: ['123'],
        }),
      ],
    };

    const input = createMockInput(cartLines, discountConfig);
    const result = run(input);

    expect(result.discounts[0].value.percentage.value).toBe('100');
  });

  it('should handle decimal percentage values', () => {
    const cartLines = [
      createMockCartLine({
        productId: 'gid://shopify/Product/123',
        price: '100.00',
      }),
    ];

    const discountConfig = {
      discounts: [
        createMockDiscount({
          type: 'percentage',
          value: 12.5,
          productIds: ['123'],
        }),
      ],
    };

    const input = createMockInput(cartLines, discountConfig);
    const result = run(input);

    expect(result.discounts[0].value.percentage.value).toBe('12.5');
  });

  it('should include discount message', () => {
    const cartLines = [
      createMockCartLine({
        productId: 'gid://shopify/Product/123',
        price: '100.00',
      }),
    ];

    const discountConfig = {
      discounts: [
        createMockDiscount({
          name: 'Summer Sale',
          type: 'percentage',
          value: 25,
          productIds: ['123'],
        }),
      ],
    };

    const input = createMockInput(cartLines, discountConfig);
    const result = run(input);

    expect(result.discounts[0].message).toBe('Summer Sale');
  });
});

/**
 * =================================================================
 * Fixed Discount Logic Tests
 * =================================================================
 */
describe('Fixed Discount Logic', () => {
  it('should apply $10 fixed discount correctly', () => {
    const cartLines = [
      createMockCartLine({
        productId: 'gid://shopify/Product/123',
        price: '100.00',
      }),
    ];

    const discountConfig = {
      discounts: [
        createMockDiscount({
          type: 'fixed',
          value: 10,
          productIds: ['123'],
        }),
      ],
    };

    const input = createMockInput(cartLines, discountConfig);
    const result = run(input);

    expect(result.discounts).toHaveLength(1);
    // Fixed $10 off $100 = 10% discount
    expect(result.discounts[0].value.percentage.value).toBe('10');
  });

  it('should apply $25 fixed discount correctly', () => {
    const cartLines = [
      createMockCartLine({
        productId: 'gid://shopify/Product/123',
        price: '100.00',
      }),
    ];

    const discountConfig = {
      discounts: [
        createMockDiscount({
          type: 'fixed',
          value: 25,
          productIds: ['123'],
        }),
      ],
    };

    const input = createMockInput(cartLines, discountConfig);
    const result = run(input);

    // Fixed $25 off $100 = 25% discount
    expect(result.discounts[0].value.percentage.value).toBe('25');
  });

  it('should NOT exceed item price for fixed discount', () => {
    const cartLines = [
      createMockCartLine({
        productId: 'gid://shopify/Product/123',
        price: '50.00',
      }),
    ];

    const discountConfig = {
      discounts: [
        createMockDiscount({
          type: 'fixed',
          value: 100, // More than item price
          productIds: ['123'],
        }),
      ],
    };

    const input = createMockInput(cartLines, discountConfig);
    const result = run(input);

    // Discount capped at item price ($50), so 100% off
    expect(result.discounts[0].value.percentage.value).toBe('100');
  });

  it('should handle decimal fixed discount values', () => {
    const cartLines = [
      createMockCartLine({
        productId: 'gid://shopify/Product/123',
        price: '100.00',
      }),
    ];

    const discountConfig = {
      discounts: [
        createMockDiscount({
          type: 'fixed',
          value: 7.50,
          productIds: ['123'],
        }),
      ],
    };

    const input = createMockInput(cartLines, discountConfig);
    const result = run(input);

    // Fixed $7.50 off $100 = 7.5% discount
    expect(result.discounts[0].value.percentage.value).toBe('7.5');
  });
});

/**
 * =================================================================
 * Multiple Discounts Priority Tests
 * =================================================================
 */
describe('Multiple Discounts - Priority Rules', () => {
  it('should apply highest percentage when multiple percentage discounts match', () => {
    const cartLines = [
      createMockCartLine({
        productId: 'gid://shopify/Product/123',
        price: '100.00',
      }),
    ];

    const discountConfig = {
      discounts: [
        createMockDiscount({
          id: 'discount_1',
          name: '10% Off',
          type: 'percentage',
          value: 10,
          productIds: ['123'],
        }),
        createMockDiscount({
          id: 'discount_2',
          name: '25% Off',
          type: 'percentage',
          value: 25,
          productIds: ['123'],
        }),
        createMockDiscount({
          id: 'discount_3',
          name: '15% Off',
          type: 'percentage',
          value: 15,
          productIds: ['123'],
        }),
      ],
    };

    const input = createMockInput(cartLines, discountConfig);
    const result = run(input);

    // Should apply the 25% discount (highest)
    expect(result.discounts).toHaveLength(1);
    expect(result.discounts[0].message).toBe('25% Off');
    expect(result.discounts[0].value.percentage.value).toBe('25');
  });

  it('should apply highest fixed when multiple fixed discounts match', () => {
    const cartLines = [
      createMockCartLine({
        productId: 'gid://shopify/Product/123',
        price: '100.00',
      }),
    ];

    const discountConfig = {
      discounts: [
        createMockDiscount({
          id: 'discount_1',
          name: '$5 Off',
          type: 'fixed',
          value: 5,
          productIds: ['123'],
        }),
        createMockDiscount({
          id: 'discount_2',
          name: '$20 Off',
          type: 'fixed',
          value: 20,
          productIds: ['123'],
        }),
        createMockDiscount({
          id: 'discount_3',
          name: '$10 Off',
          type: 'fixed',
          value: 10,
          productIds: ['123'],
        }),
      ],
    };

    const input = createMockInput(cartLines, discountConfig);
    const result = run(input);

    // Should apply the $20 discount (highest)
    expect(result.discounts).toHaveLength(1);
    expect(result.discounts[0].message).toBe('$20 Off');
    expect(result.discounts[0].value.percentage.value).toBe('20'); // $20 off $100 = 20%
  });

  it('should prefer percentage discount over fixed when both match', () => {
    const cartLines = [
      createMockCartLine({
        productId: 'gid://shopify/Product/123',
        price: '100.00',
      }),
    ];

    const discountConfig = {
      discounts: [
        createMockDiscount({
          id: 'discount_1',
          name: '$25 Off',
          type: 'fixed',
          value: 25,
          productIds: ['123'],
        }),
        createMockDiscount({
          id: 'discount_2',
          name: '20% Off',
          type: 'percentage',
          value: 20,
          productIds: ['123'],
        }),
      ],
    };

    const input = createMockInput(cartLines, discountConfig);
    const result = run(input);

    // Should prefer percentage discount
    expect(result.discounts).toHaveLength(1);
    expect(result.discounts[0].message).toBe('20% Off');
  });

  it('should apply different discounts to different products', () => {
    const cartLines = [
      createMockCartLine({
        id: 'gid://shopify/CartLine/1',
        productId: 'gid://shopify/Product/123',
        price: '100.00',
      }),
      createMockCartLine({
        id: 'gid://shopify/CartLine/2',
        productId: 'gid://shopify/Product/456',
        price: '50.00',
      }),
    ];

    const discountConfig = {
      discounts: [
        createMockDiscount({
          name: '25% Off Product 123',
          type: 'percentage',
          value: 25,
          productIds: ['123'],
        }),
        createMockDiscount({
          name: '$10 Off Product 456',
          type: 'fixed',
          value: 10,
          productIds: ['456'],
        }),
      ],
    };

    const input = createMockInput(cartLines, discountConfig);
    const result = run(input);

    expect(result.discounts).toHaveLength(2);
    expect(result.discounts[0].message).toBe('25% Off Product 123');
    expect(result.discounts[0].value.percentage.value).toBe('25');
    expect(result.discounts[1].message).toBe('$10 Off Product 456');
    expect(result.discounts[1].value.percentage.value).toBe('20'); // $10 off $50 = 20%
  });
});

/**
 * =================================================================
 * Empty Cart Tests
 * =================================================================
 */
describe('Empty Cart Scenarios', () => {
  it('should return empty discounts for empty cart', () => {
    const input = createMockInput([], {
      discounts: [
        createMockDiscount({
          type: 'percentage',
          value: 20,
          productIds: [],
        }),
      ],
    });

    const result = run(input);

    expect(result).toEqual({ discounts: [] });
  });

  it('should handle cart with zero lines', () => {
    const input = {
      cart: { lines: [] },
      discountNode: {
        metafield: {
          value: JSON.stringify({
            discounts: [
              createMockDiscount({ type: 'percentage', value: 20 }),
            ],
          }),
        },
      },
    };

    const result = run(input);

    expect(result.discounts).toHaveLength(0);
  });

  it('should return empty when cart has items but no matching products', () => {
    const cartLines = [
      createMockCartLine({
        productId: 'gid://shopify/Product/999',
        price: '100.00',
      }),
    ];

    const discountConfig = {
      discounts: [
        createMockDiscount({
          type: 'percentage',
          value: 20,
          productIds: ['123', '456'], // No matching products
        }),
      ],
    };

    const input = createMockInput(cartLines, discountConfig);
    const result = run(input);

    expect(result.discounts).toHaveLength(0);
  });
});

/**
 * =================================================================
 * Invalid Discount Format Tests
 * =================================================================
 */
describe('Invalid Discount Format Handling', () => {
  it('should handle invalid JSON in metafield', () => {
    const input = {
      cart: {
        lines: [
          createMockCartLine({
            productId: 'gid://shopify/Product/123',
            price: '100.00',
          }),
        ],
      },
      discountNode: {
        metafield: {
          value: 'invalid json{',
        },
      },
    };

    expect(() => run(input)).toThrow();
  });

  it('should handle missing metafield value', () => {
    const input = {
      cart: {
        lines: [
          createMockCartLine({
            productId: 'gid://shopify/Product/123',
            price: '100.00',
          }),
        ],
      },
      discountNode: {
        metafield: {
          value: null,
        },
      },
    };

    const result = run(input);
    expect(result.discounts).toHaveLength(0);
  });

  it('should handle undefined metafield', () => {
    const input = {
      cart: {
        lines: [
          createMockCartLine({
            productId: 'gid://shopify/Product/123',
            price: '100.00',
          }),
        ],
      },
      discountNode: {
        metafield: undefined,
      },
    };

    const result = run(input);
    expect(result.discounts).toHaveLength(0);
  });

  it('should handle discount with unknown type', () => {
    const cartLines = [
      createMockCartLine({
        productId: 'gid://shopify/Product/123',
        price: '100.00',
      }),
    ];

    const discountConfig = {
      discounts: [
        createMockDiscount({
          type: 'unknown_type',
          value: 20,
          productIds: ['123'],
        }),
      ],
    };

    const input = createMockInput(cartLines, discountConfig);
    const result = run(input);

    // Should return empty discounts for unknown type (discount amount = 0)
    expect(result.discounts).toHaveLength(0);
  });

  it('should handle discount with zero value', () => {
    const cartLines = [
      createMockCartLine({
        productId: 'gid://shopify/Product/123',
        price: '100.00',
      }),
    ];

    const discountConfig = {
      discounts: [
        createMockDiscount({
          type: 'percentage',
          value: 0,
          productIds: ['123'],
        }),
      ],
    };

    const input = createMockInput(cartLines, discountConfig);
    const result = run(input);

    // Zero discount should not be applied
    expect(result.discounts).toHaveLength(0);
  });

  it('should handle discount with negative value', () => {
    const cartLines = [
      createMockCartLine({
        productId: 'gid://shopify/Product/123',
        price: '100.00',
      }),
    ];

    const discountConfig = {
      discounts: [
        createMockDiscount({
          type: 'percentage',
          value: -10,
          productIds: ['123'],
        }),
      ],
    };

    const input = createMockInput(cartLines, discountConfig);
    const result = run(input);

    // Negative discount should not be applied
    expect(result.discounts).toHaveLength(0);
  });

  it('should handle price of zero', () => {
    const cartLines = [
      createMockCartLine({
        productId: 'gid://shopify/Product/123',
        price: '0.00',
      }),
    ];

    const discountConfig = {
      discounts: [
        createMockDiscount({
          type: 'percentage',
          value: 20,
          productIds: ['123'],
        }),
      ],
    };

    const input = createMockInput(cartLines, discountConfig);
    const result = run(input);

    // Zero price should result in zero discount
    expect(result.discounts).toHaveLength(0);
  });
});

/**
 * =================================================================
 * Edge Cases and Integration Tests
 * =================================================================
 */
describe('Edge Cases and Complex Scenarios', () => {
  it('should handle very large cart with multiple products', () => {
    const cartLines = Array.from({ length: 50 }, (_, i) =>
      createMockCartLine({
        id: `gid://shopify/CartLine/${i}`,
        productId: `gid://shopify/Product/${i % 10}`, // 10 unique products
        price: `${(i + 1) * 10}.00`,
      })
    );

    const discountConfig = {
      discounts: [
        createMockDiscount({
          type: 'percentage',
          value: 15,
          productIds: [], // Applies to all
        }),
      ],
    };

    const input = createMockInput(cartLines, discountConfig);
    const result = run(input);

    expect(result.discounts).toHaveLength(50);
  });

  it('should handle mix of matching and non-matching products', () => {
    const cartLines = [
      createMockCartLine({
        id: 'gid://shopify/CartLine/1',
        productId: 'gid://shopify/Product/123',
        price: '100.00',
      }),
      createMockCartLine({
        id: 'gid://shopify/CartLine/2',
        productId: 'gid://shopify/Product/999', // Won't match
        price: '50.00',
      }),
      createMockCartLine({
        id: 'gid://shopify/CartLine/3',
        productId: 'gid://shopify/Product/456',
        price: '75.00',
      }),
    ];

    const discountConfig = {
      discounts: [
        createMockDiscount({
          type: 'percentage',
          value: 20,
          productIds: ['123', '456'], // Only matches 2 out of 3
        }),
      ],
    };

    const input = createMockInput(cartLines, discountConfig);
    const result = run(input);

    expect(result.discounts).toHaveLength(2);
    expect(result.discounts[0].targets[0].cartLine.id).toBe('gid://shopify/CartLine/1');
    expect(result.discounts[1].targets[0].cartLine.id).toBe('gid://shopify/CartLine/3');
  });

  it('should handle discount without name (use default)', () => {
    const cartLines = [
      createMockCartLine({
        productId: 'gid://shopify/Product/123',
        price: '100.00',
      }),
    ];

    const discountConfig = {
      discounts: [
        {
          type: 'percentage',
          value: 20,
          productIds: ['123'],
          // No name provided
        },
      ],
    };

    const input = createMockInput(cartLines, discountConfig);
    const result = run(input);

    expect(result.discounts[0].message).toBe('Product Discount');
  });

  it('should extract numeric ID from various GID formats', () => {
    const cartLines = [
      createMockCartLine({
        id: 'gid://shopify/CartLine/1',
        productId: 'gid://shopify/Product/123456789',
        price: '100.00',
      }),
    ];

    const discountConfig = {
      discounts: [
        createMockDiscount({
          type: 'percentage',
          value: 20,
          productIds: ['123456789'],
        }),
      ],
    };

    const input = createMockInput(cartLines, discountConfig);
    const result = run(input);

    expect(result.discounts).toHaveLength(1);
  });
});
