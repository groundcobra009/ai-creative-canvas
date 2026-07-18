import { agentPlanRequestSchema } from "@/features/agent/schema";
import { createAgentPlan, getAgentProviderMode } from "@/server/ai/agent-planner";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function GET() {
  return Response.json(getAgentProviderMode());
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON形式のリクエストが必要です" }, { status: 400 });
  }
  const result = agentPlanRequestSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0]?.message ?? "エージェントへの指示が不正です" },
      { status: 400 },
    );
  }
  try {
    return Response.json(await createAgentPlan(result.data.instruction, result.data.context));
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "操作案を作成できませんでした" },
      { status: 422 },
    );
  }
}
