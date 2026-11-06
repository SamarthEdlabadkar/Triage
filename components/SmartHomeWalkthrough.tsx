"use client";

import { Stage } from "./stageshow-kit/stage";
import type { Act } from "./stageshow-kit/act";
import { Window } from "./stageshow-kit/window";
import "./SmartHomeWalkthrough.css";

type Scene = { screen: "overview" | "records" | "summary"; detail: boolean };
const initial: Scene = { screen: "overview", detail: false };
const poster: Scene = { screen: "summary", detail: false };

async function script(a: Act<Scene>) {
  await a.wait(600);
  a.mark("day");
  await a.move("day-3");
  await a.click();
  await a.set({ detail: true });
  await a.wait(1500);
  await a.move("records");
  await a.click();
  await a.set({ screen: "records", detail: false });
  await a.wait(1600);
  a.mark("summary");
  await a.move("summary");
  await a.click();
  await a.set({ screen: "summary" });
  await a.move("rest");
  await a.wait(2100);
}

export function SmartHomeWalkthrough() {
  return <Stage<Scene> width={960} height={500} compact={{ below: 680, width: 358, height: 530 }} initial={initial} poster={poster} script={script} play="once" cursor={{ at: { wide: { x: 850, y: 440 }, compact: { x: 300, y: 480 } }, ripple: true }} accent="#9d2d73" greys="cool" className="shw">
    {(s, _rect, layout) => <>
      <Window url="SMART@Home / clinician view" className="shw-window" lights="grey">
        <div className="shw-app">
          <div className="shw-header"><div className="shw-brand"><i />SMART@Home</div><span>Sample patient · Alex Morgan</span></div>
          <div className="shw-tabs"><span className={s.screen === "overview" ? "active" : ""}>Overview</span><span data-target="records" className={s.screen === "records" ? "active" : ""}>Records</span><span data-target="summary" className={s.screen === "summary" ? "active" : ""}>Visit summary</span></div>
          <div className="shw-body">
            <div className="shw-kicker">PRE-VISIT REVIEW · SAMPLE DATA</div>
            <div className="shw-name">Alex Morgan</div>
            <div className="shw-sub">Patient-reported home monitoring · February 2026</div>
            <div className="shw-screens">
              <div className="shw-screen" data-active={s.screen === "overview"}>
                <section className="shw-card shw-metrics"><b>30-second snapshot</b><div><span>Tracker days<small>Responses received</small></span><strong>22 <em>/ 28</em></strong></div><div><span>Symptoms<small>Patient reported</small></span><strong>5 <em>days</em></strong></div><div><span>Medication<small>Marked taken</small></span><strong>19 <em>days</em></strong></div></section>
                <section className="shw-card shw-calendar"><b>Reported days</b><small>February 2026</small><div className="shw-grid shw-week"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div><div className="shw-grid shw-days">{Array.from({ length: 28 }, (_, i) => { const day = i + 1; return <span key={i} data-target={day === 3 ? "day-3" : undefined} className={day === 3 ? "focus" : [7, 12, 19, 26].includes(day) ? "symptom" : [1, 5, 10, 16, 23, 27].includes(day) ? "missing" : "reported"}>{day}</span>; })}</div><p><i /> Reported <i /> Symptoms <i /> No response</p></section>
              </div>
              <div className="shw-screen" data-active={s.screen === "records"}><section className="shw-card shw-full"><b>Daily records</b><small>Source entries</small><div className="shw-table"><div className="head"><span>Date</span><span>Tracker response</span><span>Medication</span></div><div className="selected"><span>Feb 3</span><span>Breathing symptoms reported</span><span>Marked taken</span></div><div><span>Feb 2</span><span>No symptoms reported</span><span>Marked taken</span></div><div><span>Feb 1</span><span>No tracker response</span><span>Not marked</span></div></div><p>Entries reflect patient reports. Missing data is not a negative finding.</p></section></div>
              <div className="shw-screen" data-active={s.screen === "summary"}><section className="shw-card shw-full shw-summary"><div className="shw-kicker">VISIT SUMMARY</div><b>Ready for discussion</b><div><span>01</span><p><strong>Review reported symptoms</strong><small>5 days with symptom responses in this window</small></p></div><div><span>02</span><p><strong>Discuss reporting gaps</strong><small>6 days without tracker responses</small></p></div><div><span>03</span><p><strong>Confirm medication history</strong><small>Patient markings are not verified administrations</small></p></div></section></div>
            </div>
          </div>
          <aside className="shw-detail" data-open={s.detail}><div className="shw-kicker">SOURCE DAY · FEB 3</div><b>Reported day</b><div><span>Tracker</span><strong>Breathing symptoms reported</strong></div><div><span>Medication</span><strong>Marked taken</strong></div><p>Patient-reported entries. Review with the patient.</p></aside>
        </div>
      </Window>
      <span data-target="rest" style={{ position: "absolute", left: layout === "compact" ? 300 : 850, top: layout === "compact" ? 480 : 440 }} />
    </>}
  </Stage>;
}
