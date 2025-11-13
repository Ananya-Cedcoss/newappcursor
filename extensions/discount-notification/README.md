# Discount Notification Extension

A comprehensive Shopify checkout extension that displays discount notifications to customers and automatically applies the best available discounts.

## Features

- 🎯 **Auto-Apply Discounts**: Automatically applies the best available discount to cart
- 🔔 **Smart Notifications**: Shows discount availability at checkout with clear call-to-action
- 💰 **Multi-Discount Support**: Handles percentage and fixed-amount discounts
- 🔒 **CORS Enabled**: Secure API with full CORS support
- 📊 **Usage Tracking**: Monitors discount usage and limits
- 🎨 **Customizable**: Configurable notification messages and behavior

## Installation

### 1. Install Dependencies

```bash
cd extensions/discount-notification
npm install
```

### 2. Deploy the Extension

```bash
npm run dev
# or for production
npm run build
```

### 3. Configure Settings

In your Shopify admin, navigate to:
1. Apps > [Your App] > Extensions
2. Click on "Discount Notification"
3. Configure the following settings:
   - **Show Notification**: Enable/disable discount notifications
   - **Discount Message**: Custom message to show customers
   - **Auto Apply Discount**: Automatically apply best discount

## API Endpoints

### Get Available Discounts

**Endpoint**: `POST /api/discounts/available`

**Request Body**:
```json
{
  "cartLines": [
    {
      "id": "gid://shopify/CartLine/1",
      "quantity": 2,
      "merchandiseId": "gid://shopify/ProductVariant/123",
      "price": "29.99"
    }
  ]
}
```

**Response**:
```json
{
  "discount": {
    "id": "discount-id",
    "code": "SAVE20",
    "type": "percentage",
    "value": 20,
    "description": "Save 20% on your order",
    "currency": "USD",
    "savings": 5.99
  }
}
```

### Apply Discount to Cart

**Endpoint**: `POST /api/cart/apply-discount`

**Request Body**:
```json
{
  "discountCode": "SAVE20",
  "cartTotal": 100.00,
  "cartItems": [...],
  "customerId": "customer-id",
  "cartId": "cart-id"
}
```

**Response**:
```json
{
  "success": true,
  "discount": {
    "code": "SAVE20",
    "type": "percentage",
    "value": 20,
    "description": "Save 20% on your order"
  },
  "discountAmount": 20.00,
  "originalTotal": 100.00,
  "finalTotal": 80.00,
  "savings": 20.00
}
```

## Discount Management UI

Access the discount management interface at: `/app/discounts`

### Creating a Discount

1. Navigate to "Discounts" in your app navigation
2. Click "Create New Discount"
3. Fill in the discount details:
   - **Code**: Unique discount code (e.g., SAVE20)
   - **Type**: Percentage or Fixed Amount
   - **Value**: Discount value (e.g., 20 for 20%)
   - **Description**: Customer-facing description
   - **Start/End Date**: Validity period
   - **Min Purchase**: Minimum cart value required
   - **Max Discount**: Maximum discount cap
   - **Usage Limit**: Maximum number of uses
   - **Priority**: Order preference for auto-apply

### Managing Discounts

- **Activate/Deactivate**: Toggle discount availability
- **Delete**: Remove discount permanently
- **View Usage**: Track how many times a discount has been used

## CORS Configuration

All API endpoints include the following CORS headers:

```javascript
{
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400"
}
```

For production, update the `Access-Control-Allow-Origin` header in:
- `app/routes/api.discounts.available.jsx`
- `app/routes/api.discounts.apply.jsx`
- `app/routes/api.cart.apply-discount.jsx`

## Database Schema

The extension uses the following Prisma models:

### Discount Model
```prisma
model Discount {
  id                 String
  code               String (unique)
  type               String (percentage/fixed)
  value              Float
  description        String?
  active             Boolean
  startDate          DateTime
  endDate            DateTime?
  minPurchaseAmount  Float?
  maxDiscountAmount  Float?
  usageLimit         Int?
  usageCount         Int
  priority           Int
  shop               String
  createdAt          DateTime
  updatedAt          DateTime
  usages             DiscountUsage[]
}
```

### DiscountUsage Model
```prisma
model DiscountUsage {
  id         String
  discountId String
  customerId String?
  cartId     String?
  appliedAt  DateTime
  orderValue Float?
}
```

## Testing

### Testing Discount Notifications

1. Add products to your test cart
2. Navigate to checkout
3. The extension will automatically:
   - Fetch available discounts
   - Display notification banner
   - Show apply button or auto-apply (if enabled)

### Testing Admin Interface

1. Log into your Shopify admin
2. Navigate to Apps > [Your App] > Discounts
3. Create test discounts with various configurations
4. Verify activation/deactivation works
5. Test usage limits and expiration

## Troubleshooting

### Discount Not Showing at Checkout

1. Verify discount is active in admin
2. Check start/end dates
3. Ensure cart meets minimum purchase requirements
4. Verify usage limit not exceeded

### CORS Errors

1. Check API endpoint CORS headers
2. Verify origin is allowed
3. Check browser console for specific errors

### API Errors

1. Check server logs for detailed error messages
2. Verify database connection
3. Ensure Prisma migrations are applied

## Migration

To apply the database schema changes:

```bash
# Note: Run from project root, not extension directory
npx prisma migrate dev --name add_discount_models
npx prisma generate
```

If you encounter network issues with Prisma, set:
```bash
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma migrate dev --name add_discount_models
```

## Required Shopify Scopes

Ensure your app has the following scopes in `shopify.app.toml`:

```toml
scopes = "write_products,read_discounts,write_discounts"
```

## Support

For issues or questions:
1. Check the console for error messages
2. Review API endpoint responses
3. Verify discount configuration in admin
4. Check database for discount records

## License

This extension is part of the Shopify app and follows the same license terms.
