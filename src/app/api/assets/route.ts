import { saveUploadedAsset } from "@/server/assets";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "画像ファイルを選択してください" }, { status: 400 });
  }

  try {
    return Response.json(await saveUploadedAsset(file), { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "画像を保存できませんでした" },
      { status: 400 },
    );
  }
}
