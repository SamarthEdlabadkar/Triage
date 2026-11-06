import { SparkBars } from "./SparkBars";
import type { ClinicianSummary } from "@/lib/summarize";
import type { GroundTruth } from "@/lib/types";

type ClinicianDashboardProps = {
  summary: ClinicianSummary;
  groundTruth: GroundTruth | null;
  patientFiles: string[];
  selectedPatient: string;
  labelFor: (filename: string) => string;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const dateOnly = value.length === 10;
  const date = new Date(dateOnly ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(dateOnly ? {} : { hour: "numeric", minute: "2-digit" }),
  }).format(date);
}

function shortDay(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

function topEntries(counts: Record<string, number>, limit = 5) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

export function ClinicianDashboard({
  summary,
  groundTruth,
  patientFiles,
  selectedPatient,
  labelFor,
}: ClinicianDashboardProps) {
  const dailyMeds = summary.medications.filter((med) => med.adherencePct !== null);
  const prnMeds = summary.medications.filter((med) => med.adherencePct === null);
  const primaryAdherence = dailyMeds[0];
  const zone = summary.actionPlan.status;

  return (
    <div className="dash">
      <div className="ambient" aria-hidden="true">
        <span className="blob blob-a" />
        <span className="blob blob-b" />
        <span className="blob blob-c" />
      </div>

      <header className="topbar glass">
        <div className="brand-block">
          <p className="brand">SMART@Home</p>
          <p className="brand-sub">Clinician pre-visit review</p>
        </div>

        <form className="picker" method="get">
          <label htmlFor="patient">Patient</label>
          <div className="picker-row">
            <select id="patient" name="patient" defaultValue={selectedPatient}>
              {patientFiles.map((filename) => (
                <option key={filename} value={filename}>
                  {labelFor(filename)}
                </option>
              ))}
            </select>
            <button type="submit">Open</button>
          </div>
        </form>
      </header>

      <section className="hero-strip glass enter" aria-labelledby="patient-heading">
        <div className="hero-identity">
          <p className="eyebrow">Synthetic sample · patient-reported</p>
          <h1 id="patient-heading">{summary.patient.displayName}</h1>
          <p className="hero-meta">
            {summary.patient.age}y · {summary.patient.sex} · Study {summary.patient.studyId}
            {summary.patient.conditions.length > 0
              ? ` · ${summary.patient.conditions.join(", ")}`
              : ""}
          </p>
          <div className="chip-row" aria-label="Assigned trackers">
            {summary.patient.trackerNames.map((name) => (
              <span key={name} className="chip">
                {name}
              </span>
            ))}
            {zone ? (
              <span className={`chip chip-zone zone-${zone.toLowerCase()}`}>
                Action plan: {zone}
              </span>
            ) : null}
          </div>
        </div>

        <dl className="stat-rail">
          <div>
            <dt>Last activity</dt>
            <dd>{formatDate(summary.lastActivityAt)}</dd>
          </div>
          <div>
            <dt>Tracker days / {summary.windowDays}d</dt>
            <dd>
              {summary.daysWithTrackerAnswers}
              <span className="stat-soft"> answered</span>
            </dd>
          </div>
          <div>
            <dt>Longest gap</dt>
            <dd>
              {summary.longestGapDays}
              <span className="stat-soft"> day{summary.longestGapDays === 1 ? "" : "s"}</span>
            </dd>
          </div>
          <div>
            <dt>Daily med adherence</dt>
            <dd>
              {primaryAdherence?.adherencePct != null
                ? `${primaryAdherence.adherencePct}%`
                : "—"}
              <span className="stat-soft"> reported</span>
            </dd>
          </div>
        </dl>
      </section>

      <p className="provenance glass enter delay-1" role="note">
        {summary.aggregationNote}
      </p>

      {groundTruth ? (
        <section className="glass panel enter delay-1" aria-labelledby="scenario-title">
          <div className="panel-head">
            <div>
              <p className="panel-kicker">Hackathon scenario note</p>
              <h2 id="scenario-title">30-second clinician read</h2>
            </div>
            <span className="tag">Synthetic ground truth</span>
          </div>
          <p className="scenario-line">{groundTruth.clinician30s}</p>
          <p className="scenario-body">{groundTruth.scenario}</p>
        </section>
      ) : null}

      <div className="grid">
        <section className="glass panel enter delay-2" aria-labelledby="feeling-title">
          <div className="panel-head">
            <div>
              <p className="panel-kicker">Daily feeling</p>
              <h2 id="feeling-title">Last {summary.windowDays} days</h2>
            </div>
            <span className="tag">Face scale</span>
          </div>
          <SparkBars
            values={summary.feelingSeries.map((point) => point.rank)}
            labels={summary.feelingSeries.map((point) =>
              point.label ? `${shortDay(point.day)} · ${point.label}` : `${shortDay(point.day)} · no report`,
            )}
          />
          <div className="legend-row">
            {topEntries(summary.feelingCounts).map(([label, count]) => (
              <span key={label} className="legend-pill">
                {label} <strong>{count}</strong>
              </span>
            ))}
            {Object.keys(summary.feelingCounts).length === 0 ? (
              <span className="muted">No feeling answers in this window.</span>
            ) : null}
          </div>
        </section>

        <section className="glass panel enter delay-2" aria-labelledby="symptom-title">
          <div className="panel-head">
            <div>
              <p className="panel-kicker">Symptoms & triggers</p>
              <h2 id="symptom-title">{summary.symptomDays} days with any</h2>
            </div>
            <span className="tag">Checkbox union / day</span>
          </div>
          {topEntries(summary.symptomCounts).length > 0 ? (
            <ul className="bar-list">
              {topEntries(summary.symptomCounts).map(([label, count]) => (
                <li key={label}>
                  <div className="bar-list-meta">
                    <span>{label}</span>
                    <span>
                      {count}d
                    </span>
                  </div>
                  <div className="bar-track" aria-hidden="true">
                    <span
                      style={{
                        width: `${Math.max(8, (count / summary.windowDays) * 100)}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No symptom or trigger options selected in this window.</p>
          )}

          {summary.yesNoHighlights.length > 0 ? (
            <div className="mini-grid">
              {summary.yesNoHighlights.slice(0, 4).map((item) => (
                <div key={item.key} className="mini-stat">
                  <p>{item.label}</p>
                  <strong>
                    {item.yesDays}
                    <span> / {item.answeredDays} yes</span>
                  </strong>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <section className="glass panel enter delay-3" aria-labelledby="meds-title">
          <div className="panel-head">
            <div>
              <p className="panel-kicker">Medications</p>
              <h2 id="meds-title">Reported administrations</h2>
            </div>
            <span className="tag">Not verified doses</span>
          </div>
          <ul className="med-list">
            {dailyMeds.map((med) => (
              <li key={med.id}>
                <div className="med-top">
                  <div>
                    <strong>{med.name}</strong>
                    <p>
                      {med.howOften} · expected {med.expectedPerDay}/day
                    </p>
                  </div>
                  <div className="med-pct">{med.adherencePct}%</div>
                </div>
                <div className="bar-track" aria-hidden="true">
                  <span style={{ width: `${Math.min(100, med.adherencePct ?? 0)}%` }} />
                </div>
                <p className="med-foot">
                  {med.doseEvents === 1 ? "1 dose event" : `${med.doseEvents} dose events`}
                  {" · "}
                  {med.totalUnits} {med.doseUnit} recorded · {med.windowDays}d window
                </p>
              </li>
            ))}
            {prnMeds.map((med) => (
              <li key={med.id}>
                <div className="med-top">
                  <div>
                    <strong>{med.name}</strong>
                    <p>
                      {med.howOften} · {med.relatedCondition}
                    </p>
                  </div>
                  <div className="med-pct med-pct-soft">
                    {med.daysWithDose}d
                  </div>
                </div>
                <p className="med-foot">
                  {med.totalUnits} {med.doseUnit} on {med.daysWithDose} day
                  {med.daysWithDose === 1 ? "" : "s"} in window
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="glass panel enter delay-3" aria-labelledby="device-title">
          <div className="panel-head">
            <div>
              <p className="panel-kicker">Device / metrics</p>
              <h2 id="device-title">
                {summary.spirometry.available
                  ? summary.deviceName ?? "Spirometry"
                  : "Condition metrics"}
              </h2>
            </div>
            <span className="tag">
              {summary.spirometry.available ? "Home spirometer" : "Tracker numbers"}
            </span>
          </div>

          {summary.spirometry.available ? (
            <>
              <div className="mini-grid">
                <div className="mini-stat">
                  <p>Sessions in window</p>
                  <strong>{summary.spirometry.sessionsInWindow}</strong>
                </div>
                <div className="mini-stat">
                  <p>Latest FEV1 % pred.</p>
                  <strong>
                    {summary.spirometry.latestFev1Pct != null
                      ? `${summary.spirometry.latestFev1Pct}%`
                      : "—"}
                  </strong>
                </div>
                <div className="mini-stat">
                  <p>Window avg % pred.</p>
                  <strong>
                    {summary.spirometry.avgFev1Pct != null
                      ? `${summary.spirometry.avgFev1Pct}%`
                      : "—"}
                  </strong>
                </div>
                <div className="mini-stat">
                  <p>Baseline % pred.</p>
                  <strong>
                    {summary.spirometry.baselineFev1Pct != null
                      ? `${Math.round(summary.spirometry.baselineFev1Pct)}%`
                      : "—"}
                  </strong>
                </div>
              </div>
              {summary.spirometry.series.length > 0 ? (
                <SparkBars
                  className="spiro-spark"
                  max={Math.max(
                    ...summary.spirometry.series.map((s) => s.fev1Pct ?? s.fev1),
                    1,
                  )}
                  values={summary.recentDays.map((day) => {
                    const hit = summary.spirometry.series.find((s) => s.day === day.day);
                    return hit?.fev1Pct ?? hit?.fev1 ?? null;
                  })}
                  labels={summary.recentDays.map((day) => {
                    const hit = summary.spirometry.series.find((s) => s.day === day.day);
                    if (!hit) return `${shortDay(day.day)} · no session`;
                    return `${shortDay(day.day)} · FEV1 ${hit.fev1.toFixed(2)} L${
                      hit.fev1Pct != null ? ` (${hit.fev1Pct}% pred.)` : ""
                    }`;
                  })}
                />
              ) : (
                <p className="muted">
                  Baseline on file, but no parsed FEV1 payloads in this window. Empty spirometry
                  answers are shown as missing, not normal.
                </p>
              )}
              <p className="muted tight">
                % predicted estimated from accepted baseline FEV1 and baseline % predicted.
              </p>
            </>
          ) : (
            <>
              {summary.numberHighlights.length > 0 ? (
                <div className="mini-grid">
                  {summary.numberHighlights.map((item) => (
                    <div key={item.key} className="mini-stat">
                      <p>{item.label}</p>
                      <strong>
                        {item.avg ?? "—"}
                        {item.unit ? <span> {item.unit} avg</span> : <span> avg</span>}
                      </strong>
                      <p className="mini-foot">
                        max {item.max ?? "—"} · {item.answeredDays} days
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">No numeric tracker answers in this window.</p>
              )}
              {summary.choiceHighlights.slice(0, 2).map((item) => (
                <div key={item.key} className="choice-block">
                  <p className="choice-label">{item.label}</p>
                  <div className="legend-row">
                    {topEntries(item.counts, 4).map(([label, count]) => (
                      <span key={label} className="legend-pill">
                        {label} <strong>{count}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </section>
      </div>

      <section className="glass panel enter delay-4" aria-labelledby="timeline-title">
        <div className="panel-head">
          <div>
            <p className="panel-kicker">Recent days</p>
            <h2 id="timeline-title">14-day activity strip</h2>
          </div>
          <span className="tag">
            {summary.multiSubmissionDays} multi-submission day
            {summary.multiSubmissionDays === 1 ? "" : "s"} in window
          </span>
        </div>
        <div className="timeline" role="list">
          {summary.recentDays.map((day) => (
            <article key={day.day} className="day-card" role="listitem">
              <header>
                <strong>{shortDay(day.day)}</strong>
                <span className={day.trackerSubmitted ? "dot on" : "dot"} aria-hidden="true" />
              </header>
              <p className="day-feeling">
                {day.feeling ?? (day.trackerSubmitted ? "Partial" : "No report")}
              </p>
              <p className="day-detail">
                {day.symptoms.length > 0
                  ? day.symptoms.slice(0, 2).join(", ")
                  : day.trackerSubmitted
                    ? "No symptoms flagged"
                    : "Missing ≠ negative"}
              </p>
              {day.fev1 != null ? (
                <p className="day-detail accent">
                  FEV1 {day.fev1.toFixed(2)}
                  {day.fev1Pct != null ? ` · ${day.fev1Pct}%` : ""}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
