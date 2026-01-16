import { authenticate } from "../shopify.server";
import { getAllAnalyticsForExport, generateCSV } from "../services/analytics.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  try {
    const analytics = await getAllAnalyticsForExport();
    const csvContent = generateCSV(analytics);

    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `product-analytics-${timestamp}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting analytics:", error);
    return new Response("Failed to export analytics", { status: 500 });
  }
};
