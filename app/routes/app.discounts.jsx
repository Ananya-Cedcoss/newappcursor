import { useState, useEffect } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  // Fetch products with their variants
  const productsResponse = await admin.graphql(
    `#graphql
      query getProducts {
        products(first: 50) {
          edges {
            node {
              id
              title
              handle
              status
              featuredImage {
                url
                altText
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    price
                    compareAtPrice
                  }
                }
              }
            }
          }
        }
      }`,
  );

  const productsJson = await productsResponse.json();

  // Fetch existing price rules (discounts)
  const discountsResponse = await admin.graphql(
    `#graphql
      query getDiscounts {
        priceRules(first: 50) {
          edges {
            node {
              id
              title
              summary
              valueV2 {
                ... on PricingPercentageValue {
                  percentage
                }
                ... on MoneyV2 {
                  amount
                  currencyCode
                }
              }
              status
              startsAt
              endsAt
            }
          }
        }
      }`,
  );

  const discountsJson = await discountsResponse.json();

  return {
    products: productsJson.data?.products?.edges || [],
    discounts: discountsJson.data?.priceRules?.edges || [],
  };
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get("actionType");

  if (actionType === "createDiscount") {
    const productId = formData.get("productId");
    const variantId = formData.get("variantId");
    const discountType = formData.get("discountType");
    const discountValue = formData.get("discountValue");
    const discountTitle = formData.get("discountTitle");

    // Create a price rule
    const priceRuleResponse = await admin.graphql(
      `#graphql
        mutation priceRuleCreate($priceRule: PriceRuleInput!) {
          priceRuleCreate(priceRule: $priceRule) {
            priceRule {
              id
              title
              summary
            }
            priceRuleUserErrors {
              field
              message
            }
          }
        }`,
      {
        variables: {
          priceRule: {
            title: discountTitle || `Discount for ${productId}`,
            target: "LINE_ITEM",
            validityPeriod: {
              start: new Date().toISOString(),
            },
            customerSelection: {
              all: true,
            },
            itemEntitlements: {
              productVariantIds: [variantId],
            },
            value:
              discountType === "percentage"
                ? {
                    percentageDiscount: {
                      percentage: parseFloat(discountValue) / 100,
                    },
                  }
                : {
                    fixedAmountDiscount: {
                      amount: parseFloat(discountValue),
                    },
                  },
            allocationMethod: "ACROSS",
            combinesWith: {
              orderDiscounts: true,
              productDiscounts: true,
              shippingDiscounts: true,
            },
          },
        },
      },
    );

    const priceRuleJson = await priceRuleResponse.json();

    if (priceRuleJson.data?.priceRuleCreate?.priceRuleUserErrors?.length > 0) {
      return {
        errors: priceRuleJson.data.priceRuleCreate.priceRuleUserErrors,
      };
    }

    // Create a discount code for the price rule
    const priceRuleId = priceRuleJson.data?.priceRuleCreate?.priceRule?.id;
    if (priceRuleId) {
      const discountCode = `SAVE${Math.random().toString(36).substring(7).toUpperCase()}`;

      const discountCodeResponse = await admin.graphql(
        `#graphql
          mutation priceRuleDiscountCodeCreate($priceRuleId: ID!, $code: String!) {
            priceRuleDiscountCodeCreate(priceRuleId: $priceRuleId, code: $code) {
              priceRuleDiscountCode {
                id
                code
              }
              priceRuleUserErrors {
                field
                message
              }
            }
          }`,
        {
          variables: {
            priceRuleId: priceRuleId,
            code: discountCode,
          },
        },
      );

      const discountCodeJson = await discountCodeResponse.json();

      return {
        success: true,
        priceRule: priceRuleJson.data.priceRuleCreate.priceRule,
        discountCode: discountCodeJson.data?.priceRuleDiscountCodeCreate?.priceRuleDiscountCode,
      };
    }

    return {
      success: true,
      priceRule: priceRuleJson.data.priceRuleCreate.priceRule,
    };
  }

  return { error: "Invalid action type" };
};

