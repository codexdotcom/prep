import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recordUsage } from "@/lib/usage";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { feature } = await req.json();
  if (!feature) return NextResponse.json({ error: "Feature required" }, { status: 400 });

  await recordUsage(session.user.id, feature);
  return NextResponse.json({ ok: true });
}