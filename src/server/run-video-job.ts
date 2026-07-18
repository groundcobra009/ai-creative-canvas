import "server-only";

import {
  canAdvanceVideoJob,
  hasVideoJobTimedOut,
  mapRemoteVideoState,
} from "@/features/video/state-machine";
import { createVideoProvider, getVideoProviderMode } from "./ai/video-provider";
import { readAsset, saveGeneratedAsset } from "./assets";
import {
  claimQueuedVideoJob,
  getVideoJob,
  isVideoPollDue,
  updateVideoJob,
} from "./video-jobs";

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

async function downloadVideo(url: string) {
  if (url.startsWith("data:video/mp4;base64,")) {
    const bytes = Buffer.from(url.slice("data:video/mp4;base64,".length), "base64");
    if (bytes.byteLength > MAX_VIDEO_BYTES) throw new Error("生成動画が100MBを超えています");
    return bytes;
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`生成動画を保存できませんでした (${response.status})`);
  const declaredSize = Number(response.headers.get("content-length") ?? 0);
  if (declaredSize > MAX_VIDEO_BYTES) throw new Error("生成動画が100MBを超えています");
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.byteLength > MAX_VIDEO_BYTES) throw new Error("生成動画が100MBを超えています");
  return bytes;
}

export async function advanceVideoJob(jobId: string) {
  const job = getVideoJob(jobId);
  if (!job || !canAdvanceVideoJob(job.status)) return job;
  if (hasVideoJobTimedOut(job.createdAt)) {
    return updateVideoJob(jobId, {
      status: "timed_out",
      progress: 100,
      error: "動画生成が12分を超えたためタイムアウトしました。再実行できます。",
      completedAt: new Date().toISOString(),
      nextPollAt: null,
    });
  }
  if (!isVideoPollDue(jobId)) return job;

  try {
    const provider = await createVideoProvider();
    if (job.status === "queued") {
      if (!claimQueuedVideoJob(jobId)) return getVideoJob(jobId);
      const source = job.request.sourceAssetId
        ? await readAsset(job.request.sourceAssetId)
        : null;
      if (job.request.kind === "image" && !source) {
        throw new Error("動画にする画像が見つかりません");
      }
      const submitted = await provider.create({
        request: job.request,
        source: source ? { bytes: source.bytes, mimeType: source.mimeType } : undefined,
      });
      return updateVideoJob(jobId, {
        status: "running",
        remoteJobId: submitted.remoteJobId,
        progress: 10,
        attempts: 0,
        nextPollAt: new Date(Date.now() + 1_500).toISOString(),
      });
    }

    if (!job.remoteJobId) {
      throw new Error("送信途中で中断されました。二重課金を避けるため再実行してください。");
    }
    updateVideoJob(jobId, {
      nextPollAt: new Date(Date.now() + 60_000).toISOString(),
    });
    const remote = await provider.get(job.remoteJobId);
    const mapped = mapRemoteVideoState(remote.status);
    if (remote.status === "failed") {
      return updateVideoJob(jobId, {
        ...mapped,
        error: remote.error ?? "Seedanceで動画を生成できませんでした",
        completedAt: new Date().toISOString(),
        nextPollAt: null,
      });
    }
    if (remote.status === "succeeded") {
      if (!remote.videoUrl) throw new Error("Seedanceの完了結果に動画URLがありません");
      const bytes = await downloadVideo(remote.videoUrl);
      const asset = await saveGeneratedAsset({
        bytes,
        mimeType: "video/mp4",
        name: `seedance-${jobId.slice(0, 8)}.mp4`,
      });
      return updateVideoJob(jobId, {
        ...mapped,
        resultAssetId: asset.id,
        error: null,
        completedAt: new Date().toISOString(),
        nextPollAt: null,
      });
    }
    const delay = getVideoProviderMode() === "mock" ? 1_500 : 8_000;
    return updateVideoJob(jobId, {
      ...mapped,
      error: null,
      attempts: 0,
      nextPollAt: new Date(Date.now() + delay).toISOString(),
    });
  } catch (error) {
    const latest = getVideoJob(jobId);
    const message = error instanceof Error ? error.message : "動画生成に失敗しました";
    if (!latest) return null;
    const attempts = latest.attempts + 1;
    if (latest.status === "submitting" || attempts >= 3) {
      return updateVideoJob(jobId, {
        status: "failed",
        progress: 100,
        error: message,
        attempts,
        completedAt: new Date().toISOString(),
        nextPollAt: null,
      });
    }
    return updateVideoJob(jobId, {
      error: `${message}（自動再試行 ${attempts}/3）`,
      attempts,
      nextPollAt: new Date(Date.now() + 5_000 * attempts).toISOString(),
    });
  }
}
