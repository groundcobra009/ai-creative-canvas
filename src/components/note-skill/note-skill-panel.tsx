"use client";

import { ArrowLeft, Check, FileText, LayoutTemplate, Sparkles } from "lucide-react";
import { useState } from "react";
import { useEditorStore } from "@/features/canvas/store";
import type { NoteDesignDirection } from "@/features/canvas/types";
import { analyzeNoteBrief, noteSkillInputSchema } from "@/features/note-skill/analyze";
import { createNoteVariants } from "@/features/note-skill/layouts";
import type { NoteDesignPlan, NoteSkillAnalysis } from "@/features/note-skill/types";

const directionLabels: Record<NoteDesignDirection, string> = {
  photo: "写真中心",
  abstract: "抽象イラスト",
  typography: "タイポグラフィ",
};

export function NoteSkillPanel() {
  const scene = useEditorStore((state) => state.scene);
  const setVariants = useEditorStore((state) => state.setVariants);
  const [title, setTitle] = useState(scene.noteBrief?.title ?? "");
  const [body, setBody] = useState(scene.noteBrief?.body ?? "");
  const [audience, setAudience] = useState(scene.noteBrief?.audience ?? "");
  const [analysis, setAnalysis] = useState<NoteSkillAnalysis | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const analyze = () => {
    const result = noteSkillInputSchema.safeParse({ title, body, audience });
    if (!result.success) {
      setMessage(result.error.issues[0]?.message ?? "入力内容を確認してください");
      return;
    }
    setAnalysis(analyzeNoteBrief(result.data));
    setMessage(null);
  };

  const updatePlan = (index: number, patch: Partial<NoteDesignPlan>) => {
    if (!analysis) return;
    setAnalysis({
      ...analysis,
      plans: analysis.plans.map((plan, planIndex) =>
        planIndex === index
          ? {
              ...plan,
              ...patch,
              label: patch.direction ? directionLabels[patch.direction] : plan.label,
            }
          : plan,
      ),
    });
  };

  const generate = () => {
    if (!analysis) return;
    const visual = scene.elements.find(
      (element) => element.type === "image" && element.assetId,
    );
    const variants = createNoteVariants(
      analysis.plans,
      analysis.brief,
      visual?.type === "image" ? { src: visual.src, assetId: visual.assetId } : undefined,
    );
    setVariants(variants, analysis.brief);
    setMessage("3案を作成しました。上部のプレビューから切り替えられます");
  };

  return (
    <section className="note-skill-panel">
      <div className="note-skill-title">
        <span><FileText size={15} />note skill</span>
        <strong>記事から3案をつくる</strong>
      </div>

      {!analysis ? (
        <div className="note-skill-form">
          <label>
            <span>記事タイトル</span>
            <input value={title} maxLength={300} placeholder="記事タイトルを入力" onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label>
            <span>本文</span>
            <textarea value={body} rows={5} maxLength={50_000} placeholder="記事本文または要約を入力" onChange={(event) => setBody(event.target.value)} />
            <small>{body.length.toLocaleString()}文字</small>
          </label>
          <label>
            <span>想定読者</span>
            <input value={audience} maxLength={300} placeholder="例：AI活用を始めたい会社員" onChange={(event) => setAudience(event.target.value)} />
          </label>
          <button type="button" className="note-analyze-button" onClick={analyze}>
            <Sparkles size={15} />記事を分析
          </button>
        </div>
      ) : (
        <div className="note-plan-review">
          <button type="button" className="note-back-button" onClick={() => setAnalysis(null)}>
            <ArrowLeft size={13} />入力へ戻る
          </button>
          <div className="note-insight">
            <span>読者価値</span>
            <p>{analysis.brief.readerValue}</p>
            <div>{analysis.brief.keywords.map((keyword) => <em key={keyword}>#{keyword}</em>)}</div>
          </div>
          <div className="note-plan-list">
            {analysis.plans.map((plan, index) => (
              <article key={plan.id}>
                <div className="note-plan-heading">
                  <span>案{index + 1}</span>
                  <select
                    aria-label={`案${index + 1}のデザイン方向`}
                    value={plan.direction}
                    onChange={(event) => updatePlan(index, { direction: event.target.value as NoteDesignDirection })}
                  >
                    <option value="photo">写真中心</option>
                    <option value="abstract">抽象イラスト</option>
                    <option value="typography">タイポグラフィ</option>
                  </select>
                </div>
                <textarea
                  aria-label={`案${index + 1}の短縮コピー`}
                  rows={3}
                  value={plan.copy}
                  maxLength={80}
                  onChange={(event) => updatePlan(index, { copy: event.target.value })}
                />
                <small>{plan.description}</small>
              </article>
            ))}
          </div>
          <button type="button" className="note-generate-button" onClick={generate}>
            <LayoutTemplate size={15} />3案をキャンバスに生成
          </button>
        </div>
      )}

      {scene.variants?.length ? (
        <p className="note-output-ready"><Check size={13} />編集可能な3案を保存中</p>
      ) : null}
      {message ? <p className="note-skill-message" role="status">{message}</p> : null}
    </section>
  );
}
