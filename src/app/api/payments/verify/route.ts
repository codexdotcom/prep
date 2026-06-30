import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPayment } from "@/lib/paystack";
import { SubscriptionTier } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get("reference");
    if (!reference) return NextResponse.redirect(new URL("/pricing", req.url));

    const payment = await db.payment.findUnique({ where: { paystackRef: reference } });
    if (!payment) return NextResponse.redirect(new URL("/pricing?error=not_found", req.url));

    const verified = await verifyPayment(reference);

    if (verified.status === "success") {
      await db.payment.update({
        where: { paystackRef: reference },
        data: { status: "SUCCESS", paystackData: verified as any },
      });

      if (payment.type === "subscription") {
        const tier = (payment.paystackData as any)?.tier as SubscriptionTier;
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);

        await db.subscription.upsert({
          where: { userId: payment.userId },
          update: {
            tier,
            status: "active",
            paystackRef: reference,
            paystackEmail: verified.customer.email,
            amount: payment.amount,
            startDate: new Date(),
            endDate,
          },
          create: {
            userId: payment.userId,
            tier,
            status: "active",
            paystackRef: reference,
            paystackEmail: verified.customer.email,
            amount: payment.amount,
            startDate: new Date(),
            endDate,
          },
        });

        return NextResponse.redirect(new URL("/pricing?success=1", req.url));
      }

      if (payment.type === "microtransaction" && payment.feature) {
        // Grant usage credits
        const creditsMap: Record<string, number> = {
          quizfetch: 5, flashcards: 3, essay: 1, "audio-recap": 1,
          "visual-explainer": 3, "explainer-video": 1, "record-lecture": 1,
          call: 1, chat: 10, arcade: 5,
        };
        const credits = creditsMap[payment.feature] || 1;

        // Add negative usage to offset (effectively granting extra uses)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await db.usageRecord.upsert({
          where: { userId_feature_date: { userId: payment.userId, feature: payment.feature, date: today } },
          update: { count: { decrement: credits } },
          create: { userId: payment.userId, feature: payment.feature, date: today, count: -credits },
        });

        return NextResponse.redirect(new URL(`/${payment.feature}?unlocked=1`, req.url));
      }
    } else {
      await db.payment.update({
        where: { paystackRef: reference },
        data: { status: "FAILED" },
      });
    }

    return NextResponse.redirect(new URL("/pricing?error=failed", req.url));
  } catch (error: any) {
    console.error("Verify error:", error?.message);
    return NextResponse.redirect(new URL("/pricing?error=server", req.url));
  }
}