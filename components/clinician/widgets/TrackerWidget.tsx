import type { ClinicianModel } from "@/lib/clinician-model";
import type { WidgetId } from "../view-config";
import { WIDGETS } from "../view-config";
import { trackerEmptyMessage, trackerRows } from "../shared/tracker-rows";

export function TrackerWidget({ id, model, onOpen }: { id: WidgetId; model: ClinicianModel; onOpen: (index: number) => void }) {
  const entries = trackerRows(model, id).slice(-4).reverse();
  const generic = id === "mood" || id === "adverse" || id === "medication";
  return (
    <article className="card tracker-widget">
      <div>
        <p className="kicker">{generic ? "General module" : "SMART@Home tracker"}</p>
        <h3>{WIDGETS[id].name}</h3>
        <p className="muted">{id === "medication"
          ? "Patient-marked administrations. Unmarked is not a confirmed missed dose."
          : id === "mood" && model.patient.kind !== "mood"
            ? "Feeling answers from the selected tracker; no separate mood submission is implied."
            : "Latest patient-reported answers. Select a day for the full submission."}</p>
      </div>
      <div className="tracker-entries">
        {entries.length ? entries.map(({ date, short, detail, index }) => (
          <button className="hit tracker-entry" type="button" key={date} onClick={() => onOpen(index)}>
            <strong>{short}</strong>
            <span>{detail}</span>
          </button>
        )) : <p className="tracker-empty">{trackerEmptyMessage(id)}</p>}
      </div>
    </article>
  );
}
