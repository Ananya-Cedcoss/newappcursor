# API Endpoints Documentation

## Overview
This document describes the API endpoints for the product discount management system.

## Authentication
All API endpoints require Shopify admin authentication. Requests must include valid Shopify session credentials.

---

## 1. `/api/discounts` - Discount Management

### GET - Fetch Discounts

**Fetch all discounts:**
```bash
GET /api/discounts
```

**Response:**
```json
{
  "success": true,
  "discounts": [
    {
      "id": "uuid",
      "name": "Summer Sale",
      "type": "percentage",
      "value": 20,
      "productIds": ["gid://shopify/Product/123", "gid://shopify/Product/456"],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

**Fetch specific discount:**
```bash
GET /api/discounts?id=uuid-here
```

**Response:**
```json
{
  "success": true,
  "discount": {
    "id": "uuid",
    "name": "Summer Sale",
    "type": "percentage",
    "value": 20,
    "productIds": ["gid://shopify/Product/123"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### POST - Create Discount

**Request:**
```bash
POST /api/discounts
Content-Type: application/json

{
  "name": "Winter Sale",
  "type": "percentage",
  "value": 15,
  "productIds": ["gid://shopify/Product/789"]
}
```

**Request Body:**
- `name` (string, required): Discount name
- `type` (string, required): "percentage" or "fixed"
- `value` (number, required): Discount value (percentage or fixed amount)
- `productIds` (array, required): Array of Shopify product IDs

**Response:**
```json
{
  "success": true,
  "message": "Discount created successfully",
  "discount": {
    "id": "uuid",
    "name": "Winter Sale",
    "type": "percentage",
    "value": 15,
    "productIds": ["gid://shopify/Product/789"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Status Codes:**
- `201`: Discount created successfully
- `400`: Invalid request (missing fields or invalid type)
- `500`: Server error

---

### PATCH - Update Discount

**Request:**
```bash
PATCH /api/discounts
Content-Type: application/json

{
  "id": "uuid-here",
  "name": "Updated Sale",
  "value": 25
}
```

**Request Body:**
- `id` (string, required): Discount ID to update
- Any fields to update: `name`, `type`, `value`, `productIds`

**Response:**
```json
{
  "success": true,
  "message": "Discount updated successfully",
  "discount": {
    "id": "uuid",
    "name": "Updated Sale",
    "type": "percentage",
    "value": 25,
    "productIds": ["gid://shopify/Product/789"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

**Status Codes:**
- `200`: Discount updated successfully
- `400`: Invalid request (missing ID or invalid type)
- `500`: Server error

---

### DELETE - Remove Discount

**Request:**
```bash
DELETE /api/discounts
Content-Type: application/json

{
  "id": "uuid-here"
}
```

**Request Body:**
- `id` (string, required): Discount ID to delete

**Response:**
```json
{
  "success": true,
  "message": "Discount deleted successfully"
}
```

**Status Codes:**
- `200`: Discount deleted successfully
- `400`: Missing discount ID
- `500`: Server error

---

## 2. `/api/apply-cart-discount` - Calculate Cart Discounts

### POST - Apply Discounts to Cart

Calculates applicable discounts for cart items and returns discounted totals.

**Request:**
```bash
POST /api/apply-cart-discount
Content-Type: application/json

{
  "items": [
    {
      "productId": "gid://shopify/Product/123",
      "quantity": 2,
      "price": 29.99
    },
    {
      "productId": "gid://shopify/Product/456",
      "quantity": 1,
      "price": 49.99
    }
  ]
}
```

**Request Body:**
- `items` (array, required): Array of cart items
  - `productId` (string, required): Shopify product GID
  - `quantity` (number, required): Item quantity
  - `price` (number, required): Item price

**Response:**
```json
{
  "success": true,
  "cart": {
    "items": [
      {
        "productId": "gid://shopify/Product/123",
        "quantity": 2,
        "price": 29.99,
        "lineTotal": 59.98,
        "discount": {
          "id": "discount-uuid",
          "name": "Summer Sale",
          "type": "percentage",
          "value": 20,
          "amountPerItem": 6.00,
          "totalAmount": 12.00
        },
        "discountedPrice": 23.99,
        "lineFinalPrice": 47.98
      },
      {
        "productId": "gid://shopify/Product/456",
        "quantity": 1,
        "price": 49.99,
        "lineTotal": 49.99,
        "discount": null,
        "discountedPrice": 49.99,
        "lineFinalPrice": 49.99
      }
    ],
    "subtotal": 109.97,
    "totalDiscount": 12.00,
    "total": 97.97,
    "discountsApplied": 1
  }
}
```

**Response Fields:**
- `items`: Array of processed cart items
  - `lineTotal`: Price × quantity (before discount)
  - `discount`: Applied discount details (null if none)
  - `discountedPrice`: Price per item after discount
  - `lineFinalPrice`: Total for line item after discount
- `subtotal`: Cart subtotal before discounts
- `totalDiscount`: Total discount amount applied
- `total`: Final cart total after discounts
- `discountsApplied`: Number of items with discounts

**Discount Logic:**
- If multiple discounts apply to a product, the best (highest value) discount is used
- For percentage discounts: `discount = (price × percentage) / 100`
- For fixed discounts: `discount = fixed amount`
- Empty `productIds` array means discount applies to all products

**Status Codes:**
- `200`: Discounts calculated successfully
- `400`: Invalid request (missing or invalid items array)
- `500`: Server error

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error description",
  "message": "Detailed error message"
}
```

---

## Example Usage

### Create a percentage discount
```bash
curl -X POST https://your-app.com/api/discounts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Black Friday",
    "type": "percentage",
    "value": 30,
    "productIds": ["gid://shopify/Product/123"]
  }'
```

### Apply discounts to cart
```bash
curl -X POST https://your-app.com/api/apply-cart-discount \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "gid://shopify/Product/123",
        "quantity": 2,
        "price": 29.99
      }
    ]
  }'
```

### Update a discount
```bash
curl -X PATCH https://your-app.com/api/discounts \
  -H "Content-Type: application/json" \
  -d '{
    "id": "uuid-here",
    "value": 35
  }'
```

### Delete a discount
```bash
curl -X DELETE https://your-app.com/api/discounts \
  -H "Content-Type: application/json" \
  -d '{
    "id": "uuid-here"
  }'
```

---

## Notes

1. **Authentication**: All endpoints require Shopify admin authentication
2. **Product IDs**: Support both numeric IDs and Shopify GID format
3. **Discount Priority**: When multiple discounts apply, the highest value discount is used
4. **Validation**: Type must be either "percentage" or "fixed"
5. **Decimal Precision**: All monetary values are rounded to 2 decimal places
