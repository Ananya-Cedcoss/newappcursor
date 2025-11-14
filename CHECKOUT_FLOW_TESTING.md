# Checkout Flow Testing Guide

## Overview
This guide provides step-by-step instructions to verify discounts work correctly throughout the entire customer journey: Product Page → Cart → Checkout → Order Creation.

---

## 🎯 Testing Objectives

Verify discounts are:
- ✅ Visible on product pages (via theme extension)
- ✅ Applied in cart (via Shopify Function)
- ✅ Displayed in checkout (Shopify native)
- ✅ Recorded in order (Shopify order system)
- ✅ Consistent across all stages
- ✅ Properly calculated and formatted

---

## 📋 Pre-Testing Setup

### Prerequisites
- [ ] Function deployed and activated
- [ ] At least one test discount created
- [ ] "Activate in Cart" button clicked
- [ ] Theme extension installed on test theme
- [ ] Test products assigned to discount

### Test Environment Setup

**Test Discount Configuration:**
```
Name: "Test Flow 20% Off"
Type: Percentage
Value: 20
Product: Product A (ID: 123)
Product Price: $50.00
Expected Discount: $10.00
Expected Final Price: $40.00
```

---

## 🔍 Stage 1: Product Page

### What to Test

Verify the theme extension displays discount information before adding to cart.

### Expected Display

**Visual Elements:**
```
┌──────────────────────────────────────┐
│ Product A                            │
│ $50.00                               │
│                                      │
│ ┌────────────────────────────────┐  │
│ │ 🎉 Special Offer               │  │
│ │                                │  │
│ │ Test Flow 20% Off              │  │
│ │ Save 20% today!                │  │
│ │                                │  │
│ │      20% OFF                   │  │
│ │                                │  │
│ │ $50.00  $40.00  Save $10.00   │  │
│ │                                │  │
│ │ ✓ Discount applied             │  │
│ │   automatically at checkout    │  │
│ └────────────────────────────────┘  │
│                                      │
│ [ Add to Cart ]                      │
└──────────────────────────────────────┘
```

### Testing Steps

1. **Navigate to Product Page**
   ```
   https://your-store.myshopify.com/products/product-a
   ```

2. **Wait for Extension to Load**
   - [ ] See loading spinner briefly
   - [ ] Discount block appears (slides in)
   - [ ] No JavaScript errors in console

3. **Verify Discount Information**
   - [ ] Discount name: "Test Flow 20% Off" ✓
   - [ ] Discount badge: "🎉 Special Offer" ✓
   - [ ] Highlight message: "Save 20% today!" ✓
   - [ ] Discount amount: "20% OFF" ✓
   - [ ] Original price: "$50.00" (strikethrough) ✓
   - [ ] Discounted price: "$40.00" (prominent) ✓
   - [ ] Savings: "Save $10.00" ✓
   - [ ] Footer message: "✓ Discount applied automatically at checkout" ✓

4. **Check Visual Quality**
   - [ ] Gradient background visible
   - [ ] Text readable and properly aligned
   - [ ] Animations smooth (no jank)
   - [ ] Responsive on mobile

5. **Test with Non-Discounted Product**
   - Navigate to Product B (no discount)
   - [ ] Discount block hidden (not visible)
   - [ ] No errors in console

### Screenshot Checklist
- [ ] Full product page with discount visible
- [ ] Discount block close-up
- [ ] Mobile view
- [ ] Non-discounted product (block hidden)

---

## 🛒 Stage 2: Cart Page

### What to Test

Verify Shopify Function applies discount in cart with correct line items.

### Expected Display

**Cart with Discount:**
```
┌────────────────────────────────────────┐
│ Shopping Cart                          │
├────────────────────────────────────────┤
│ Product A x 1                          │
│ $50.00                                 │
│   - Test Flow 20% Off    -$10.00      │
│                                        │
├────────────────────────────────────────┤
│ Subtotal:                    $40.00    │
│                                        │
│ [ Checkout ]                           │
└────────────────────────────────────────┘
```

### Testing Steps

1. **Add Product to Cart**
   - From product page, click "Add to Cart"
   - [ ] Success message shown
   - [ ] Cart icon updates count

2. **Navigate to Cart**
   ```
   https://your-store.myshopify.com/cart
   ```

