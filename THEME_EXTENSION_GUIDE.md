# Theme App Extension Integration Guide

Complete guide for integrating product discounts into your Shopify theme.

## Quick Start

### 1. Deploy the Extension

```bash
cd /home/cedcoss/data/13\ nov/product-discount
shopify app dev
```

This will:
- Start the development server
- Make the theme extension available in your development store
- Enable hot reloading for changes

### 2. Configure App Proxy (Optional)

If you want to use the app proxy fallback method:

1. Go to [Shopify Partner Dashboard](https://partners.shopify.com)
2. Select your app
3. Go to Configuration > App proxy
4. Set up:
   - **Subpath prefix:** `discount-proxy`
   - **Subpath:** `product-discount`
   - **Proxy URL:** Your app URL + `/app/proxy/product-discount`
     - Example: `https://your-app.fly.dev/app/proxy/product-discount`

### 3. Enable in Theme

#### Option A: Theme Editor (Recommended)
1. Go to **Online Store > Themes** in Shopify admin
2. Click **Customize** on your theme
3. Navigate to a product page
4. Click **Add block** or **Add section**
5. Under **Apps**, select **Product Discount**
6. Position and customize settings
7. Click **Save**

#### Option B: Manual Code Integration

**In your theme's `product.liquid` or `sections/product-template.liquid`:**

```liquid
<!-- Add this where you want the full discount display -->
{% render 'product-discount-block', product: product %}

<!-- OR use individual components: -->

<!-- Discount badge (near product image) -->
<div class="product__badges">
  {% render 'product-discount-badge', product: product %}
</div>

<!-- Discount price (replace default price) -->
<div class="product__price">
  {% render 'product-discount-price', product: product %}
</div>
```

## Integration Examples

### Example 1: Product Page - Complete Discount Info

**Location:** Above the "Add to Cart" button

```liquid
<div class="product">
  <div class="product__media">
    <!-- Product images -->
  </div>

  <div class="product__info">
    <h1 class="product__title">{{ product.title }}</h1>

    <!-- Add discount display here -->
    <div class="product__discount">
      {% render 'product-discount-price', product: product %}
    </div>

    <div class="product__description">
      {{ product.description }}
    </div>

    <form method="post" action="/cart/add">
      <!-- Add to cart form -->
    </form>
  </div>
</div>
```

### Example 2: Collection Grid - Discount Badges

**Location:** `snippets/product-card.liquid` or `sections/collection-template.liquid`

```liquid
<div class="product-card">
  <a href="{{ product.url }}" class="product-card__link">
    <div class="product-card__image-wrapper">
      {{ product.featured_image | image_url: width: 600 | image_tag }}

      <!-- Add discount badge as overlay -->
      <div class="product-card__badge">
        {% render 'product-discount-badge', product: product %}
      </div>
    </div>

    <div class="product-card__info">
      <h3 class="product-card__title">{{ product.title }}</h3>

      <!-- Show discount price -->
      <div class="product-card__price">
        {% render 'product-discount-price', product: product %}
      </div>
    </div>
  </a>
</div>
```

### Example 3: Featured Product Section

**Location:** Custom section file

```liquid
{% schema %}
{
  "name": "Featured Product with Discount",
  "settings": [
    {
      "type": "product",
      "id": "featured_product",
      "label": "Product"
    }
  ]
}
{% endschema %}

{% assign product = all_products[section.settings.featured_product] %}

<div class="featured-product">
  <div class="featured-product__content">
    <h2>{{ product.title }}</h2>

    <!-- Full discount block -->
    {% render 'product-discount-block', product: product %}

    <a href="{{ product.url }}" class="button">Shop Now</a>
  </div>
</div>
```

## How It Works

### Data Flow

1. **Admin creates discount** in the app (at `/app/discounts`)
2. **Discount is saved** to SQLite database
3. **Optional: Discount syncs to Shopify** as product metafields
4. **Storefront renders** discount using theme extension
5. **Data source** priority:
   - Primary: Product metafields (`custom.discount_info`)
   - Fallback: App proxy endpoint

### Metafield Structure

When "Sync to Shopify" is enabled, discount data is stored as:

```json
{
  "namespace": "custom",
  "key": "discount_info",
  "type": "json",
  "value": {
    "discountId": "abc-123-def",
    "name": "Summer Sale",
    "type": "percentage",
    "value": 20,
    "updatedAt": "2025-01-13T10:00:00Z"
  }
}
```

### Price Calculation Logic

**Percentage Discount:**
```liquid
{% assign discount_amount = original_price | times: discount_value | divided_by: 100.0 %}
{% assign discounted_price = original_price | minus: discount_amount %}
```

**Fixed Amount Discount:**
```liquid
{% assign discount_amount = discount_value | times: 100 %}
{% assign discounted_price = original_price | minus: discount_amount %}
```

## Customization

### CSS Customization

Add to your theme's CSS file:

```css
/* Customize discount block colors */
.product-discount-block {
  background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
  border-radius: 8px;
}

/* Customize badge style */
.discount-badge--percentage {
  background: #your-brand-color;
  color: white;
  font-weight: bold;
}

/* Customize price display */
.price--discounted {
  color: #e63946;
  font-size: 32px;
}
```

### Liquid Customization

**Custom Badge Text:**
```liquid
{% render 'product-discount-badge', product: product, badge_text: "Limited Offer" %}
```

**Hide Savings Amount:**
```liquid
{% render 'product-discount-price', product: product, show_savings: false %}
```

## Testing

### Test Checklist

- [ ] Create a discount in admin UI
- [ ] Select test products
- [ ] Enable "Sync to Shopify" checkbox
- [ ] Save discount
- [ ] Visit product page on storefront
- [ ] Verify discount displays correctly
- [ ] Test both percentage and fixed discounts
- [ ] Test on mobile devices
- [ ] Test with theme editor
- [ ] Test without metafields (app proxy fallback)

### Debug Tips

**Check if metafield exists:**
```liquid
{% if product.metafields.custom.discount_info %}
  <p>Metafield found: {{ product.metafields.custom.discount_info }}</p>
{% else %}
  <p>No metafield found</p>
{% endif %}
```

**Test app proxy endpoint:**
```
https://your-store.myshopify.com/apps/discount-proxy/product-discount?productId=gid://shopify/Product/123456
```

## Common Issues & Solutions

### Issue: Discount not showing

**Solutions:**
1. Verify discount is created in admin
2. Check products are selected for discount
3. Ensure "Sync to Shopify" was enabled
4. Refresh product page (metafields may take a moment to update)
5. Check browser console for errors

### Issue: Prices not calculating correctly

**Solutions:**
1. Verify discount type (percentage vs fixed)
2. Check discount value is correct
3. Ensure variant price is being used
4. Look for Liquid errors in theme console

### Issue: Styling doesn't match theme

**Solutions:**
1. Override CSS in your theme
2. Use theme's existing classes
3. Adjust colors in theme editor settings
4. Check for CSS conflicts

### Issue: App proxy 404 error

**Solutions:**
1. Verify proxy configuration in Partner Dashboard
2. Check subpath and prefix match exactly
3. Ensure app is deployed and accessible
4. Test proxy URL directly in browser

## Performance Optimization

### Best Practices

1. **Use metafields** instead of app proxy when possible
2. **Cache app proxy responses** (5 minutes default)
3. **Lazy load** discount block on collection pages
4. **Minimize HTTP requests** by using metafields
5. **Optimize CSS** - only load on pages that need it

### Metafield Benefits
- ✅ No HTTP requests required
- ✅ Faster page load times
- ✅ Works offline in theme editor
- ✅ Cached with product data
- ✅ No rate limiting concerns

## Multi-language Support

The extension includes localization files. To add more languages:

1. Create `locales/{language-code}.json`:
```json
{
  "product_discount": {
    "labels": {
      "you_save": "Vous économisez",
      "off": "DE RÉDUCTION"
    }
  }
}
```

2. Use in Liquid:
```liquid
{{ 'product_discount.labels.you_save' | t }}
```

## Going Live

### Pre-launch Checklist

- [ ] Test on all product types
- [ ] Test on mobile devices
- [ ] Verify pricing calculations
- [ ] Test with different themes
- [ ] Check page load performance
- [ ] Verify app proxy is configured
- [ ] Test discount creation/editing
- [ ] Test discount deletion
- [ ] Review analytics tracking
- [ ] Train staff on using admin UI

### Deployment

```bash
# Deploy app
shopify app deploy

# The theme extension will be available to all stores that install your app
```

## Support Resources

- [Shopify Theme App Extensions Docs](https://shopify.dev/docs/apps/online-store/theme-app-extensions)
- [Liquid Reference](https://shopify.dev/docs/api/liquid)
- [Metafields Guide](https://shopify.dev/docs/apps/custom-data/metafields)
- [App Proxy Documentation](https://shopify.dev/docs/apps/online-store/app-proxies)

## Next Steps

1. **Test thoroughly** in development store
2. **Customize styling** to match brand
3. **Add analytics** tracking for discount performance
4. **Consider A/B testing** different discount displays
5. **Gather merchant feedback** and iterate

---

**Need Help?** Check the extension README at `extensions/product-discount-display/README.md` for detailed component documentation.
