# Cart Function Deployment Guide

## Overview
This guide explains how to deploy and test the Product Discount Shopify Function, which automatically applies discounts in the customer's cart at checkout.

---

## Architecture

### How It Works

```
Customer adds product to cart
         ↓
Shopify evaluates cart
         ↓
Calls product-discount-function
         ↓
Function reads configuration from metafield
         ↓
Checks if products in cart have discounts
         ↓
Applies discount to qualifying line items
         ↓
Customer sees discounted price in cart
```

### Components

1. **Function Code** (`extensions/product-discount-function/`)
   - `src/run.js` - Main function logic
   - `src/run.graphql` - Input query definition
   - `shopify.extension.toml` - Function configuration

2. **Backend Utilities** (`app/utils/discount-function.server.js`)
   - Create automatic discounts
   - Update discount configuration
   - Sync all discounts to Shopify

3. **API Endpoint** (`app/routes/api.sync-discounts.jsx`)
   - POST endpoint to activate discounts
   - Syncs database discounts to Shopify Functions

4. **Admin UI** (`app/routes/app.discounts.jsx`)
   - "Activate in Cart" button
   - Triggers discount synchronization

---

## Deployment Steps

### 1. Prerequisites

Ensure you have:
- Shopify CLI installed
- App deployed to a Shopify development store
- Access to Shopify Partner Dashboard

### 2. Update App Scopes

Add required scopes to `shopify.app.toml`:

```toml
[access_scopes]
scopes = "write_products,write_discounts"
```

### 3. Deploy the Function

```bash
# Navigate to your project
cd /home/cedcoss/data/13\ nov/product-discount

# Deploy the app including the function
npm run deploy
```

Or deploy just the function:

```bash
# Deploy function extension
npx shopify app function deploy
```

### 4. Get Function ID

After deployment, get your function ID:

```bash
npx shopify app function list
```

This will output something like:
```
└─ product-discount-function
   └─ ID: 01234567-89ab-cdef-0123-456789abcdef
```

### 5. Set Environment Variable

Add the function ID to your environment:

```bash
# In your .env file
SHOPIFY_DISCOUNT_FUNCTION_ID=01234567-89ab-cdef-0123-456789abcdef
```

Or set it in your deployment platform (Heroku, Vercel, etc.).

### 6. Restart Your App

Restart the app to load the new environment variable:

```bash
npm run dev
```

---

## Activating Discounts

### Via Admin UI (Recommended)

1. Go to your app's discount management page
2. Create discounts as needed
3. Click the **"Activate in Cart"** button
4. See success message: "Discounts activated in cart!"

### Via API

```bash
curl -X POST https://your-app-url/api/sync-discounts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### What Happens During Activation

1. Fetches all discounts from database
2. For each discount:
   - Creates Shopify automatic discount
   - Attaches function configuration as metafield
   - Links to your deployed function
3. Returns summary of created/updated discounts

---

## Testing

### Test Scenario 1: Single Product Discount

**Setup:**
1. Create discount: "Summer Sale" - 20% off
2. Assign to Product A (ID: 123)
3. Click "Activate in Cart"

**Test:**
1. Add Product A to cart
2. Go to cart/checkout
3. ✅ **Expected:** 20% discount appears
4. Remove Product A
5. ✅ **Expected:** Discount disappears

### Test Scenario 2: Multiple Products

**Setup:**
1. Create discount: "Multi-Buy Deal" - $10 off
2. Assign to Products A, B, C
3. Activate

**Test:**
1. Add Product A to cart
2. ✅ Discount appears
3. Add Product B to cart
4. ✅ Both have $10 off
5. Add Product D (not in discount)
6. ✅ Product D has no discount
7. Remove all products
8. ✅ All discounts disappear

### Test Scenario 3: Best Discount Selection

**Setup:**
1. Discount A: 20% off Product X
2. Discount B: 15% off Product X
3. Activate both

**Test:**
1. Add Product X to cart
2. ✅ **Expected:** 20% discount applies (higher value)

### Test Scenario 4: Fixed vs Percentage

**Setup:**
1. Product X: $50
2. Discount A: 20% off ($10 discount)
3. Discount B: $15 off
4. Activate both

**Test:**
1. Add Product X to cart
2. ✅ **Expected:** $15 discount applies (higher value)

---

## Verification

### Check in Shopify Admin

1. Go to Shopify Admin → Discounts
2. You should see automatic discounts created
3. Names match your discount names
4. Status: ACTIVE
5. Type: Automatic

### Check Function Logs

```bash
# View function logs
npx shopify app function logs --tail
```

Add products to cart and watch for:
- Function execution
- Input data received
- Discounts applied
- Any errors

### Debug Mode

Enable debug logging in `run.js`:

```javascript
export function run(input) {
  console.log('Function input:', JSON.stringify(input, null, 2));

  // ... rest of function

  console.log('Discounts applied:', discounts.length);
  return { discounts };
}
```

---

## Common Issues

### Issue: "Function not found"

**Cause:** Function ID not set or incorrect

**Solution:**
1. Get function ID: `npx shopify app function list`
2. Set in .env: `SHOPIFY_DISCOUNT_FUNCTION_ID=...`
3. Restart app

### Issue: "Discounts not applying"

**Causes:**
1. Function not activated
2. Products not assigned to discount
3. Function has errors

**Solutions:**
1. Click "Activate in Cart" in admin
2. Verify product IDs in database
3. Check function logs for errors

### Issue: "Wrong discount amount"

**Cause:** Calculation error in function

**Check:**
1. Review `calculateDiscountAmount()` in run.js
2. Verify discount type (percentage vs fixed)
3. Check product prices in cart

### Issue: "Multiple discounts stacking"

**Cause:** combinesWith settings

**Solution:**
Update function configuration in `discount-function.server.js`:

```javascript
combinesWith: {
  productDiscounts: false,  // Don't combine with other discounts
  orderDiscounts: false,
  shippingDiscounts: false,
}
```

---

## Cart Display

### What Customers See

**Before Discount:**
```
Product A x 1        $50.00
Subtotal:            $50.00
```

**After Discount (20%):**
```
Product A x 1        $50.00
  - Summer Sale      -$10.00
