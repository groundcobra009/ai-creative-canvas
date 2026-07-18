import "server-only";

import { and, desc, eq } from "drizzle-orm";
import type {
  VideoGenerationRequest,
  VideoJob,
  VideoJobStatus,
} from "@/features/video/types";
import { getVideoProviderMode, SEEDANCE_MODEL } from "./ai/video-provider";
import { getDb } from "./db";
import { videoJobs } from "./db/schema";

type VideoJobPatch = Partial<{
  status: VideoJobStatus;
  remoteJobId: string | null;
  resultAssetId: string | null;
  progress: number;
  error: string | null;
  attempts: number;
  nextPollAt: string | null;
  completedAt: string | null;
}>;

function toVideoJob(row: typeof videoJobs.$inferSelect): VideoJob {
  return {
    id: row.id,
    status: row.status as VideoJobStatus,
    provider: row.provider as VideoJob["provider"],
    model: row.model,
    prompt: row.prompt,
    request: JSON.parse(row.requestJson) as VideoGenerationRequest,
    remoteJobId: row.remoteJobId,
    resultAssetId: row.resultAssetId,
    resultUrl: row.resultAssetId ? `/api/assets/${row.resultAssetId}` : null,
    progress: row.progress,
    error: row.error,
    attempts: row.attempts,
    retryOfJobId: row.retryOfJobId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    completedAt: row.completedAt,
  };
}

export function createVideoJob(
  request: VideoGenerationRequest,
  retryOfJobId?: string,
) {
  const timestamp = new Date().toISOString();
  const provider = getVideoProviderMode();
  const id = crypto.randomUUID();
  getDb().insert(videoJobs).values({
    id,
    status: "queued",
    provider,
    model: provider === "seedance" ? SEEDANCE_MODEL : "mock-seedance-video",
    prompt: request.prompt,
    requestJson: JSON.stringify(request),
    remoteJobId: null,
    resultAssetId: null,
    progress: 0,
    error: null,
    attempts: 0,
    nextPollAt: null,
    retryOfJobId: retryOfJobId ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: null,
  }).run();
  return getVideoJob(id)!;
}

export function getVideoJob(id: string) {
  const row = getDb().select().from(videoJobs).where(eq(videoJobs.id, id)).get();
  return row ? toVideoJob(row) : null;
}

export function listVideoJobs(limit = 30) {
  return getDb().select().from(videoJobs)
    .orderBy(desc(videoJobs.createdAt)).limit(limit).all().map(toVideoJob);
}

export function countActiveVideoJobs() {
  return listVideoJobs(1000).filter((job) =>
    ["queued", "submitting", "running"].includes(job.status),
  ).length;
}

export function updateVideoJob(id: string, patch: VideoJobPatch) {
  const values: Partial<typeof videoJobs.$inferInsert> = {
    updatedAt: new Date().toISOString(),
  };
  if (patch.status !== undefined) values.status = patch.status;
  if (patch.remoteJobId !== undefined) values.remoteJobId = patch.remoteJobId;
  if (patch.resultAssetId !== undefined) values.resultAssetId = patch.resultAssetId;
  if (patch.progress !== undefined) values.progress = patch.progress;
  if (patch.error !== undefined) values.error = patch.error;
  if (patch.attempts !== undefined) values.attempts = patch.attempts;
  if (patch.nextPollAt !== undefined) values.nextPollAt = patch.nextPollAt;
  if (patch.completedAt !== undefined) values.completedAt = patch.completedAt;
  getDb().update(videoJobs).set(values).where(eq(videoJobs.id, id)).run();
  return getVideoJob(id);
}

export function claimQueuedVideoJob(id: string) {
  const result = getDb().update(videoJobs).set({
    status: "submitting",
    progress: 5,
    error: null,
    updatedAt: new Date().toISOString(),
  }).where(and(eq(videoJobs.id, id), eq(videoJobs.status, "queued"))).run();
  return result.changes === 1;
}

export function isVideoPollDue(id: string, now = Date.now()) {
  const row = getDb().select({ nextPollAt: videoJobs.nextPollAt })
    .from(videoJobs).where(eq(videoJobs.id, id)).get();
  return !row?.nextPollAt || new Date(row.nextPollAt).getTime() <= now;
}
