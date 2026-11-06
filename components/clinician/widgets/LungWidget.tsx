import type { ClinicianModel } from "@/lib/clinician-model";
import type { Chart } from "../chart";
import { ChartFrame } from "../shared/ChartFrame";

export function LungWidget({ model, chart, showQ, onToggle, onOpen }: { model: ClinicianModel; chart: Chart; showQ: boolean; onToggle: () => void; onOpen: (index: number) => void }) {
  const points = showQ ? chart.points : chart.points.filter((point) => point.ok);
  return (
    <article className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 240px" }}>
          <h3 style={{ margin: 0, fontSize: 21 }}>Lung function (FEV1)</h3>
          <div className="muted" style={{ fontSize: 13 }}>Home spirometer · best blow per day · passed means accepted and quality check Accept</div>
        </div>
        <button className="btn btn-secondary" type="button" onClick={onToggle}>{showQ ? "Hide questionable" : "Show questionable"}</button>
      </div>
      <ChartFrame chart={chart} points={points} height={230} onOpen={onOpen} />
      <div className="faint" style={{ fontSize: 12 }}>{model.aggregationNote}</div>
    </article>
  );
}
