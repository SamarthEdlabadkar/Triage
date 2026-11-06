"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";

import {
  answerQuestion,
  type ClinicianModel,
  type DayView,
  type PatientChoice,
} from "@/lib/clinician-model";

type View = "overview" | "timeline" | "ask" | "summary";
type WidgetId = "snapshot" | "changed" | "lung" | "compare" | "review" | "timeline" | "meds" | "plan";

const WIDGETS: Record<WidgetId, { name: string; desc: string }> = {
  snapshot: { name: "30-second snapshot", desc: "The main reported measures" },
  changed: { name: "What changed", desc: "Last 14 days versus the 14 before" },
  lung: { name: "Lung function", desc: "Quality-aware FEV1 chart" },
  compare: { name: "Window comparison", desc: "The two halves of this window" },
  review: { name: "Review points", desc: "Conflicts, gaps, and record notes" },
  timeline: { name: "Synchronized timeline", desc: "Measures aligned by date" },
  meds: { name: "Medication reporting", desc: "Marked and not marked" },
  plan: { name: "Action plan", desc: "The status stored on the record" },
};

const PRESETS: Record<string, { label: string; desc: string; order: WidgetId[]; off: WidgetId[] }> = {
  pulm: {
    label: "Pulmonology",
    desc: "Lung function and the recent change first",
    order: ["snapshot", "changed", "lung", "compare", "review", "timeline", "meds", "plan"],
    off: [],
  },
  primary: {
    label: "Primary care",
    desc: "Reporting, medication, and the plan",
    order: ["snapshot", "changed", "meds", "plan", "review", "timeline", "lung", "compare"],
    off: ["lung", "compare"],
  },
  nurse: {
    label: "Nurse / NP",
    desc: "Pre-visit prep: doses, gaps, follow-ups",
    order: ["snapshot", "meds", "review", "plan", "changed", "timeline", "lung", "compare"],
    off: ["lung", "compare"],
  },
};

function layoutFor(preset: string, kind: ClinicianModel["patient"]["kind"]) {
  const source = PRESETS[preset];
  const unavailable = new Set<WidgetId>();
  if (kind !== "asthma") {
    unavailable.add("lung");
    unavailable.add("plan");
  }
  return source.order.map((id) => ({
    id,
    on: !source.off.includes(id) && !unavailable.has(id),
    wide: id === "snapshot" || id === "timeline",
  }));
}

function download(name: string, text: string, type: string) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([text], { type }));
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}

function slotStyle(slot: "taken" | "open" | undefined) {
  if (slot === "taken") return { background: "var(--color-accent-2-600)", border: "0" };
  return { background: "transparent", border: "1.5px dashed var(--color-neutral-500)" };
}

