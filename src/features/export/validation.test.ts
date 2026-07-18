import { describe, expect, it } from "vitest";
import { inspectNoteExport } from "./validation";

describe("note export inspection", () => {
  it("accepts a 1280x670 file under 10MB", () => {
    expect(inspectNoteExport({ width: 1280, height: 670, bytes: 800_000 }).withinLimit).toBe(true);
  });

  it("rejects incorrect dimensions", () => {
    expect(() => inspectNoteExport({ width: 1200, height: 630, bytes: 800_000 })).toThrow("1280 × 670");
  });

  it("rejects files over 10MB", () => {
    expect(() => inspectNoteExport({ width: 1280, height: 670, bytes: 10 * 1024 * 1024 + 1 })).toThrow("10MB");
  });
});
