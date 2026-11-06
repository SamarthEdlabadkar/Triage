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
  const [dayDate, setDayDate] = useState<string | null>(null);
  const [showQ, setShowQ] = useState(true);
  const [askInput, setAskInput] = useState("");
  const [asking, setAsking] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [announcement, setAnnouncement] = useState("");
  const [msgs, setMsgs] = useState<Array<{ role: "user" | "ai"; text: string; dates: string[] }>>([]);
  const viewReady = useRef(false);
  const router = useRouter();

  const days = model.days;
  const chart = useMemo(() => buildChart(days, showQ), [days, showQ]);
  const selectedIndex = dayDate == null ? -1 : model.history.findIndex((item) => item.date === dayDate);
  const selected = selectedIndex < 0 ? null : model.history[selectedIndex];

  // Views share one page, so without this a phone stays scrolled partway down the new view.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view, consult]);

  function openDay(index: number | null) {
    if (index == null || index < 0 || index >= days.length) return;
    setDayDate(days[index].date);
  }

  function openDate(date: string) {
    if (model.history.some((item) => item.date === date)) setDayDate(date);
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
      setAnnouncement(`${query}. ${result.text}`);
      setAsking(false);
    }, 400);
  }

  useEffect(() => {
    if (!viewReady.current) {
      viewReady.current = true;
      return;
    }
    const id = consult ? "consult-heading" : view === "overview" ? "patient-heading" : "view-heading";
    document.getElementById(id)?.focus();
  }, [view, consult]);

  const visible = layout.filter((item) => item.on);
  const trackers = patients.find((patient) => patient.file === model.patient.file)?.trackers ?? [];
  const href = (file: string, trackerId?: string) => {
    const params = new URLSearchParams({ patient: file });
    if (trackerId) params.set("tracker", trackerId);
    return `/?${params.toString()}`;
  };

  return (
    <div className="shell">
<<<<<<< HEAD
      <header className="app-header">
=======
      <a className="skip" href="#content">Skip to content</a>
      <div role="status" className="sr-only">{announcement}</div>
      <header style={{ display: "flex", alignItems: "center", gap: 20, padding: "16px 32px", flexWrap: "wrap" }}>
>>>>>>> 1ae36672bc116ca96cc68bc798a20f5553b4ccd8
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--color-accent)", display: "grid", placeItems: "center", color: "#fff", fontWeight: 700 }}>
            S
          </div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 21 }}>SMART@Home</div>
        </div>
        {!consult ? (
<<<<<<< HEAD
          <nav className="tabs" aria-label="Clinician views">
=======
          <nav style={{ display: "flex", gap: 4, padding: 4, background: "var(--color-surface)", borderRadius: 999, flexWrap: "wrap" }}>
>>>>>>> 1ae36672bc116ca96cc68bc798a20f5553b4ccd8
            {(
              [
                ["overview", "Overview", "Overview"],
                ["timeline", "Timeline & records", "Timeline"],
                ["ask", "Ask the data", "Ask"],
                ["summary", "Visit summary", "Summary"],
              ] as const
            ).map(([id, label, shortLabel]) => (
              <button
                key={id}
                type="button"
<<<<<<< HEAD
                className="tab"
                aria-current={view === id ? "page" : undefined}
=======
                aria-pressed={view === id}
>>>>>>> 1ae36672bc116ca96cc68bc798a20f5553b4ccd8
                onClick={() => { setView(id); setConsult(false); }}
                style={{
                  background: view === id ? "var(--color-text)" : "transparent",
                  color: view === id ? "#fff" : "var(--color-text)",
                }}
              >
                <span className="hide-phone">{label}</span>
                <span className="only-phone">{shortLabel}</span>
              </button>
            ))}
          </nav>
        ) : null}
        <div className="header-tools">
          <span className="muted" style={{ fontSize: 12 }}>Synthetic dataset — not a real patient</span>
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
          <button className={`btn ${consult ? "btn-primary" : "btn-secondary"}`} type="button" aria-pressed={consult} onClick={() => { setConsult((value) => !value); setDayDate(null); }}>
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
<<<<<<< HEAD
            <h1 className="patient-name">{model.patient.name}</h1>
=======
            <h1 id="patient-heading" tabIndex={-1} style={{ margin: 0, fontSize: 34 }}>{model.patient.name}</h1>
