# Cart Function Testing Checklist

## Quick Test Guide

Use this checklist to verify your cart function is working correctly.

---

## ✅ Pre-Testing Setup

- [ ] Function deployed: `npm run deploy`
- [ ] Function ID added to `.env`
- [ ] App restarted
- [ ] At least one discount created in admin
- [ ] "Activate in Cart" button clicked
- [ ] Automatic discount visible in Shopify Admin → Discounts

---

## ✅ Test 1: Single Product Discount

**Setup:**
```
Discount: "Test 20% Off"
Type: Percentage
Value: 20
Product: Product A (ID: 123)
```

**Steps:**
1. [ ] Go to storefront
2. [ ] Add Product A to cart
3. [ ] View cart
4. [ ] **Verify:** Discount line appears: "Test 20% Off -$XX.XX"
5. [ ] **Verify:** Price reduced by 20%
6. [ ] Remove product from cart
7. [ ] **Verify:** Discount disappears

**Expected Result:**
```
Product A x 1        $50.00
  - Test 20% Off    -$10.00
Subtotal:            $40.00
```

---

## ✅ Test 2: Fixed Amount Discount

**Setup:**
```
Discount: "$15 Off Special"
Type: Fixed
Value: 15
Product: Product B (ID: 456)
```

**Steps:**
1. [ ] Add Product B to cart ($50 product)
2. [ ] **Verify:** Shows "-$15.00" discount
3. [ ] **Verify:** Final price is $35.00
4. [ ] Add 2x Product B
5. [ ] **Verify:** Each item gets $15 off
6. [ ] **Verify:** Total discount = $30.00

**Expected Result:**
```
Product B x 2         $100.00
  - $15 Off Special    -$30.00
Subtotal:              $70.00
```

---

## ✅ Test 3: Multiple Products

**Setup:**
```
Discount: "Multi-Product Sale"
Type: Percentage
Value: 25
Products: A, B, C
```

**Steps:**
1. [ ] Add Product A to cart
2. [ ] **Verify:** 25% discount applied
3. [ ] Add Product B
4. [ ] **Verify:** Both have 25% discount
5. [ ] Add Product D (not in discount list)
6. [ ] **Verify:** Product D has NO discount
7. [ ] **Verify:** A and B still have discount

**Expected Result:**
```
Product A x 1              $50.00
  - Multi-Product Sale    -$12.50
Product B x 1              $30.00
  - Multi-Product Sale     -$7.50
Product D x 1              $40.00
Subtotal:                 $100.00
```

---

## ✅ Test 4: Best Discount Wins

**Setup:**
```
Discount 1: "Summer Sale" - 15% off Product A
Discount 2: "Flash Deal" - 25% off Product A
```

**Steps:**
1. [ ] Activate both discounts
2. [ ] Add Product A to cart
3. [ ] **Verify:** Only "Flash Deal" (25%) appears
4. [ ] **Verify:** "Summer Sale" (15%) does NOT appear
5. [ ] **Verify:** Discount amount matches 25%

**Expected:** Higher discount automatically selected

---

## ✅ Test 5: Discount Persistence

**Steps:**
1. [ ] Add discounted product to cart
2. [ ] Leave site (close tab)
3. [ ] Return to site
4. [ ] Open cart
5. [ ] **Verify:** Discount still applied
6. [ ] Proceed to checkout
7. [ ] **Verify:** Discount shows in checkout summary

---

## ✅ Test 6: Quantity Changes

**Setup:**
```
Discount: "10% Off"
Product: Product A ($50)
```

**Steps:**
1. [ ] Add 1x Product A to cart
2. [ ] **Verify:** Discount = $5.00
3. [ ] Change quantity to 3
4. [ ] **Verify:** Discount = $15.00 (3 × $5)
5. [ ] Change quantity to 1
6. [ ] **Verify:** Discount = $5.00
7. [ ] Change quantity to 0 (remove)
8. [ ] **Verify:** Discount disappears

---

## ✅ Test 7: Mixed Cart

**Setup:**
```
Products in cart:
- 2x Product A (20% discount)
- 1x Product B (no discount)
- 3x Product C ($10 off each)
```

**Steps:**
1. [ ] Add all products
2. [ ] **Verify:** Product A shows 20% off on both items
3. [ ] **Verify:** Product B shows no discount
4. [ ] **Verify:** Product C shows $10 off on each (total $30)
5. [ ] **Verify:** Subtotal = original - all discounts

---

## ✅ Test 8: Edge Cases

### Test 8a: Discount Greater Than Price
```
Product: $5 item
Discount: $10 fixed
```
- [ ] **Verify:** Discount capped at product price ($5 max)

