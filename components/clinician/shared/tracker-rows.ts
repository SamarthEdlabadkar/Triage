import type { ClinicianModel } from "@/lib/clinician-model";
import type { WidgetId } from "../view-config";

export function trackerRows(model: ClinicianModel, id: WidgetId) {
  return model.days.flatMap((day, index) => {
    let detail = "";
    if (id === "mood") {
      if (!day.feeling) return [];
      detail = model.patient.kind === "mood"
        ? day.submissions.filter((submission) => !submission.blank).at(-1)?.lines.join(" · ") || `Feeling: ${day.feeling}`
        : `Feeling: ${day.feeling} · ${model.patient.trackerName}`;
    } else if (id === "adverse") {
      if (model.patient.kind !== "adverse" || !day.logged) return [];
      detail = day.submissions.filter((submission) => !submission.blank).at(-1)?.lines.join(" · ") || "";
    } else if (id === "medication") {
      if (!day.doses.length || (!day.logged && !day.doses.some((dose) => dose.tone === "good" || dose.tone === "warn"))) return [];
      detail = day.doses.map((dose) => `${dose.name}: ${dose.status}`).join(" · ");
    } else {
      if (model.patient.kind !== id || !day.logged) return [];
      detail = day.submissions.filter((submission) => !submission.blank).at(-1)?.lines.join(" · ") || "";
    }
    return detail ? [{ date: day.date, short: day.short, detail, index }] : [];
  });
}

export function trackerEmptyMessage(id: WidgetId) {
  if (id === "mood") return "No mood check-in answers in this patient sample. Missing entries do not describe how the patient felt.";
  if (id === "adverse") return "No adverse event reports in this patient sample. Missing reports do not establish that no event occurred.";
  if (id === "medication") return "No medication administration reports for this selected tracker in the window.";
  return "No entries for this tracker in the window.";
}
