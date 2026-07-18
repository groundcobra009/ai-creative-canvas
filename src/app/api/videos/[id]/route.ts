import { advanceVideoJob } from "@/server/run-video-job";
import { getVideoJob } from "@/server/video-jobs";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const existing = getVideoJob(id);
  if (!existing) return Response.json({ error: "動画ジョブが見つかりません" }, { status: 404 });
  const job = await advanceVideoJob(id);
  return Response.json(job);
}
