import type { DayView } from "@/lib/clinician-model";
export type Chart = ReturnType<typeof buildChart>;

export function buildChart(days: DayView[]) {
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
