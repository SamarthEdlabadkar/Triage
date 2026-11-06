import type { Chart } from "../chart";

export function ChartFrame({ chart, points, height, onOpen }: { chart: Chart; points: Chart["points"]; height: number; onOpen: (index: number) => void }) {
  return (
    <div>
      <div style={{ position: "relative", height, marginLeft: 44 }}>
        {chart.grid.map((line) => (
          <div key={line.label} style={{ position: "absolute", left: 0, right: 0, top: line.top, borderTop: "1px solid var(--color-divider)" }}>
            <span className="faint" style={{ position: "absolute", left: -44, top: -8, fontSize: 11 }}>{line.label}</span>
          </div>
        ))}
        {chart.predTop ? <div style={{ position: "absolute", left: 0, right: 0, top: chart.predTop, borderTop: "2px dashed var(--color-accent-2-600)" }} /> : null}
        <svg viewBox="0 0 1000 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
          <path d={chart.path} fill="none" stroke="var(--color-accent-2-600)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        </svg>
        {points.map((point) => (
          <button
            key={point.index}
            type="button"
            className="chart-point"
            title={point.title}
            aria-label={point.title}
            onClick={() => onOpen(point.index)}
            style={{
              position: "absolute",
              left: point.left,
              top: point.top,
              borderRadius: "50%",
              background: point.ok ? "var(--color-accent-2-700)" : "var(--color-neutral-100)",
              border: point.ok ? "2px solid var(--color-surface)" : "2.5px solid var(--color-accent-600)",
              cursor: "pointer",
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginLeft: 44, fontSize: 11 }} className="faint">
        {chart.labels.map((label) => <span key={label}>{label}</span>)}
      </div>
    </div>
  );
}
