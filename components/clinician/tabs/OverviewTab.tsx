"use client";
import type { ClinicianModel } from "@/lib/clinician-model";
import type { Chart } from "../chart";
import type { Audience, WidgetId } from "../view-config";
import { moduleAvailable, TRACKER_MODULES, WIDE_MODULES } from "../view-config";
import { ViewSkeleton } from "../ViewSkeleton";
import { PatientView } from "../views/PatientView";
import { SnapshotWidget } from "../widgets/SnapshotWidget";
import { ChangedWidget } from "../widgets/ChangedWidget";
import { LungWidget } from "../widgets/LungWidget";
import { CompareWidget } from "../widgets/CompareWidget";
import { ReviewWidget } from "../widgets/ReviewWidget";
import { TimelineWidget } from "../widgets/TimelineWidget";
import { TrackerWidget } from "../widgets/TrackerWidget";

export function OverviewTab({
  model, chart, audience, modules, showQ, onToggleQuality, onOpenDay, onOpenDate,
}: {
  model: ClinicianModel;
  chart: Chart;
  audience: Audience;
  modules: WidgetId[];
  showQ: boolean;
  onToggleQuality: () => void;
  onOpenDay: (index: number | null) => void;
  onOpenDate: (date: string) => void;
}) {
  if (audience === "patient") {
    return <PatientView model={model} chart={chart} onOpen={(index) => onOpenDay(index)} />;
  }

  const visible = modules.filter((id) => moduleAvailable(id, model));
  return (
    <ViewSkeleton variant="clinician">
      {visible.map((id) => (
        <div key={id} className={WIDE_MODULES.has(id) ? "span-12" : "span-6"}>
          {id === "snapshot" ? <SnapshotWidget model={model} onOpenDate={onOpenDate} /> : null}
          {id === "changed" ? <ChangedWidget model={model} onOpen={onOpenDay} /> : null}
          {id === "lung" ? <LungWidget model={model} chart={chart} showQ={showQ} onToggle={onToggleQuality} onOpen={onOpenDay} /> : null}
          {id === "compare" ? <CompareWidget model={model} /> : null}
          {id === "review" ? <ReviewWidget model={model} onOpen={onOpenDay} /> : null}
          {id === "timeline" ? <TimelineWidget model={model} chart={chart} onOpen={onOpenDay} /> : null}
          {TRACKER_MODULES.includes(id) ? <TrackerWidget id={id} model={model} onOpen={(index) => onOpenDay(index)} /> : null}
        </div>
      ))}
    </ViewSkeleton>
  );
}