3. **Verify Discount Line Item**
   - [ ] Product A listed: "$50.00" ✓
   - [ ] Discount line appears below product ✓
   - [ ] Discount name: "Test Flow 20% Off" ✓
   - [ ] Discount amount: "-$10.00" ✓
   - [ ] Negative sign present ✓
   - [ ] Proper indentation/styling ✓

4. **Verify Subtotal Calculation**
   ```
   Product Price:     $50.00
   Discount:         -$10.00
   Expected Subtotal: $40.00
   ```
   - [ ] Subtotal shows: "$40.00" ✓
   - [ ] Matches expected calculation ✓

5. **Test Quantity Changes**

   **Change quantity to 2:**
   - [ ] Product total: "$100.00" ✓
   - [ ] Discount: "-$20.00" (2 × $10) ✓
   - [ ] Subtotal: "$80.00" ✓

   **Change quantity to 3:**
   - [ ] Product total: "$150.00" ✓
   - [ ] Discount: "-$30.00" (3 × $10) ✓
   - [ ] Subtotal: "$120.00" ✓

   **Change back to 1:**
   - [ ] Returns to: "$40.00" ✓

6. **Test Removal and Re-add**

   **Remove product:**
   - [ ] Click remove/delete
   - [ ] Product disappears ✓
   - [ ] Discount disappears ✓
   - [ ] Cart shows empty ✓

   **Re-add product:**
   - [ ] Navigate back to product page
   - [ ] Add to cart again
   - [ ] Discount reappears ✓
   - [ ] Amount correct ✓

7. **Test Mixed Cart**

   Add multiple products:
   - Product A (has discount): 1x
   - Product B (no discount): 1x

   Verify:
   - [ ] Product A has discount line ✓
   - [ ] Product B has NO discount line ✓
   - [ ] Subtotal = (A - discount) + B ✓

8. **Browser Refresh Test**
   - [ ] Refresh cart page
   - [ ] Discount still visible ✓
   - [ ] Amounts unchanged ✓
   - [ ] No flickering/reloading ✓

### API Verification

Open browser console and check:

```javascript
// Check cart API
fetch('/cart.js')
  .then(r => r.json())
  .then(cart => {
    console.log('Cart:', cart);
    console.log('Line items:', cart.items);
    console.log('Total:', cart.total_price);
  });
```

Verify response includes discount information.

### Screenshot Checklist
- [ ] Cart with single discounted product
- [ ] Cart with quantity 2 (double discount)
- [ ] Cart with mixed products (discounted + non-discounted)
- [ ] Empty cart after removal
- [ ] Mobile cart view

---

## 💳 Stage 3: Checkout Page

### What to Test

Verify discount carries through to Shopify's native checkout.

### Expected Display

**Checkout Summary:**
```
┌────────────────────────────────────────┐
│ Order Summary                          │
├────────────────────────────────────────┤
│ Product A x 1              $50.00      │
│   Discount: Test Flow 20% Off          │
│                           -$10.00      │
│                                        │
│ Subtotal:                  $40.00      │
│ Shipping:                   $5.00      │
│ Tax:                        $3.60      │
├────────────────────────────────────────┤
│ Total:                     $48.60      │
└────────────────────────────────────────┘
```

### Testing Steps

1. **Proceed to Checkout**
   - From cart, click "Checkout" button
   - [ ] Redirects to checkout page ✓
   - [ ] URL: `/checkouts/...` ✓

2. **Verify Order Summary (Right Sidebar)**

   **Product Line:**
   - [ ] Product A listed ✓
   - [ ] Quantity shown: "x 1" ✓
   - [ ] Original price: "$50.00" ✓

   **Discount Line:**
   - [ ] Discount appears below product ✓
   - [ ] Label: "Discount: Test Flow 20% Off" ✓
   - [ ] Amount: "-$10.00" ✓
   - [ ] Negative formatting ✓

3. **Verify Price Calculations**

   ```
   Product:    $50.00
   Discount:   -$10.00
   ─────────────────
   Subtotal:   $40.00
   Shipping:   + $5.00
   Tax:        + $3.60 (9% of $40.00)
   ─────────────────
   Total:      $48.60
   ```

   - [ ] Subtotal correct: "$40.00" ✓
   - [ ] Tax calculated on discounted amount ✓
   - [ ] Total includes shipping + tax ✓
   - [ ] All decimals correct ✓

