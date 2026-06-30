import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkUsage } from "@/lib/usage";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const feature = searchParams.get("feature");
  if (!feature) return NextResponse.json({ error: "Feature required" }, { status: 400 });

  const usage = await checkUsage(session.user.id, feature);
  return NextResponse.json(usage);
}