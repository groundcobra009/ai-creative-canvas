import { z } from "zod";
import type { NoteSkillAnalysis, NoteSkillInput } from "./types";

export const noteSkillInputSchema = z.object({
  title: z.string().trim().min(3, "タイトルを3文字以上入力してください").max(300),
  body: z.string().trim().min(20, "本文を20文字以上入力してください").max(50_000),
  audience: z.string().trim().min(2, "想定読者を2文字以上入力してください").max(300),
});

const STOP_WORDS = new Set([
  "こと",
  "ため",
  "よう",
  "これ",
  "それ",
  "記事",
  "紹介",
  "解説",
  "方法",
  "今回",
]);

function normalizeText(value: string) {
  return value.replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").trim();
}

export function shortenCopy(value: string, maxLength = 34) {
  const normalized = normalizeText(value).replace(/\n+/g, " ");
  const characters = Array.from(normalized);
  if (characters.length <= maxLength) return normalized;

  const firstPhrase = normalized.split(/[。！？!?｜|]/)[0]?.trim();
  if (firstPhrase && Array.from(firstPhrase).length <= maxLength) return firstPhrase;
  return `${characters.slice(0, maxLength - 1).join("")}…`;
}

export function extractKeywords(input: NoteSkillInput) {
  const source = `${input.title}\n${input.body.slice(0, 8_000)}`;
  const tokens = source.match(/[\p{Script=Han}\p{Script=Katakana}A-Za-z0-9]{2,}/gu) ?? [];
  const frequency = new Map<string, number>();
  for (const raw of tokens) {
    const token = raw.toLowerCase();
    if (STOP_WORDS.has(token) || token.length > 32) continue;
    frequency.set(token, (frequency.get(token) ?? 0) + 1);
  }
  const ranked = [...frequency.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ja"))
    .map(([token]) => token)
    .slice(0, 5);
  return ranked.length ? ranked : ["アイデア", "学び", "note"];
}

export function analyzeNoteBrief(raw: NoteSkillInput): NoteSkillAnalysis {
  const input = noteSkillInputSchema.parse(raw);
  const normalized = {
    title: normalizeText(input.title),
    body: normalizeText(input.body),
    audience: normalizeText(input.audience),
  };
  const keywords = extractKeywords(normalized);
  const shortTitle = shortenCopy(normalized.title);
  const primaryKeyword = keywords[0] ?? "新しい発見";

  return {
    brief: {
      ...normalized,
      keywords,
      readerValue: `${normalized.audience}が「${primaryKeyword}」の要点をひと目で理解できる`,
    },
    plans: [
      {
        id: "photo",
        direction: "photo",
        label: "写真中心",
        copy: shortTitle,
        description: "余白のあるビジュアルと端的なコピーで、温度感を伝えます。",
        palette: ["#f7f2ea", "#172235", "#ff6b4a"],
      },
      {
        id: "abstract",
        direction: "abstract",
        label: "抽象イラスト",
        copy: `${primaryKeyword}で変わる\n${shortenCopy(normalized.title, 24)}`,
        description: "色面と幾何学モチーフで、テーマを強く印象づけます。",
        palette: ["#171b35", "#f7f4ff", "#9cf1d2"],
      },
      {
        id: "typography",
        direction: "typography",
        label: "タイポグラフィ",
        copy: shortenCopy(normalized.title, 30),
        description: "大きな文字と明快な階層で、一覧表示でも内容を伝えます。",
        palette: ["#f4f0ff", "#201d2e", "#6657d9"],
      },
    ],
  };
}
