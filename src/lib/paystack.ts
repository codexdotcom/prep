const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";
const PAYSTACK_PUBLIC = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";

export { PAYSTACK_PUBLIC };

export async function initializePayment(params: {
  email: string;
  amount: number; // in kobo (Naira * 100)
  reference: string;
  callback_url: string;
  metadata?: Record<string, any>;
}): Promise<{ authorization_url: string; reference: string }> {
  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!data.status) throw new Error(data.message || "Paystack initialization failed");
  return data.data;
}

export async function verifyPayment(reference: string): Promise<{
  status: string;
  amount: number;
  currency: string;
  customer: { email: string };
  metadata: Record<string, any>;
}> {
  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
  });

  const data = await res.json();
  if (!data.status) throw new Error(data.message || "Verification failed");
  return data.data;
}