4. **Test Throughout Checkout Steps**

   **Step 1: Contact Information**
   - [ ] Enter email
   - [ ] Discount still visible in summary ✓
   - [ ] Amount unchanged ✓
   - [ ] Click "Continue to shipping"

   **Step 2: Shipping Method**
   - [ ] Select shipping option
   - [ ] Discount still visible ✓
   - [ ] Shipping added to total ✓
   - [ ] Click "Continue to payment"

   **Step 3: Payment**
   - [ ] Discount still visible ✓
   - [ ] Final total correct ✓
   - [ ] All amounts match previous screens ✓

5. **Test Browser Back Button**
   - [ ] Click browser back from checkout
   - [ ] Return to cart
   - [ ] Discount still there ✓
   - [ ] Forward to checkout again
   - [ ] Discount persists ✓

6. **Test Different Shipping Options**
   - [ ] Choose standard shipping ($5.00)
   - [ ] Total: $48.60 ✓
   - [ ] Change to express ($10.00)
   - [ ] Discount amount unchanged: -$10.00 ✓
   - [ ] New total: $53.60 ✓

7. **Mobile Checkout Test**
   - [ ] Open checkout on mobile device
   - [ ] Discount visible in collapsed summary ✓
   - [ ] Expand order summary
   - [ ] Discount details visible ✓
   - [ ] Tap through all steps
   - [ ] Discount persists ✓

### Important Checks

**Do NOT see:**
- ❌ Discount disappearing at any step
- ❌ Discount amount changing unexpectedly
- ❌ Multiple discounts stacking (unless intended)
- ❌ Tax calculated on pre-discount price
- ❌ Checkout errors or warnings

**DO see:**
- ✅ Consistent discount name throughout
- ✅ Consistent discount amount
- ✅ Discount clearly separated from product price
- ✅ Proper negative formatting (-$10.00)
- ✅ Tax calculated AFTER discount

### Screenshot Checklist
- [ ] Checkout summary (order details sidebar)
- [ ] Contact information step
- [ ] Shipping method step
- [ ] Payment method step
- [ ] Mobile checkout view
- [ ] Expanded order summary on mobile

---

## 📦 Stage 4: Order Creation

### What to Test

Verify discount is properly recorded in the created order.

### Testing Steps

1. **Complete Test Order**

   Use Shopify's test mode:
   - [ ] Use test credit card: `4242 4242 4242 4242`
   - [ ] Any future expiry date
   - [ ] Any 3-digit CVV
   - [ ] Any postal code
   - [ ] Click "Complete Order"

2. **Verify Order Confirmation Page**

   **Order Summary Display:**
   ```
   ┌────────────────────────────────────────┐
   │ Thank you for your order!              │
   │ Order #1001                            │
   ├────────────────────────────────────────┤
   │ Product A x 1              $50.00      │
   │   Discount: Test Flow 20% Off          │
   │                           -$10.00      │
   │                                        │
   │ Subtotal:                  $40.00      │
   │ Shipping:                   $5.00      │
   │ Tax:                        $3.60      │
   │ Total:                     $48.60      │
   └────────────────────────────────────────┘
   ```

   Verify:
   - [ ] Order number assigned ✓
   - [ ] Product listed with original price ✓
   - [ ] Discount line item present ✓
   - [ ] Discount name correct ✓
   - [ ] Discount amount: "-$10.00" ✓
   - [ ] All totals match checkout ✓

3. **Check Order Confirmation Email**

   - [ ] Email received (check test email)
   - [ ] Order number matches ✓
   - [ ] Product listed ✓
   - [ ] Discount shown in email ✓
   - [ ] Discount amount: "-$10.00" ✓
   - [ ] Total matches: "$48.60" ✓

4. **Verify in Shopify Admin**

   **Navigate to:** Shopify Admin → Orders → [Your Order]

   **Order Details Page:**
   - [ ] Order status: Paid/Pending ✓
   - [ ] Customer information correct ✓

   **Line Items Section:**
   ```
   Product A × 1             $50.00
   Test Flow 20% Off        -$10.00
   ```

   - [ ] Product line item: "$50.00" ✓
   - [ ] Discount line item: "-$10.00" ✓
   - [ ] Discount name visible ✓

   **Financial Summary:**
   - [ ] Subtotal: "$40.00" ✓
   - [ ] Discount: "-$10.00" (may be separate line) ✓
   - [ ] Shipping: "$5.00" ✓
   - [ ] Tax: "$3.60" ✓
   - [ ] Total: "$48.60" ✓
   - [ ] Paid: "$48.60" ✓

   **Timeline:**
   - [ ] Discount applied event logged ✓
   - [ ] Timestamp correct ✓