export function ClinicianApp({
  model,
  patients,
}: {
  model: ClinicianModel;
  patients: PatientChoice[];
}) {
  const [view, setView] = useState<View>("overview");
  const [consult, setConsult] = useState(false);
  const [preset, setPreset] = useState("pulm");
  const [layout, setLayout] = useState(() => layoutFor("pulm", model.patient.kind));
  const [customOpen, setCustomOpen] = useState(false);
  const [day, setDay] = useState<number | null>(null);
  const [showQ, setShowQ] = useState(true);
  const [askInput, setAskInput] = useState("");
  const [asking, setAsking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [msgs, setMsgs] = useState<Array<{ role: "user" | "ai"; text: string; dates: string[] }>>([]);
  const router = useRouter();

  const days = model.days;
  const chart = useMemo(() => buildChart(days, showQ), [days, showQ]);
  const selected = day == null ? null : days[day];

  // Views share one page, so without this a phone stays scrolled partway down the new view.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view, consult]);

  function openDay(index: number | null) {
    if (index == null || index < 0) return;
    setDay(Math.max(0, Math.min(days.length - 1, index)));
  }

  function ask(question: string) {
    const query = question.trim();
    if (!query || asking) return;
    setMsgs((current) => [...current, { role: "user", text: query, dates: [] }]);
    setAskInput("");
    setAsking(true);
    setView("ask");
    setConsult(false);
    const result = answerQuestion(model, query);
    window.setTimeout(() => {
      setMsgs((current) => [...current, { role: "ai", text: result.text, dates: result.dates }]);
      setAsking(false);
    }, 400);
  }

  const visible = layout.filter((item) => item.on);
  const trackers = patients.find((patient) => patient.file === model.patient.file)?.trackers ?? [];
  const href = (file: string, trackerId?: string) => {
    const params = new URLSearchParams({ patient: file });
    if (trackerId) params.set("tracker", trackerId);
    return `/?${params.toString()}`;
  };

  return (
    <div className="shell">
      <header className="app-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--color-accent)", display: "grid", placeItems: "center", color: "var(--color-bg)", fontWeight: 700 }}>
            S
          </div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 21 }}>SMART@Home</div>
        </div>
        {!consult ? (
          <nav className="tabs" aria-label="Clinician views">
            {(
              [
                ["overview", "Overview", "Overview"],
                ["timeline", "Records", "Records"],
                ["ask", "Ask the data", "Ask"],
                ["summary", "Visit summary", "Summary"],
              ] as const
            ).map(([id, label, shortLabel]) => (
              <button
                key={id}
                type="button"
                className="tab"
                aria-current={view === id ? "page" : undefined}
                onClick={() => { setView(id); setConsult(false); }}
                style={{
                  background: view === id ? "var(--color-text)" : "transparent",
                  color: view === id ? "var(--color-bg)" : "var(--color-text)",
                }}
              >
                <span className="hide-phone">{label}</span>
                <span className="only-phone">{shortLabel}</span>
              </button>
            ))}
          </nav>
        ) : null}
        <div className="header-tools">
          <div className="patient-form">
            <label className="muted" htmlFor="patient" style={{ fontSize: 12, alignSelf: "center" }}>Patient</label>
            <select
              id="patient"
              className="select"
              value={model.patient.file}
              onChange={(event) => {
                const file = event.target.value;
                if (file && file !== model.patient.file) router.push(href(file));
              }}
            >
              {patients.map((patient) => (
                <option key={patient.file} value={patient.file}>{patient.name}</option>
              ))}
            </select>
          </div>
          <button className={`btn ${consult ? "btn-primary" : "btn-secondary"}`} type="button" onClick={() => { setConsult((value) => !value); setDay(null); }}>
            {consult ? "Exit consultation mode" : "Consultation mode"}
          </button>
        </div>
      </header>

      <section className="hero">
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--color-accent-2-200)", color: "var(--color-accent-2-800)", display: "grid", placeItems: "center", fontFamily: "var(--font-heading)", fontSize: 20 }}>
            {model.patient.initials}
          </div>
          <div>
            <h1 className="patient-name">{model.patient.name}</h1>
            <div className="muted" style={{ fontSize: 14 }}>{model.visitLabel}</div>
          </div>
        </div>
        {trackers.length > 1 ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label className="muted" htmlFor="tracker" style={{ fontSize: 12 }}>Tracker</label>
            <select
              id="tracker"
              className="select"
              value={model.patient.trackerId}
              onChange={(event) => {
                const trackerId = event.target.value;
                if (trackerId && trackerId !== model.patient.trackerId) router.push(href(model.patient.file, trackerId));
              }}
            >
              {trackers.map((tracker) => (
                <option key={tracker.id} value={tracker.id}>{tracker.name}</option>
              ))}
            </select>
          </div>
        ) : null}
        {!consult && view === "overview" ? (
          <div className="layout-tools">
            <span className="muted" style={{ fontSize: 12 }}>Layout</span>
            {Object.entries(PRESETS).map(([key, item]) => (
              <button
                key={key}
                type="button"
                className="preset"
                aria-pressed={preset === key}
                onClick={() => { setPreset(key); setLayout(layoutFor(key, model.patient.kind)); }}
                style={{
                  background: preset === key ? "var(--color-accent)" : "transparent",
                  color: preset === key ? "var(--color-bg)" : "var(--color-text)",
                }}
              >
                {item.label}
              </button>
            ))}
            <button className="btn btn-secondary" type="button" onClick={() => setCustomOpen(true)}>Customise</button>
          </div>
        ) : null}
      </section>

      <main className="page-main">
        {!consult && view === "overview" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <form
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 8px 8px 20px", background: "var(--color-neutral-100)", borderRadius: 999, boxShadow: "var(--shadow-sm)" }}
              onSubmit={(event) => { event.preventDefault(); ask(askInput); }}
            >
              <input
                value={askInput}
                onChange={(event) => setAskInput(event.target.value)}
                placeholder={`Ask about ${model.patient.name.split(" ")[0]}’s data`}
                className="ask-input"
              />
              <button className="btn btn-primary" type="submit">Ask</button>
            </form>
            <div className="board">
              {visible.map((item) => (
                <div key={item.id} className={item.wide ? "span-12" : "span-6"}>
                  {item.id === "snapshot" ? <Snapshot model={model} onOpen={openDay} onTimeline={() => setView("timeline")} /> : null}
                  {item.id === "changed" ? <Changed model={model} onOpen={openDay} /> : null}
                  {item.id === "lung" ? <Lung model={model} chart={chart} showQ={showQ} onToggle={() => setShowQ((value) => !value)} onOpen={openDay} /> : null}
                  {item.id === "compare" ? <Compare model={model} /> : null}
                  {item.id === "review" ? <Review model={model} onOpen={openDay} /> : null}
                  {item.id === "timeline" ? <Timeline model={model} chart={chart} compact onOpen={openDay} onFull={() => setView("timeline")} /> : null}
                  {item.id === "meds" ? <Meds model={model} onOpen={openDay} /> : null}
                  {item.id === "plan" ? <Plan model={model} /> : null}
                </div>
              ))}
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              Showing {visible.length} widgets · layout “{preset === "custom" ? "Custom" : PRESETS[preset].label}”. {model.aggregationNote}
            </div>
          </div>
        ) : null}

        {!consult && view === "timeline" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Records key={`${model.patient.file}:${model.patient.trackerId}`} model={model} onOpen={openDay} />
          </div>
        ) : null}

        {!consult && view === "ask" ? (
          <Ask
            model={model}
            msgs={msgs}
            asking={asking}
            askInput={askInput}
            setAskInput={setAskInput}
            onAsk={ask}
            onOpenDate={(date) => openDay(days.findIndex((item) => item.date === date))}
          />
        ) : null}

        {!consult && view === "summary" ? (
          <Summary
            model={model}
            copied={copied}
            onCopy={() => {
              navigator.clipboard?.writeText(model.summaryText).catch(() => undefined);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1800);
            }}
          />
        ) : null}

        {consult ? <Consult model={model} chart={chart} /> : null}
      </main>

      {selected ? (
        <Drawer
          day={selected}
          fromRecords={view === "timeline" && !consult}
          onClose={() => setDay(null)}
          onPrev={() => openDay(day! - 1)}
          onNext={() => openDay(day! + 1)}
        />
      ) : null}
      {customOpen ? (
        <Customize
          layout={layout}
          preset={preset}
          onClose={() => setCustomOpen(false)}
          onPreset={(key) => { setPreset(key); setLayout(layoutFor(key, model.patient.kind)); }}
          onEdit={(next) => { setLayout(next); setPreset("custom"); }}
        />
      ) : null}
    </div>
  );
}

