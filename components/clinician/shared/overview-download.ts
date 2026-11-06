import type { ClinicianModel } from "@/lib/clinician-model";
import type { WidgetId } from "../view-config";
import { TRACKER_MODULES, WIDGETS } from "../view-config";
import { trackerEmptyMessage, trackerRows } from "./tracker-rows";

export async function downloadOverviewPdf(model: ClinicianModel, visible: WidgetId[], viewName: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 42;
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  const bottom = doc.internal.pageSize.getHeight() - margin;
  let y = margin;
  const write = (value: string, size = 10, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(value, width) as string[];
    const height = lines.length * (size + 4);
    if (y + height > bottom) { doc.addPage(); y = margin; }
    doc.text(lines, margin, y);
    y += height + 3;
  };
  const heading = (value: string) => { y += 8; write(value, 13, true); };

  write("SMART@Home overview · synthetic example", 16, true);
  write(`${model.patient.name} · ${model.patient.trackerName} · ${viewName} view`, 11);
  write(`${model.rangeLabel} · ${model.lastEntry}`, 9);
  write("Home reports are patient-entered. Medication marks are not verified doses; missing entries are not negative findings.", 9);

  for (const id of visible) {
    heading(WIDGETS[id].name);
    if (id === "snapshot") {
      for (const card of model.cards) write(`${card.kicker}: ${card.value} ${card.unit}. ${card.line}`, 9);
      write(`${model.days.filter((day) => day.logged).length} days with reports in this 28-day window.`, 9);
    } else if (id === "changed") {
      for (const row of model.changed) write(`${row.title}: ${row.detail} (${row.tag})`, 9);
    } else if (id === "lung") {
      for (const day of model.days.filter((item) => item.fev1 != null)) write(`${day.short}: ${day.fev1?.toFixed(2)} L FEV1 · ${day.fevOk ? "passed quality check" : "quality flagged"}`, 9);
    } else if (id === "compare") {
      for (const row of model.compare) write(`${row.label}: ${row.before} then ${row.after}. ${row.note}.`, 9);
    } else if (id === "review") {
      for (const row of model.review) write(`${row.sev}: ${row.title}. ${row.detail}`, 9);
    } else if (id === "timeline") {
      for (const day of model.days.filter((item) => item.logged || item.fev1 != null || item.doses.length)) {
        const parts = [`${day.short}: ${day.logged ? "tracker entry" : "no tracker entry"}`];
        if (day.symptoms.length) parts.push(`symptoms ${day.symptoms.join(", ")}`);
        if (day.fev1 != null) parts.push(`FEV1 ${day.fev1.toFixed(2)} L`);
        if (day.slots.length) parts.push(`${day.slots.filter((slot) => slot === "taken").length}/${day.slots.length} doses marked`);
        write(parts.join(" · "), 9);
      }
    } else if (id === "plan" && model.plan) {
      write(`Status: ${model.plan.status}. Updated ${model.plan.updated}.${model.plan.retest ? ` Retest ${model.plan.retest}.` : ""}`, 9);
    } else if (TRACKER_MODULES.includes(id)) {
      const rows = trackerRows(model, id).slice(-8);
      if (!rows.length) write(trackerEmptyMessage(id), 9);
      for (const row of rows) write(`${row.short}: ${row.detail}`, 9);
    }
  }
  heading("How this overview was derived");
  write(model.aggregationNote, 8);
  doc.save(`${model.patient.file.replace(/\.json$/i, "")}-overview.pdf`);
}
