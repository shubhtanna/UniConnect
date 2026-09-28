import { NextResponse } from "next/server";
import { z } from "zod";
import { getCompleteApiUser } from "@/lib/api-auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";

const schema = z.object({ mode: z.enum(["named", "anonymous"]) });

export async function POST(request: Request) {
  const auth = await getCompleteApiUser();
  if (!auth.user) return auth.response;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Choose named or anonymous viewing" }, { status: 400 });
  await connectToDatabase();
  await User.updateOne({ _id: auth.user.id }, { $set: { profileViewMode: parsed.data.mode } });
  return NextResponse.json({ ok: true, mode: parsed.data.mode });
}
