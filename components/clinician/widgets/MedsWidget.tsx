import type { ClinicianModel, DayView } from "@/lib/clinician-model";
import { slotStyle } from "../shared/utils";

export function MedsWidget({ model, onOpen }: { model: ClinicianModel; onOpen: (index: number) => void }) {
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
