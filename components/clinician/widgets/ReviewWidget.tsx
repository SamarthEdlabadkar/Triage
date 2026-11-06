import type { ClinicianModel } from "@/lib/clinician-model";

export function ReviewWidget({ model, onOpen }: { model: ClinicianModel; onOpen: (index: number | null) => void }) {
  return (
    <article className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 21 }}>Review points</h3>
        <div className="muted" style={{ fontSize: 13 }}>From the record. Open a row for the day behind it.</div>
      </div>
      {model.review.length === 0 ? <div className="muted">Nothing in this window met the review rules.</div> : null}
      {model.review.map((row) => (
        <button key={row.title} type="button" className="hit review-row" onClick={() => onOpen(row.day)}>
          <span className={`tag ${row.tone === "warn" ? "tag-accent" : row.tone === "good" ? "tag-accent-2" : "tag-neutral"}`}>{row.sev}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{row.title}</div>
            <div className="muted" style={{ fontSize: 13 }}>{row.detail}</div>
          </div>
        </button>
      ))}
    </article>
  );
}
