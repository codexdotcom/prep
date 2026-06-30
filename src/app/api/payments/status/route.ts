import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await db.subscription.findUnique({ where: { userId: session.user.id } });

  return NextResponse.json({
    tier: sub?.tier || "FREE",
    status: sub?.status || "none",
    endDate: sub?.endDate,
    active: sub ? (sub.status === "active" && (!sub.endDate || new Date(sub.endDate) > new Date())) : false,
  });
}