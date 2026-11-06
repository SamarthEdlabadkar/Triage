import type {
  DailyLog,
  GroundTruth,
  Medication,
  PatientDocument,
  TrackerDefinition,
  TrackerQuestion,
  TrackerSubmission,
} from "./types";

const END = "2026-11-05";
const VISIT = "2026-11-06";
const WINDOW = 28;
const TZ = "America/New_York";
const NONE = /none of these/i;

export type Kind = "asthma" | "migraine" | "ibd";
export type Slot = "taken" | "open";

export type Blow = {
  n: number;
  fev1: string;
  fvc: string;
  ratio: string;
  pef: string;
  quality: string;
  note: string;
  best: boolean;
  ok: boolean;
};

export type SubmissionView = {
  time: string;
  blank: boolean;
  lines: string[];
  detailLines: string[];
  counts: boolean;
};

export type DoseView = {
  name: string;
  slot: string;
  status: string;
  tone: "good" | "warn" | "muted";
};

export type DayView = {
  date: string;
  short: string;
  dow: string;
  dow1: string;
  num: number;
  long: string;
  active: boolean;
  logged: boolean;
  entries: number;
  blanks: number;
  feeling: string | null;
  symptoms: string[];
  rescue: number | null;
  slots: Slot[];
  fev1: number | null;
  fev1Pct: number | null;
  fevOk: boolean | null;
  fevNote: string;
  school: boolean | null;
  night: boolean | null;
  headache: boolean | null;
  pain: number | null;
  blood: string | null;
  conflict: string | null;
  submissions: SubmissionView[];
  doses: DoseView[];
  blows: Blow[];
};

export type SnapCard = {
  kicker: string;
  value: string;
  unit: string;
  line: string;
  note: string;
  bar: { taken: number; rest: number } | null;
  day: number | null;
  view: "timeline" | "overview" | null;
};

export type ChangeRow = {
  title: string;
  detail: string;
  tag: string;
  good: boolean;
  day: number | null;
};

export type ReviewRow = {
  sev: string;
  tone: "warn" | "muted" | "good";
  title: string;
  detail: string;
  day: number | null;
};

export type CompareRow = {
  label: string;
  note: string;
  before: string;
  after: string;
  beforeWidth: string;
  afterWidth: string;
};

export type PatientChoice = {
  file: string;
  name: string;
  trackers: Array<{ id: string; name: string }>;
};

export type ClinicianModel = {
  patient: {
    file: string;
    name: string;
    initials: string;
    age: number;
    sex: string;
    studyId: string;
    trackerId: string;
    trackerName: string;
    kind: Kind;
  };
  visitLabel: string;
  rangeLabel: string;
  lastEntry: string;
  aggregationNote: string;
  scenario: string | null;
  dailyMedName: string | null;
  otherMeds: string | null;
  plan: {
    status: string;
    updated: string;
    expiration: string;
    retest: string | null;
    expired: boolean;
    retestOverdue: boolean;
  } | null;
  days: DayView[];
  history: DayView[];
  cards: SnapCard[];
  changed: ChangeRow[];
  compare: CompareRow[];
  compareNote: string;
  review: ReviewRow[];
  halfLabel: { before: string; after: string };
  doseLegend: { taken: number; open: number };
  suggestions: string[];
  summary: Array<{ title: string; text: string }>;
  trackerSummary: Array<{ title: string; question: string; text: string }>;
  summaryText: string;
  csv: string;
};

type Reading = {
  readingDate: string;
  accepted: boolean;
  sessionId?: string;
  fvcPlusResults?: {
    fvc: number;
    fev1: number;
    fev1FvcRatio?: number;
    pef?: number;
    fev1PercentPredicted?: number;
    fev1Predicted?: number;
  };
  qualityReport?: {
    sessionGrade?: string;
    qualityCode?: string;
    qualityIndications?: string[];
  };
};

function addDays(iso: string, n: number) {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + n);
  return date.toISOString().slice(0, 10);
}

function utcFormat(iso: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...options }).format(
    new Date(`${iso}T12:00:00Z`),
  );
}

function short(iso: string) {
  return utcFormat(iso, { month: "short", day: "numeric" });
}

function nyDate(iso: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(iso));
}

function nyTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function kindOf(tracker: TrackerDefinition): Kind {
  const name = tracker.condition.toLowerCase();
  if (name.includes("migraine")) return "migraine";
  if (name.includes("ibd")) return "ibd";
  return "asthma";
}

function matchesCondition(med: Medication, kind: Kind) {
  const text = med.relatedCondition.toLowerCase();
  if (kind === "asthma") return text.includes("asthma");
  if (kind === "migraine") return text.includes("migraine");
  return /ibd|crohn|colitis/.test(text);
}

function question(tracker: TrackerDefinition, key: string) {
  return tracker.questions.find((item) => item.metricKey === key);
}

function parseList(value: string | undefined) {
  if (!value?.trim()) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map(String).map((item) => item.trim()).filter((item) => item && !NONE.test(item));
    }
  } catch {
    // plain text
  }
  const text = value.trim();
  return text && !NONE.test(text) ? [text] : [];
}

