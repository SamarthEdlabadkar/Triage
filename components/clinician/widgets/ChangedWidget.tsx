import type { ClinicianModel } from "@/lib/clinician-model";

export function ChangedWidget({ model, onOpen }: { model: ClinicianModel; onOpen: (index: number | null) => void }) {
  return (
    <article className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 21 }}>What changed</h3>
        <div className="muted" style={{ fontSize: 13 }}>{model.halfLabel.before} versus {model.halfLabel.after}</div>
      </div>
      {model.changed.map((row) => (
        <button key={row.title} type="button" className="hit" onClick={() => onOpen(row.day)} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 12px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{row.title}</div>
            <div className="muted" style={{ fontSize: 13 }}>{row.detail}</div>
          </div>
          <span className={`tag ${row.tag === "Similar" || row.tag === "Not comparable" ? "tag-neutral" : row.good ? "tag-accent-2" : "tag-accent"}`}>{row.tag}</span>
        </button>
      ))}
    </article>
  );
}
