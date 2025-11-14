import { useState, useCallback, useEffect } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Select,
  Button,
  DataTable,
  BlockStack,
  InlineStack,
  Text,
  Badge,
  Modal,
  ResourceList,
  ResourceItem,
  Checkbox,
  Banner,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import {
  getAllDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
} from "../models/discount.server";
import {
  fetchProducts,
  syncDiscountToProducts,
  removeDiscountFromProducts,
} from "../utils/shopify-products.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  // Fetch all discounts from database
  const discounts = await getAllDiscounts();

  // Fetch products from Shopify using utility function
  const products = await fetchProducts(admin);

  return json({ discounts, products });
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("_action");

  if (action === "create") {
    const name = formData.get("name");
    const type = formData.get("type");
    const value = parseFloat(formData.get("value"));
    const productIds = JSON.parse(formData.get("productIds") || "[]");
    const syncToShopify = formData.get("syncToShopify") === "true";

    const discount = await createDiscount({ name, type, value, productIds });

    // Sync to Shopify if requested and products are selected
    if (syncToShopify && productIds.length > 0) {
      const syncResult = await syncDiscountToProducts(admin, productIds, {
        id: discount.id,
        name,
        type,
        value,
      });

      return json({
        success: true,
        message: "Discount created successfully",
        syncResult,
      });
    }

    return json({ success: true, message: "Discount created successfully" });
  }

  if (action === "update") {
    const id = formData.get("id");
    const name = formData.get("name");
    const type = formData.get("type");
    const value = parseFloat(formData.get("value"));
    const productIds = JSON.parse(formData.get("productIds") || "[]");
    const syncToShopify = formData.get("syncToShopify") === "true";

    await updateDiscount(id, { name, type, value, productIds });

    // Sync to Shopify if requested and products are selected
    if (syncToShopify && productIds.length > 0) {
      const syncResult = await syncDiscountToProducts(admin, productIds, {
        id,
        name,
        type,
        value,
      });

      return json({
        success: true,
        message: "Discount updated successfully",
        syncResult,
      });
    }

    return json({ success: true, message: "Discount updated successfully" });
  }

  if (action === "delete") {
    const id = formData.get("id");
    const discount = await deleteDiscount(id);

    // Remove discount metadata from products
    if (discount.productIds && discount.productIds.length > 0) {
      const productIds = JSON.parse(discount.productIds);
      await removeDiscountFromProducts(admin, productIds);
    }

    return json({ success: true, message: "Discount deleted successfully" });
  }

  return json({ success: false, message: "Invalid action" });
};