5. **Check Order JSON API**

   Via Admin API or GraphQL:
   ```graphql
   query {
     order(id: "gid://shopify/Order/1001") {
       name
       totalPrice
       subtotalPrice
       totalDiscounts
       discountApplications {
         allocationMethod
         targetSelection
         targetType
         value {
           ... on MoneyV2 {
             amount
           }
           ... on PricingPercentageValue {
             percentage
           }
         }
       }
       lineItems {
         title
         quantity
         originalTotalPrice
         discountedTotalPrice
       }
     }
   }
   ```

   Verify response:
   - [ ] `totalDiscounts`: "10.00" ✓
   - [ ] `discountApplications` array contains discount ✓
   - [ ] Discount value: 20% or $10 ✓
   - [ ] Line item `discountedTotalPrice`: "40.00" ✓

6. **Analytics Verification**

   **Shopify Admin → Analytics → Reports**

   - [ ] Order appears in sales reports ✓
   - [ ] Revenue recorded as $48.60 (final total) ✓
   - [ ] Discount tracked in discount reports ✓
   - [ ] Discount amount: $10.00 ✓

### Screenshot Checklist
- [ ] Order confirmation page
- [ ] Order confirmation email
- [ ] Shopify Admin order details
- [ ] Order line items with discount
- [ ] Financial summary in admin
- [ ] Timeline showing discount applied

---

## 🔄 Complete Flow Test Matrix

Test all combinations:

### Discount Type Tests

| Discount Type | Amount | Product Price | Expected Discount | Final Price | Status |
|---------------|--------|---------------|-------------------|-------------|--------|
| Percentage    | 20%    | $50.00        | -$10.00           | $40.00      | [ ]    |
| Percentage    | 50%    | $50.00        | -$25.00           | $25.00      | [ ]    |
| Percentage    | 100%   | $50.00        | -$50.00           | $0.00       | [ ]    |
| Fixed         | $10    | $50.00        | -$10.00           | $40.00      | [ ]    |
| Fixed         | $5     | $50.00        | -$5.00            | $45.00      | [ ]    |
| Fixed         | $50    | $50.00        | -$50.00           | $0.00       | [ ]    |

### Quantity Tests

| Quantity | Unit Price | Unit Discount | Line Total | Line Discount | Final |
|----------|------------|---------------|------------|---------------|-------|
| 1        | $50.00     | -$10.00       | $50.00     | -$10.00       | $40.00 | [ ] |
| 2        | $50.00     | -$10.00       | $100.00    | -$20.00       | $80.00 | [ ] |
| 5        | $50.00     | -$10.00       | $250.00    | -$50.00       | $200.00 | [ ] |

### Multi-Product Tests

| Products in Cart | Discounts | Expected Behavior | Status |
|------------------|-----------|-------------------|--------|
| A (discounted)   | 20% off A | A has discount | [ ] |
| A, B (both discounted) | 20% off both | Both have discounts | [ ] |
| A (discounted), C (not) | 20% off A | Only A has discount | [ ] |
| A, B, C (mixed) | Various | Correct discounts applied | [ ] |

---

## 🐛 Common Issues to Watch For

### Issue 1: Discount Disappears in Checkout

**Symptoms:**
- Visible in cart
- Missing in checkout

**Causes:**
- Function not properly activated
- Automatic discount inactive in Shopify
- Configuration error

**Fix:**
1. Check Shopify Admin → Discounts
2. Ensure automatic discount is ACTIVE
3. Re-click "Activate in Cart" in app

### Issue 2: Wrong Tax Calculation

**Symptoms:**
- Tax calculated on pre-discount price
- Tax amount too high

**Expected:**
```
Product:  $50.00
Discount: -$10.00
Subtotal: $40.00  ← Tax calculated on this
Tax (9%): $3.60
Total:    $48.60
```

**If Wrong:**
```
Product:  $50.00
Tax (9%): $4.50   ← Calculated on $50!
Discount: -$10.00
Total:    $44.50  ← Wrong!
```

**Fix:**
- This is typically Shopify's responsibility
- Verify discount type is set correctly
- Check Shopify's discount configuration

### Issue 3: Discount Amount Changes

