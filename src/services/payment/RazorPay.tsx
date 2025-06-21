import { useRazorpay } from "react-razorpay";
import TrimlyLogo from "/logo.svg";
import { useEffect, useRef, useState } from "react";
import MuiButton from "@/components/common/buttons/MuiButton";
import { useToaster } from "@/hooks/ui/useToaster";
import { CurrencyCode } from "react-razorpay/dist/constants/currency";

export interface RazorpayButtonProps {
  className?: string;
  onCreateOrder: () => Promise<{
    orderId: string;
    amount: number;
    currency: CurrencyCode;
    customData?: any;
  }>;
  onVerifyPayment: (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    customData?: any;
  }) => Promise<void>;
  onFailure: ({ orderId, status }: { orderId: string; status: string }) => void;
  amount: number;
  disabled?: boolean;
  description: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onSuccess: () => void;
  buttonText?: string;
}

export const RazorpayButton: React.FC<RazorpayButtonProps> = ({
  className,
  onCreateOrder,
  onSuccess,
  onVerifyPayment,
  onFailure,
  disabled,
  amount,
  description,
  prefill = {
    name: "Customer Name",
    email: "customer@example.com",
    contact: "9876543210",
  },
  buttonText,
}) => {
  const { Razorpay } = useRazorpay();
  const { errorToast, successToast } = useToaster();
  const [orderId, setOrderId] = useState<string>("");
  const isPaymentFailedRef = useRef(false);

  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      e.preventDefault();
      await onFailure({ orderId, status: "cancelled" });
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [onFailure, orderId]);


  const handlePayment = async () => {
    try {
      const { orderId, currency, customData } = await onCreateOrder();
      setOrderId(orderId);
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: "Trimly",
        description,
        order_id: orderId,
        image: TrimlyLogo,
        retry: {
          enabled: false,
        },
        handler: async (response: any) => {
          isPaymentFailedRef.current = false;

          await onVerifyPayment({
            ...response,
            customData,
          });
          onSuccess();
          successToast(response.message);
        },
        prefill,
        theme: { color: "#feba43" },
        modal: {
          ondismiss: () => {
            if (!isPaymentFailedRef.current) {
              onFailure({ orderId, status: "cancelled" });
              console.log("Modal closed");
            }
            isPaymentFailedRef.current = false;
          },
        },
      };

      const rzp = new Razorpay(options);

      rzp.on("payment.failed", async (err: any) => {
        isPaymentFailedRef.current = true;
        errorToast(err.error.description || "Payment failed");

        await onFailure({
          orderId: err?.error?.metadata?.order_id || "",
          status: "cancelled",
        });

        if (err.error.reason === "payment_failed") {
          errorToast(
            description || "Payment failed. Please try another method."
          );
        } else if (err.error.reason === "payment_authorization") {
          errorToast(
            "Your payment was declined by the bank. Try another method."
          );
        } else {
          errorToast("An unexpected error occurred during payment.");
        }
      });

      rzp.open();
    } catch (err: any) {
      console.error("Payment Init Error", err);
      errorToast(err.response.data.message || "Unable to initiate payment");
    }
  };

  return (
    <MuiButton
      onClick={handlePayment}
      disabled={disabled}
      className={className}
    >
      {buttonText ? buttonText : `Pay ₹${amount} With Razorpay`}
    </MuiButton>
  );
};
