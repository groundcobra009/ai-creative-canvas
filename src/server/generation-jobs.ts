import "server-only";

import { desc, eq } from "drizzle-orm";
import type {
  GenerationJob,
  GenerationStatus,
  ImageGenerationRequest,
} from "@/features/generation/types";
import { getAssetRecords } from "./assets";
import { IMAGE_MODEL_BY_TIER, getImageProviderMode } from "./ai/image-provider";
import { getDb } from "./db";
import { generationJobs } from "./db/schema";

type JobPatch = Partial<{
  status: GenerationStatus;
  progress: number;
  resultAssetIds: string[];
  error: string | null;
  completedAt: string | null;
}>;

function toJob(row: typeof generationJobs.$inferSelect): GenerationJob {
  const request = JSON.parse(row.requestJson) as ImageGenerationRequest;
  const resultAssetIds = JSON.parse(row.resultAssetIdsJson) as string[];
  const assetById = new Map(
    getAssetRecords(resultAssetIds).map((asset) => [asset.id, asset]),
  );

  return {
    id: row.id,
    kind: row.kind as GenerationJob["kind"],
    status: row.status as GenerationStatus,
    provider: row.provider as GenerationJob["provider"],
    model: row.model,
    prompt: row.prompt,
    request,
    resultAssetIds,
    resultAssets: resultAssetIds.flatMap((id) => {
      const asset = assetById.get(id);
      return asset
        ? [
            {
              id: asset.id,
              name: asset.name,
              mimeType: asset.mimeType,
              url: `/api/assets/${asset.id}`,
            },
          ]
        : [];
    }),
    progress: row.progress,
    error: row.error,
    retryOfJobId: row.retryOfJobId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    completedAt: row.completedAt,
  };
}

export function createGenerationJob(
  request: ImageGenerationRequest,
  retryOfJobId?: string,
) {
  const timestamp = new Date().toISOString();
  const id = crypto.randomUUID();
  const provider = getImageProviderMode();
  getDb()
    .insert(generationJobs)
    .values({
      id,
      kind: request.kind,
      status: "queued",
      provider,
      model: IMAGE_MODEL_BY_TIER[request.modelTier],
      prompt: request.prompt,
      requestJson: JSON.stringify(request),
      resultAssetIdsJson: "[]",
      progress: 0,
      error: null,
      retryOfJobId: retryOfJobId ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
      completedAt: null,
    })
    .run();

  return getGenerationJob(id)!;
}

export function getGenerationJob(id: string) {
  const row = getDb()
    .select()
    .from(generationJobs)
    .where(eq(generationJobs.id, id))
    .get();
  return row ? toJob(row) : null;
}

export function listGenerationJobs(limit = 30) {
  return getDb()
    .select()
    .from(generationJobs)
    .orderBy(desc(generationJobs.createdAt))
    .limit(limit)
    .all()
    .map(toJob);
}

export function updateGenerationJob(id: string, patch: JobPatch) {
  const values: Partial<typeof generationJobs.$inferInsert> = {
    updatedAt: new Date().toISOString(),
  };
  if (patch.status !== undefined) values.status = patch.status;
  if (patch.progress !== undefined) values.progress = patch.progress;
  if (patch.resultAssetIds !== undefined) {
    values.resultAssetIdsJson = JSON.stringify(patch.resultAssetIds);
  }
  if (patch.error !== undefined) values.error = patch.error;
  if (patch.completedAt !== undefined) values.completedAt = patch.completedAt;

  getDb()
    .update(generationJobs)
    .set(values)
    .where(eq(generationJobs.id, id))
    .run();
  return getGenerationJob(id);
}

export function cancelGenerationJob(id: string) {
  const job = getGenerationJob(id);
  if (!job || !["queued", "running"].includes(job.status)) return job;
  return updateGenerationJob(id, {
    status: "cancelled",
    completedAt: new Date().toISOString(),
  });
}
