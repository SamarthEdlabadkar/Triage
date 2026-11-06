import type { ClinicianModel } from "@/lib/clinician-model";

export function PlanWidget({ model }: { model: ClinicianModel }) {
  if (!model.plan) return null;
  return (
    <article className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 21 }}>Action plan</h3>
          <div className="muted" style={{ fontSize: 13 }}>The status stored on the patient record. Day-by-day zones are not in the file.</div>
        </div>
        <span className="tag tag-neutral">{model.plan.status}</span>
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.6 }}>
        Last updated {model.plan.updated}.
        {model.plan.retest ? ` Retest date ${model.plan.retest}.` : ""}
        {model.plan.retestOverdue ? " That retest date is before this visit." : ""}
      </div>
    </article>
  );
}
