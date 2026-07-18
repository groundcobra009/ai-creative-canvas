import { after } from "next/server";
import { advanceVideoJob } from "@/server/run-video-job";
import {
  countActiveVideoJobs,
  createVideoJob,
  getVideoJob,
} from "@/server/video-jobs";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const source = getVideoJob(id);
  if (!source) return Response.json({ error: "動画ジョブが見つかりません" }, { status: 404 });
  if (!["failed", "timed_out"].includes(source.status)) {
    return Response.json({ error: "失敗またはタイムアウトしたジョブだけ再実行できます" }, { status: 409 });
  }
  const maxJobs = Number(process.env.MAX_CONCURRENT_VIDEO_JOBS ?? 1);
  if (countActiveVideoJobs() >= maxJobs) {
    return Response.json({ error: "実行中の動画生成があります" }, { status: 429 });
  }
  const job = createVideoJob(source.request, source.id);
  after(() => advanceVideoJob(job.id));
  return Response.json(job, { status: 202 });
}
