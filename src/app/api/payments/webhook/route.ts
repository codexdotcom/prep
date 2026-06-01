import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/paystack";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature") || "";

    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    switch (event.event) {
      case "charge.success": {
        const reference = event.data.reference;
        const payment = await db.payment.findUnique({
          where: { providerRef: reference },
        });

        if (payment && payment.status !== "SUCCESS") {
          await db.payment.update({
            where: { id: payment.id },
            data: {
              status: "SUCCESS",
              providerTxId: String(event.data.id),
            },
          });

          const periodEnd = new Date();
          periodEnd.setMonth(periodEnd.getMonth() + 1);

          await db.subscription.upsert({
            where: { userId: payment.userId },
            update: {
              plan: payment.plan || "STARTER",
              status: "ACTIVE",
              currentPeriodStart: new Date(),
              currentPeriodEnd: periodEnd,
            },
            create: {
              userId: payment.userId,
              plan: payment.plan || "STARTER",
              status: "ACTIVE",
              currentPeriodStart: new Date(),
              currentPeriodEnd: periodEnd,
            },
          });
        }
        break;
      }

      case "subscription.disable": {
        const customerCode = event.data.customer?.customer_code;
        if (customerCode) {
          await db.subscription.updateMany({
            where: { paystackCustomerId: customerCode },
            data: { status: "CANCELLED", cancelledAt: new Date() },
          });
        }
        break;
      }

      case "charge.failed": {
        const ref = event.data.reference;
        await db.payment.updateMany({
          where: { providerRef: ref },
          data: { status: "FAILED" },
        });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}