import { describe, expect, it } from "vitest";
import {
  canAdvanceVideoJob,
  hasVideoJobTimedOut,
  mapRemoteVideoState,
  VIDEO_JOB_TIMEOUT_MS,
} from "./state-machine";

describe("video job state machine", () => {
  it.each([
    ["queued", "running", 20],
    ["running", "running", 55],
    ["succeeded", "succeeded", 100],
    ["failed", "failed", 100],
  ] as const)("maps %s", (remote, status, progress) => {
    expect(mapRemoteVideoState(remote)).toEqual({ status, progress });
  });

  it("detects timeout at the configured boundary", () => {
    const createdAt = "2026-07-18T00:00:00.000Z";
    const start = new Date(createdAt).getTime();
    expect(hasVideoJobTimedOut(createdAt, start + VIDEO_JOB_TIMEOUT_MS - 1)).toBe(false);
    expect(hasVideoJobTimedOut(createdAt, start + VIDEO_JOB_TIMEOUT_MS)).toBe(true);
  });

  it("only advances active states", () => {
    expect(canAdvanceVideoJob("queued")).toBe(true);
    expect(canAdvanceVideoJob("running")).toBe(true);
    expect(canAdvanceVideoJob("failed")).toBe(false);
    expect(canAdvanceVideoJob("timed_out")).toBe(false);
  });
});
