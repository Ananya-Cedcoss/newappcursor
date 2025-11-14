import { authenticate } from "../shopify.server";
import {
  getAllDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  getDiscountById,
} from "../models/discount.server";

/**
 * GET: Fetch all discounts or a specific discount by ID
 * POST: Create a new discount
 * PATCH: Update an existing discount
 * DELETE: Remove a discount
 */

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  try {
    if (id) {
      // Fetch specific discount by ID
      const discount = await getDiscountById(id);

      if (!discount) {
        return new Response(
          JSON.stringify({ error: "Discount not found" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      return new Response(JSON.stringify({ success: true, discount }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch all discounts
    const discounts = await getAllDiscounts();

    return new Response(
      JSON.stringify({ success: true, discounts, count: discounts.length }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error fetching discounts:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch discounts",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

export const action = async ({ request }) => {
  await authenticate.admin(request);

  const method = request.method;

  try {
    if (method === "POST") {
      // Create new discount
      const body = await request.json();
      const { name, type, value, productIds } = body;

      // Validate required fields
      if (!name || !type || value === undefined || !productIds) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Missing required fields",
            required: ["name", "type", "value", "productIds"],
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Validate type
      if (!["percentage", "fixed"].includes(type)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Invalid discount type",
            allowed: ["percentage", "fixed"],
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const discount = await createDiscount({
        name,
        type,
        value: parseFloat(value),
        productIds: Array.isArray(productIds) ? productIds : [],
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Discount created successfully",
          discount,
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (method === "PATCH") {
      // Update existing discount
      const body = await request.json();
      const { id, ...updateData } = body;

      if (!id) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Discount ID is required",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Validate type if provided
      if (updateData.type && !["percentage", "fixed"].includes(updateData.type)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Invalid discount type",
            allowed: ["percentage", "fixed"],
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Convert value to float if provided
      if (updateData.value !== undefined) {
        updateData.value = parseFloat(updateData.value);
      }

      const discount = await updateDiscount(id, updateData);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Discount updated successfully",
          discount,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (method === "DELETE") {
      // Delete discount
      const body = await request.json();
      const { id } = body;

      if (!id) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Discount ID is required",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      await deleteDiscount(id);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Discount deleted successfully",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Method not allowed
    return new Response(
      JSON.stringify({
        success: false,
        error: "Method not allowed",
        allowed: ["GET", "POST", "PATCH", "DELETE"],
      }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error(`Error processing ${method} request:`, error);

    return new Response(
      JSON.stringify({
        success: false,
        error: `Failed to process ${method} request`,
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
