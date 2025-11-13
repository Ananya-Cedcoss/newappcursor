import {
  reactExtension,
  Banner,
  Text,
  Button,
  useApplyDiscountCodeChange,
  useSettings,
  useBuyerJourneyIntercept,
  useCartLines,
  useApi,
} from '@shopify/ui-extensions-react/checkout';
import { useState, useEffect } from 'react';

export default reactExtension('purchase.checkout.block.render', () => <DiscountNotification />);

function DiscountNotification() {
  const { show_notification, discount_message, auto_apply } = useSettings();
  const applyDiscountCode = useApplyDiscountCodeChange();
  const cartLines = useCartLines();
  const { extension } = useApi();

  const [discount, setDiscount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState(null);

  // Fetch available discounts from backend
  useEffect(() => {
    fetchAvailableDiscount();
  }, [cartLines]);

  const fetchAvailableDiscount = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${extension.apiUrl}/api/discounts/available`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartLines: cartLines.map(line => ({
            id: line.id,
            quantity: line.quantity,
            merchandiseId: line.merchandise.id,
            price: line.cost.totalAmount.amount,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch discounts');
      }

      const data = await response.json();
      if (data.discount) {
        setDiscount(data.discount);

        // Auto-apply if enabled
        if (auto_apply && !applied) {
          await applyDiscount(data.discount.code);
        }
      }
    } catch (err) {
      console.error('Error fetching discount:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyDiscount = async (code) => {
    try {
      setLoading(true);
      const result = await applyDiscountCode({
        type: 'addDiscountCode',
        code: code,
      });

      if (result.type === 'success') {
        setApplied(true);
        setError(null);
      } else {
        setError('Failed to apply discount');
      }
    } catch (err) {
      console.error('Error applying discount:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Intercept checkout to validate discount
  useBuyerJourneyIntercept(({ canBlockProgress }) => {
    if (!canBlockProgress || !discount || applied) {
      return {
        behavior: 'allow',
      };
    }

    // Optionally block checkout to encourage discount application
    return {
      behavior: 'allow',
    };
  });

  if (!show_notification || !discount) {
    return null;
  }

  return (
    <>
      {discount && !applied && (
        <Banner
          title="Special Discount Available!"
          status="success"
        >
          <Text>
            {discount_message || `Save ${discount.value}${discount.type === 'percentage' ? '%' : ' ' + discount.currency} with code: ${discount.code}`}
          </Text>
          <Button
            kind="primary"
            loading={loading}
            onPress={() => applyDiscount(discount.code)}
          >
            Apply Discount
          </Button>
        </Banner>
      )}

      {applied && (
        <Banner title="Discount Applied!" status="success">
          <Text>Your discount has been successfully applied to your order.</Text>
        </Banner>
      )}

      {error && (
        <Banner title="Error" status="critical">
          <Text>{error}</Text>
        </Banner>
      )}
    </>
  );
}