**Symptoms:**
- Cart shows -$10.00
- Checkout shows -$8.00 (different)

**Causes:**
- Multiple discounts conflicting
- Currency conversion issues
- Rounding errors

**Fix:**
- Review combinesWith settings
- Check for multiple automatic discounts
- Verify single currency

### Issue 4: Order Doesn't Record Discount

**Symptoms:**
- Checkout showed discount
- Order confirmation doesn't show it
- Admin shows full price paid

**Causes:**
- Order creation failed midway
- Function error during final calculation
- Shopify bug (rare)

**Fix:**
1. Check function logs during order creation
2. Verify no errors in console
3. Test with different payment method
4. Contact Shopify Support if persists

---

## ✅ Success Criteria

**Test passes if:**

### Product Page ✓
- Discount information visible and correct
- Loading smooth, no errors
- Styling looks professional

### Cart ✓
- Discount appears as separate line item
- Amount negative and correct
- Subtotal = original - discount
- Quantity changes update discount
- Remove/re-add works correctly

### Checkout ✓
- Discount persists through all steps
- Always visible in order summary
- Amount never changes unexpectedly
- Tax calculated on discounted amount
- Final total correct

### Order ✓
- Confirmation shows discount
- Email includes discount
- Admin order details show discount
- Financial summary correct
- Analytics track discount
- API returns discount data

### Consistency ✓
- Same discount name everywhere
- Same discount amount everywhere
- Calculations consistent
- No flickering or reloading
- No errors in console

---

## 📊 Test Results Template

```
Test Date: _______________
Tester: _______________
Environment: [ ] Development [ ] Staging [ ] Production

═══════════════════════════════════════

STAGE 1: PRODUCT PAGE
Status: [ ] Pass [ ] Fail
Issues: _______________________________

STAGE 2: CART PAGE
Status: [ ] Pass [ ] Fail
Subtotal Correct: [ ] Yes [ ] No
Quantity Tests: [ ] Pass [ ] Fail
Issues: _______________________________

STAGE 3: CHECKOUT
Status: [ ] Pass [ ] Fail
Discount Persists: [ ] Yes [ ] No
Tax Calculation: [ ] Correct [ ] Incorrect
Issues: _______________________________

STAGE 4: ORDER CREATION
Status: [ ] Pass [ ] Fail
Admin Shows Discount: [ ] Yes [ ] No
Email Shows Discount: [ ] Yes [ ] No
Analytics Updated: [ ] Yes [ ] No
Issues: _______________________________

═══════════════════════════════════════

OVERALL RESULT: [ ] PASS [ ] FAIL

Critical Issues Found:
1. _______________________________
2. _______________________________
3. _______________________________

Recommendations:
_______________________________
_______________________________
_______________________________

Sign-off: _______________
```

---

## 🚀 Quick Verification Script

Use this for rapid testing:

```javascript
// Paste in browser console

console.log('=== DISCOUNT VERIFICATION ===');

// 1. Check if on product page with discount
if (document.querySelector('.product-discount-block')) {
  console.log('✓ Product page discount visible');
} else {
  console.log('✗ Product page discount missing');
}

// 2. Check cart via API
fetch('/cart.js')
  .then(r => r.json())
  .then(cart => {
    console.log('Cart total:', cart.total_price / 100);
    console.log('Items:', cart.items.length);
    cart.items.forEach(item => {
      console.log(`- ${item.title}: $${item.price / 100}`);
    });
  });

// 3. Check if in checkout
if (window.location.href.includes('/checkouts/')) {
  console.log('✓ In checkout');
  // Look for discount in order summary
  const discounts = document.querySelectorAll('[data-discount], .discount');
  console.log(`Discounts visible: ${discounts.length}`);
}

console.log('=== END VERIFICATION ===');
```

---

## 📞 Support Escalation

If tests fail repeatedly:

1. **Review Function Logs**
   ```bash
   npx shopify app function logs --tail
   ```

2. **Check Shopify Status**
   - https://www.shopifystatus.com/
   - Verify no ongoing issues

3. **Review Recent Changes**
   - Any app updates?
   - Any theme changes?
   - Any Shopify admin changes?

4. **Contact Support**
   - Shopify Partner Support for function issues
   - Theme developer for display issues
   - App developer for backend issues

---

**Test thoroughly before going live!**

A smooth checkout experience = happy customers = more sales 🎉
