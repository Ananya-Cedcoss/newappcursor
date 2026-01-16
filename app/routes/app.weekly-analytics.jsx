import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import {
  Page,
  Card,
  DataTable,
  Text,
  BlockStack,
  Button,
  InlineStack,
  Badge,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { getWeeklyAnalytics } from "../services/analytics.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  const url = new URL(request.url);
  const weeks = parseInt(url.searchParams.get("weeks") || "4", 10);

  const weeklyData = await getWeeklyAnalytics(weeks);

  return json({ weeklyData, weeks });
};

export default function WeeklyAnalytics() {
  const { weeklyData, weeks } = useLoaderData();

  const handleExport = () => {
    window.open("/api/export-analytics", "_blank");
  };

  return (
    <Page
      title="Weekly Analytics"
      primaryAction={{
        content: "Export to CSV",
        onAction: handleExport,
      }}
    >
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="200">
            <Text variant="headingMd" as="h2">
              Product Views by Week
            </Text>
            <Text variant="bodyMd" as="p" tone="subdued">
              Showing analytics for the past {weeks} weeks
            </Text>
          </BlockStack>
        </Card>

        {weeklyData.length === 0 ? (
          <Card>
            <Text variant="bodyMd" as="p">
              No analytics data available for the selected period.
            </Text>
          </Card>
        ) : (
          weeklyData.map((week, index) => {
            const weekStartStr = new Date(week.weekStart).toLocaleDateString();
            const weekEndStr = new Date(week.weekEnd).toLocaleDateString();

            const topProducts = Object.values(week.products)
              .sort((a, b) => b.views - a.views)
              .slice(0, 10);

            const rows = topProducts.map((product) => [
              product.productId,
              product.views.toString(),
              new Date(product.lastViewed).toLocaleString(),
            ]);

            return (
              <Card key={index}>
                <BlockStack gap="300">
                  <InlineStack align="space-between">
                    <BlockStack gap="100">
                      <Text variant="headingSm" as="h3">
                        Week of {weekStartStr} - {weekEndStr}
                      </Text>
                      <InlineStack gap="200">
                        <Badge>Total Views: {week.totalViews}</Badge>
                        <Badge>Unique Products: {week.uniqueProducts}</Badge>
                      </InlineStack>
                    </BlockStack>
                  </InlineStack>

                  {rows.length > 0 && (
                    <DataTable
                      columnContentTypes={["text", "numeric", "text"]}
                      headings={["Product ID", "Views", "Last Viewed"]}
                      rows={rows}
                    />
                  )}
                </BlockStack>
              </Card>
            );
          })
        )}
      </BlockStack>
    </Page>
  );
}