>>>>>>> 1ae36672bc116ca96cc68bc798a20f5553b4ccd8
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
<<<<<<< HEAD
                className="preset"
=======
>>>>>>> 1ae36672bc116ca96cc68bc798a20f5553b4ccd8
                aria-pressed={preset === key}
                onClick={() => { setPreset(key); setLayout(layoutFor(key, model.patient.kind)); }}
                style={{
                  background: preset === key ? "var(--color-accent)" : "transparent",
                  color: preset === key ? "#fff" : "var(--color-text)",
                }}
              >
                {item.label}
              </button>
            ))}
            <button className="btn btn-secondary" type="button" onClick={() => setCustomOpen(true)}>Customize</button>
          </div>
        ) : null}
      </section>

      {model.scenario ? (
        <p className="muted scenario">
          <strong style={{ color: "var(--color-text)" }}>Scenario note, synthetic ground truth. </strong>
          {model.scenario}
        </p>
      ) : null}

<<<<<<< HEAD
      <main className="page-main">
=======
      <main id="content" tabIndex={-1} style={{ padding: "0 32px 56px" }}>
>>>>>>> 1ae36672bc116ca96cc68bc798a20f5553b4ccd8
        {!consult && view === "overview" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <form className="ask-form" onSubmit={(event) => { event.preventDefault(); ask(askInput); }}>
              <label className="muted" htmlFor="overview-ask" style={{ fontSize: 12 }}>Ask a question</label>
              <input
                id="overview-ask"
                value={askInput}
                onChange={(event) => setAskInput(event.target.value)}
<<<<<<< HEAD
                placeholder={`Ask about ${model.patient.name.split(" ")[0]}’s data`}
                className="ask-input"
=======
                placeholder="Headaches in the last 14 days"
>>>>>>> 1ae36672bc116ca96cc68bc798a20f5553b4ccd8
              />
              <button className="btn btn-primary" type="submit">Ask</button>
            </form>
            <div className="board">
              {visible.map((item) => (
                <div key={item.id} className={item.wide ? "span-12" : "span-6"}>
                  {item.id === "snapshot" ? <Snapshot model={model} onOpen={openDay} onOpenDate={openDate} onTimeline={() => setView("timeline")} /> : null}
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
            <Timeline model={model} chart={chart} onOpen={openDay} />
            <Records model={model} onOpen={openDay} />
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
            onOpenDate={openDate}
          />
        ) : null}

        {!consult && view === "summary" ? (
          <Summary
            model={model}
            copyState={copyState}
            onCopy={() => {
              const write = navigator.clipboard?.writeText(model.summaryText);
              if (!write) {
                setCopyState("failed");
              } else {
                write.then(() => setCopyState("copied")).catch(() => setCopyState("failed"));
              }
              window.setTimeout(() => setCopyState("idle"), 4000);
            }}
          />
        ) : null}

        {consult ? <Consult model={model} chart={chart} onOpen={openDay} /> : null}
      </main>

      {selected ? (
        <Drawer
          day={selected}
          onClose={() => setDayDate(null)}
          onPrev={() => selectedIndex > 0 && setDayDate(model.history[selectedIndex - 1].date)}
          onNext={() => selectedIndex >= 0 && selectedIndex < model.history.length - 1 && setDayDate(model.history[selectedIndex + 1].date)}
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

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dayMarked(day: DayView) {
  return day.symptoms.length > 0 || day.headache === true;
}

function dayMarkLabel(day: DayView) {
  if (!day.active) return "before this tracker was assigned";
  if (!day.logged) return "no entry";
  if (dayMarked(day)) return day.headache ? "headache or symptoms reported" : "symptoms reported";
  return "logged without symptoms or headache";
}

function dotStyle(day: DayView): CSSProperties {
  const marked = dayMarked(day);
  return {
    width: 12,
    height: 12,
    borderRadius: "50%",
    boxSizing: "border-box",
    background: !day.logged ? "transparent" : marked ? "var(--color-accent-400)" : "var(--color-accent-2-700)",
    border: day.logged ? "0" : "1.5px dashed var(--color-neutral-500)",
    opacity: day.active ? 1 : 0.35,
  };
}

function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function shiftMonth(key: string, amount: number) {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + amount, 1));
  return monthKey(date.getUTCFullYear(), date.getUTCMonth() + 1);
}

function Snapshot({ model, onOpen, onOpenDate, onTimeline }: { model: ClinicianModel; onOpen: (index: number | null) => void; onOpenDate: (date: string) => void; onTimeline: () => void }) {
  return (
    <article className="card" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, fontSize: 21 }}>30-second snapshot</h3>
        <span className="muted" style={{ fontSize: 13 }}>Patient-reported unless noted · open a figure for that day</span>
      </div>
<<<<<<< HEAD
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(210px, 100%), 1fr))", gap: 12 }}>
        {model.cards.map((card) => (
=======
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12, alignItems: "start" }}>
        {model.cards.filter((card) => card.kicker !== "Data gaps").map((card) => (
>>>>>>> 1ae36672bc116ca96cc68bc798a20f5553b4ccd8
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
        <MonthCalendar days={model.history} onOpenDate={onOpenDate} />
      </div>
    </article>
  );
}

function MonthCalendar({ days, onOpenDate }: { days: DayView[]; onOpenDate: (date: string) => void }) {
  const earliest = days[0]?.date.slice(0, 7) ?? "2026-11";
  const latest = days[days.length - 1]?.date.slice(0, 7) ?? earliest;
  const [cursor, setCursor] = useState(latest);
  const byDate = useMemo(() => new Map(days.map((day) => [day.date, day])), [days]);
  const [year, month] = cursor.split("-").map(Number);
  const label = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)));
  const firstDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: Array<DayView | null> = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: count }, (_, index) => byDate.get(`${cursor}-${String(index + 1).padStart(2, "0")}`) ?? null),
  ];

  function move(amount: number) {
    const next = shiftMonth(cursor, amount);
    setCursor(next < earliest ? earliest : next > latest ? latest : next);
  }

  return (
    <div style={{ background: "var(--color-neutral-100)", borderRadius: 22, padding: "16px 14px", display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
      <div className="kicker">Calendar</div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <CalendarStep label="Previous year" glyph="«" disabled={cursor <= earliest} onClick={() => move(-12)} />
        <CalendarStep label="Previous month" glyph="‹" disabled={cursor <= earliest} onClick={() => move(-1)} />
        <div style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: 13 }}>{label}</div>
        <CalendarStep label="Next month" glyph="›" disabled={cursor >= latest} onClick={() => move(1)} />
        <CalendarStep label="Next year" glyph="»" disabled={cursor >= latest} onClick={() => move(12)} />
      </div>
<<<<<<< HEAD
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
=======
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 2, minWidth: 0 }}>
        {WEEKDAYS.map((name) => (
          <div key={name} className="faint" style={{ textAlign: "center", fontSize: 10, fontWeight: 700 }}>{name.slice(0, 1)}</div>
        ))}
        {cells.map((day, index) => day ? (
          <button
            key={day.date}
            type="button"
            title={`${day.short} · ${dayMarkLabel(day)}`}
            aria-label={`${day.long}. ${dayMarkLabel(day)}`}
            onClick={() => onOpenDate(day.date)}
            style={{ display: "grid", placeItems: "center", aspectRatio: "1", minWidth: 0, border: 0, background: "transparent", padding: 0, cursor: "pointer" }}
          >
            <span style={dotStyle(day)} />
          </button>
        ) : (
          <div key={`pad-${cursor}-${index}`} aria-hidden="true" />
        ))}
