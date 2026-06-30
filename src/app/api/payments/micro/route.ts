import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { initializePayment } from "@/lib/paystack";
import { MICRO_PRICES } from "@/lib/plans";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { feature } = await req.json();
    const micro = MICRO_PRICES[feature];
    if (!micro) return NextResponse.json({ error: "Invalid feature" }, { status: 400 });

    const reference = `jambos_micro_${feature}_${session.user.id}_${Date.now()}`;
    const origin = req.headers.get("origin") || "https://jambos.vercel.app";

    const payment = await initializePayment({
      email: session.user.email,
      amount: micro.price * 100,
      reference,
      callback_url: `${origin}/api/payments/verify?reference=${reference}`,
      metadata: {
        userId: session.user.id,
        feature,
        type: "microtransaction",
      },
    });

    await db.payment.create({
      data: {
        userId: session.user.id,
        type: "microtransaction",
        feature,
        amount: micro.price,
        paystackRef: reference,
        status: "PENDING",
      },
    });

    return NextResponse.json({ url: payment.authorization_url, reference });
  } catch (error: any) {
    console.error("Micro payment error:", error?.message);
    return NextResponse.json({ error: error?.message || "Payment failed" }, { status: 500 });
  }
}