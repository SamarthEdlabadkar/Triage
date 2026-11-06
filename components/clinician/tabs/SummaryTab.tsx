import type { ClinicianModel } from "@/lib/clinician-model";
import { download } from "../shared/utils";

export function SummaryTab({ model, copied, onCopy }: { model: ClinicianModel; copied: boolean; onCopy: () => void }) {
  return (
    <div className="summary-layout">
      <div className="summary-content">
        <header className="summary-heading">
          <div className="kicker" style={{ color: "var(--color-accent-700)" }}>Visit summary</div>
          <h2 className="summary-title">{model.patient.name}</h2>
          <p className="muted summary-context">{model.patient.trackerName} · {model.rangeLabel}</p>
        </header>
        <section aria-labelledby="summary-highlights">
          <h3 id="summary-highlights" className="summary-section-title">At a glance</h3>
          <div className="summary-widget-grid">
            {model.summary.map((section) => (
              <article key={section.title} className="card summary-widget">
                <h4>{section.title}</h4>
                <p>{section.text}</p>
              </article>
            ))}
          </div>
        </section>
        <section aria-labelledby="summary-tracker">
          <h3 id="summary-tracker" className="summary-section-title">Tracker responses</h3>
          <p className="muted summary-section-note">Latest reported answer for each question in this window. Earlier entries are available in Daily records.</p>
          <div className="summary-widget-grid">
            {model.trackerSummary.map((item) => (
              <article key={item.question} className="card summary-widget">
                <h4>{item.title}</h4>
                <p className="muted summary-question">{item.question}</p>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
      <aside className="card summary-export" aria-label="Export visit summary">
        <h3>Export</h3>
        <button className="btn btn-primary" type="button" onClick={onCopy}>{copied ? "Copied" : "Copy summary"}</button>
        <button className="btn btn-secondary" type="button" onClick={() => download(`${model.patient.file.replace(".json", "")}-summary.txt`, model.summaryText, "text/plain")}>Download .txt</button>
        <button className="btn btn-secondary" type="button" onClick={() => download(`${model.patient.file.replace(".json", "")}-daily.csv`, model.csv, "text/csv")}>Daily data .csv</button>
        <p className="muted">Every figure is from the synthetic home record and carries the limits of self-report.</p>
      </aside>
    </div>
  );
}
