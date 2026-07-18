import type { VideoJobStatus } from "./types";

export const VIDEO_JOB_TIMEOUT_MS = 12 * 60 * 1000;

export type RemoteVideoState = "queued" | "running" | "succeeded" | "failed";

export function mapRemoteVideoState(state: RemoteVideoState): {
  status: VideoJobStatus;
  progress: number;
} {
  if (state === "queued") return { status: "running", progress: 20 };
  if (state === "running") return { status: "running", progress: 55 };
  if (state === "succeeded") return { status: "succeeded", progress: 100 };
  return { status: "failed", progress: 100 };
}

export function hasVideoJobTimedOut(createdAt: string, now = Date.now()) {
  return now - new Date(createdAt).getTime() >= VIDEO_JOB_TIMEOUT_MS;
}

export function canAdvanceVideoJob(status: VideoJobStatus) {
  return status === "queued" || status === "submitting" || status === "running";
}
