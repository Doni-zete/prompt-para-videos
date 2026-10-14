import type { LucideIcon } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface ToolField {
  id: string;
  label: string;
  kind: "text" | "textarea" | "select";
  placeholder?: string;
  options?: SelectOption[];
  defaultValue?: string;
  required?: boolean;
  help?: string;
}

export interface ToolInputConfig {
  images?: { min: number; max: number; label: string; hint: string };
  video?: { maxMB: number; label: string; hint: string };
  fields: ToolField[];
}

export interface ToolDef {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  panelTitle: string;
  resultTitle: string;
  cta: string;
  notice: string;
  emptyTitle: string;
  emptyText: string;
  input: ToolInputConfig;
  system: string;
  buildPrompt: (values: Record<string, string>) => string;
  temperature?: number;
}