export default function Discounts() {
  const { products, discounts } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [discountTitle, setDiscountTitle] = useState("");
  const [showForm, setShowForm] = useState(false);

  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";

  useEffect(() => {
    if (fetcher.data?.success) {
      shopify.toast.show("Discount created successfully!");
      setShowForm(false);
      setSelectedProduct("");
      setSelectedVariant("");
      setDiscountValue("");
      setDiscountTitle("");
    }
    if (fetcher.data?.errors) {
      shopify.toast.show("Error creating discount", { error: true });
    }
  }, [fetcher.data, shopify]);

  const selectedProductData = products.find(
    (p) => p.node.id === selectedProduct,
  );

  const handleCreateDiscount = () => {
    if (!selectedProduct || !selectedVariant || !discountValue) {
      shopify.toast.show("Please fill in all required fields", { error: true });
      return;
    }

    const formData = new FormData();
    formData.append("actionType", "createDiscount");
    formData.append("productId", selectedProduct);
    formData.append("variantId", selectedVariant);
    formData.append("discountType", discountType);
    formData.append("discountValue", discountValue);
    formData.append("discountTitle", discountTitle);

    fetcher.submit(formData, { method: "POST" });
  };

  return (
    <s-page heading="Product Discounts">
      <s-button slot="primary-action" onClick={() => setShowForm(!showForm)}>
        {showForm ? "Cancel" : "Create New Discount"}
      </s-button>

      {showForm && (
        <s-section heading="Create Product Discount">
          <s-stack direction="block" gap="base">
            <s-box>
              <s-stack direction="block" gap="small">
                <s-text weight="bold">Discount Title</s-text>
                <input
                  type="text"
                  placeholder="e.g., Summer Sale"
                  value={discountTitle}
                  onChange={(e) => setDiscountTitle(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                  }}
                />
              </s-stack>
            </s-box>

            <s-box>
              <s-stack direction="block" gap="small">
                <s-text weight="bold">Select Product *</s-text>
                <select
                  value={selectedProduct}
                  onChange={(e) => {
                    setSelectedProduct(e.target.value);
                    setSelectedVariant("");
                  }}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                  }}
                >
                  <option value="">Choose a product</option>
                  {products.map((product) => (
                    <option key={product.node.id} value={product.node.id}>
                      {product.node.title}
                    </option>
                  ))}
                </select>
              </s-stack>
            </s-box>

            {selectedProductData && (
              <s-box>
                <s-stack direction="block" gap="small">
                  <s-text weight="bold">Select Variant *</s-text>
                  <select
                    value={selectedVariant}
                    onChange={(e) => setSelectedVariant(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                    }}
                  >
                    <option value="">Choose a variant</option>
                    {selectedProductData.node.variants.edges.map((variant) => (
                      <option key={variant.node.id} value={variant.node.id}>
                        {variant.node.title} - ${variant.node.price}
                      </option>
                    ))}
                  </select>
                </s-stack>
              </s-box>
            )}

            <s-box>
              <s-stack direction="block" gap="small">
                <s-text weight="bold">Discount Type</s-text>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                  }}
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </s-stack>
            </s-box>

            <s-box>
              <s-stack direction="block" gap="small">
                <s-text weight="bold">
                  Discount Value * ({discountType === "percentage" ? "%" : "$"})
                </s-text>
                <input
                  type="number"
                  placeholder={
                    discountType === "percentage" ? "e.g., 10" : "e.g., 5.00"
                  }
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  min="0"
                  step={discountType === "percentage" ? "1" : "0.01"}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                  }}
                />
              </s-stack>
            </s-box>

            <s-button
              onClick={handleCreateDiscount}
              {...(isLoading ? { loading: true } : {})}
            >
              Create Discount
            </s-button>

            {fetcher.data?.discountCode && (
              <s-box
                padding="base"
                borderWidth="base"
                borderRadius="base"
                background="success"
              >
                <s-stack direction="block" gap="small">
                  <s-text weight="bold">Discount Code Created!</s-text>
                  <s-text>Code: {fetcher.data.discountCode.code}</s-text>
                </s-stack>
              </s-box>
            )}

            {fetcher.data?.errors && (
              <s-box
                padding="base"
                borderWidth="base"
                borderRadius="base"
                background="critical"
              >
                <s-stack direction="block" gap="small">
                  {fetcher.data.errors.map((error, index) => (
                    <s-text key={index}>
                      {error.field}: {error.message}
                    </s-text>
                  ))}
                </s-stack>
              </s-box>
            )}
          </s-stack>
        </s-section>
      )}

      <s-section heading="Your Products">
        <s-paragraph>
          Select a product to create a discount. You can create percentage-based
          or fixed-amount discounts for specific product variants.
        </s-paragraph>

        {products.length === 0 ? (
          <s-box padding="base">
            <s-text>
              No products found. Create some products first using the Home page.
            </s-text>
          </s-box>
        ) : (
          <s-stack direction="block" gap="base">
            {products.slice(0, 10).map((product) => (
              <s-box
                key={product.node.id}
                padding="base"
                borderWidth="base"
                borderRadius="base"
              >
                <s-stack direction="inline" gap="base" alignment="center">
                  {product.node.featuredImage && (
                    <img
                      src={product.node.featuredImage.url}
                      alt={product.node.featuredImage.altText || product.node.title}
                      style={{
                        width: "60px",
                        height: "60px",
                        objectFit: "cover",
                        borderRadius: "4px",
                      }}
                    />
                  )}
                  <s-stack direction="block" gap="small">
                    <s-text weight="bold">{product.node.title}</s-text>
                    <s-text variant="subdued">
                      {product.node.variants.edges.length} variant(s)
                    </s-text>
                  </s-stack>
                </s-stack>
              </s-box>
            ))}
          </s-stack>
        )}
      </s-section>

      <s-section heading="Active Discounts">
        <s-paragraph>
          View and manage your existing discount rules.
        </s-paragraph>

        {discounts.length === 0 ? (
          <s-box padding="base">
            <s-text>No discounts created yet.</s-text>
          </s-box>
        ) : (
          <s-stack direction="block" gap="base">
            {discounts.map((discount) => (
              <s-box
                key={discount.node.id}
                padding="base"
                borderWidth="base"
                borderRadius="base"
                background="subdued"
              >
                <s-stack direction="block" gap="small">
                  <s-text weight="bold">{discount.node.title}</s-text>
                  {discount.node.summary && (
                    <s-text>{discount.node.summary}</s-text>
                  )}
                  <s-text variant="subdued">Status: {discount.node.status}</s-text>
                  {discount.node.valueV2?.percentage && (
                    <s-text>
                      Discount: {(discount.node.valueV2.percentage * 100).toFixed(0)}%
                    </s-text>
                  )}
                  {discount.node.valueV2?.amount && (
                    <s-text>
                      Discount: ${discount.node.valueV2.amount} {discount.node.valueV2.currencyCode}
                    </s-text>
                  )}
                </s-stack>
              </s-box>
            ))}
          </s-stack>
        )}
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
