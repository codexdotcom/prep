import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyTransaction } from "@/lib/paystack";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json({ error: "Reference required" }, { status: 400 });
    }

    // Find the payment
    const payment = await db.payment.findUnique({
      where: { providerRef: reference },
    });

    if (!payment || payment.userId !== session.user.id) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status === "SUCCESS") {
      return NextResponse.json({ status: "success", message: "Already verified" });
    }

    // Verify with Paystack
    const result = await verifyTransaction(reference);

    if (!result.status || result.data.status !== "success") {
      await db.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });
      return NextResponse.json({ status: "failed", message: "Payment verification failed" });
    }

    // Update payment
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCESS",
        providerTxId: String(result.data.id),
      },
    });

    // Activate subscription
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await db.subscription.upsert({
      where: { userId: session.user.id },
      update: {
        plan: payment.plan || "STARTER",
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
        paystackCustomerId: result.data.customer?.customer_code,
      },
      create: {
        userId: session.user.id,
        plan: payment.plan || "STARTER",
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
        paystackCustomerId: result.data.customer?.customer_code,
      },
    });

    return NextResponse.json({ status: "success", plan: payment.plan });
  } catch (error) {
    console.error("Payment verify error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}