function Snapshot({ model, onOpen, onTimeline }: { model: ClinicianModel; onOpen: (index: number | null) => void; onTimeline: () => void }) {
  return (
    <article className="card" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, fontSize: 21 }}>30-second snapshot</h3>
        <span className="muted" style={{ fontSize: 13 }}>Patient-reported unless noted · open a figure for that day</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(210px, 100%), 1fr))", gap: 12 }}>
        {model.cards.map((card) => (
          <button
            key={card.kicker}
            type="button"
            className="tile"
            onClick={() => {
              if (card.view === "timeline") onTimeline();
              else if (card.day != null) onOpen(card.day);
            }}
          >
            <div className="kicker">{card.kicker}</div>
            <div className="figure">{card.value}<span style={{ fontSize: 18 }} className="faint"> {card.unit}</span></div>
            <div style={{ fontSize: 13 }}>{card.line}</div>
            {card.bar ? (
              <div style={{ display: "flex", height: 10, borderRadius: 999, overflow: "hidden", gap: 2, marginTop: 6 }}>
                <div style={{ flex: card.bar.taken, background: "var(--color-accent-2-600)" }} />
                <div style={{ flex: Math.max(card.bar.rest, 0.001), background: "var(--color-neutral-300)" }} />
              </div>
            ) : null}
            <div style={{ fontSize: 12, color: "var(--color-accent-2-800)", fontWeight: 700, marginTop: 4 }}>{card.note}</div>
          </button>
        ))}
      </div>
      <DayStrip days={model.days} onOpen={onOpen} />
    </article>
  );
}

function DayStrip({ days, onOpen }: { days: DayView[]; onOpen: (index: number) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12 }} className="muted">
        <span style={{ fontWeight: 700, color: "var(--color-text)" }}>Reported days</span>
        <span>Filled = symptoms or headache · pale = logged without those · dashed = no entry</span>
      </div>
      <div className="day-strip" style={{ "--day-count": days.length } as CSSProperties}>
        {days.map((day, index) => {
          const marked = day.symptoms.length > 0 || day.headache === true;
          return (
            <button
              key={day.date}
              type="button"
              className="day-cell"
              title={`${day.short}${day.logged ? "" : " · no entry"}`}
              aria-label={`${day.short}: ${!day.logged ? "no entry" : marked ? "symptoms or headache reported" : "logged without symptoms or headache"}`}
              onClick={() => onOpen(index)}
              style={{
                background: !day.logged ? "transparent" : marked ? "var(--color-accent-500)" : "var(--color-accent-2-500)",
                border: day.logged ? "0" : "1.5px dashed var(--color-neutral-500)",
                opacity: day.active ? 1 : 0.35,
              }}
            >
              <span className="only-phone">{day.num}</span>
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }} className="faint">
        <span>{days[0].short}</span>
        <span className="hide-phone">{days[14].short}</span>
        <span>{days[days.length - 1].short}</span>
      </div>
    </div>
  );
}