>>>>>>> 1ae36672bc116ca96cc68bc798a20f5553b4ccd8
      </div>
    </div>
  );
}

function CalendarStep({ label, glyph, disabled, onClick }: { label: string; glyph: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 28,
        height: 28,
        border: 0,
        borderRadius: 999,
        background: "transparent",
        color: "var(--color-text)",
        font: "600 16px var(--font-body)",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.35 : 1,
      }}
    >
      {glyph}
    </button>
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
          <path d={chart.path} fill="none" stroke="var(--color-blue-600)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
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
              background: point.ok ? "var(--color-blue-600)" : "#fff",
              border: point.ok ? "2px solid var(--color-surface)" : "2.5px solid var(--color-accent-400)",
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
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ height: 12, borderRadius: 999, background: "var(--color-neutral-700)", width: row.beforeWidth }} /><span style={{ fontSize: 12 }}>{row.before}</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ height: 12, borderRadius: 999, background: "var(--color-blue-600)", width: row.afterWidth }} /><span style={{ fontSize: 12, fontWeight: 700 }}>{row.after}</span></div>
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
<<<<<<< HEAD
          <h3 style={{ margin: 0, fontSize: 21 }}>Synchronized timeline</h3>
          <div className="muted" style={{ fontSize: 13 }}>Aligned by date · select a column for the submissions<span className="scroll-hint"> · swipe right for earlier days</span></div>
