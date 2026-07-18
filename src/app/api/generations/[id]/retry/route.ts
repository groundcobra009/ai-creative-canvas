import { after } from "next/server";
import {
  createGenerationJob,
  getGenerationJob,
} from "@/server/generation-jobs";
import { runGenerationJob } from "@/server/run-generation-job";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const original = getGenerationJob(id);
  if (!original) {
    return Response.json({ error: "生成ジョブが見つかりません" }, { status: 404 });
  }

  const job = createGenerationJob(original.request, original.id);
  after(() => runGenerationJob(job.id));
  return Response.json(job, { status: 202 });
}