function Changed({ model, onOpen }: { model: ClinicianModel; onOpen: (index: number | null) => void }) {
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

type Chart = ReturnType<typeof buildChart>;

function Lung({ model, chart, showQ, onToggle, onOpen }: { model: ClinicianModel; chart: Chart; showQ: boolean; onToggle: () => void; onOpen: (index: number) => void }) {
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

function ChartFrame({ chart, points, height, onOpen }: { chart: Chart; points: Chart["points"]; height: number; onOpen: (index: number) => void }) {
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

function Compare({ model }: { model: ClinicianModel }) {
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

function Review({ model, onOpen }: { model: ClinicianModel; onOpen: (index: number | null) => void }) {
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

function Timeline({ model, chart, compact, onOpen, onFull }: { model: ClinicianModel; chart: Chart; compact?: boolean; onOpen: (index: number) => void; onFull?: () => void }) {
  const days = model.days;
  const scroller = useRef<HTMLDivElement>(null);

  // On narrow screens the 28 days overflow; open on the most recent ones.
  useEffect(() => {
    const element = scroller.current;
    if (element) element.scrollLeft = element.scrollWidth;
  }, []);

  return (
    <article className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 21 }}>Synchronized timeline</h3>
          <div className="muted" style={{ fontSize: 13 }}>Aligned by date · select a column for the submissions<span className="scroll-hint"> · swipe right for earlier days</span></div>
        </div>
        {onFull ? <button className="btn btn-ghost" type="button" onClick={onFull}>View records →</button> : null}
      </div>
      <div className="scroll-x" ref={scroller} tabIndex={0} role="region" aria-label="Timeline by date, scrollable">
        <div className="track" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="timeline-dates">
            <Row label="Date">
              {days.map((day) => <span key={day.date} className="faint" style={{ fontSize: 11, textAlign: "center" }} title={day.short}>{day.num}</span>)}
            </Row>
          </div>
          <Row label="Reported">
            {days.map((day, index) => {
              const marked = day.symptoms.length > 0 || day.headache === true;
              return <button key={day.date} type="button" onClick={() => onOpen(index)} style={{ height: 16, borderRadius: 999, background: !day.active || !day.logged ? "transparent" : marked ? "var(--color-accent-500)" : "var(--color-accent-2-500)", border: day.logged ? "0" : "1.5px dashed var(--color-neutral-500)", opacity: day.active ? 1 : 0.35 }} />;
            })}
          </Row>
          <Row label="Symptoms">
            {days.map((day, index) => (
              <button key={day.date} type="button" title={day.symptoms.join(", ")} onClick={() => onOpen(index)} style={{ display: "grid", placeItems: "center", height: 28 }}>
                <span style={{ width: day.logged ? 6 + day.symptoms.length * 4 : 8, height: day.logged ? 6 + day.symptoms.length * 4 : 8, borderRadius: "50%", background: !day.logged ? "transparent" : day.symptoms.length ? "var(--color-accent-500)" : "var(--color-neutral-400)", border: day.logged ? "0" : "1.5px dashed var(--color-neutral-500)" }} />
              </button>
            ))}
          </Row>
          {model.patient.kind !== "ibd" ? (
            <Row label={model.patient.kind === "asthma" ? "Rescue units" : "As-needed units"}>
              {days.map((day, index) => (
                <button key={day.date} type="button" onClick={() => onOpen(index)} style={{ height: "100%", display: "flex", alignItems: "end" }}>
                  <span style={{ display: "block", width: "56%", margin: "0 auto", height: Math.min(24, (day.rescue ?? 0) * 6), background: "var(--color-accent-700)", borderRadius: 4 }} />
                </button>
              ))}
            </Row>
          ) : null}
          <Row label={model.dailyMedName ? "Daily med" : "Daily med"}>
            {days.map((day, index) => (
              <button key={day.date} type="button" onClick={() => onOpen(index)} style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "center" }}>
                {(day.slots.length ? day.slots : ["open" as const]).map((slot, slotIndex) => {
                  const style = day.active ? slotStyle(slot) : { background: "transparent", border: "0" };
                  return <span key={slotIndex} style={{ width: 12, height: 12, borderRadius: 4, boxSizing: "border-box", ...style }} />;
                })}
              </button>
            ))}
          </Row>
          {model.patient.kind === "asthma" ? (
            <div className="tl-row">
              <div className="tl-label">FEV1</div>
              <div style={{ position: "relative", height: compact ? 56 : 90 }}>
                <svg viewBox="0 0 1000 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
                  <path d={chart.path} fill="none" stroke="var(--color-accent-2-600)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                </svg>
                {chart.points.map((point) => (
                  <button key={point.index} type="button" className="timeline-point" title={point.title} aria-label={point.title} onClick={() => onOpen(point.index)} style={{ position: "absolute", left: point.left, top: point.top, width: 9, height: 9, margin: "-4.5px 0 0 -4.5px", borderRadius: "50%", background: point.ok ? "var(--color-accent-2-700)" : "transparent", border: point.ok ? "0" : "2px solid var(--color-accent-600)" }} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="tl-row">
      <div className="tl-label">{label}</div>
      <div className="tl-cells" style={{ display: "grid", gridTemplateColumns: "repeat(28, minmax(0, 1fr))", gap: 3 }}>{children}</div>
    </div>
  );
}

function Meds({ model, onOpen }: { model: ClinicianModel; onOpen: (index: number) => void }) {
  const lead = (new Date(`${model.days[0].date}T12:00:00Z`).getUTCDay() + 6) % 7;
  const cells: Array<DayView | null> = [...Array.from({ length: lead }, () => null), ...model.days];
  return (
    <article className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 21 }}>Medication reporting</h3>
        <div className="muted" style={{ fontSize: 13 }}>{model.dailyMedName ?? "No daily medication"} · a mark means an administration was recorded</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "var(--cal-gap, 6px)" }}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
          <div key={label} className="faint" style={{ fontSize: 11, textAlign: "center", fontWeight: 700 }}>{label}</div>
        ))}
        {cells.map((day, index) => (
          <button key={day?.date ?? `blank-${index}`} type="button" onClick={() => day && onOpen(model.days.indexOf(day))} className="med-cell" style={{ border: 0, background: "transparent", borderRadius: 14, opacity: day?.active === false ? 0.35 : 1, cursor: day ? "pointer" : "default" }}>
            <div className="muted" style={{ fontSize: 11 }}>{day ? day.num : ""}</div>
            <div style={{ display: "flex", gap: 2 }}>
              {(day?.slots.length ? day.slots : day ? ["open" as const] : []).map((slot, slotIndex) => {
                const style = slotStyle(slot);
                return <span key={slotIndex} style={{ flex: 1, height: 16, borderRadius: 999, boxSizing: "border-box", ...style }} />;
              })}
            </div>
          </button>
        ))}
      </div>
      <div className="muted" style={{ fontSize: 12 }}>
        {calendarCaption(model)}
        {model.otherMeds ? ` Also on the record, not drawn as daily slots: ${model.otherMeds}.` : ""}
      </div>
    </article>
  );
}

