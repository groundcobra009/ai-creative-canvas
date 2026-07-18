import { cancelGenerationJob } from "@/server/generation-jobs";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const job = cancelGenerationJob(id);
  return job
    ? Response.json(job)
    : Response.json({ error: "生成ジョブが見つかりません" }, { status: 404 });
}
