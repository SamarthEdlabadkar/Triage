import type { ClinicianModel } from "@/lib/clinician-model";
import type { Chart } from "../chart";
import type { Audience, WidgetId } from "../view-config";
import { moduleAvailable, WIDE_MODULES } from "../view-config";
import { ViewSkeleton } from "../ViewSkeleton";
import { PatientView } from "../views/PatientView";
import { SnapshotWidget } from "../widgets/SnapshotWidget";
import { ChangedWidget } from "../widgets/ChangedWidget";
import { LungWidget } from "../widgets/LungWidget";
import { CompareWidget } from "../widgets/CompareWidget";
import { ReviewWidget } from "../widgets/ReviewWidget";
import { TimelineWidget } from "../widgets/TimelineWidget";
import { PlanWidget } from "../widgets/PlanWidget";

export function OverviewTab({
  model, chart, audience, modules, viewName, showQ, onToggleQuality, onOpenDay, onOpenDate,
}: {
  model: ClinicianModel;
  chart: Chart;
  audience: Audience;
  modules: WidgetId[];
  viewName: string;
  showQ: boolean;
  onToggleQuality: () => void;
  onOpenDay: (index: number | null) => void;
  onOpenDate: (date: string) => void;
}) {
  if (audience === "patient") {
    return <PatientView model={model} chart={chart} onOpen={(index) => onOpenDay(index)} />;
  }

  const visible = modules.filter((id) => moduleAvailable(id, model.patient.kind) && (id !== "plan" || Boolean(model.plan)));
  return (
    <ViewSkeleton
      variant="clinician"
      footer={<p className="muted" style={{ fontSize: 12 }}>Showing {visible.length} modules in {viewName}. {model.aggregationNote}</p>}
    >
      {visible.map((id) => (
        <div key={id} className={WIDE_MODULES.has(id) ? "span-12" : "span-6"}>
          {id === "snapshot" ? <SnapshotWidget model={model} onOpenDate={onOpenDate} /> : null}
          {id === "changed" ? <ChangedWidget model={model} onOpen={onOpenDay} /> : null}
          {id === "lung" ? <LungWidget model={model} chart={chart} showQ={showQ} onToggle={onToggleQuality} onOpen={onOpenDay} /> : null}
          {id === "compare" ? <CompareWidget model={model} /> : null}
          {id === "review" ? <ReviewWidget model={model} onOpen={onOpenDay} /> : null}
          {id === "timeline" ? <TimelineWidget model={model} chart={chart} onOpen={onOpenDay} /> : null}
          {id === "plan" ? <PlanWidget model={model} /> : null}
        </div>
      ))}
    </ViewSkeleton>
  );
}
