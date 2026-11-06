import type { ClinicianModel } from "@/lib/clinician-model";

export type Audience = "clinician" | "patient";
export type PageId = "overview" | "records" | "summary";
export type WidgetId = "snapshot" | "changed" | "lung" | "compare" | "review" | "timeline" | "plan";
export type SpecialistView = { id: string; name: string; modules: WidgetId[] };

export const WIDGETS: Record<WidgetId, { name: string; desc: string }> = {
  snapshot: { name: "Overview and calendar", desc: "Key reported measures beside a month calendar" },
  changed: { name: "What changed", desc: "Last 14 days versus the 14 before" },
  lung: { name: "Lung function", desc: "Quality-aware FEV1 chart" },
  compare: { name: "Window comparison", desc: "The two halves of this window" },
  review: { name: "Review points", desc: "Conflicts, gaps, and record notes" },
  timeline: { name: "Synchronized timeline", desc: "Measures aligned by date" },
  plan: { name: "Action plan", desc: "The status stored on the record" },
};

export const MODULE_IDS = Object.keys(WIDGETS) as WidgetId[];
export const GENERAL_MODULES: WidgetId[] = ["snapshot", "changed", "lung", "compare", "review", "timeline", "plan"];
export const WIDE_MODULES = new Set<WidgetId>(["snapshot", "timeline"]);
export const STORAGE_KEY = "smarthome-specialist-views-v1";

export function moduleAvailable(id: WidgetId, kind: ClinicianModel["patient"]["kind"]) {
  return kind === "asthma" || (id !== "lung" && id !== "plan");
}

export function readSpecialistViews(): SpecialistView[] {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(stored)) return [];
    return stored.flatMap((item) => {
      if (!item || typeof item.id !== "string" || typeof item.name !== "string" || !Array.isArray(item.modules)) return [];
      const modules = item.modules.filter((id: unknown): id is WidgetId => typeof id === "string" && MODULE_IDS.includes(id as WidgetId));
      return modules.length ? [{ id: item.id, name: item.name, modules }] : [];
    });
  } catch {
    return [];
  }
}
