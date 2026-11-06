"use client";
import { useMemo, useState } from "react";
import type { DayView } from "@/lib/clinician-model";

function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function shiftMonth(key: string, amount: number) {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + amount, 1));
  return monthKey(date.getUTCFullYear(), date.getUTCMonth() + 1);
}

export function MonthCalendar({ days, onOpenDate }: { days: DayView[]; onOpenDate: (date: string) => void }) {
  const firstMonth = days[0]?.date.slice(0, 7) ?? "2026-11";
  const lastMonth = days[days.length - 1]?.date.slice(0, 7) ?? firstMonth;
  const [month, setMonth] = useState(lastMonth);
  const byDate = useMemo(() => new Map(days.map((day) => [day.date, day])), [days]);
  const [year, monthNumber] = month.split("-").map(Number);
  const label = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
  const firstWeekday = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
  const count = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();

  function move(amount: number) {
    const next = shiftMonth(month, amount);
    setMonth(next < firstMonth ? firstMonth : next > lastMonth ? lastMonth : next);
  }

  return (
    <section className="month-calendar" aria-label="Reported days calendar">
      <div className="calendar-header">
        <div>
          <h3>Reported days</h3>
          <p className="muted">Select a day to review its entries</p>
        </div>
        <div className="calendar-nav">
          <button type="button" aria-label="Previous month" disabled={month <= firstMonth} onClick={() => move(-1)}>‹</button>
          <strong aria-live="polite">{label}</strong>
          <button type="button" aria-label="Next month" disabled={month >= lastMonth} onClick={() => move(1)}>›</button>
        </div>
      </div>
      <div className="calendar-grid" role="grid" aria-label={label}>
        {["S", "M", "T", "W", "T", "F", "S"].map((name, index) => <span className="calendar-weekday" key={index} aria-hidden="true">{name}</span>)}
        {Array.from({ length: firstWeekday + count }, (_, index) => {
          if (index < firstWeekday) return <span key={`pad-${index}`} aria-hidden="true" />;
          const date = `${month}-${String(index - firstWeekday + 1).padStart(2, "0")}`;
          const day = byDate.get(date);
          const reported = Boolean(day?.logged);
          const symptomatic = Boolean(day && (day.symptoms.length || day.headache));
          if (!day) return <span className="calendar-outside" key={date}>{index - firstWeekday + 1}</span>;
          return (
            <button
              key={date}
              type="button"
              className={`calendar-day ${reported ? symptomatic ? "calendar-symptoms" : "calendar-reported" : "calendar-missing"}`}
              aria-label={`${day.long}: ${reported ? symptomatic ? "symptoms or headache reported" : "tracker response, no symptoms or headache reported" : "no tracker response"}`}
              onClick={() => onOpenDate(date)}
            >
              {day.num}
              {reported ? <span className="calendar-dot" aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>
      <div className="calendar-legend">
        <span><i className="legend-reported" />Reported</span>
        <span><i className="legend-symptoms" />Symptoms reported</span>
        <span><i className="legend-missing" />No response</span>
      </div>
    </section>
  );
}
