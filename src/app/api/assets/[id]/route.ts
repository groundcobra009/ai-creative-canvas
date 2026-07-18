import { readAsset } from "@/server/assets";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const asset = await readAsset(id);
  if (!asset) {
    return Response.json({ error: "画像が見つかりません" }, { status: 404 });
  }

  return new Response(asset.bytes, {
    headers: {
      "Content-Type": asset.mimeType,
      "Content-Length": String(asset.size),
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
