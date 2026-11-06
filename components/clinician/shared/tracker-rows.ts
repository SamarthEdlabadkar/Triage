import type { ClinicianModel } from "@/lib/clinician-model";
import type { WidgetId } from "../view-config";

export function trackerRows(model: ClinicianModel, id: WidgetId) {
  return model.days.flatMap((day, index) => {
    let detail = "";
    if (id === "adverse") {
      if (model.patient.kind !== "adverse" || !day.logged) return [];
      detail = day.submissions.filter((submission) => !submission.blank).at(-1)?.lines.join(" · ") || "";
    } else {
      if (model.patient.kind !== id || !day.logged) return [];
      detail = day.submissions.filter((submission) => !submission.blank).at(-1)?.lines.join(" · ") || "";
    }
    return detail ? [{ date: day.date, short: day.short, detail, index }] : [];
  });
}

export function trackerEmptyMessage(id: WidgetId) {
  if (id === "adverse") return "No adverse event reports in this patient sample. Missing reports do not establish that no event occurred.";
  return "No entries for this tracker in the window.";
}
