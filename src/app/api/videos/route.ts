import { after } from "next/server";
import { videoGenerationRequestSchema } from "@/features/video/validation";
import { getVideoProviderMode } from "@/server/ai/video-provider";
import { advanceVideoJob } from "@/server/run-video-job";
import {
  countActiveVideoJobs,
  createVideoJob,
  listVideoJobs,
} from "@/server/video-jobs";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET() {
  return Response.json({ providerMode: getVideoProviderMode(), jobs: listVideoJobs() });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON形式のリクエストが必要です" }, { status: 400 });
  }
  const parsed = videoGenerationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "動画生成条件が不正です" },
      { status: 400 },
    );
  }
  const maxJobs = Number(process.env.MAX_CONCURRENT_VIDEO_JOBS ?? 1);
  if (countActiveVideoJobs() >= maxJobs) {
    return Response.json(
      { error: "実行中の動画生成があります。完了後にもう一度お試しください。" },
      { status: 429 },
    );
  }
  const job = createVideoJob(parsed.data);
  after(() => advanceVideoJob(job.id));
  return Response.json(job, { status: 202 });
}
