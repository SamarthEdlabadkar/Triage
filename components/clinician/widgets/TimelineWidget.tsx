"use client";
import { useEffect, useRef, type ReactNode } from "react";
import type { ClinicianModel } from "@/lib/clinician-model";
import type { Chart } from "../chart";
import { slotStyle } from "../shared/utils";

export function TimelineWidget({ model, chart, onOpen }: { model: ClinicianModel; chart: Chart; onOpen: (index: number) => void }) {
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
              <div style={{ position: "relative", height: 90 }}>
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
