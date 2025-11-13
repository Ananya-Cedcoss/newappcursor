import { json } from "@remix-run/node";
import db from "../db.server";
import { calculateDiscountAmount, validateDiscount } from "../utils/discount.server";

// CORS headers configuration
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

// Handle OPTIONS request for CORS preflight
export async function loader({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  return json({ error: "Method not allowed" }, {
    status: 405,
    headers: corsHeaders,
  });
}

export async function action({ request }) {
  // Handle OPTIONS request for CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const { discountCode, cartTotal, cartItems, customerId, cartId } = await request.json();

    if (!discountCode || typeof cartTotal !== "number") {
      return json({
        success: false,
        error: "Invalid request data",
      }, {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Find the discount
    const discount = await db.discount.findUnique({
      where: { code: discountCode.toUpperCase() },
    });

    if (!discount) {
      return json({
        success: false,
        error: "Invalid discount code",
      }, {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Validate discount
    const validation = validateDiscount(discount, cartTotal);
    if (!validation.valid) {
      return json({
        success: false,
        error: validation.reason,
      }, {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Calculate discount amount
    const discountAmount = calculateDiscountAmount(discount, cartTotal);
    const finalTotal = Math.max(0, cartTotal - discountAmount);

    // Record usage
    await db.discountUsage.create({
      data: {
        discountId: discount.id,
        customerId: customerId || null,
        cartId: cartId || null,
        appliedAt: new Date(),
        orderValue: cartTotal,
      },
    });

    // Update usage count
    await db.discount.update({
      where: { id: discount.id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });

    return json({
      success: true,
      discount: {
        code: discount.code,
        type: discount.type,
        value: discount.value,
        description: discount.description,
      },
      discountAmount,
      originalTotal: cartTotal,
      finalTotal,
      savings: discountAmount,
    }, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Error applying discount to cart:", error);
    return json({
      success: false,
      error: "Failed to apply discount",
      details: error.message,
    }, {
      status: 500,
      headers: corsHeaders,
    });
  }
}