=======
          <h3 id={onFull ? undefined : "view-heading"} tabIndex={onFull ? undefined : -1} style={{ margin: 0, fontSize: 21 }}>Synchronized timeline</h3>
          <div className="muted" style={{ fontSize: 13 }}>Aligned by date · select a column for the submissions</div>
>>>>>>> 1ae36672bc116ca96cc68bc798a20f5553b4ccd8
        </div>
        {onFull ? <button className="btn btn-ghost" type="button" onClick={onFull}>Full timeline & records →</button> : null}
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
              return <button key={day.date} type="button" aria-label={`${day.long}, Reported: ${dayMarkLabel(day)}`} onClick={() => onOpen(index)} style={{ height: 16, borderRadius: 999, padding: 0, background: !day.active || !day.logged ? "transparent" : marked ? "var(--color-accent-400)" : "var(--color-accent-2-700)", border: day.logged ? "0" : "1.5px dashed var(--color-neutral-500)", opacity: day.active ? 1 : 0.35 }} />;
            })}
          </Row>
          <Row label="Symptoms">
            {days.map((day, index) => (
              <button key={day.date} type="button" aria-label={`${day.long}, Symptoms: ${!day.logged ? "no entry" : day.symptoms.length ? day.symptoms.join(", ") : "none reported"}`} onClick={() => onOpen(index)} style={{ display: "grid", placeItems: "center", height: 28 }}>
                <span style={{ width: day.logged ? 6 + day.symptoms.length * 4 : 8, height: day.logged ? 6 + day.symptoms.length * 4 : 8, borderRadius: "50%", background: !day.logged ? "transparent" : day.symptoms.length ? "var(--color-accent-400)" : "var(--color-neutral-700)", border: day.logged ? "0" : "1.5px dashed var(--color-neutral-500)" }} />
              </button>
            ))}
          </Row>
          {model.patient.kind !== "ibd" ? (
            <Row label={model.patient.kind === "asthma" ? "Rescue units" : "As-needed units"}>
              {days.map((day, index) => (
                <button key={day.date} type="button" aria-label={`${day.long}, ${model.patient.kind === "asthma" ? "Rescue units" : "As-needed units"}: ${day.logged ? `${day.rescue ?? 0} units` : "no entry"}`} onClick={() => onOpen(index)} style={{ height: "100%", display: "flex", alignItems: "end" }}>
                  <span style={{ display: "block", width: "56%", margin: "0 auto", height: Math.min(24, (day.rescue ?? 0) * 6), background: "var(--color-accent-700)", borderRadius: 4 }} />
                </button>
              ))}
            </Row>
          ) : null}
          <Row label={model.dailyMedName ? "Daily med" : "Daily med"}>
            {days.map((day, index) => (
              <button key={day.date} type="button" aria-label={`${day.long}, Daily medication: ${!day.active ? "before this tracker was assigned" : day.slots.length ? day.slots.map((slot) => (slot === "taken" ? "marked" : "not marked")).join(", ") : "not marked"}`} onClick={() => onOpen(index)} style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "center" }}>
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
                  <path d={chart.path} fill="none" stroke="var(--color-blue-600)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                </svg>
                {chart.points.map((point) => (
<<<<<<< HEAD
                  <button key={point.index} type="button" className="timeline-point" title={point.title} aria-label={point.title} onClick={() => onOpen(point.index)} style={{ position: "absolute", left: point.left, top: point.top, width: 9, height: 9, margin: "-4.5px 0 0 -4.5px", borderRadius: "50%", background: point.ok ? "var(--color-accent-2-700)" : "transparent", border: point.ok ? "0" : "2px solid var(--color-accent-600)" }} />
=======
                  <button key={point.index} type="button" title={point.title} aria-label={point.title} onClick={() => onOpen(point.index)} style={{ position: "absolute", left: point.left, top: point.top, width: 24, height: 24, margin: "-12px 0 0 -12px", borderRadius: "50%", background: "transparent", border: 0, cursor: "pointer" }}><span style={{ display: "block", width: 9, height: 9, margin: "7.5px auto", borderRadius: "50%", background: point.ok ? "var(--color-blue-600)" : "transparent", border: point.ok ? "0" : "2px solid var(--color-accent-400)", boxSizing: "border-box" }} /></button>
>>>>>>> 1ae36672bc116ca96cc68bc798a20f5553b4ccd8
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
<<<<<<< HEAD
        {cells.map((day, index) => (
          <button key={day?.date ?? `blank-${index}`} type="button" onClick={() => day && onOpen(model.days.indexOf(day))} className="med-cell" style={{ border: 0, background: "transparent", borderRadius: 14, opacity: day?.active === false ? 0.35 : 1, cursor: day ? "pointer" : "default" }}>
            <div className="muted" style={{ fontSize: 11 }}>{day ? day.num : ""}</div>
=======
        {cells.map((day, index) => day ? (
          <button key={day.date} type="button" aria-label={`${day.long}. ${day.slots.length ? day.slots.map((slot) => (slot === "taken" ? "Marked" : "Not marked")).join(", ") : "No daily medication"}`} onClick={() => onOpen(model.days.indexOf(day))} style={{ border: 0, background: "transparent", borderRadius: 14, padding: 5, opacity: day.active === false ? 0.35 : 1, cursor: "pointer" }}>
            <div className="muted" style={{ fontSize: 12 }}>{day.num}</div>
>>>>>>> 1ae36672bc116ca96cc68bc798a20f5553b4ccd8
            <div style={{ display: "flex", gap: 2 }}>
              {(day.slots.length ? day.slots : ["open" as const]).map((slot, slotIndex) => {
                const style = slotStyle(slot);
                return <span key={slotIndex} aria-hidden="true" style={{ flex: 1, height: 16, borderRadius: 999, boxSizing: "border-box", ...style }} />;
              })}
            </div>
          </button>
        ) : (
          <div key={`blank-${index}`} aria-hidden="true" />
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
  const eventLabel = model.patient.kind === "migraine" ? "Headache" : "Rescue";
  return (
    <article className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, fontSize: 21 }}>Daily records</h3>
        <span className="muted" style={{ fontSize: 13 }}>Select a row for submissions, doses, and spirometer blows</span>
        <button className="btn btn-secondary" type="button" style={{ marginLeft: "auto" }} onClick={() => download(`${model.patient.file.replace(".json", "")}-daily.csv`, model.csv, "text/csv")}>Download CSV</button>
      </div>
<<<<<<< HEAD
      {/* Explicit roles: the phone layout restyles these rows as stacked cards, which drops native table semantics. */}
      <div className="scroll-x">
        <table className="table records-table" role="table">
          <thead role="rowgroup">
            <tr role="row">
              <th role="columnheader">Date</th><th role="columnheader">Feeling</th><th role="columnheader">Symptoms</th><th role="columnheader">{eventLabel}</th><th role="columnheader">Daily med</th><th role="columnheader">FEV1</th><th role="columnheader">Entries</th>
=======
      <table className="table" style={{ minWidth: 860 }}>
        <thead>
          <tr>
            <th>Date</th><th>Feeling</th><th>Symptoms</th><th>{model.patient.kind === "migraine" ? "Headache" : "Rescue"}</th><th>Daily med</th><th>FEV1</th><th>Entries</th>
          </tr>
        </thead>
        <tbody>
          {[...model.days].reverse().map((day) => (
            <tr key={day.date}>
              <td><button type="button" className="record-open" onClick={() => onOpen(model.days.indexOf(day))} aria-label={`Open ${day.dow} ${day.short}`}>{day.dow} {day.short}</button></td>
              <td>{day.feeling ?? "—"}</td>
              <td style={{ fontSize: 13 }}>{day.logged ? day.symptoms.join(", ") || "None" : "—"}</td>
              <td>{model.patient.kind === "migraine" ? (day.headache == null ? "—" : day.headache ? "Yes" : "No") : (day.rescue ?? "—")}</td>
              <td>{day.slots.length ? day.slots.map((slot) => (slot === "taken" ? "Marked" : "Not marked")).join(" / ") : "—"}</td>
              <td>{day.fev1 == null ? "—" : `${day.fev1.toFixed(2)} L${day.fevOk ? "" : " · flagged"}`}</td>
              <td>{day.entries}</td>
>>>>>>> 1ae36672bc116ca96cc68bc798a20f5553b4ccd8
            </tr>
          </thead>
          <tbody role="rowgroup">
            {[...model.days].reverse().map((day) => (
              <tr key={day.date} role="row" onClick={() => onOpen(model.days.indexOf(day))} style={{ cursor: "pointer" }}>
                <td role="cell" className="rec-date" style={{ fontWeight: 700 }}>{day.dow} {day.short}</td>
                <td role="cell" data-label="Feeling">{day.feeling ?? "—"}</td>
                <td role="cell" className="rec-wide" data-label="Symptoms" style={{ fontSize: 13 }}>{day.logged ? day.symptoms.join(", ") || "None" : "—"}</td>
                <td role="cell" data-label={eventLabel}>{model.patient.kind === "migraine" ? (day.headache == null ? "—" : day.headache ? "Yes" : "No") : (day.rescue ?? "—")}</td>
                <td role="cell" className="rec-med" data-label="Daily med">{day.slots.length ? day.slots.map((slot) => (slot === "taken" ? "Marked" : "Not marked")).join(" / ") : "—"}</td>
                <td role="cell" data-label="FEV1">{day.fev1 == null ? "—" : `${day.fev1.toFixed(2)} L${day.fevOk ? "" : " · flagged"}`}</td>
                <td role="cell" data-label="Entries">{day.entries}</td>
              </tr>
            ))}
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
          <h3 id="view-heading" tabIndex={-1} style={{ margin: 0, fontSize: 21 }}>Ask the data</h3>
          <div className="muted" style={{ fontSize: 13 }}>Answers use only this patient’s records in the 28-day window.</div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
          {msgs.length === 0 && !asking ? (
            <div style={{ padding: "40px 0", textAlign: "center" }} className="muted">Try a suggested question, or ask your own.</div>
          ) : null}
          {msgs.map((message, index) => (
            <div key={index} style={{ display: "flex", justifyContent: message.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: "78%", padding: "12px 16px", borderRadius: 22, background: message.role === "user" ? "var(--color-text)" : "var(--color-neutral-100)", color: message.role === "user" ? "#fff" : "var(--color-text)", fontSize: 14, lineHeight: 1.55 }}>
                <div style={{ whiteSpace: "pre-wrap" }}>{message.text}</div>
                {message.dates.length ? (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                    {message.dates.map((date) => (
                      <button key={date} type="button" className="tag tag-outline" aria-label={`Open ${date}`} onClick={() => onOpenDate(date)}>{date.slice(5)}</button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
          <div ref={latest} className="ask-latest" />
        </div>
<<<<<<< HEAD
        <form style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 6px 6px 18px", background: "var(--color-neutral-100)", borderRadius: 999 }} onSubmit={(event) => { event.preventDefault(); onAsk(askInput); }}>
          <input value={askInput} onChange={(event) => setAskInput(event.target.value)} placeholder="Ask about symptoms, medication, lung function, gaps…" className="ask-input" />
=======
        <form className="ask-form" onSubmit={(event) => { event.preventDefault(); onAsk(askInput); }}>
          <label className="muted" htmlFor="ask-question" style={{ fontSize: 12 }}>Ask a question</label>
          <input id="ask-question" value={askInput} onChange={(event) => setAskInput(event.target.value)} placeholder="Rescue doses last week" />
>>>>>>> 1ae36672bc116ca96cc68bc798a20f5553b4ccd8
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

function Summary({ model, copyState, onCopy }: { model: ClinicianModel; copyState: "idle" | "copied" | "failed"; onCopy: () => void }) {
  return (
    <div className="split" style={{ display: "grid", gridTemplateColumns: "minmax(0, 760px) minmax(220px, 300px)", gap: 20, alignItems: "start" }}>
      <article className="summary-doc" style={{ background: "var(--color-neutral-100)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-md)", display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <div className="kicker" style={{ color: "var(--color-accent-700)" }}>Visit summary · factual findings</div>
<<<<<<< HEAD
          <h2 className="summary-title" style={{ margin: "4px 0 0" }}>{model.patient.name}, {model.patient.age} y — {model.patient.trackerName}</h2>
          <div className="muted" style={{ fontSize: 13 }}>{model.rangeLabel}</div>
        </div>
        {model.summary.map((section) => (
          <div key={section.title} className="summary-row">
=======
          <h2 id="view-heading" tabIndex={-1} style={{ margin: "4px 0 0", fontSize: 28 }}>{model.patient.name}, {model.patient.age} y — {model.patient.trackerName}</h2>
          <div className="muted" style={{ fontSize: 13 }}>{model.rangeLabel}</div>
        </div>
        {model.summary.map((section) => (
          <div key={section.title} className="summary-row" style={{ display: "grid", gridTemplateColumns: "minmax(0, 150px) minmax(0, 1fr)", gap: 16 }}>
>>>>>>> 1ae36672bc116ca96cc68bc798a20f5553b4ccd8
            <div style={{ fontWeight: 700, fontSize: 13 }}>{section.title}</div>
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>{section.text}</div>
          </div>
        ))}
      </article>
      <aside className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 18 }}>Export</div>
        <button className="btn btn-primary" type="button" onClick={onCopy} style={{ whiteSpace: "normal" }}>{copyState === "copied" ? "Copied" : copyState === "failed" ? "Copy failed. Download .txt instead." : "Copy summary"}</button>
        <button className="btn btn-secondary" type="button" onClick={() => download(`${model.patient.file.replace(".json", "")}-summary.txt`, model.summaryText, "text/plain")}>Download .txt</button>
        <button className="btn btn-secondary" type="button" onClick={() => download(`${model.patient.file.replace(".json", "")}-daily.csv`, model.csv, "text/csv")}>Daily data .csv</button>
        <div className="muted" style={{ fontSize: 12 }}>Every figure is from the synthetic home record and carries the limits of self-report.</div>
      </aside>
    </div>
  );
}

function Consult({ model, chart, onOpen }: { model: ClinicianModel; chart: Chart; onOpen: (index: number) => void }) {
  const good = model.days.filter((day) => day.logged && day.symptoms.length === 0 && day.headache !== true).length;
  const hard = model.days.filter((day) => day.logged && (day.symptoms.length > 0 || day.headache === true)).length;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
<<<<<<< HEAD
      <h2 className="consult-title">{model.patient.name.split(" ")[0]}’s last 4 weeks</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: 24 }}>
        <article className="card consult-card">
=======
      <h2 id="consult-heading" tabIndex={-1} style={{ margin: 0, fontSize: 48 }}>{model.patient.name.split(" ")[0]}’s last 4 weeks</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
        <article className="card" style={{ borderRadius: 36, padding: 32 }}>
>>>>>>> 1ae36672bc116ca96cc68bc798a20f5553b4ccd8
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
          <ChartFrame chart={chart} points={chart.points.filter((point) => point.ok)} height={240} onOpen={onOpen} />
        </article>
      ) : null}
    </div>
  );
}

function useModalDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);
  return ref;
}

function Drawer({ day, onClose, onPrev, onNext }: { day: DayView; onClose: () => void; onPrev: () => void; onNext: () => void }) {
  const ref = useModalDialog();
  function requestClose() {
    ref.current?.close();
  }
  return (
<<<<<<< HEAD
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "color-mix(in srgb, var(--color-neutral-900) 35%, transparent)", zIndex: 20 }} />
      <aside className="drawer" style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(480px, 100%)", background: "var(--color-bg)", boxShadow: "var(--shadow-lg)", zIndex: 21, overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
=======
    <dialog
      ref={ref}
      className="panel-dialog wide"
      aria-labelledby="day-heading"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
>>>>>>> 1ae36672bc116ca96cc68bc798a20f5553b4ccd8
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-icon" type="button" onClick={onPrev} aria-label="Previous day">‹</button>
          <button className="btn btn-secondary btn-icon" type="button" onClick={onNext} aria-label="Next day">›</button>
          <button className="btn btn-ghost" type="button" style={{ marginLeft: "auto" }} onClick={requestClose}>Close</button>
        </div>
        <div>
          <div className="muted" style={{ fontSize: 12 }}>Day detail</div>
          <h2 id="day-heading" style={{ margin: 0, fontSize: 28 }}>{day.long}</h2>
          {!day.active ? <div className="tag tag-neutral" style={{ marginTop: 8 }}>Before this tracker was assigned</div> : null}
          {day.conflict ? <div style={{ marginTop: 10, background: "var(--color-accent-100)", color: "var(--color-accent-800)", borderRadius: 18, padding: "12px 16px", fontSize: 13 }}>{day.conflict}</div> : null}
        </div>
        <section>
          <h4 style={{ margin: "0 0 8px", fontSize: 17 }}>Tracker submissions</h4>
          {day.submissions.length === 0 ? <div className="muted">No entries this day.</div> : null}
          {day.submissions.map((submission, index) => (
            <div key={index} style={{ padding: "10px 14px", borderRadius: 16, marginBottom: 8, background: submission.counts ? "var(--color-surface)" : "var(--color-neutral-100)", opacity: submission.blank ? 0.65 : 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{submission.time}{submission.counts ? " · used in the summary" : ""}</div>
              <div className="muted" style={{ fontSize: 13 }}>{submission.blank ? "Opened, no answers" : submission.lines.join(" · ")}</div>
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
    </dialog>
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
  const ref = useModalDialog();
  function requestClose() {
    ref.current?.close();
  }
  return (
<<<<<<< HEAD
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "color-mix(in srgb, var(--color-neutral-900) 35%, transparent)", zIndex: 20 }} />
      <aside className="drawer" style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(440px, 100%)", background: "var(--color-bg)", boxShadow: "var(--shadow-lg)", zIndex: 21, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
=======
    <dialog
      ref={ref}
      className="panel-dialog narrow"
      aria-labelledby="customize-heading"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
>>>>>>> 1ae36672bc116ca96cc68bc798a20f5553b4ccd8
        <div style={{ display: "flex", alignItems: "center" }}>
          <h2 id="customize-heading" style={{ margin: 0, fontSize: 26, flex: 1 }}>Customize dashboard</h2>
          <button className="btn btn-ghost" type="button" onClick={requestClose}>Close</button>
        </div>
        {Object.entries(PRESETS).map(([key, item]) => (
          <button key={key} type="button" aria-pressed={preset === key} onClick={() => onPreset(key)} style={{ textAlign: "left", borderRadius: 20, padding: "12px 16px", background: preset === key ? "var(--color-accent-100)" : "var(--color-surface)", border: preset === key ? "2px solid var(--color-accent)" : "2px solid transparent", fontFamily: "var(--font-body)", color: "var(--color-text)", cursor: "pointer" }}>
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
<<<<<<< HEAD
            <button type="button" className="tag tag-neutral hide-phone" style={{ border: 0, cursor: "pointer" }} onClick={() => onEdit(layout.map((widget, widgetIndex) => widgetIndex === index ? { ...widget, wide: !widget.wide } : widget))}>{item.wide ? "Wide" : "Half"}</button>
            <button type="button" className="btn btn-secondary" onClick={() => onEdit(layout.map((widget, widgetIndex) => widgetIndex === index ? { ...widget, on: !widget.on } : widget))}>{item.on ? "Hide" : "Show"}</button>
=======
            <button type="button" className="tag tag-neutral" style={{ border: 0, cursor: "pointer" }} onClick={() => onEdit(layout.map((widget, widgetIndex) => widgetIndex === index ? { ...widget, wide: !widget.wide } : widget))}>{item.wide ? `Make ${WIDGETS[item.id].name} half` : `Make ${WIDGETS[item.id].name} wide`}</button>
            <button type="button" className="btn btn-secondary" onClick={() => onEdit(layout.map((widget, widgetIndex) => widgetIndex === index ? { ...widget, on: !widget.on } : widget))}>{item.on ? `Hide ${WIDGETS[item.id].name}` : `Show ${WIDGETS[item.id].name}`}</button>
>>>>>>> 1ae36672bc116ca96cc68bc798a20f5553b4ccd8
          </div>
        ))}
    </dialog>
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
