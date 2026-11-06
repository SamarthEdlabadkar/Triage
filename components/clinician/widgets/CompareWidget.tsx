import type { ClinicianModel } from "@/lib/clinician-model";

export function CompareWidget({ model }: { model: ClinicianModel }) {
  return (
    <article className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 21 }}>First half vs second half</h3>
        <div className="muted" style={{ fontSize: 13 }}>{model.halfLabel.before} versus {model.halfLabel.after}</div>
      </div>
      {model.compare.map((row) => (
        <div key={row.label} className="compare-row">
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{row.label}</div>
            <div className="faint" style={{ fontSize: 11 }}>{row.note}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ height: 12, borderRadius: 999, background: "var(--color-neutral-400)", width: row.beforeWidth }} /><span style={{ fontSize: 12 }}>{row.before}</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ height: 12, borderRadius: 999, background: "var(--color-accent-2-600)", width: row.afterWidth }} /><span style={{ fontSize: 12, fontWeight: 700 }}>{row.after}</span></div>
          </div>
        </div>
      ))}
      <div className="muted" style={{ fontSize: 12, background: "var(--color-neutral-100)", borderRadius: 16, padding: "10px 14px" }}>{model.compareNote}</div>
    </article>
  );
}
