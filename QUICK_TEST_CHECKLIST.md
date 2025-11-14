# Quick Checkout Flow Test Checklist

**Fast 5-Minute Test** - Print this and check off as you go!

---

## Setup (1 minute)

- [ ] Test discount created: "Test 20% Off"
- [ ] Assigned to Product A ($50)
- [ ] "Activate in Cart" clicked
- [ ] Expected discount: -$10.00
- [ ] Expected final: $40.00

---

## Stage 1: Product Page (30 seconds)

Go to: `/products/product-a`

**Quick Checks:**
- [ ] Discount block visible
- [ ] Shows "Save 20% today!"
- [ ] Shows "20% OFF"
- [ ] Shows "$50.00" → "$40.00"
- [ ] No errors in console

**PASS: ____  FAIL: ____**

---

## Stage 2: Cart (1 minute)

Add to cart, go to: `/cart`

**Quick Checks:**
- [ ] Product A: $50.00
- [ ] Discount line: "- Test 20% Off"
- [ ] Discount amount: -$10.00
- [ ] Subtotal: $40.00

**Test Quantity = 2:**
- [ ] Discount becomes: -$20.00
- [ ] Subtotal: $80.00

**Change back to 1:**
- [ ] Returns to: -$10.00 and $40.00

**PASS: ____  FAIL: ____**

---

## Stage 3: Checkout (2 minutes)

Click "Checkout"

**Contact Step:**
- [ ] Discount visible in summary
- [ ] Amount: -$10.00
- [ ] Subtotal: $40.00

**Shipping Step:**
- [ ] Discount still visible
- [ ] Amount unchanged
- [ ] Total = $40 + shipping + tax

**Payment Step:**
- [ ] Discount still visible
- [ ] Final total includes discount

**Quick Math Check:**
```
Product:   $50.00
Discount:  -$10.00
Subtotal:  $40.00
Shipping:  + shipping
Tax:       + tax
Total:     = _____ (verify on screen)
```

**PASS: ____  FAIL: ____**

---

## Stage 4: Order (1 minute)

Complete order (use test card: 4242 4242 4242 4242)

**Confirmation Page:**
- [ ] Discount shown
- [ ] Amount: -$10.00
- [ ] Total correct

**Shopify Admin (Orders):**
- [ ] Open order in admin
- [ ] Discount line item present
- [ ] Amount: -$10.00
- [ ] Financial summary correct

**PASS: ____  FAIL: ____**

---

## Overall Result

**Stages Passed: ____ / 4**

**READY FOR PRODUCTION:** [ ] YES [ ] NO

**If NO, main issues:**
1. _______________________________
2. _______________________________

---

## Emergency Troubleshooting

**Discount not in cart?**
→ Check: Shopify Admin → Discounts → Is it ACTIVE?

**Discount disappears in checkout?**
→ Re-click "Activate in Cart" button

**Wrong amount?**
→ Verify: Discount type and value correct?

**Not in order?**
→ Check function logs for errors

---

**Test completed by:** ________________

**Date:** ________________

**Environment:** [ ] Dev [ ] Staging [ ] Prod
