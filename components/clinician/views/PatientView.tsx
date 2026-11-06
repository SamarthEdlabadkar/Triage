import type { ClinicianModel } from "@/lib/clinician-model";
import type { Chart } from "../chart";
import { ViewSkeleton } from "../ViewSkeleton";
import { ChartFrame } from "../shared/ChartFrame";

export function PatientView({ model, chart, onOpen }: { model: ClinicianModel; chart: Chart; onOpen: (index: number) => void }) {
  const withoutSymptoms = model.days.filter((day) => day.logged && day.symptoms.length === 0 && day.headache !== true).length;
  const withSymptoms = model.days.filter((day) => day.logged && (day.symptoms.length > 0 || day.headache === true)).length;
  const noResponse = model.days.filter((day) => day.active && !day.logged).length;
  const hasSymptoms = model.days.some((day) => day.symptoms.length || day.headache !== null);
  const hasMedicine = Boolean(model.dailyMedName);
  const latest = model.days.filter((day) => day.logged).at(-1);
  return (
    <ViewSkeleton variant="patient">
      <header>
        <p className="kicker">Patient view · synthetic example</p>
        <h2>{model.patient.name.split(" ")[0]}’s last 4 weeks</h2>
        <p className="muted">A simple look at what was reported at home. You can discuss any day with your care team.</p>
      </header>
      <div className="patient-view-grid">
        <article className="card patient-view-card">
          <h3>Days you checked in</h3>
          <p><strong>{model.days.filter((day) => day.logged).length}</strong> days with a tracker response</p>
          {hasSymptoms ? <p><strong>{withoutSymptoms}</strong> days without symptoms reported · <strong>{withSymptoms}</strong> days with symptoms reported</p> : null}
          <p className="muted">{noResponse} days had no tracker response. A missing response does not say how you felt.</p>
        </article>
        {latest && !hasSymptoms ? (
          <article className="card patient-view-card">
            <h3>Latest check-in</h3>
            <p><strong>{latest.short}</strong></p>
            <p>{latest.submissions.filter((submission) => !submission.blank).at(-1)?.lines.join(" · ")}</p>
          </article>
        ) : null}
        {hasMedicine ? (
        <article className="card patient-view-card">
          <h3>Daily medicine</h3>
          <p>Marked taken <strong>{model.doseLegend.taken}</strong> times</p>
          <p>Not marked <strong>{model.doseLegend.open}</strong> times</p>
          <p className="muted">These are your app marks. Not marked does not confirm a dose was skipped.</p>
        </article>
        ) : null}
      </div>
      {model.patient.kind === "asthma" && model.days.some((day) => day.fev1 != null) ? (
        <article className="card patient-view-card">
          <h3>Breathing test</h3>
          <p className="muted">FEV1 is the air blown out in one second. This chart uses home readings that passed the device check.</p>
          <ChartFrame chart={chart} points={chart.points.filter((point) => point.ok)} height={220} onOpen={onOpen} />
        </article>
      ) : null}
    </ViewSkeleton>
  );
}
