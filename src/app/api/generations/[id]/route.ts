import { getGenerationJob } from "@/server/generation-jobs";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const job = getGenerationJob(id);
  return job
    ? Response.json(job)
    : Response.json({ error: "生成ジョブが見つかりません" }, { status: 404 });
}