function calendarCaption(model: ClinicianModel) {
  const active = model.days.filter((day) => day.active);
  const taken = active.reduce((sum, day) => sum + day.slots.filter((slot) => slot === "taken").length, 0);
  const open = active.reduce((sum, day) => sum + day.slots.filter((slot) => slot === "open").length, 0);
  const calendarTotal = taken + open;
  const allTotal = model.doseLegend.taken + model.doseLegend.open;
  const name = model.dailyMedName ?? "Daily medication";
  const base = `${name}: marked ${taken}, not marked ${open}. Not marked includes days with no entry. The file has no skipped flag.`;
  if (allTotal !== calendarTotal) {
    return `${base} The snapshot percentage counts every daily medicine for this condition.`;
  }
  return base;
}

function Plan({ model }: { model: ClinicianModel }) {
  if (!model.plan) return null;
  return (
    <article className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 21 }}>Action plan</h3>
          <div className="muted" style={{ fontSize: 13 }}>The status stored on the patient record. Day-by-day zones are not in the file.</div>
        </div>
        <span className={`tag ${model.plan.expired ? "tag-accent" : "tag-accent-2"}`}>{model.plan.status}</span>
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.6 }}>
        Last updated {model.plan.updated}. Expiration {model.plan.expiration}.
        {model.plan.retest ? ` Retest date ${model.plan.retest}.` : ""}
        {model.plan.retestOverdue ? " That retest date is before this visit." : ""}
      </div>
    </article>
  );
}

