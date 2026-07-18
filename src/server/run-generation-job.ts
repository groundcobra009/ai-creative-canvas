import "server-only";

import { createImageProvider } from "./ai/image-provider";
import { readAsset, saveGeneratedAsset } from "./assets";
import {
  getGenerationJob,
  updateGenerationJob,
} from "./generation-jobs";

function isCancelled(jobId: string) {
  return getGenerationJob(jobId)?.status === "cancelled";
}

export async function runGenerationJob(jobId: string) {
  const initialJob = getGenerationJob(jobId);
  if (!initialJob || initialJob.status !== "queued") return;

  updateGenerationJob(jobId, { status: "running", progress: 5, error: null });

  try {
    const provider = await createImageProvider();
    const source = initialJob.request.sourceAssetId
      ? await readAsset(initialJob.request.sourceAssetId)
      : null;
    if (initialJob.kind === "edit" && !source) {
      throw new Error("編集元の画像が見つかりません");
    }

    const resultAssetIds: string[] = [];
    for (let index = 0; index < initialJob.request.count; index += 1) {
      if (isCancelled(jobId)) return;
      const output = await provider.generate({
        prompt: initialJob.prompt,
        modelTier: initialJob.request.modelTier,
        aspectRatio: initialJob.request.aspectRatio,
        variation: index,
        source: source
          ? { bytes: source.bytes, mimeType: source.mimeType }
          : undefined,
      });
      if (isCancelled(jobId)) return;

      const extension = output.mimeType === "image/jpeg" ? "jpg" : output.mimeType.split("/")[1];
      const asset = await saveGeneratedAsset({
        bytes: output.bytes,
        mimeType: output.mimeType,
        name: `ai-${initialJob.kind}-${jobId.slice(0, 8)}-${index + 1}.${extension}`,
      });
      resultAssetIds.push(asset.id);
      updateGenerationJob(jobId, {
        progress: Math.round(10 + ((index + 1) / initialJob.request.count) * 85),
        resultAssetIds,
      });
    }

    if (isCancelled(jobId)) return;
    updateGenerationJob(jobId, {
      status: "succeeded",
      progress: 100,
      resultAssetIds,
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (isCancelled(jobId)) return;
    updateGenerationJob(jobId, {
      status: "failed",
      error: error instanceof Error ? error.message : "画像生成に失敗しました",
      completedAt: new Date().toISOString(),
    });
  }
}
