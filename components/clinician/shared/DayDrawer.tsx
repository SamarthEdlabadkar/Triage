import type { DayView } from "@/lib/clinician-model";

export function DayDrawer({ day, fromRecords, onClose, onPrev, onNext }: {
  day: DayView;
  fromRecords: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "color-mix(in srgb, var(--color-neutral-900) 35%, transparent)", zIndex: 20 }} />
      <aside className="drawer" style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(480px, 100%)", background: "var(--color-bg)", boxShadow: "var(--shadow-lg)", zIndex: 21, overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-icon" type="button" onClick={onPrev} aria-label="Previous day">‹</button>
          <button className="btn btn-secondary btn-icon" type="button" onClick={onNext} aria-label="Next day">›</button>
          <button className="btn btn-ghost" type="button" style={{ marginLeft: "auto" }} onClick={onClose}>Close</button>
        </div>
        <div>
          <div className="muted" style={{ fontSize: 12 }}>Day detail</div>
          <h2 style={{ margin: 0, fontSize: 28 }}>{day.long}</h2>
          {!day.active ? <div className="tag tag-neutral" style={{ marginTop: 8 }}>Before this tracker was assigned</div> : null}
          {day.conflict ? <div style={{ marginTop: 10, background: "var(--color-accent-100)", color: "var(--color-accent-900)", borderRadius: 18, padding: "12px 16px", fontSize: 13 }}>{day.conflict}</div> : null}
        </div>
        <section>
          <h4 style={{ margin: "0 0 8px", fontSize: 17 }}>Tracker submissions</h4>
          {day.submissions.length === 0 ? <div className="muted">No entries this day.</div> : null}
          {day.submissions.map((submission, index) => (
            <div key={index} style={{ padding: "10px 14px", borderRadius: 16, marginBottom: 8, background: submission.counts ? "var(--color-surface)" : "var(--color-neutral-100)", opacity: submission.blank ? 0.65 : 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{submission.time}{submission.counts ? " · used in the summary" : ""}</div>
              <div className="muted" style={{ fontSize: 13 }}>
                {submission.blank
                  ? "Opened, no answers"
                  : (fromRecords ? submission.detailLines : submission.lines).join(" · ") || "Responses shown in the table"}
              </div>
            </div>
          ))}
        </section>
        {day.doses.length ? <section>
          <h4 style={{ margin: "0 0 8px", fontSize: 17 }}>Medication</h4>
          {day.doses.map((dose) => (
            <div key={`${dose.name}-${dose.slot}`} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 14px", borderRadius: 16, background: "var(--color-surface)", marginBottom: 8, fontSize: 13 }}>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 700 }}>{dose.name}</div><div className="muted">{dose.slot}</div></div>
              <span className={`tag ${dose.tone === "good" ? "tag-accent-2" : dose.tone === "warn" ? "tag-accent" : "tag-neutral"}`}>{dose.status}</span>
            </div>
          ))}
        </section> : null}
        {day.blows.length ? (
          <section>
            <h4 style={{ margin: "0 0 8px", fontSize: 17 }}>Spirometer blows</h4>
            <div className="scroll-x">
            <table className="table" style={{ fontSize: 13 }}>
              <thead><tr><th>#</th><th>FEV1</th><th>FVC</th><th>Peak flow</th><th>Quality</th></tr></thead>
              <tbody>
                {day.blows.map((blow) => (
                  <tr key={blow.n} style={{ fontWeight: blow.best ? 700 : 400 }}>
                    <td>{blow.n}</td><td>{blow.fev1}</td><td>{blow.fvc}</td><td>{blow.pef}</td>
                    <td><span className={`tag ${blow.ok ? "tag-accent-2" : "tag-accent"}`}>{blow.quality}</span>{blow.note ? <div className="muted" style={{ fontWeight: 400, fontSize: 11 }}>{blow.note}</div> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>Bold is the best blow, the one used on the chart. Peak flow is converted from liters per second.</div>
          </section>
        ) : null}
      </aside>
    </>
  );
}
