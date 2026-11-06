import type { ClinicianModel } from "@/lib/clinician-model";
import { MonthCalendar } from "../shared/MonthCalendar";

export function SnapshotWidget({ model, onOpenDate }: { model: ClinicianModel; onOpenDate: (date: string) => void }) {
  return (
    <article className="card snapshot">
      <section className="snapshot-overview" aria-labelledby="snapshot-heading">
        <div className="snapshot-heading">
          <h3 id="snapshot-heading">30-second snapshot</h3>
          <p className="muted">{model.rangeLabel} </p>
        </div>
        <dl className="snapshot-metrics">
          {model.cards.map((card) => (
            <div className="snapshot-metric" key={card.kicker}>
              <dt>{card.kicker}</dt>
              <dd><strong>{card.value}</strong> <span>{card.unit}</span></dd>
              <p>{card.line}</p>
            </div>
          ))}
        </dl>
      </section>
      <MonthCalendar days={model.history} onOpenDate={onOpenDate} />
    </article>
  );
}
