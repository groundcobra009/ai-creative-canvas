export const NOTE_THUMBNAIL_SKILL = {
  id: "note-thumbnail",
  name: "note 見出し画像",
  description: "記事タイトル・本文・読者から、編集可能な1280×670pxのデザインを3案作成します。",
  output: {
    width: 1280,
    height: 670,
    maxBytes: 10 * 1024 * 1024,
    formats: ["image/png", "image/jpeg"],
  },
  directions: ["photo", "abstract", "typography"],
} as const;