Subtotal:            $40.00
```

The discount appears as a line item with your discount name.

---

## Performance

### Execution Time
- Function runs in < 100ms
- Evaluated on every cart update
- Cached by Shopify for performance

### Limits
- Max 100 cart lines supported
- Max 100 discounts per function configuration
- Function timeout: 5 seconds (plenty for this use case)

---

## Monitoring

### Metrics to Track

1. **Function Executions**
   - How many times function runs
   - Check Shopify Partner Dashboard

2. **Success Rate**
   - % of successful executions
   - Monitor for errors

3. **Discount Usage**
   - How often discounts apply
   - Track in Shopify Analytics

4. **Revenue Impact**
   - Total discount amount given
   - Average order value with/without discounts

---

## Updating Discounts

### To Update Discount Configuration

1. Update discount in admin UI
2. Click "Activate in Cart" again
3. Function configuration updates automatically

### To Add New Products

1. Edit discount
2. Add product IDs
3. Save
4. Click "Activate in Cart"
5. New products now have discount

### To Disable Discount

Option 1: Delete from admin UI
- Discount removed from database
- Function still runs but discount not applied

Option 2: Deactivate in Shopify Admin
- Go to Shopify Admin → Discounts
- Find your automatic discount
- Click "Deactivate"

---

## Advanced Configuration

### Custom Discount Logic

Edit `src/run.js` to add custom logic:

```javascript
// Example: Minimum quantity requirement
if (line.quantity < 2) {
  continue; // Skip if less than 2 items
}

// Example: Minimum purchase amount
const lineTotal = variantPrice * line.quantity;
if (lineTotal < 100) {
  continue; // Skip if line total under $100
}

// Example: Date-based discounts
const now = new Date();
const startDate = new Date('2024-12-01');
const endDate = new Date('2024-12-31');
if (now < startDate || now > endDate) {
  continue; // Skip if outside date range
}
```

### Multiple Discount Rules

Configure different discount types:

```javascript
const discountConfig = {
  discounts: [
    {
      id: "1",
      name: "Summer Sale",
      type: "percentage",
      value: 20,
      productIds: ["123", "456"],
      minQuantity: 1,
    },
    {
      id: "2",
      name: "Bulk Discount",
      type: "percentage",
      value: 30,
      productIds: ["123", "456"],
      minQuantity: 5, // 30% off when buying 5+
    },
  ],
};
```

---

## Rollback

If issues occur, rollback:

### Option 1: Disable All Discounts

```bash
# Call API to delete all function discounts
curl -X POST https://your-app-url/api/deactivate-discounts
```

### Option 2: Manual Deletion

1. Go to Shopify Admin → Discounts
2. Delete automatic discounts created by app
3. Function still deployed but won't apply discounts

### Option 3: Deploy Previous Version

```bash
# Checkout previous commit
git checkout previous-commit-hash

# Redeploy
npm run deploy
```

---

## Best Practices

1. **Test in Development First**
   - Always test on development store
   - Verify calculations are correct
   - Check edge cases

2. **Clear Discount Names**
   - Use descriptive names
   - Customers see these in cart
   - Example: "Holiday Sale 20% Off"

3. **Monitor Function Logs**
   - Check for errors regularly
   - Set up alerts for failures
   - Review performance metrics

4. **Backup Before Major Changes**
   - Export discounts from database
   - Document current configuration
   - Keep rollback plan ready

5. **Communicate with Customers**
   - Show discount in product pages (theme extension)
   - Clear messaging about automatic application
   - FAQ about how discounts work

---

## Troubleshooting Checklist

- [ ] Function deployed successfully
- [ ] Function ID set in environment variables
- [ ] App restarted after setting env var
- [ ] Required scopes granted (write_discounts)
- [ ] Discounts exist in database
- [ ] "Activate in Cart" clicked
- [ ] Automatic discounts visible in Shopify Admin
- [ ] Product IDs correct in discount configuration
- [ ] Function logs show successful execution
- [ ] Test cart has qualifying products
- [ ] No JavaScript errors in console

---

## Support

For issues:
1. Check function logs: `npx shopify app function logs`
2. Review Shopify Admin → Discounts
3. Verify environment variables are set
4. Test API endpoint directly
5. Check database for discount records

---

## Next Steps

After successful deployment:
1. Monitor discount performance
2. Gather customer feedback
3. Analyze sales impact
4. Iterate on discount strategy
5. Consider A/B testing different discount values

---

**Status:** Ready for Deployment
**Last Updated:** 2025-11-13