function Records({ model, onOpen }: { model: ClinicianModel; onOpen: (index: number) => void }) {
  const [filters, setFilters] = useState({ date: "", feeling: "", symptoms: "", med: "", fev1: "", entries: "" });
  const days = [...model.days].reverse().filter((day) => day.entries > 0);
  const showFeeling = days.some((day) => Boolean(day.feeling));
  const showMed = Boolean(model.dailyMedName) && days.some((day) => day.slots.length > 0);
  const showFev1 = days.some((day) => day.fev1 != null);
  const feelings = [...new Set(days.map((day) => day.feeling).filter((value): value is string => Boolean(value)))].sort();
  const medStatuses = new Set(days.map((day) => !day.slots.length ? "unscheduled" : day.slots.every((slot) => slot === "taken") ? "all" : day.slots.some((slot) => slot === "taken") ? "some" : "none"));
  const fev1Statuses = new Set(days.map((day) => day.fev1 == null ? "missing" : day.fevOk ? "passed" : "flagged"));
  const activeFilters = [filters.date, showFeeling && filters.feeling, filters.symptoms, showMed && filters.med, showFev1 && filters.fev1, filters.entries].filter(Boolean).length;
  const filteredDays = days.filter((day) => {
    const medStatus = !day.slots.length ? "unscheduled" : day.slots.every((slot) => slot === "taken") ? "all" : day.slots.some((slot) => slot === "taken") ? "some" : "none";
    const fev1Status = day.fev1 == null ? "missing" : day.fevOk ? "passed" : "flagged";
    return `${day.dow} ${day.short}`.toLowerCase().includes(filters.date.toLowerCase())
      && (!showFeeling || !filters.feeling || (day.feeling ?? "none") === filters.feeling)
      && (day.symptoms.join(", ") || "none").toLowerCase().includes(filters.symptoms.toLowerCase())
      && (!showMed || !filters.med || medStatus === filters.med)
      && (!showFev1 || !filters.fev1 || fev1Status === filters.fev1)
      && (!filters.entries || day.entries === Number(filters.entries));
  });
  const setFilter = (key: keyof typeof filters, value: string) => setFilters((current) => ({ ...current, [key]: value }));
  return (
    <article className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, fontSize: 21 }}>Daily records</h3>
        <span className="muted" style={{ fontSize: 13 }}>Select a row for submissions, doses, and spirometer blows</span>
        <button className="btn btn-secondary" type="button" style={{ marginLeft: "auto" }} onClick={() => download(`${model.patient.file.replace(".json", "")}-daily.csv`, model.csv, "text/csv")}>Download CSV</button>
      </div>
      <div className="records-tools">
        <details className="records-filter-panel">
          <summary>Filters{activeFilters ? ` (${activeFilters})` : ""}</summary>
          <div className="records-filters">
            <label>Date<input aria-label="Filter by date" value={filters.date} onChange={(event) => setFilter("date", event.target.value)} placeholder="e.g. Nov 5" /></label>
            {showFeeling ? <label>Feeling<select aria-label="Filter by feeling" value={filters.feeling} onChange={(event) => setFilter("feeling", event.target.value)}><option value="">Any feeling</option>{feelings.map((feeling) => <option key={feeling} value={feeling}>{feeling}</option>)}{days.some((day) => !day.feeling) ? <option value="none">No answer</option> : null}</select></label> : null}
            <label>Symptoms<input aria-label="Filter by symptoms" value={filters.symptoms} onChange={(event) => setFilter("symptoms", event.target.value)} placeholder="Search symptoms" /></label>
            {showMed ? <label>Daily med<select aria-label="Filter by daily med" value={filters.med} onChange={(event) => setFilter("med", event.target.value)}><option value="">Any status</option>{medStatuses.has("all") ? <option value="all">All administrations recorded</option> : null}{medStatuses.has("some") ? <option value="some">Some administrations recorded</option> : null}{medStatuses.has("none") ? <option value="none">No administration recorded</option> : null}{medStatuses.has("unscheduled") ? <option value="unscheduled">Not scheduled</option> : null}</select></label> : null}
            {showFev1 ? <label>FEV1<select aria-label="Filter by FEV1" value={filters.fev1} onChange={(event) => setFilter("fev1", event.target.value)}><option value="">Any result</option>{fev1Statuses.has("passed") ? <option value="passed">Passed check</option> : null}{fev1Statuses.has("flagged") ? <option value="flagged">Flagged check</option> : null}{fev1Statuses.has("missing") ? <option value="missing">No reading</option> : null}</select></label> : null}
            <label>Entries<input aria-label="Filter by entries" type="number" min="1" value={filters.entries} onChange={(event) => setFilter("entries", event.target.value)} placeholder="Count" /></label>
            <button className="btn btn-ghost" type="button" onClick={() => setFilters({ date: "", feeling: "", symptoms: "", med: "", fev1: "", entries: "" })}>Clear filters</button>
          </div>
        </details>
        {showMed ? <span className="muted" style={{ fontSize: 12 }}>✓ administration recorded · ✕ none recorded</span> : null}
      </div>
      {/* Explicit roles: the phone layout restyles these rows as stacked cards, which drops native table semantics. */}
      <div className="scroll-x">
        <table className="table records-table" role="table">
          <thead role="rowgroup">
            <tr role="row">
              <th role="columnheader" className="rec-date">Date</th>{showFeeling ? <th role="columnheader" className="rec-feeling">Feeling</th> : null}<th role="columnheader" className="rec-symptoms">Symptoms</th>{showMed ? <th role="columnheader" className="rec-med">Daily med<small className="record-med-name">{model.dailyMedName}</small></th> : null}{showFev1 ? <th role="columnheader" className="rec-fev1">FEV1</th> : null}<th role="columnheader" className="rec-entries">Entries</th>
            </tr>
          </thead>
          <tbody role="rowgroup">
            {filteredDays.map((day) => (
              <tr key={day.date} role="row" tabIndex={0} aria-label={`Open details for ${day.long}`} onClick={() => onOpen(model.days.indexOf(day))} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpen(model.days.indexOf(day)); } }} style={{ cursor: "pointer" }}>
                <td role="cell" className="rec-date" style={{ fontWeight: 700 }}>{day.dow} {day.short}</td>
                {showFeeling ? <td role="cell" className="rec-feeling" data-label="Feeling">{day.feeling ?? "—"}</td> : null}
                <td role="cell" className="rec-symptoms rec-wide" data-label="Symptoms">{day.logged ? day.symptoms.join(", ") || "None" : "—"}</td>
                {showMed ? <td role="cell" className="rec-med" data-label="Daily med" aria-label={`${model.dailyMedName}: ${day.slots.length ? day.slots.map((slot, index) => `dose ${index + 1} ${slot === "taken" ? "recorded" : "not recorded"}`).join(", ") : "not scheduled"}`}>
                  {day.slots.length ? day.slots.map((slot) => (slot === "taken" ? "✓" : "✕")).join(" / ") : "—"}
                </td> : null}
                {showFev1 ? <td role="cell" className="rec-fev1" data-label="FEV1">{day.fev1 == null ? "—" : `${day.fev1.toFixed(2)} L${day.fevOk ? "" : " · flagged"}`}</td> : null}
                <td role="cell" className="rec-entries" data-label="Entries">{day.entries}</td>
              </tr>
            ))}
            {filteredDays.length === 0 ? <tr role="row"><td role="cell" colSpan={3 + Number(showFeeling) + Number(showMed) + Number(showFev1)}>No records match these filters.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function Ask({
  model, msgs, asking, askInput, setAskInput, onAsk, onOpenDate,
}: {
  model: ClinicianModel;
  msgs: Array<{ role: "user" | "ai"; text: string; dates: string[] }>;
  asking: boolean;
  askInput: string;
  setAskInput: (value: string) => void;
  onAsk: (question: string) => void;
  onOpenDate: (date: string) => void;
}) {
  const latest = useRef<HTMLDivElement>(null);

  // When stacked, suggestions sit below the conversation, so a new answer can land off-screen.
  useEffect(() => {
    if (msgs.length) latest.current?.scrollIntoView({ block: "nearest" });
  }, [msgs.length]);

  return (
    <div className="split" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(240px, 320px)", gap: 20, alignItems: "start" }}>
      <article className="card ask-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 21 }}>Ask the data</h3>
          <div className="muted" style={{ fontSize: 13 }}>Answers use only this patient’s records in the 28-day window.</div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
          {msgs.length === 0 && !asking ? (
            <div style={{ padding: "40px 0", textAlign: "center" }} className="muted">Try a suggested question, or ask your own.</div>
          ) : null}
          {msgs.map((message, index) => (
            <div key={index} style={{ display: "flex", justifyContent: message.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: "78%", padding: "12px 16px", borderRadius: 22, background: message.role === "user" ? "var(--color-text)" : "var(--color-neutral-100)", color: message.role === "user" ? "var(--color-bg)" : "var(--color-text)", fontSize: 14, lineHeight: 1.55 }}>
                <div style={{ whiteSpace: "pre-wrap" }}>{message.text}</div>
                {message.dates.length ? (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                    {message.dates.map((date) => (
                      <button key={date} type="button" className="tag tag-outline" onClick={() => onOpenDate(date)}>{date.slice(5)}</button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
          <div ref={latest} className="ask-latest" />
        </div>
        <form style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 6px 6px 18px", background: "var(--color-neutral-100)", borderRadius: 999 }} onSubmit={(event) => { event.preventDefault(); onAsk(askInput); }}>
          <input value={askInput} onChange={(event) => setAskInput(event.target.value)} placeholder="Ask about symptoms, medication, lung function, gaps…" className="ask-input" />
          <button className="btn btn-primary" type="submit">Ask</button>
        </form>
      </article>
      <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="kicker">Suggested</div>
          {model.suggestions.map((suggestion) => (
            <button key={suggestion} type="button" className="suggestion" onClick={() => onAsk(suggestion)}>{suggestion}</button>
          ))}
        </div>
        <div style={{ background: "var(--color-accent-2-100)", color: "var(--color-accent-2-900)", borderRadius: "var(--radius-lg)", padding: 20, fontSize: 13 }}>
          Self-reported data. Check the source day before acting. Nothing is written to the medical record.
        </div>
      </aside>
    </div>
  );
}

function Summary({ model, copied, onCopy }: { model: ClinicianModel; copied: boolean; onCopy: () => void }) {
  return (
    <div className="split" style={{ display: "grid", gridTemplateColumns: "minmax(0, 760px) minmax(220px, 300px)", gap: 20, alignItems: "start" }}>
      <article className="summary-doc" style={{ background: "var(--color-neutral-100)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-md)", display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <div className="kicker" style={{ color: "var(--color-accent-700)" }}>Visit summary · factual findings</div>
          <h2 className="summary-title" style={{ margin: "4px 0 0" }}>{model.patient.name}, {model.patient.age} y — {model.patient.trackerName}</h2>
          <div className="muted" style={{ fontSize: 13 }}>{model.rangeLabel}</div>
        </div>
        {model.summary.map((section) => (
          <div key={section.title} className="summary-row">
            <div style={{ fontWeight: 700, fontSize: 13 }}>{section.title}</div>
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>{section.text}</div>
          </div>
        ))}
      </article>
      <aside className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 18 }}>Export</div>
        <button className="btn btn-primary" type="button" onClick={onCopy}>{copied ? "Copied" : "Copy summary"}</button>
        <button className="btn btn-secondary" type="button" onClick={() => download(`${model.patient.file.replace(".json", "")}-summary.txt`, model.summaryText, "text/plain")}>Download .txt</button>
        <button className="btn btn-secondary" type="button" onClick={() => download(`${model.patient.file.replace(".json", "")}-daily.csv`, model.csv, "text/csv")}>Daily data .csv</button>
        <div className="muted" style={{ fontSize: 12 }}>Every figure is from the synthetic home record and carries the limits of self-report.</div>
      </aside>
    </div>
  );
}

function Consult({ model, chart }: { model: ClinicianModel; chart: Chart }) {
  const good = model.days.filter((day) => day.logged && day.symptoms.length === 0 && day.headache !== true).length;
  const hard = model.days.filter((day) => day.logged && (day.symptoms.length > 0 || day.headache === true)).length;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <h2 className="consult-title">{model.patient.name.split(" ")[0]}’s last 4 weeks</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: 24 }}>
        <article className="card consult-card">
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 28 }}>How the days were reported</div>
          <div style={{ fontSize: 22, marginTop: 12 }}><b>{good} quieter days</b>, {hard} days with symptoms or headache</div>
        </article>
        <article className="card consult-card">
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 28 }}>Daily medicine</div>
          <div style={{ fontSize: 22, marginTop: 12 }}>Marked taken <b>{model.doseLegend.taken}</b> times. Not marked <b>{model.doseLegend.open}</b> times.</div>
          <div className="muted" style={{ marginTop: 8 }}>A missing mark is not proof a dose was skipped.</div>
        </article>
      </div>
      {model.patient.kind === "asthma" ? (
        <article className="card consult-card">
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 28 }}>Breathing test</div>
          <div style={{ fontSize: 18, margin: "8px 0 16px" }}>Air blown out in one second, using blows that passed the device check. Higher on the chart is a larger volume.</div>
          <ChartFrame chart={chart} points={chart.points.filter((point) => point.ok)} height={240} onOpen={() => undefined} />
        </article>
      ) : null}
    </div>
  );
}

