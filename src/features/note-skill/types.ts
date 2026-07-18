import type { NoteBrief, NoteDesignDirection } from "@/features/canvas/types";

export type NoteSkillInput = Pick<NoteBrief, "title" | "body" | "audience">;

export type NoteDesignPlan = {
  id: string;
  direction: NoteDesignDirection;
  label: string;
  copy: string;
  description: string;
  palette: [string, string, string];
};

export type NoteSkillAnalysis = {
  brief: NoteBrief;
  plans: NoteDesignPlan[];
};
