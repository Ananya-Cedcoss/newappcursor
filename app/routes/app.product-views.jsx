import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import {
  Page,
  Card,
  DataTable,
  Text,
  BlockStack,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  const productAnalytics = await db.productAnalytics.findMany({
    orderBy: { viewCount: "desc" },
  });

  return json({ productAnalytics });
};

export default function ProductViews() {
  const { productAnalytics } = useLoaderData();

  const rows = productAnalytics.map((analytics) => [
    analytics.productId,
    analytics.viewCount.toString(),
    new Date(analytics.lastViewedAt).toLocaleString(),
  ]);

  return (
    <Page title="Product Analytics">
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="200">
            <Text variant="headingMd" as="h2">
              Product View Analytics
            </Text>
            <Text variant="bodyMd" as="p" tone="subdued">
              Track how many times each product has been viewed (debounced to 30 seconds)
            </Text>
          </BlockStack>
        </Card>
        <Card>
          <DataTable
            columnContentTypes={["text", "numeric", "text"]}
            headings={["Product ID", "View Count", "Last Viewed At"]}
            rows={rows}
          />
        </Card>
      </BlockStack>
    </Page>
  );
}
