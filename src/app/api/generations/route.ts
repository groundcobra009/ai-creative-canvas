import { after } from "next/server";
import { imageGenerationRequestSchema } from "@/features/generation/validation";
import { getImageProviderMode } from "@/server/ai/image-provider";
import {
  createGenerationJob,
  listGenerationJobs,
} from "@/server/generation-jobs";
import { runGenerationJob } from "@/server/run-generation-job";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET() {
  return Response.json({
    providerMode: getImageProviderMode(),
    jobs: listGenerationJobs(),
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON形式のリクエストが必要です" }, { status: 400 });
  }

  const result = imageGenerationRequestSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0]?.message ?? "生成条件が不正です" },
      { status: 400 },
    );
  }

  const job = createGenerationJob(result.data);
  after(() => runGenerationJob(job.id));
  return Response.json(job, { status: 202 });
}