function lastValue(submissions: TrackerSubmission[], id: string) {
  let found: string | null = null;
  for (const submission of submissions) {
    for (const response of submission.responses) {
      if (response.questionId === id && response.value?.trim()) found = response.value.trim();
    }
  }
  return found;
}

function unionValues(submissions: TrackerSubmission[], id: string) {
  const set = new Set<string>();
  for (const submission of submissions) {
    for (const response of submission.responses) {
      if (response.questionId === id) {
        for (const item of parseList(response.value)) set.add(item);
      }
    }
  }
  return [...set];
}

function anyYes(submissions: TrackerSubmission[], id: string): boolean | null {
  let seen = false;
  let yes = false;
  for (const submission of submissions) {
    for (const response of submission.responses) {
      if (response.questionId !== id || !response.value?.trim()) continue;
      seen = true;
      if (/^yes$/i.test(response.value.trim())) yes = true;
    }
  }
  return seen ? yes : null;
}

function maxNumber(submissions: TrackerSubmission[], id: string): number | null {
  let max: number | null = null;
  for (const submission of submissions) {
    for (const response of submission.responses) {
      if (response.questionId !== id || !response.value?.trim()) continue;
      const value = Number(response.value);
      if (!Number.isFinite(value)) continue;
      max = max === null ? value : Math.max(max, value);
    }
  }
  return max;
}

function blankSubmission(submission: TrackerSubmission) {
  return !submission.responses.some((response) => response.value?.trim());
}

