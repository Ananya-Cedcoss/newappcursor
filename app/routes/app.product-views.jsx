import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  DataTable,
  Text,
  BlockStack,
  Button,
  InlineStack,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import {
  getAllAnalyticsForExport,
  formatAnalyticsAsCSV,
} from "../services/analytics.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  const url = new URL(request.url);
  const exportParam = url.searchParams.get("export");

  // Handle CSV export
  if (exportParam === "csv") {
    const analytics = await getAllAnalyticsForExport();
    const csvContent = formatAnalyticsAsCSV(analytics);
    const date = new Date().toISOString().split("T")[0];
    const filename = `product-analytics-${date}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  // Fetch all product analytics, ordered by view count (highest first)
  const productAnalytics = await db.productAnalytics.findMany({
    orderBy: { viewCount: "desc" },
  });

  return { productAnalytics };
};

export default function ProductViews() {
  const { productAnalytics } = useLoaderData();

  const rows = productAnalytics.map((analytics) => [
    analytics.productId,
    analytics.viewCount.toString(),
    new Date(analytics.lastViewedAt).toLocaleString(),
  ]);

  const handleExport = async () => {
    try {
      const response = await fetch("/app/product-views?export=csv");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `product-analytics-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export is  failed:", error);
    }
  };

  return (
    <Page>
      <TitleBar title="Product Analytics dashboard" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingMd">
                  Product View Tracking
                </Text>
                <Button onClick={handleExport} variant="primary">
                  Export to CSV
                </Button>
              </InlineStack>
              <Text as="p" variant="bodyMd">
                Track how many times each product has been viewed. Use the
                /api/track-view endpoint to increment view counts.
              </Text>
              {productAnalytics.length === 0 ? (
                <Text as="p" variant="bodyMd" tone="subdued">
                  No product views tracked yet. Start tracking by sending POST
                  requests to /api/track-view with a productId.
                </Text>
              ) : (
                <DataTable
                  columnContentTypes={["text", "numeric", "text"]}
                  headings={["Product ID", "View Count", "Last Viewed"]}
                  rows={rows}
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
