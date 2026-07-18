import { getDefaultProject, saveDefaultProject } from "@/server/projects";
import { sceneSchema } from "@/server/validation";

export const runtime = "nodejs";

export async function GET() {
  return Response.json(await getDefaultProject());
}

export async function PUT(request: Request) {
  const result = sceneSchema.safeParse(await request.json());
  if (!result.success) {
    return Response.json(
      { error: "キャンバスデータが不正です", details: result.error.flatten() },
      { status: 400 },
    );
  }

  return Response.json(await saveDefaultProject(result.data));
}
