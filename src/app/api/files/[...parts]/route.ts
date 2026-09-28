import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCloudinarySignedUrl, readStoredFile } from "@/lib/file-storage";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ parts: string[] }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { parts } = await params;
  if (parts[0] === "cloud" && parts[1]) {
    const signedUrl = getCloudinarySignedUrl(parts[1], user.id);
    if (!signedUrl) return NextResponse.json({ error: "File not found" }, { status: 404 });
    return NextResponse.redirect(signedUrl);
  }

  const file = parts[0] ? await readStoredFile(parts[0], user.id) : null;
  if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

  return new NextResponse(file.buffer, {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `inline; filename="${file.filename.replace(/["\r\n]/g, "")}"`,
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
