import { json } from "@remix-run/node";
import db from "../db.server";
import { authenticate } from "../shopify.server";

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
    const { discountCode, cartId, customerId } = await request.json();

    if (!discountCode) {
      return json({
        success: false,
        error: "Discount code is required",
      }, {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Find the discount in database
    const discount = await db.discount.findUnique({
      where: { code: discountCode },
    });

    if (!discount || !discount.active) {
      return json({
        success: false,
        error: "Invalid or inactive discount code",
      }, {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Check if discount is still valid
    const now = new Date();
    if (discount.startDate > now || (discount.endDate && discount.endDate < now)) {
      return json({
        success: false,
        error: "Discount code has expired or not yet active",
      }, {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Check usage limits
    if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
      return json({
        success: false,
        error: "Discount code has reached its usage limit",
      }, {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Log discount usage
    await db.discountUsage.create({
      data: {
        discountId: discount.id,
        customerId: customerId || null,
        cartId: cartId || null,
        appliedAt: new Date(),
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
        id: discount.id,
        code: discount.code,
        type: discount.type,
        value: discount.value,
        description: discount.description,
      },
    }, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Error applying discount:", error);
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
