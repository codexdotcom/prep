import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { initializeTransaction, PLANS, type PlanKey } from "@/lib/paystack";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan } = await req.json();

    if (!plan || !PLANS[plan as PlanKey] || plan === "FREE") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const selectedPlan = PLANS[plan as PlanKey];
    const reference = `pg_${randomUUID().replace(/-/g, "").slice(0, 16)}`;

    // Create pending payment record
    await db.payment.create({
      data: {
        userId: session.user.id,
        amount: selectedPlan.price,
        status: "PENDING",
        providerRef: reference,
        plan: plan as any,
        metadata: { planName: selectedPlan.name },
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    const result = await initializeTransaction({
      email: session.user.email,
      amount: selectedPlan.price,
      reference,
      callbackUrl: `${baseUrl}/subscription/verify?reference=${reference}`,
      metadata: {
        userId: session.user.id,
        plan,
        custom_fields: [
          { display_name: "Plan", variable_name: "plan", value: selectedPlan.name },
        ],
      },
    });

    if (!result.status) {
      return NextResponse.json({ error: result.message || "Payment initialization failed" }, { status: 500 });
    }

    return NextResponse.json({
      authorizationUrl: result.data.authorization_url,
      reference: result.data.reference,
    });
  } catch (error) {
    console.error("Payment init error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}