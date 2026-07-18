"use client";

import {
  AlertTriangle,
  Bot,
  Check,
  LoaderCircle,
  RotateCcw,
  Send,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { buildAgentContext } from "@/features/agent/context";
import { describeCommand } from "@/features/agent/describe";
import { agentPlanResponseSchema } from "@/features/agent/schema";
import type { AgentPlan } from "@/features/agent/types";
import { validateCommandsAgainstContext } from "@/features/agent/validate-plan";
import { useEditorStore } from "@/features/canvas/store";
import type { GenerationJob } from "@/features/generation/types";

type ConversationMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

type PendingImageJob = {
  jobId: string;
  elementId: string;
};

const examples = ["タイトルを大きくして右へ", "選択要素を青にして", "案2の配色を使って"];

export function AgentPanel() {
  const selectedId = useEditorStore((state) => state.selectedId);
  const scene = useEditorStore((state) => state.scene);
  const applyAgentCommands = useEditorStore((state) => state.applyAgentCommands);
  const [instruction, setInstruction] = useState("");
  const [plan, setPlan] = useState<AgentPlan | null>(null);
  const [plannedSceneUpdatedAt, setPlannedSceneUpdatedAt] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingImageJob, setPendingImageJob] = useState<PendingImageJob | null>(null);

  const context = useMemo(
    () => buildAgentContext(scene, selectedId),
    [scene, selectedId],
  );

  useEffect(() => {
    if (!pendingImageJob) return;
    let active = true;
    const poll = async () => {
      try {
        const response = await fetch(`/api/generations/${pendingImageJob.jobId}`, { cache: "no-store" });
        if (!response.ok || !active) return;
        const job = (await response.json()) as GenerationJob;
        if (job.status === "succeeded") {
          const asset = job.resultAssets[0];
          if (!asset) throw new Error("再生成画像が見つかりません");
          applyAgentCommands([
            {
              type: "replaceImage",
              elementId: pendingImageJob.elementId,
              assetId: asset.id,
              src: asset.url,
            },
          ]);
          setMessages((current) => [
            ...current,
            { id: crypto.randomUUID(), role: "assistant" as const, text: "画像再生成を適用しました。Undoで元に戻せます" },
          ].slice(-10));
          setMessage("画像再生成を適用しました");
          setPendingImageJob(null);
        } else if (job.status === "failed" || job.status === "cancelled") {
          setMessage(job.error ?? "画像再生成を完了できませんでした");
          setPendingImageJob(null);
        }
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : "画像再生成を確認できませんでした");
      }
    };
    const initial = window.setTimeout(poll, 0);
    const timer = window.setInterval(poll, 1600);
    return () => {
      active = false;
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [applyAgentCommands, pendingImageJob]);

  const requestPlan = async () => {
    if (instruction.trim().length < 2) {
      setMessage("変更したい内容を2文字以上で入力してください");
      return;
    }
    setLoading(true);
    setMessage(null);
    setPlan(null);
    try {
      const snapshot = useEditorStore.getState();
      const requestContext = buildAgentContext(snapshot.scene, snapshot.selectedId);
      const response = await fetch("/api/agent/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: instruction.trim(), context: requestContext }),
      });
      const body = (await response.json()) as unknown;
      if (!response.ok) {
        const error = body as { error?: string };
        throw new Error(error.error ?? "操作案を作成できませんでした");
      }
      const nextPlan = agentPlanResponseSchema.parse(body);
      validateCommandsAgainstContext(nextPlan.commands, requestContext);
      setPlan(nextPlan);
      setPlannedSceneUpdatedAt(snapshot.scene.updatedAt);
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "user" as const, text: instruction.trim() },
        { id: crypto.randomUUID(), role: "assistant" as const, text: nextPlan.summary },
      ].slice(-10));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "操作案を作成できませんでした");
    } finally {
      setLoading(false);
    }
  };

  const applyPlan = async () => {
    if (!plan) return;
    setMessage(null);
    if (useEditorStore.getState().scene.updatedAt !== plannedSceneUpdatedAt) {
      setPlan(null);
      setMessage("キャンバスが変更されました。もう一度操作案を作成してください");
      return;
    }
    const currentContext = buildAgentContext(
      useEditorStore.getState().scene,
      useEditorStore.getState().selectedId,
    );
    try {
      validateCommandsAgainstContext(plan.commands, currentContext);
      const regeneration = plan.commands[0]?.type === "regenerateImage" ? plan.commands[0] : null;
      if (regeneration?.type === "regenerateImage") {
        const element = useEditorStore.getState().scene.elements.find((item) => item.id === regeneration.elementId);
        if (element?.type !== "image" || !element.assetId) throw new Error("再生成元の画像が見つかりません");
        const response = await fetch("/api/generations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "edit",
            prompt: regeneration.prompt,
            count: 1,
            modelTier: "default",
            aspectRatio: "16:9",
            sourceAssetId: element.assetId,
            sourceElementId: element.id,
          }),
        });
        const job = (await response.json()) as GenerationJob & { error?: string };
        if (!response.ok) throw new Error(job.error ?? "画像再生成を開始できませんでした");
        setPendingImageJob({ jobId: job.id, elementId: element.id });
        setMessage("画像を再生成しています…");
      } else {
        applyAgentCommands(plan.commands.filter((command) => command.type !== "regenerateImage"));
        setMessage("変更を適用しました。Undoでまとめて元に戻せます");
      }
      setPlan(null);
      setInstruction("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "変更を適用できませんでした");
    }
  };

  const cancelImageJob = async () => {
    if (!pendingImageJob) return;
    await fetch(`/api/generations/${pendingImageJob.jobId}/cancel`, { method: "POST" });
    setPendingImageJob(null);
    setMessage("画像再生成を中止しました");
  };

  return (
    <section className="agent-panel">
      <div className="agent-heading">
        <div><Bot size={16} /><strong>Canvas Agent</strong></div>
        <span>{plan?.provider === "gemini" ? "Gemini" : "Safe mode"}</span>
      </div>
      <p className="agent-description">自然言語を安全な編集コマンドへ変換し、確認後にまとめて適用します。</p>

      {messages.length ? (
        <div className="agent-history" aria-label="エージェント会話履歴">
          {messages.slice(-6).map((item) => (
            <div key={item.id} className={item.role}>
              {item.role === "user" ? <UserRound size={11} /> : <Sparkles size={11} />}
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      ) : null}

      {!plan ? (
        <>
          <div className="agent-examples">
            {examples.map((example) => (
              <button key={example} type="button" onClick={() => setInstruction(example)}>{example}</button>
            ))}
          </div>
          <label className="agent-input">
            <span>変更指示</span>
            <textarea
              rows={3}
              value={instruction}
              placeholder="例：タイトルを72pxにして右へ50px"
              onChange={(event) => setInstruction(event.target.value)}
            />
          </label>
          <button type="button" className="agent-plan-button" disabled={loading || Boolean(pendingImageJob)} onClick={requestPlan}>
            {loading ? <LoaderCircle size={15} className="spin" /> : <Send size={15} />}
            {loading ? "考えています…" : "変更案を作成"}
          </button>
        </>
      ) : (
        <div className="agent-preview">
          <div className="agent-preview-heading"><Check size={14} /><strong>適用前の確認</strong></div>
          <p>{plan.summary}</p>
          <ol>
            {plan.commands.map((command, index) => (
              <li key={`${command.type}-${index}`}>{describeCommand(command, context)}</li>
            ))}
          </ol>
          {plan.warnings.map((warning) => (
            <div key={warning} className="agent-warning"><AlertTriangle size={12} />{warning}</div>
          ))}
          <div className="agent-preview-actions">
            <button type="button" onClick={() => setPlan(null)}><X size={13} />やめる</button>
            <button type="button" className="apply" onClick={applyPlan}><Check size={13} />適用する</button>
          </div>
        </div>
      )}

      {pendingImageJob ? (
        <button type="button" className="agent-cancel-job" onClick={cancelImageJob}>
          <RotateCcw size={12} />画像再生成を中止
        </button>
      ) : null}
      {message ? <p className="agent-message" role="status">{message}</p> : null}
    </section>
  );
}
