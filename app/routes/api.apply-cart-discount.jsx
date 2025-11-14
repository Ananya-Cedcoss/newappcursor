import { authenticate } from "../shopify.server";
import { getDiscountsByProductId } from "../models/discount.server";

/**
 * POST: Calculate and apply discounts to cart items
 *
 * Request body:
 * {
 *   "items": [
 *     { "productId": "gid://shopify/Product/123", "quantity": 2, "price": 29.99 },
 *     { "productId": "gid://shopify/Product/456", "quantity": 1, "price": 49.99 }
 *   ]
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "cart": {
 *     "items": [...],          // Array of items with applied discounts
 *     "subtotal": 109.97,      // Original subtotal
 *     "totalDiscount": 15.00,  // Total discount amount
 *     "total": 94.97           // Final total after discounts
 *   }
 * }
 */

export const action = async ({ request }) => {
  await authenticate.admin(request);

  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Method not allowed",
        allowed: ["POST"],
      }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const body = await request.json();
    const { items } = body;

    // Validate request
    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid request",
          message: "items array is required and must not be empty",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Process each item and calculate discounts
    const processedItems = await Promise.all(
      items.map(async (item) => {
        const { productId, quantity, price } = item;

        // Validate item data
        if (!productId || !quantity || price === undefined) {
          throw new Error(
            "Each item must have productId, quantity, and price",
          );
        }

        // Extract numeric ID from Shopify GID format if needed
        const numericId = productId.includes("gid://shopify/Product/")
          ? productId.split("/").pop()
          : productId;

        // Fetch applicable discounts for this product
        const discounts = await getDiscountsByProductId(numericId);

        // Apply the best discount (highest value)
        let appliedDiscount = null;
        let discountAmount = 0;

        if (discounts.length > 0) {
          // Find the best discount
          const bestDiscount = discounts.reduce((best, current) => {
            const currentAmount =
              current.type === "percentage"
                ? (price * current.value) / 100
                : current.value;

            const bestAmount =
              best.type === "percentage"
                ? (price * best.value) / 100
                : best.value;

            return currentAmount > bestAmount ? current : best;
          });

          appliedDiscount = bestDiscount;
          discountAmount =
            bestDiscount.type === "percentage"
              ? (price * bestDiscount.value) / 100
              : bestDiscount.value;
        }

        const lineTotal = price * quantity;
        const lineDiscount = discountAmount * quantity;
        const lineFinalPrice = lineTotal - lineDiscount;

        return {
          productId,
          quantity,
          price,
          lineTotal,
          discount: appliedDiscount
            ? {
                id: appliedDiscount.id,
                name: appliedDiscount.name,
                type: appliedDiscount.type,
                value: appliedDiscount.value,
                amountPerItem: discountAmount,
                totalAmount: lineDiscount,
              }
            : null,
          discountedPrice: price - discountAmount,
          lineFinalPrice,
        };
      }),
    );

    // Calculate totals
    const subtotal = processedItems.reduce(
      (sum, item) => sum + item.lineTotal,
      0,
    );
    const totalDiscount = processedItems.reduce(
      (sum, item) => sum + (item.discount?.totalAmount || 0),
      0,
    );
    const total = subtotal - totalDiscount;

    return new Response(
      JSON.stringify({
        success: true,
        cart: {
          items: processedItems,
          subtotal: Math.round(subtotal * 100) / 100,
          totalDiscount: Math.round(totalDiscount * 100) / 100,
          total: Math.round(total * 100) / 100,
          discountsApplied: processedItems.filter((item) => item.discount).length,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error applying cart discounts:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to apply discounts",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