function humanize(code: string) {
  const spaced = code.replace(/([a-z])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function formatAnswer(questionItem: TrackerQuestion, value: string) {
  if (!value.trim()) return "";
  if (questionItem.type === "checkbox") {
    const items = parseList(value);
    return items.length ? items.join(", ") : "None of these";
  }
  if (questionItem.type === "spirometry") return "Spirometer check-in";
  return value.trim();
}

function mean(values: number[]) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function pct(part: number, whole: number) {
  if (!whole) return null;
  return Math.round((part / whole) * 100);
}

function round1(value: number | null) {
  if (value === null) return "—";
  return (Math.round(value * 10) / 10).toString();
}

export function buildClinicianModel(
  patient: PatientDocument,
  file: string,
  tracker: TrackerDefinition,
  truth: GroundTruth | null,
): ClinicianModel {
  const kind = kindOf(tracker);
  const start = addDays(END, -(WINDOW - 1));
  const logs = new Map(patient.dailyLogs.map((log) => [log.day, log]));
  const earliestLog = [...logs.keys()].sort()[0];
  const assigned = patient.assignedTrackers.find((item) => item.trackerId === tracker.trackerId);
  const assignedOn = assigned?.assignedDate ?? patient.enrolledDate;

  const dailyMeds = patient.medications.filter(
    (med) => !med.archived && /^daily$/i.test(med.howOften) && matchesCondition(med, kind) && med.startDate <= END,
  );
  const rescueMeds = patient.medications.filter(
    (med) => !med.archived && /^as needed$/i.test(med.howOften) && matchesCondition(med, kind),
  );
  const otherMeds = patient.medications.filter(
    (med) => matchesCondition(med, kind) && !dailyMeds.includes(med) && !rescueMeds.includes(med),
  );
  const primary = dailyMeds[0] ?? null;
  const expectedSlots = primary ? Math.max(1, primary.dosage.timing.timesOfDay?.length ?? 1) : 0;

  const readings = patient.medicalDevices.flatMap(
    (device) => (device.baselineReadings ?? []) as Reading[],
  );
  const readingsByDay = new Map<string, Reading[]>();
  for (const reading of readings) {
    const day = nyDate(reading.readingDate);
    const list = readingsByDay.get(day) ?? [];
    list.push(reading);
    readingsByDay.set(day, list);
  }

  const byId = new Map(tracker.questions.map((item) => [item.questionId, item]));
  const feelingQ = question(tracker, "feeling");
  const symptomQ = question(tracker, "symptoms");
  const schoolQ = question(tracker, "school_missed");
  const nightQ = question(tracker, "night_waking");
  const headQ = question(tracker, "headache");
  const painQ = question(tracker, "pain") ?? question(tracker, "severity");
  const bloodQ = question(tracker, "blood");

  const historyStart = [earliestLog, assignedOn, patient.enrolledDate].filter(Boolean).sort()[0] ?? start;
  const first = historyStart < start ? historyStart : start;
  const allDates: string[] = [];
  for (let date = first; date <= END; date = addDays(date, 1)) allDates.push(date);

  const history: DayView[] = allDates.map((date) => {
    const log: DailyLog | undefined = logs.get(date);
    const active = date >= assignedOn && date >= patient.enrolledDate;
    const submissions = (log?.trackerResponses ?? []).filter((item) => item.trackerId === tracker.trackerId);
    const answered = submissions.filter((item) => !blankSubmission(item));
    const logged = answered.length > 0;
    const feeling = feelingQ ? lastValue(submissions, feelingQ.questionId) : null;
    const symptoms = symptomQ ? unionValues(submissions, symptomQ.questionId) : [];
    const feelings = answered.flatMap((submission) => {
      const value = feelingQ
        ? submission.responses.find((response) => response.questionId === feelingQ.questionId)?.value?.trim()
        : "";
      return value ? [value] : [];
    });
    const distinctFeelings = [...new Set(feelings)];
    const conflict =
      distinctFeelings.length > 1
        ? `Feeling changed across ${answered.length} submissions (${distinctFeelings.join(" → ")})`
        : null;

    const rescueEvents = (log?.medicationAdministrations ?? []).filter((dose) =>
      rescueMeds.some((med) => med.id === dose.medicationId),
    );
    const rescue = rescueEvents.reduce((sum, dose) => {
      const amount = Number(dose.value);
      return sum + (Number.isFinite(amount) ? amount : 1);
    }, 0);

    const slotEvents = primary
      ? (log?.medicationAdministrations ?? []).filter((dose) => dose.medicationId === primary.id)
      : [];
    const slots: Slot[] = [];
    if (primary && active && expectedSlots === 2) {
      const morning = slotEvents.some((dose) => {
        const hour = Number(
          new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", hourCycle: "h23" }).format(
            new Date(dose.administeredAt),
          ),
        );
        return hour < 14;
      });
      const evening = slotEvents.some((dose) => {
        const hour = Number(
          new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", hourCycle: "h23" }).format(
            new Date(dose.administeredAt),
          ),
        );
        return hour >= 14;
      });
      slots.push(morning ? "taken" : "open", evening ? "taken" : "open");
    } else if (primary && active) {
      slots.push(slotEvents.length ? "taken" : "open");
    }

    const dayReadings = kind === "asthma" ? readingsByDay.get(date) ?? [] : [];
    const best = dayReadings.reduce<Reading | null>((current, reading) => {
      const fev = reading.fvcPlusResults?.fev1;
      if (fev == null) return current;
      if (!current || fev > (current.fvcPlusResults?.fev1 ?? 0)) return reading;
      return current;
    }, null);
    const fevOk = best
      ? Boolean(best.accepted && best.qualityReport?.qualityCode === "Accept")
      : null;
    const mismatch = best
      ? best.accepted !== (best.qualityReport?.qualityCode === "Accept")
      : false;
    const indications = (best?.qualityReport?.qualityIndications ?? []).map(humanize);
    const fevNote = !best
      ? ""
      : mismatch
        ? `Accepted flag is ${best.accepted ? "yes" : "no"}, quality check is ${best.qualityReport?.qualityCode ?? "missing"}.`
        : indications.join(". ");

    const blows: Blow[] = dayReadings
      .filter((reading) => reading.fvcPlusResults)
      .map((reading, index) => {
        const results = reading.fvcPlusResults!;
        const ok = Boolean(reading.accepted && reading.qualityReport?.qualityCode === "Accept");
        return {
          n: index + 1,
          fev1: `${results.fev1.toFixed(2)} L`,
          fvc: `${results.fvc.toFixed(2)} L`,
          ratio: results.fev1FvcRatio != null ? `${Math.round(results.fev1FvcRatio)}%` : "—",
          pef: results.pef != null ? `${Math.round(results.pef * 60)} L/min` : "—",
          quality: ok ? "Passed check" : "Questionable",
          note: (reading.qualityReport?.qualityIndications ?? []).map(humanize).join(". "),
          best: reading === best,
          ok,
        };
      });

    const ordered = [...submissions].sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
    const lastCounted = [...ordered].reverse().find((submission) => !blankSubmission(submission));
    const submissionViews: SubmissionView[] = ordered.map((submission) => {
      const answers = submission.responses.flatMap((response) => {
        const item = byId.get(response.questionId);
        if (!item) return [];
        const answer = formatAnswer(item, response.value);
        return answer ? [{ questionId: response.questionId, answer, line: `${item.text}: ${answer}` }] : [];
      });

      const detailLines = answers
        .filter(({ questionId, answer }) => {
          if (questionId === feelingQ?.questionId && answer === feeling) return false;
          if (questionId === symptomQ?.questionId) {
            return answer !== symptoms.join(", ") && !(answer === "None of these" && symptoms.length === 0);
          }
          return true;
        })
        .map(({ line }) => line);

      return {
        time: nyTime(submission.submittedAt),
        blank: blankSubmission(submission),
        counts: submission === lastCounted,
        lines: answers.map(({ line }) => line),
        detailLines,
      };
    });

    const doses: DoseView[] = [];
    for (const med of [...dailyMeds, ...rescueMeds]) {
      if (!active || date < med.startDate) continue;
      const events = (log?.medicationAdministrations ?? []).filter((dose) => dose.medicationId === med.id);
      if (/^daily$/i.test(med.howOften)) {
        const expected = Math.max(1, med.dosage.timing.timesOfDay?.length ?? 1);
        doses.push({
          name: med.name,
          slot: expected === 1 ? "Once a day" : "Scheduled daily",
          status: events.length ? `${Math.min(events.length, expected)} of ${expected} marked` : "Not marked",
          tone: events.length >= expected ? "good" : events.length ? "warn" : "muted",
        });
      } else if (events.length) {
        const units = events.reduce((sum, dose) => sum + (Number(dose.value) || 1), 0);
        doses.push({
          name: med.name,
          slot: "As needed",
          status: `${units} ${med.dosage.doseUnit}`,
          tone: "warn",
        });
      } else if (logged) {
        doses.push({
          name: med.name,
          slot: "As needed",
          status: "None recorded",
          tone: "muted",
        });
      }
    }

    return {
      date,
      short: short(date),
      dow: utcFormat(date, { weekday: "short" }),
      dow1: utcFormat(date, { weekday: "narrow" }),
      num: Number(date.slice(8)),
      long: utcFormat(date, { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
      active,
      logged,
      entries: submissions.length,
      blanks: submissions.filter(blankSubmission).length,
      feeling,
      symptoms,
      rescue: active && (logged || rescueEvents.length) ? rescue : null,
      slots,
      fev1: best?.fvcPlusResults?.fev1 ?? null,
      fev1Pct: best?.fvcPlusResults?.fev1PercentPredicted ?? null,
      fevOk,
      fevNote,
      school: schoolQ ? anyYes(submissions, schoolQ.questionId) : null,
      night: nightQ ? anyYes(submissions, nightQ.questionId) : null,
      headache: headQ ? anyYes(submissions, headQ.questionId) : null,
      pain: painQ ? maxNumber(submissions, painQ.questionId) : null,
      blood: bloodQ ? lastValue(submissions, bloodQ.questionId) : null,
      conflict,
      submissions: submissionViews,
      doses,
      blows,
    };
  });
  const days = history.filter((day) => day.date >= start);

  const activeDays = days.filter((day) => day.active);
  const loggedDays = activeDays.filter((day) => day.logged);
  const before = days.slice(0, 14);
  const after = days.slice(14);
  const doseTotals = (group: DayView[]) => {
    let taken = 0;
    let open = 0;
    for (const day of group) {
      if (!day.active) continue;
      for (const med of dailyMeds) {
        if (day.date < med.startDate) continue;
        const expected = Math.max(1, med.dosage.timing.timesOfDay?.length ?? 1);
        const events = (logs.get(day.date)?.medicationAdministrations ?? []).filter(
          (dose) => dose.medicationId === med.id,
        ).length;
        const marked = Math.min(events, expected);
        taken += marked;
        open += expected - marked;
      }
    }
    return { taken, open, n: taken + open, pct: pct(taken, taken + open) };
  };
  const allDoses = doseTotals(days);
  const beforeDoses = doseTotals(before);
  const afterDoses = doseTotals(after);
  const symptomDays = (group: DayView[]) =>
    group.filter((day) => day.active && day.logged && day.symptoms.length).length;
  const loggedCount = (group: DayView[]) => group.filter((day) => day.active && day.logged).length;
  const rescueSum = (group: DayView[]) =>
    group.reduce((sum, day) => sum + (day.rescue ?? 0), 0);
  const reliable = days.filter((day) => day.fev1 != null && day.fevOk);
  const flagged = days.filter((day) => day.fev1 != null && day.fevOk === false);
  const latest = reliable.at(-1) ?? null;
  const firstReliable = reliable[0] ?? null;
  const gaps = activeDays.filter((day) => !day.logged);
  const blanks = activeDays.reduce((sum, day) => sum + day.blanks, 0);
  const counts = new Map<string, number>();
  for (const day of loggedDays) {
    for (const symptom of day.symptoms) counts.set(symptom, (counts.get(symptom) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const headDays = (group: DayView[]) => group.filter((day) => day.logged && day.headache).length;
  const painMean = (group: DayView[]) =>
    mean(group.filter((day) => day.headache && day.pain != null).map((day) => day.pain!));
  const bellyMean = (group: DayView[]) =>
    mean(group.filter((day) => day.logged && day.pain != null).map((day) => day.pain!));
  const bloodDays = loggedDays.filter((day) => day.blood && !/^none$/i.test(day.blood)).length;
  const fevMean = (group: DayView[]) =>
    mean(group.filter((day) => day.fevOk && day.fev1Pct != null).map((day) => day.fev1Pct!));

  const cards: SnapCard[] = [];
  if (kind === "asthma") {
    cards.push({
      kicker: "Symptoms",
      value: String(symptomDays(days)),
      unit: `/ ${loggedCount(days)} days`,
      line: top.length ? `had symptoms · most often ${top.slice(0, 2).map((item) => item[0].toLowerCase()).join(" & ")}` : "no symptoms recorded on logged days",
      note: `${symptomDays(after)} of ${loggedCount(after)} logged days in the last 14`,
      bar: null,
      day: null,
      view: "timeline",
    });
  } else if (kind === "migraine") {
    cards.push({
      kicker: "Headache days",
      value: String(headDays(days)),
      unit: `/ ${loggedCount(days)} logged`,
      line: top.length ? `most reported with headache: ${top.slice(0, 2).map((item) => item[0].toLowerCase()).join(" & ")}` : "no symptoms recorded with headache",
      note: `${headDays(after)} of ${loggedCount(after)} logged days in the last 14`,
      bar: null,
      day: null,
      view: "timeline",
    });
  } else {
    cards.push({
      kicker: "Symptom days",
      value: String(symptomDays(days)),
      unit: `/ ${loggedCount(days)} logged`,
      line: bloodDays ? `blood reported on ${bloodDays} logged days` : "symptom checkboxes, excluding “none”",
      note: `${symptomDays(after)} of ${loggedCount(after)} logged days in the last 14`,
      bar: null,
      day: null,
      view: "timeline",
    });
  }

  cards.push({
    kicker: dailyMeds.length ? "Daily medication reported taken" : "Daily medication",
    value: allDoses.pct == null ? "—" : `${allDoses.pct}%`,
    unit: allDoses.n ? `of ${allDoses.n} doses` : "none scheduled",
    line: allDoses.n
      ? `${allDoses.taken} marked · ${allDoses.open} not marked`
      : "No daily medication for this tracker",
    note: "Self-reported. Not marked is not the same as a skipped dose.",
    bar: allDoses.n ? { taken: allDoses.taken, rest: allDoses.open } : null,
    day: null,
    view: null,
  });

  if (kind === "asthma") {
    cards.push({
      kicker: "Lung function · device",
      value: latest ? latest.fev1!.toFixed(2) : "—",
      unit: latest ? "L FEV1" : "",
      line: latest ? `Latest reading that passed the quality check · ${Math.round(latest.fev1Pct ?? 0)}% predicted` : "No reading passed the quality check in this window",
      note: firstReliable && latest
        ? `${(latest.fev1! - firstReliable.fev1!).toFixed(2)} L from the first passed reading · ${flagged.length} readings flagged`
        : `${flagged.length} readings flagged`,
      bar: null,
      day: latest ? days.indexOf(latest) : null,
      view: null,
    });
  } else if (kind === "migraine") {
    const pain = painMean(days);
    cards.push({
      kicker: "Pain on headache days",
      value: pain == null ? "—" : pain.toFixed(1),
      unit: "/ 10",
      line: "Daily maximum on days a headache was reported",
      note: `Last 14 days: ${round1(painMean(after))}`,
      bar: null,
      day: null,
      view: "timeline",
    });
  } else {
    const pain = bellyMean(days);
    cards.push({
      kicker: "Belly pain",
      value: pain == null ? "—" : pain.toFixed(1),
      unit: "/ 10",
      line: "Daily maximum on logged days",
      note: `Blood reported on ${bloodDays} logged days`,
      bar: null,
      day: null,
      view: "timeline",
    });
  }

  const gapText = gaps.map((day) => day.short).slice(0, 8).join(", ");
  cards.push({
    kicker: "Data gaps",
    value: String(gaps.length),
    unit: gaps.length === 1 ? "day" : "days",
    line: gaps.length ? `with no entries · ${gapText}${gaps.length > 8 ? "…" : ""}` : "an entry on every active day",
    note: `+ ${blanks} blank submissions`,
    bar: null,
    day: gaps[0] ? days.indexOf(gaps[0]) : null,
    view: null,
  });

  const rate = (group: DayView[]) => {
    const logged = loggedCount(group);
    return logged ? rescueSum(group) / logged : null;
  };
  const changed: ChangeRow[] = [];
  const pushChange = (title: string, beforeValue: number | null, afterValue: number | null, unit: string, better: "up" | "down", threshold: number, day: DayView | undefined) => {
    if (beforeValue == null && afterValue == null) return;
    let tag = beforeValue == null || afterValue == null ? "Not comparable" : "Similar";
    let good = false;
    if (beforeValue != null && afterValue != null && Math.abs(afterValue - beforeValue) >= threshold) {
      const up = afterValue > beforeValue;
      good = better === "up" ? up : !up;
      tag = good ? "Lower burden" : "Higher burden";
      if (better === "up") tag = good ? "Higher" : "Lower";
    }
    changed.push({
      title,
      detail: `${round1(beforeValue)}${unit} → ${round1(afterValue)}${unit}`,
      tag,
      good,
      day: day ? days.indexOf(day) : null,
    });
  };
  if (kind === "asthma") {
    pushChange("Symptom days", pct(symptomDays(before), loggedCount(before)), pct(symptomDays(after), loggedCount(after)), "% of logged days", "down", 10, after.find((day) => day.symptoms.length));
    pushChange("Rescue units per logged day", rate(before), rate(after), "", "down", 0.5, after.find((day) => (day.rescue ?? 0) > 0));
    pushChange("Daily doses marked", beforeDoses.pct, afterDoses.pct, "%", "up", 10, after.find((day) => day.slots.includes("taken")));
    pushChange("FEV1 % predicted", fevMean(before), fevMean(after), "%", "up", 5, reliable.at(-1));
  } else if (kind === "migraine") {
    pushChange("Headache days", pct(headDays(before), loggedCount(before)), pct(headDays(after), loggedCount(after)), "% of logged days", "down", 10, after.find((day) => day.headache));
    pushChange("Pain on headache days", painMean(before), painMean(after), " / 10", "down", 1, after.find((day) => day.pain != null));
    pushChange("Daily doses marked", beforeDoses.pct, afterDoses.pct, "%", "up", 10, after.find((day) => day.slots.includes("taken")));
  } else {
    pushChange("Symptom days", pct(symptomDays(before), loggedCount(before)), pct(symptomDays(after), loggedCount(after)), "% of logged days", "down", 10, after.find((day) => day.symptoms.length));
    pushChange("Belly pain", bellyMean(before), bellyMean(after), " / 10", "down", 1, after.find((day) => day.pain != null));
    pushChange("Daily doses marked", beforeDoses.pct, afterDoses.pct, "%", "up", 10, after.find((day) => day.slots.includes("taken")));
  }
  pushChange("Days logged", loggedCount(before), loggedCount(after), "", "up", 3, gaps.at(-1));

  const scale = (beforeValue: number, afterValue: number, max: number) => ({
    beforeWidth: `${Math.max(4, (beforeValue / max) * 80)}%`,
    afterWidth: `${Math.max(4, (afterValue / max) * 80)}%`,
  });
  const compare: CompareRow[] = [];
  const addCompare = (label: string, note: string, beforeValue: number | null, afterValue: number | null, suffix: string, max: number) => {
    if (beforeValue == null || afterValue == null) return;
    const widths = scale(beforeValue, afterValue, max);
    compare.push({
      label,
      note,
      before: `${round1(beforeValue)}${suffix}`,
      after: `${round1(afterValue)}${suffix}`,
      ...widths,
    });
  };
  if (kind === "asthma") {
    addCompare("Symptom days", "% of logged days", pct(symptomDays(before), loggedCount(before)), pct(symptomDays(after), loggedCount(after)), "%", 100);
    addCompare("Rescue units", "per logged day", rate(before), rate(after), "", Math.max(1, rate(before) ?? 0, rate(after) ?? 0));
    addCompare("FEV1, passed check", "mean % predicted", fevMean(before), fevMean(after), "%", 120);
  } else if (kind === "migraine") {
    addCompare("Headache days", "% of logged days", pct(headDays(before), loggedCount(before)), pct(headDays(after), loggedCount(after)), "%", 100);
    addCompare("Pain", "mean on headache days", painMean(before), painMean(after), "", 10);
  } else {
    addCompare("Symptom days", "% of logged days", pct(symptomDays(before), loggedCount(before)), pct(symptomDays(after), loggedCount(after)), "%", 100);
    addCompare("Belly pain", "mean on logged days", bellyMean(before), bellyMean(after), "", 10);
  }
  addCompare("Daily doses marked", "% of scheduled doses", beforeDoses.pct, afterDoses.pct, "%", 100);

  const review: ReviewRow[] = [];
  for (const day of days.filter((item) => item.conflict).slice(-2).reverse()) {
    review.push({
      sev: "Conflict",
      tone: "warn",
      title: day.conflict!,
      detail: `${day.short} · ${day.entries} submissions. The summary uses the last completed one.`,
      day: days.indexOf(day),
    });
  }
  const mismatches = kind === "asthma"
    ? readings.filter((reading) => {
        const day = nyDate(reading.readingDate);
        if (day < start || day > END) return false;
        return reading.accepted !== (reading.qualityReport?.qualityCode === "Accept");
      })
    : [];
  if (mismatches.length) {
    const day = nyDate(mismatches[mismatches.length - 1].readingDate);
    const index = days.findIndex((item) => item.date === day);
    review.push({
      sev: "Device",
      tone: "muted",
      title: `${mismatches.length} blows where the accepted flag and the quality check disagree`,
      detail: "Questionable blows stay off the trend line.",
      day: index >= 0 ? index : null,
    });
  }
  let run = 0;
  let bestRun = 0;
  let bestEnd = -1;
  days.forEach((day, index) => {
    if (day.active && !day.logged) {
      run += 1;
      if (run > bestRun) {
        bestRun = run;
        bestEnd = index;
      }
    } else run = 0;
  });
  if (bestRun >= 3) {
    review.push({
      sev: "Gap",
      tone: "muted",
      title: `No entries for ${bestRun} days in a row`,
      detail: `${days[bestEnd - bestRun + 1].short} – ${days[bestEnd].short}. Doses on those days are not marked, not confirmed missed.`,
      day: bestEnd - bestRun + 1,
    });
  }
  const planRaw = kind === "asthma" ? patient.asthmaTreatmentPlan : undefined;
  const plan = planRaw
    ? {
        status: planRaw.status,
        updated: short(planRaw.lastUpdated.slice(0, 10)),
        expiration: `${short(planRaw.expiration.slice(0, 10))}, ${planRaw.expiration.slice(0, 4)}`,
        retest: planRaw.retestTime ? short(planRaw.retestTime.slice(0, 10)) : null,
        expired: planRaw.expiration.slice(0, 10) < VISIT,
        retestOverdue: Boolean(planRaw.retestTime && planRaw.retestTime.slice(0, 10) < VISIT),
      }
    : null;
  if (plan?.expired) {
    review.push({
      sev: "Plan",
      tone: "warn",
      title: "Action plan expiration date has passed",
      detail: `Recorded expiration ${plan.expiration}. Daily zone history is not stored.`,
      day: null,
    });
  } else if (plan && planRaw && planRaw.expiration.slice(0, 10) <= addDays(VISIT, 45)) {
    review.push({
      sev: "Plan",
      tone: "muted",
      title: `Action plan expiration is ${plan.expiration}`,
      detail: "Only the current status is in the record.",
      day: null,
    });
  }
  if (plan?.retestOverdue) {
    review.push({
      sev: "Plan",
      tone: "muted",
      title: "Spirometry retest date is before this visit",
      detail: `Recorded due date ${plan.retest}.`,
      day: null,
    });
  }
  for (const med of patient.medications.filter((item) => item.archived && matchesCondition(item, kind))) {
    const used = days.filter((day) =>
      (logs.get(day.date)?.medicationAdministrations ?? []).some((dose) => dose.medicationId === med.id),
    );
    if (!used.length) continue;
    review.push({
      sev: "Record",
      tone: "muted",
      title: `${med.name} is archived`,
      detail: `Marked on ${used.length} days in this window (${used[0].short} – ${used[used.length - 1].short}).`,
      day: days.indexOf(used[0]),
    });
  }

  const lastSubmission = patient.dailyLogs
    .filter((log) => log.day >= start && log.day <= END)
    .flatMap((log) => log.trackerResponses.filter((item) => item.trackerId === tracker.trackerId && !blankSubmission(item)))
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
    .at(-1) ?? null;

  const summary: Array<{ title: string; text: string }> = [
    {
      title: "Reporting",
      text: `Entries on ${loggedCount(days)} of ${activeDays.length} days this tracker was active (${short(start)} – ${short(END)}). ${blanks} blank submissions. Where a day has several submissions, the last completed answer to each question is used.`,
    },
  ];
  if (kind === "asthma") {
    summary.push({
      title: "Symptoms",
      text: `Reported on ${symptomDays(days)} of ${loggedCount(days)} logged days. Most reported: ${top.slice(0, 4).map((item) => `${item[0]} (${item[1]})`).join(", ") || "none"}.`,
    });
    summary.push({
      title: "Rescue medication",
      text: `${rescueSum(days)} units recorded on as-needed medications (${rescueMeds.map((med) => med.name).join(", ") || "none"}).`,
    });
  } else if (kind === "migraine") {
    summary.push({
      title: "Headaches",
      text: `${headDays(days)} of ${loggedCount(days)} logged days. Mean worst pain ${round1(painMean(days))} / 10.`,
    });
  } else {
    summary.push({
      title: "Symptoms",
      text: `Symptom checkboxes on ${symptomDays(days)} of ${loggedCount(days)} logged days. Blood other than “None” on ${bloodDays} days. Mean belly pain ${round1(bellyMean(days))} / 10.`,
    });
  }
  summary.push({
    title: "Medication",
    text: allDoses.n
      ? `${dailyMeds.map((med) => med.name).join(", ")}: ${allDoses.taken} of ${allDoses.n} scheduled daily doses have a recorded administration (${allDoses.pct}%). ${allDoses.open} have no record. These are self-reports.`
      : "No daily medication is scheduled for this tracker.",
  });
  if (kind === "asthma") {
    summary.push({
      title: "Lung function",
      text: reliable.length
        ? `${reliable.length} days with a reading that passed the device quality check. Latest ${latest!.fev1!.toFixed(2)} L (${Math.round(latest!.fev1Pct ?? 0)}% predicted) on ${latest!.short}. ${flagged.length} days failed that check and are off the trend line.`
        : "No spirometry in this window passed the device quality check.",
    });
  }
  if (plan) {
    summary.push({
      title: "Action plan",
      text: `Recorded status ${plan.status}. Last updated ${plan.updated}. Expiration ${plan.expiration}.${plan.retest ? ` Retest date ${plan.retest}.` : ""} Daily zones are not stored.`,
    });
  }
  summary.push({
    title: "Limitations",
    text: "Medication records show what was marked, not a verified dose. A missing record is not a confirmed miss. Home data are not part of the medical record.",
  });

  const trackerSummary = tracker.questions.map((item) => {
    const answeredDays = days.flatMap((day) => {
      if (!day.active) return [];
      const submissions = (logs.get(day.date)?.trackerResponses ?? [])
        .filter((submission) => submission.trackerId === tracker.trackerId)
        .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
      const value = lastValue(submissions, item.questionId);
      return value ? [{ day, value }] : [];
    });
    const latestAnswer = answeredDays.at(-1);
    const answer = latestAnswer ? formatAnswer(item, latestAnswer.value) : null;
    return {
      title: item.metricKey ? humanize(item.metricKey.replace(/_/g, " ")) : item.text,
      question: item.text,
      text: latestAnswer
        ? `Latest reported: ${answer}${item.unit && item.type === "number" ? ` ${item.unit}` : ""} on ${latestAnswer.day.short}. Answered on ${answeredDays.length} of ${activeDays.length} active days.`
        : `No answer recorded in this ${WINDOW}-day window.`,
    };
  });

  const summaryText = [
    `SMART@Home visit summary — ${patient.displayName} (synthetic) · ${tracker.name}`,
    `${short(start)} – ${short(END)}, 2026 · visit ${short(VISIT)}, 2026`,
    "",
    ...summary.map((section) => `${section.title}: ${section.text}`),
    "",
    "Tracker responses (latest reported answer for each question)",
    ...trackerSummary.map((item) => `${item.title} — ${item.question}: ${item.text}`),
  ].join("\n");

  const csvHead = [
    "date",
    "active",
    "logged",
    "feeling",
    "symptoms",
    "rescue_units",
    "daily_slots",
    "fev1_L",
    "fev1_pct_predicted",
    "fev1_quality",
    "headache",
    "pain",
    "blood",
    "school_missed",
    "night_waking",
    "submissions",
  ].join(",");
  const csv = [
    csvHead,
    ...days.map((day) =>
      [
        day.date,
        day.active,
        day.logged,
        day.feeling ?? "",
        `"${day.symptoms.join("; ")}"`,
        day.rescue ?? "",
        day.slots.join("/"),
        day.fev1 ?? "",
        day.fev1Pct != null ? Math.round(day.fev1Pct) : "",
        day.fev1 == null ? "" : day.fevOk ? "passed" : "questionable",
        day.headache ?? "",
        day.pain ?? "",
        day.blood ?? "",
        day.school ?? "",
        day.night ?? "",
        day.entries,
      ].join(","),
    ),
  ].join("\n");

  const suggestions =
    kind === "asthma"
      ? [
          "Is the daily inhaler being marked?",
          "What do the spirometry readings show?",
          "How often were symptoms reported?",
          "Which entries conflict or have gaps?",
        ]
      : kind === "migraine"
        ? [
            "Is the daily preventive being marked?",
            "How often were headaches reported?",
            "What was the pain like?",
            "Which entries conflict or have gaps?",
          ]
        : [
            "Is the daily medication being marked?",
            "How often were symptoms reported?",
            "Was blood reported?",
            "Which entries conflict or have gaps?",
          ];

  const parts = patient.displayName.split(/\s+/).filter(Boolean);
  const initials = parts.map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return {
    patient: {
      file,
      name: patient.displayName,
      initials,
      age: patient.age,
      sex: patient.sex,
      studyId: patient.studyId,
      trackerId: tracker.trackerId,
      trackerName: tracker.name,
      kind,
    },
    visitLabel: `${patient.age} years · ${tracker.name} · Visit ${utcFormat(VISIT, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}`,
    rangeLabel: `${short(start)} – ${short(END)} · ${WINDOW} days`,
    lastEntry: lastSubmission ? `Last entry ${short(nyDate(lastSubmission.submittedAt))}, ${nyTime(lastSubmission.submittedAt)}` : "No entries",
    aggregationNote:
      "Window is Oct 9–Nov 5, 2026. One answer per question is the last non-blank submission that day. Checkboxes are the union of the day. Yes/no is any Yes. Numbers are the daily maximum. Device times are America/New_York. Doses are administrations recorded on the log day.",
    scenario: truth?.clinician30s ?? null,
    dailyMedName: primary?.name ?? null,
    otherMeds: otherMeds.length
      ? otherMeds.map((med) => `${med.name} (${med.howOften}${med.archived ? ", archived" : ""})`).join(" · ")
      : null,
    plan,
    days,
    history,
    cards,
    changed,
    compare,
    compareNote:
      "First 14 days of this window versus the last 14. This is a change in what was reported, not evidence that a medication caused it.",
    review,
    halfLabel: { before: `${days[0].short}–${days[13].short}`, after: `${days[14].short}–${days[27].short}` },
    doseLegend: { taken: allDoses.taken, open: allDoses.open },
    suggestions,
    summary,
    trackerSummary,
    summaryText,
    csv,
  };
}

export function answerQuestion(model: ClinicianModel, questionText: string) {
  const text = questionText.toLowerCase();
  const days = model.days;
  const pick = (match: (day: DayView) => boolean) =>
    days.filter(match).slice(-6).map((day) => day.date);
  const per = model.rangeLabel;
  if (/medic|controller|preventive|inhaler|dose|adher/.test(text)) {
    const card = model.cards.find((item) => item.kicker.startsWith("Daily"));
    return {
      text: card
        ? `${per}. ${card.line}. ${card.value} ${card.unit}. ${card.note}`
        : "No daily medication is scheduled for this tracker.",
      dates: pick((day) => day.slots.includes("open") && day.logged),
    };
  }
  if (/lung|fev|spiro|breath/.test(text)) {
    const card = model.cards.find((item) => item.kicker.startsWith("Lung"));
    return {
      text: card ? `${card.line} ${card.note}` : "This tracker has no spirometry.",
      dates: pick((day) => day.fev1 != null),
    };
  }
  if (/school|night|blood/.test(text)) {
    const school = days.filter((day) => day.school).length;
    const night = days.filter((day) => day.night).length;
    const blood = days.filter((day) => day.blood && !/^none$/i.test(day.blood)).length;
    return {
      text: `In this window: school or activities missed on ${school} reported days, night waking on ${night}, blood other than “None” on ${blood}.`,
      dates: pick((day) => Boolean(day.school || day.night || (day.blood && !/^none$/i.test(day.blood)))),
    };
  }
  if (/conflict|gap|flag|review|quality|odd/.test(text)) {
    return {
      text: model.review.length
        ? model.review.map((item) => `${item.title}. ${item.detail}`).join("\n")
        : "No conflicting submissions, long gaps, or device disagreements turned up in this window.",
      dates: model.review.map((item) => (item.day == null ? null : days[item.day]?.date)).filter((date): date is string => Boolean(date)),
    };
  }
  const symptom = model.cards[0];
  return {
    text: `${symptom.kicker}: ${symptom.value} ${symptom.unit}. ${symptom.line} ${symptom.note}`,
    dates: pick((day) => day.logged && (day.symptoms.length > 0 || day.headache === true)),
  };
}