export default function Discounts() {
  const { discounts, products } = useLoaderData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const shopify = useAppBridge();

  // Form state
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    type: "percentage",
    value: "",
    productIds: [],
    syncToShopify: false,
  });

  // UI state
  const [isEditing, setIsEditing] = useState(false);
  const [productModalActive, setProductModalActive] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);

  const isLoading = navigation.state === "submitting";

  useEffect(() => {
    if (navigation.state === "idle" && navigation.formData) {
      // Reset form after successful submission
      setFormData({
        id: "",
        name: "",
        type: "percentage",
        value: "",
        productIds: [],
        syncToShopify: false,
      });
      setSelectedProducts([]);
      setIsEditing(false);
      shopify.toast.show(
        navigation.formData.get("_action") === "delete"
          ? "Discount deleted"
          : isEditing
            ? "Discount updated"
            : "Discount created",
      );
    }
  }, [navigation.state, navigation.formData, isEditing, shopify]);

  const handleSubmit = useCallback(() => {
    const data = new FormData();
    data.append("_action", isEditing ? "update" : "create");
    if (isEditing) {
      data.append("id", formData.id);
    }
    data.append("name", formData.name);
    data.append("type", formData.type);
    data.append("value", formData.value);
    data.append("productIds", JSON.stringify(formData.productIds));
    data.append("syncToShopify", formData.syncToShopify.toString());

    submit(data, { method: "post" });
  }, [formData, isEditing, submit]);

  const handleEdit = useCallback((discount) => {
    setFormData({
      id: discount.id,
      name: discount.name,
      type: discount.type,
      value: discount.value.toString(),
      productIds: discount.productIds,
      syncToShopify: false,
    });
    setSelectedProducts(discount.productIds);
    setIsEditing(true);
  }, []);

  const handleDelete = useCallback(
    (id) => {
      if (confirm("Are you sure you want to delete this discount?")) {
        const data = new FormData();
        data.append("_action", "delete");
        data.append("id", id);
        submit(data, { method: "post" });
      }
    },
    [submit],
  );

  const handleCancel = useCallback(() => {
    setFormData({
      id: "",
      name: "",
      type: "percentage",
      value: "",
      productIds: [],
      syncToShopify: false,
    });
    setSelectedProducts([]);
    setIsEditing(false);
  }, []);

  const openProductModal = useCallback(() => {
    setProductModalActive(true);
  }, []);

  const closeProductModal = useCallback(() => {
    setProductModalActive(false);
  }, []);

  const handleProductSelection = useCallback(() => {
    setFormData((prev) => ({ ...prev, productIds: selectedProducts }));
    setProductModalActive(false);
  }, [selectedProducts]);

  const toggleProductSelection = useCallback((productId) => {
    setSelectedProducts((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      return [...prev, productId];
    });
  }, []);

  const getProductNames = (productIds) => {
    return productIds
      .map((id) => {
        const product = products.find((p) => p.id === id);
        return product ? product.title : "Unknown";
      })
      .join(", ");
  };

  const discountRows = discounts.map((discount) => [
    discount.name,
    <Badge tone={discount.type === "percentage" ? "info" : "success"}>
      {discount.type === "percentage" ? "Percentage" : "Fixed Amount"}
    </Badge>,
    discount.type === "percentage" ? `${discount.value}%` : `$${discount.value}`,
    discount.productIds.length > 0
      ? getProductNames(discount.productIds)
      : "All products",
    <InlineStack gap="200">
      <Button size="slim" onClick={() => handleEdit(discount)}>
        Edit
      </Button>
      <Button
        size="slim"
        tone="critical"
        onClick={() => handleDelete(discount.id)}
      >
        Delete
      </Button>
    </InlineStack>,
  ]);

  return (
    <Page>
      <TitleBar title="Discount Management" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  {isEditing ? "Edit Discount" : "Create New Discount"}
                </Text>
                <FormLayout>
                  <TextField
                    label="Discount Name"
                    value={formData.name}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, name: value }))
                    }
                    autoComplete="off"
                  />
                  <Select
                    label="Discount Type"
                    options={[
                      { label: "Percentage", value: "percentage" },
                      { label: "Fixed Amount", value: "fixed" },
                    ]}
                    value={formData.type}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, type: value }))
                    }
                  />
                  <TextField
                    label={
                      formData.type === "percentage"
                        ? "Discount Value (%)"
                        : "Discount Value ($)"
                    }
                    type="number"
                    value={formData.value}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, value }))
                    }
                    autoComplete="off"
                    min="0"
                    step={formData.type === "percentage" ? "1" : "0.01"}
                  />
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd">
                      Selected Products: {formData.productIds.length} product(s)
                    </Text>
                    {formData.productIds.length > 0 && (
                      <Text as="p" variant="bodySm" tone="subdued">
                        {getProductNames(formData.productIds)}
                      </Text>
                    )}
                    <Button onClick={openProductModal}>Select Products</Button>
                  </BlockStack>
                  <BlockStack gap="200">
                    <Checkbox
                      label="Sync discount metadata to Shopify products"
                      checked={formData.syncToShopify}
                      onChange={(value) =>
                        setFormData((prev) => ({ ...prev, syncToShopify: value }))
                      }
                      helpText="When enabled, discount information will be saved as product metafields in Shopify for storefront access"
                    />
                    {formData.syncToShopify && formData.productIds.length === 0 && (
                      <Banner tone="warning">
                        Please select at least one product to sync discount metadata.
                      </Banner>
                    )}
                  </BlockStack>
                  <InlineStack gap="200">
                    <Button
                      variant="primary"
                      onClick={handleSubmit}
                      loading={isLoading}
                    >
                      {isEditing ? "Update Discount" : "Create Discount"}
                    </Button>
                    {isEditing && (
                      <Button onClick={handleCancel}>Cancel</Button>
                    )}
                  </InlineStack>
                </FormLayout>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h2" variant="headingMd">
                    Active Discounts
                  </Text>
                  {discounts.length > 0 && (
                    <Button
                      variant="primary"
                      onClick={() => {
                        fetch('/api/sync-discounts', { method: 'POST' })
                          .then(res => res.json())
                          .then(data => {
                            if (data.success) {
                              shopify.toast.show('Discounts activated in cart!');
                            } else {
                              shopify.toast.show('Failed to activate discounts', { isError: true });
                            }
                          })
                          .catch(() => {
                            shopify.toast.show('Error activating discounts', { isError: true });
                          });
                      }}
                    >
                      Activate in Cart
                    </Button>
                  )}
                </InlineStack>
                {discounts.length === 0 ? (
                  <Text as="p" variant="bodyMd" tone="subdued">
                    No discounts created yet. Create your first discount above.
                  </Text>
                ) : (
                  <>
                    <Banner tone="info">
                      <p>
                        Click "Activate in Cart" to apply these discounts automatically at checkout.
                        Customers will see discounts applied when they add qualifying products to their cart.
                      </p>
                    </Banner>
                    <DataTable
                      columnContentTypes={[
                        "text",
                        "text",
                        "text",
                        "text",
                        "text",
                      ]}
                      headings={["Name", "Type", "Value", "Products", "Actions"]}
                      rows={discountRows}
                    />
                  </>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>

      <Modal
        open={productModalActive}
        onClose={closeProductModal}
        title="Select Products"
        primaryAction={{
          content: "Done",
          onAction: handleProductSelection,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: closeProductModal,
          },
        ]}
      >
        <Modal.Section>
          <ResourceList
            resourceName={{ singular: "product", plural: "products" }}
            items={products}
            renderItem={(product) => {
              const { id, title, featuredImage } = product;
              const isSelected = selectedProducts.includes(id);

              return (
                <ResourceItem
                  id={id}
                  media={
                    featuredImage ? (
                      <img
                        src={featuredImage.url}
                        alt={title}
                        style={{ width: "50px", height: "50px" }}
                      />
                    ) : null
                  }
                  onClick={() => toggleProductSelection(id)}
                >
                  <InlineStack align="space-between">
                    <Text variant="bodyMd" fontWeight="bold">
                      {title}
                    </Text>
                    <Checkbox
                      checked={isSelected}
                      onChange={() => toggleProductSelection(id)}
                    />
                  </InlineStack>
                </ResourceItem>
              );
            }}
          />
        </Modal.Section>
      </Modal>
    </Page>
  );
}
