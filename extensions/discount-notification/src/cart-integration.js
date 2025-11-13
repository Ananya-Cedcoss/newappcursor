/**
 * Client-side utility for integrating discount notifications into cart/checkout
 * Can be used in theme customizations or storefront apps
 */

class DiscountNotificationClient {
  constructor(config = {}) {
    this.apiUrl = config.apiUrl || window.location.origin;
    this.autoApply = config.autoApply || false;
    this.showNotification = config.showNotification !== false;
    this.notificationContainer = config.notificationContainer || null;
  }

  /**
   * Fetch available discounts for current cart
   * @param {Array} cartLines - Array of cart line items
   * @returns {Promise<Object|null>} - Available discount or null
   */
  async fetchAvailableDiscount(cartLines) {
    try {
      const response = await fetch(`${this.apiUrl}/api/discounts/available`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cartLines }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch discounts');
      }

      const data = await response.json();
      return data.discount || null;
    } catch (error) {
      console.error('Error fetching discount:', error);
      return null;
    }
  }

  /**
   * Apply discount code to cart
   * @param {string} discountCode - Discount code to apply
   * @param {number} cartTotal - Current cart total
   * @param {Array} cartItems - Cart items
   * @param {string} customerId - Optional customer ID
   * @param {string} cartId - Optional cart ID
   * @returns {Promise<Object>} - Result of discount application
   */
  async applyDiscountToCart(discountCode, cartTotal, cartItems = [], customerId = null, cartId = null) {
    try {
      const response = await fetch(`${this.apiUrl}/api/cart/apply-discount`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          discountCode,
          cartTotal,
          cartItems,
          customerId,
          cartId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to apply discount');
      }

      return data;
    } catch (error) {
      console.error('Error applying discount:', error);
      throw error;
    }
  }

  /**
   * Apply discount code using Shopify Cart API
   * @param {string} discountCode - Discount code to apply
   * @returns {Promise<Object>} - Updated cart
   */
  async applyDiscountCodeToShopifyCart(discountCode) {
    try {
      // Update cart with discount code
      const response = await fetch('/cart/update.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attributes: {
            discount_code: discountCode,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update cart');
      }

      const cart = await response.json();

      // Update checkout URL with discount code
      const checkoutUrl = new URL(cart.checkout_url || '/checkout');
      checkoutUrl.searchParams.set('discount', discountCode);

      return {
        success: true,
        cart,
        checkoutUrl: checkoutUrl.toString(),
      };
    } catch (error) {
      console.error('Error applying discount to Shopify cart:', error);
      throw error;
    }
  }

  /**
   * Display discount notification in UI
   * @param {Object} discount - Discount object
   * @param {Function} onApply - Callback when discount is applied
   */
  displayNotification(discount, onApply) {
    if (!this.showNotification || !discount) return;

    const container = this.notificationContainer || this.createNotificationContainer();

    const notification = document.createElement('div');
    notification.className = 'discount-notification';
    notification.innerHTML = `
      <div class="discount-notification__content">
        <div class="discount-notification__icon">🎉</div>
        <div class="discount-notification__text">
          <strong>Special Discount Available!</strong>
          <p>Save ${discount.type === 'percentage' ? discount.value + '%' : '$' + discount.value} with code: <strong>${discount.code}</strong></p>
        </div>
        <button class="discount-notification__button" data-discount-code="${discount.code}">
          Apply Discount
        </button>
      </div>
    `;

    // Add styles
    this.injectStyles();

    // Add event listener
    const button = notification.querySelector('.discount-notification__button');
    button.addEventListener('click', async () => {
      button.disabled = true;
      button.textContent = 'Applying...';

      try {
        await onApply(discount.code);
        button.textContent = '✓ Applied!';
        button.classList.add('discount-notification__button--success');

        // Auto-hide after 3 seconds
        setTimeout(() => {
          notification.style.opacity = '0';
          setTimeout(() => notification.remove(), 300);
        }, 3000);
      } catch (error) {
        button.textContent = 'Failed - Try Again';
        button.disabled = false;
        console.error('Failed to apply discount:', error);
      }
    });

    container.appendChild(notification);
  }

  /**
   * Create notification container if not exists
   */
  createNotificationContainer() {
    let container = document.getElementById('discount-notifications');
    if (!container) {
      container = document.createElement('div');
      container.id = 'discount-notifications';
      container.className = 'discount-notifications-container';
      document.body.appendChild(container);
    }
    return container;
  }

  /**
   * Inject CSS styles for notifications
   */
  injectStyles() {
    if (document.getElementById('discount-notification-styles')) return;

    const style = document.createElement('style');
    style.id = 'discount-notification-styles';
    style.textContent = `
      .discount-notifications-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        max-width: 400px;
      }

      .discount-notification {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 10px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        animation: slideIn 0.3s ease-out;
        transition: opacity 0.3s ease;
      }

      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      .discount-notification__content {
        display: flex;
        align-items: center;
        gap: 15px;
      }

      .discount-notification__icon {
        font-size: 32px;
        flex-shrink: 0;
      }

      .discount-notification__text {
        flex: 1;
      }

      .discount-notification__text strong {
        display: block;
        margin-bottom: 5px;
        font-size: 16px;
      }

      .discount-notification__text p {
        margin: 0;
        font-size: 14px;
        opacity: 0.95;
      }

      .discount-notification__button {
        background: white;
        color: #667eea;
        border: none;
        border-radius: 8px;
        padding: 10px 20px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
      }

      .discount-notification__button:hover:not(:disabled) {
        transform: scale(1.05);
        box-shadow: 0 2px 10px rgba(255, 255, 255, 0.3);
      }

      .discount-notification__button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      .discount-notification__button--success {
        background: #10b981;
        color: white;
      }

      @media (max-width: 768px) {
        .discount-notifications-container {
          top: 10px;
          right: 10px;
          left: 10px;
          max-width: none;
        }

        .discount-notification__content {
          flex-direction: column;
          text-align: center;
        }

        .discount-notification__button {
          width: 100%;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Initialize discount checking for current cart
   */
  async init() {
    try {
      // Fetch current cart from Shopify
      const cartResponse = await fetch('/cart.js');
      const cart = await cartResponse.json();

      if (cart.items.length === 0) return;

      // Transform cart items to expected format
      const cartLines = cart.items.map(item => ({
        id: `gid://shopify/CartLine/${item.id}`,
        quantity: item.quantity,
        merchandiseId: `gid://shopify/ProductVariant/${item.variant_id}`,
        price: (item.price / 100).toString(),
      }));

      // Fetch available discount
      const discount = await this.fetchAvailableDiscount(cartLines);

      if (!discount) return;

      // Display notification
      this.displayNotification(discount, async (code) => {
        // Apply to our API first
        await this.applyDiscountToCart(
          code,
          cart.total_price / 100,
          cart.items,
          null,
          cart.token
        );

        // Apply to Shopify cart
        const result = await this.applyDiscountCodeToShopifyCart(code);

        // Redirect to checkout with discount
        if (result.checkoutUrl) {
          window.location.href = result.checkoutUrl;
        }
      });

      // Auto-apply if enabled
      if (this.autoApply && discount) {
        const result = await this.applyDiscountCodeToShopifyCart(discount.code);
        console.log('Discount auto-applied:', discount.code);
      }
    } catch (error) {
      console.error('Error initializing discount notification:', error);
    }
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DiscountNotificationClient;
}

// Global instance for easy access
window.DiscountNotificationClient = DiscountNotificationClient;

// Auto-initialize if data attribute is present
document.addEventListener('DOMContentLoaded', () => {
  const autoInit = document.querySelector('[data-discount-notification-auto-init]');
  if (autoInit) {
    const config = {
      autoApply: autoInit.dataset.autoApply === 'true',
      showNotification: autoInit.dataset.showNotification !== 'false',
    };
    const client = new DiscountNotificationClient(config);
    client.init();
  }
});