function Drawer({ day, fromRecords, onClose, onPrev, onNext }: { day: DayView; fromRecords: boolean; onClose: () => void; onPrev: () => void; onNext: () => void }) {
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
              <div className="muted" style={{ fontSize: 13 }}>{submission.blank ? "Opened, no answers" : (fromRecords ? submission.detailLines : submission.lines).join(" · ") || "Responses shown in the table"}</div>
            </div>
          ))}
        </section>
        <section>
          <h4 style={{ margin: "0 0 8px", fontSize: 17 }}>Medication</h4>
          {day.doses.length === 0 ? <div className="muted">No scheduled medication to show.</div> : null}
          {day.doses.map((dose) => (
            <div key={`${dose.name}-${dose.slot}`} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 14px", borderRadius: 16, background: "var(--color-surface)", marginBottom: 8, fontSize: 13 }}>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 700 }}>{dose.name}</div><div className="muted">{dose.slot}</div></div>
              <span className={`tag ${dose.tone === "good" ? "tag-accent-2" : dose.tone === "warn" ? "tag-accent" : "tag-neutral"}`}>{dose.status}</span>
            </div>
          ))}
        </section>
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

function Customize({
  layout, preset, onClose, onPreset, onEdit,
}: {
  layout: Array<{ id: WidgetId; on: boolean; wide: boolean }>;
  preset: string;
  onClose: () => void;
  onPreset: (key: string) => void;
  onEdit: (next: Array<{ id: WidgetId; on: boolean; wide: boolean }>) => void;
}) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "color-mix(in srgb, var(--color-neutral-900) 35%, transparent)", zIndex: 20 }} />
      <aside className="drawer" style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(440px, 100%)", background: "var(--color-bg)", boxShadow: "var(--shadow-lg)", zIndex: 21, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 26, flex: 1 }}>Customise dashboard</h2>
          <button className="btn btn-ghost" type="button" onClick={onClose}>Close</button>
        </div>
        {Object.entries(PRESETS).map(([key, item]) => (
          <button key={key} type="button" onClick={() => onPreset(key)} style={{ textAlign: "left", borderRadius: 20, padding: "12px 16px", background: preset === key ? "var(--color-accent-100)" : "var(--color-surface)", border: preset === key ? "2px solid var(--color-accent)" : "2px solid transparent", fontFamily: "var(--font-body)", color: "var(--color-text)", cursor: "pointer" }}>
            <div style={{ fontWeight: 700 }}>{item.label}</div>
            <div className="muted" style={{ fontSize: 12 }}>{item.desc}</div>
          </button>
        ))}
        {layout.map((item, index) => (
          <div key={item.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 12px", borderRadius: 18, background: "var(--color-surface)", opacity: item.on ? 1 : 0.55 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{WIDGETS[item.id].name}</div>
              <div className="muted" style={{ fontSize: 12 }}>{WIDGETS[item.id].desc}</div>
            </div>
            <button type="button" className="tag tag-neutral hide-phone" style={{ border: 0, cursor: "pointer" }} onClick={() => onEdit(layout.map((widget, widgetIndex) => widgetIndex === index ? { ...widget, wide: !widget.wide } : widget))}>{item.wide ? "Wide" : "Half"}</button>
            <button type="button" className="btn btn-secondary" onClick={() => onEdit(layout.map((widget, widgetIndex) => widgetIndex === index ? { ...widget, on: !widget.on } : widget))}>{item.on ? "Hide" : "Show"}</button>
          </div>
        ))}
      </aside>
    </>
  );
}

