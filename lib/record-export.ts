import type { DayView } from "@/lib/clinician-model";

export type RecordsExport = {
  title: string;
  lines: string[];
  headers: string[];
  rows: string[][];
  csv: string;
};

const LIMITS =
  "Patient-reported home monitoring. A marked dose is not a verified dose. Missing data is not a confirmed miss. These files are not part of the medical record.";

function cell(value: string) {
  return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function medText(day: DayView) {
  if (!day.slots.length) return "—";
  return day.slots.map((slot) => (slot === "taken" ? "Recorded" : "Not recorded")).join(" / ");
}

export function buildRecordsExport({
  patientName,
  age,
  trackerName,
  rangeLabel,
  dailyMedName,
  showFeeling,
  showSymptoms,
  showMed,
  showFev1,
  shown,
  totalWithEntries,
}: {
  patientName: string;
  age: number;
  trackerName: string;
  rangeLabel: string;
  dailyMedName: string | null;
  showFeeling: boolean;
  showSymptoms: boolean;
  showMed: boolean;
  showFev1: boolean;
  shown: DayView[];
  totalWithEntries: number;
}): RecordsExport {
  const headers = [
    "Date",
    ...(showFeeling ? ["Feeling"] : []),
    showSymptoms ? "Symptoms" : "Reported answers",
    ...(showMed ? [`Daily med${dailyMedName ? ` (${dailyMedName})` : ""}`] : []),
    ...(showFev1 ? ["FEV1"] : []),
    "Entries",
  ];
  const rows = shown.map((day) => [
    `${day.dow} ${day.short}`,
    ...(showFeeling ? [day.feeling ?? "—"] : []),
    showSymptoms ? (day.logged ? day.symptoms.join(", ") || "None" : "—") : (day.submissions.filter((submission) => !submission.blank).at(-1)?.lines.join("; ") || "—"),
    ...(showMed ? [medText(day)] : []),
    ...(showFev1 ? [day.fev1 == null ? "—" : `${day.fev1.toFixed(2)} L${day.fevOk ? "" : " · flagged"}`] : []),
    String(day.entries),
  ]);
  const scope =
    shown.length === totalWithEntries
      ? `${totalWithEntries} days with at least one entry. Days with no submissions are left out.`
      : `${shown.length} of ${totalWithEntries} days with entries match the filters on screen.`;
  const lines = [
    `${patientName} (synthetic), ${age} y · ${trackerName}`,
    rangeLabel,
    scope,
    LIMITS,
  ];
  const body = rows.length ? rows : [["No records match these filters."]];
  const csv = ["\uFEFF" + cell("Daily records — patient-reported"), ...lines.map(cell), "", headers.map(cell).join(","), ...body.map((row) => row.map(cell).join(","))].join("\n");
  return {
    title: "Daily records — patient-reported",
    lines,
    headers,
    rows: body,
    csv,
  };
}
