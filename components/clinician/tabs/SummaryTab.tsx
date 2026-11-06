import type { ClinicianModel } from "@/lib/clinician-model";
import { download } from "../shared/utils";

export function SummaryTab({ model, copied, onCopy }: { model: ClinicianModel; copied: boolean; onCopy: () => void }) {
  return (
    <div className="split" style={{ display: "grid", gridTemplateColumns: "minmax(0, 760px) minmax(220px, 300px)", gap: 20, alignItems: "start" }}>
      <article className="summary-doc" style={{ background: "var(--color-neutral-100)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-md)", display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <div className="kicker" style={{ color: "var(--color-accent-700)" }}>Visit summary · factual findings</div>
          <h2 className="summary-title" style={{ margin: "4px 0 0" }}>{model.patient.name}, {model.patient.age} y — {model.patient.trackerName}</h2>
          <div className="muted" style={{ fontSize: 13 }}>{model.rangeLabel}</div>
        </div>
        {model.summary.map((section) => (
          <div key={section.title} className="summary-row">
            <div style={{ fontWeight: 700, fontSize: 13 }}>{section.title}</div>
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>{section.text}</div>
          </div>
        ))}
      </article>
      <aside className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 18 }}>Export</div>
        <button className="btn btn-primary" type="button" onClick={onCopy}>{copied ? "Copied" : "Copy summary"}</button>
        <button className="btn btn-secondary" type="button" onClick={() => download(`${model.patient.file.replace(".json", "")}-summary.txt`, model.summaryText, "text/plain")}>Download .txt</button>
        <button className="btn btn-secondary" type="button" onClick={() => download(`${model.patient.file.replace(".json", "")}-daily.csv`, model.csv, "text/csv")}>Daily data .csv</button>
        <div className="muted" style={{ fontSize: 12 }}>Every figure is from the synthetic home record and carries the limits of self-report.</div>
      </aside>
    </div>
  );
}