function buildChart(days: DayView[], _showQ: boolean) {
  const values = days.flatMap((day) => (day.fev1 == null ? [] : [day.fev1]));
  const predicted = mean(days.flatMap((day) => (day.fev1Pct && day.fev1 ? [day.fev1 / (day.fev1Pct / 100)] : [])));
  const goal = predicted == null ? null : predicted * 0.8;
  const low = Math.min(...(values.length ? values : [1]), goal ?? 2) - 0.2;
  const high = Math.max(...(values.length ? values : [3]), goal ?? 2) + 0.2;
  const y = (value: number) => ((high - value) / (high - low)) * 100;
  const x = (index: number) => ((index + 0.5) / days.length) * 100;
  const reliable = days.flatMap((day, index) => (day.fev1 != null && day.fevOk ? [{ index, value: day.fev1 }] : []));
  const path = reliable.map((point, index) => `${index ? "L" : "M"}${(x(point.index) * 10).toFixed(1)} ${y(point.value).toFixed(1)}`).join(" ");
  const points = days.flatMap((day, index) =>
    day.fev1 == null
      ? []
      : [{
          index,
          left: `${x(index)}%`,
          top: `${y(day.fev1)}%`,
          ok: Boolean(day.fevOk),
          title: `${day.short} · FEV1 ${day.fev1.toFixed(2)} L${day.fevOk ? "" : ` · ${day.fevNote}`}`,
        }],
  );
  const step = (high - low) / 3;
  const grid = [0, 1, 2].map((index) => {
    const value = high - step * index;
    return { top: `${y(value)}%`, label: `${value.toFixed(1)}` };
  });
  const labelAt = (index: number) => days[Math.min(days.length - 1, Math.max(0, index))].short;
  return {
    path,
    points,
    grid,
    predTop: goal == null ? null : `${y(goal)}%`,
    labels: [labelAt(0), labelAt(7), labelAt(14), labelAt(21), labelAt(days.length - 1)],
  };
}

function mean(values: number[]) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
