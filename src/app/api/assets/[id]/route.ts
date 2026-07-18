import { readAsset } from "@/server/assets";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const asset = await readAsset(id);
  if (!asset) {
    return Response.json({ error: "素材が見つかりません" }, { status: 404 });
  }

  const range = request.headers.get("range");
  if (range && asset.mimeType === "video/mp4") {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) return new Response(null, { status: 416 });
    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Math.min(Number(match[2]), asset.size - 1) : asset.size - 1;
    if (start > end || start >= asset.size) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${asset.size}` },
      });
    }
    return new Response(asset.bytes.subarray(start, end + 1), {
      status: 206,
      headers: {
        "Content-Type": asset.mimeType,
        "Content-Length": String(end - start + 1),
        "Content-Range": `bytes ${start}-${end}/${asset.size}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  return new Response(asset.bytes, {
    headers: {
      "Content-Type": asset.mimeType,
      "Content-Length": String(asset.size),
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      ...(asset.mimeType === "video/mp4" ? { "Accept-Ranges": "bytes" } : {}),
    },
  });
}
