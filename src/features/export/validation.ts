import { NOTE_THUMBNAIL_SKILL } from "@/features/note-skill/manifest";

export type ExportInspection = {
  width: number;
  height: number;
  bytes: number;
};

export function inspectNoteExport(result: ExportInspection) {
  if (
    result.width !== NOTE_THUMBNAIL_SKILL.output.width ||
    result.height !== NOTE_THUMBNAIL_SKILL.output.height
  ) {
    throw new Error("書き出し画像は1280 × 670pxである必要があります");
  }
  if (result.bytes > NOTE_THUMBNAIL_SKILL.output.maxBytes) {
    throw new Error("書き出し画像が10MBを超えています。JPEGを選択してください");
  }
  return {
    sizeKb: Math.max(1, Math.round(result.bytes / 1024)),
    withinLimit: true as const,
  };
}
