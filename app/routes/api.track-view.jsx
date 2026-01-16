import db from "../db.server";

export const action = async ({ request }) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return Response.json({ error: "productId is required" }, { status: 400 });
    }

    // Check if product analytics already exists
    const existingAnalytics = await db.productAnalytics.findUnique({
      where: { productId: String(productId) },
    });

    if (existingAnalytics) {
      // Increment the count and update last viewed time
      const updated = await db.productAnalytics.update({
        where: { productId: String(productId) },
        data: {
          viewCount: existingAnalytics.viewCount + 1,
          lastViewedAt: new Date(),
        },
      });
      return Response.json({
        success: true,
        viewCount: updated.viewCount,
        lastViewedAt: updated.lastViewedAt,
      });
    } else {
      // Create new record with viewCount 1
      const created = await db.productAnalytics.create({
        data: {
          productId: String(productId),
          viewCount: 1,
          lastViewedAt: new Date(),
        },
      });
      return Response.json({
        success: true,
        viewCount: created.viewCount,
        lastViewedAt: created.lastViewedAt,
      });
    }
  } catch (error) {
    console.error("Error tracking product view:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
};