### Test 8b: 100% Discount
```
Product: $50 item
Discount: 100% off
```
- [ ] **Verify:** Final price = $0.00
- [ ] **Verify:** Can still checkout

### Test 8c: Decimal Amounts
```
Product: $19.99
Discount: 15%
```
- [ ] **Verify:** Discount = $3.00 (rounded properly)
- [ ] **Verify:** Final price = $16.99

### Test 8d: Empty Cart
```
Cart: No items
```
- [ ] **Verify:** No errors
- [ ] **Verify:** No discount shown

---

## ✅ Test 9: Update Discount Mid-Session

**Steps:**
1. [ ] Add Product A to cart (10% discount active)
2. [ ] Note discount amount
3. [ ] Go to admin, change discount to 20%
4. [ ] Click "Activate in Cart"
5. [ ] Return to storefront cart
6. [ ] Refresh page
7. [ ] **Verify:** Discount updates to 20%

---

## ✅ Test 10: Remove and Re-add

**Steps:**
1. [ ] Add Product A to cart (discount applies)
2. [ ] Remove Product A
3. [ ] **Verify:** Discount gone
4. [ ] Re-add Product A
5. [ ] **Verify:** Discount reappears immediately

---

## ✅ Test 11: Different Browsers/Devices

Test on:
- [ ] Desktop Chrome
- [ ] Desktop Firefox
- [ ] Mobile Safari
- [ ] Mobile Chrome
- [ ] Incognito/Private mode

**Verify:** Discounts work consistently across all

---

## ✅ Test 12: Performance

**Steps:**
1. [ ] Add 10 different products to cart
2. [ ] Multiple have discounts
3. [ ] **Verify:** Cart loads quickly (< 2 seconds)
4. [ ] **Verify:** No lag when changing quantities
5. [ ] Check function logs for execution time
6. [ ] **Verify:** Function runs in < 100ms

---

## 🐛 Common Issues

### Issue: Discount Not Showing

**Check:**
- [ ] Product ID matches in discount configuration
- [ ] Discount is activated ("Activate in Cart" clicked)
- [ ] Automatic discount is ACTIVE in Shopify Admin
- [ ] Function is deployed
- [ ] Function ID is set in environment
- [ ] Browser console for errors
- [ ] Function logs for errors

### Issue: Wrong Discount Amount

**Check:**
- [ ] Discount type (percentage vs fixed)
- [ ] Discount value is correct
- [ ] Product price is correct
- [ ] Function calculation logic
- [ ] Currency settings

### Issue: Discount Disappears

**Check:**
- [ ] Automatic discount still active in Shopify
- [ ] Product still assigned to discount
- [ ] No errors in function logs
- [ ] Session not expired

---

## 📊 Testing Metrics

Track these during testing:

| Metric | Target | Actual |
|--------|--------|--------|
| Function execution time | < 100ms | ___ |
| Cart load time | < 2s | ___ |
| Discount accuracy | 100% | ___ |
| Error rate | 0% | ___ |
| Cross-browser compatibility | 100% | ___ |

---

## ✅ Final Verification

Before going live:

- [ ] All tests above passed
- [ ] Function logs show no errors
- [ ] Tested on multiple products
- [ ] Tested on multiple devices
- [ ] Tested edge cases
- [ ] Discount amounts are correct
- [ ] UI displays properly
- [ ] Performance is acceptable
- [ ] Backup/rollback plan in place
- [ ] Merchant trained on using system

---

## 📝 Test Results Template

```
Date: ___________
Tester: ___________
Environment: [ ] Dev [ ] Staging [ ] Production

Test 1: Single Product Discount
Status: [ ] Pass [ ] Fail
Notes: _______________________

Test 2: Fixed Amount Discount
Status: [ ] Pass [ ] Fail
Notes: _______________________

[Continue for all tests...]

Overall Result: [ ] Ready for Production [ ] Needs Fixes

Issues Found:
1. _______________________
2. _______________________
3. _______________________

Fixes Applied:
1. _______________________
2. _______________________
```

---

## 🚀 Production Deployment Checklist

Once all tests pass:

- [ ] Backup current database
- [ ] Deploy to production
- [ ] Set production environment variables
- [ ] Test with 1-2 products first
- [ ] Monitor function logs for 24 hours
- [ ] Check Shopify Analytics for discount usage
- [ ] Verify customer feedback
- [ ] Document any issues
- [ ] Train support team
- [ ] Announce to customers

---

**Happy Testing! 🎉**

Remember: It's better to find issues in testing than in production!
