import type {
  DailyLog,
  Medication,
  PatientDocument,
  TrackerDefinition,
  TrackerQuestion,
  TrackerSubmission,
} from "./types";

const FEELING_RANK: Record<string, number> = {
  Great: 5,
  Good: 4,
  Okay: 3,
  Bad: 2,
  Awful: 1,
};

const NONE_PATTERNS = [/^none of these\s*$/i, /^none$/i];

export type DayMetric = {
  day: string;
  feeling: string | null;
  feelingRank: number | null;
  symptoms: string[];
  yesNo: Record<string, boolean | null>;
  numbers: Record<string, number | null>;
  choices: Record<string, string | null>;
  fev1: number | null;
  fev1Pct: number | null;
  trackerSubmitted: boolean;
  multiSubmission: boolean;
  medEvents: Record<string, number>;
  medUnits: Record<string, number>;
};

export type MedSummary = {
  id: string;
  name: string;
  howOften: string;
  relatedCondition: string;
  doseUnit: string;
  expectedPerDay: number;
  daysWithDose: number;
  doseEvents: number;
  totalUnits: number;
  adherencePct: number | null;
  windowDays: number;
};

export type ClinicianSummary = {
  patient: {
    displayName: string;
    age: number;
    sex: string;
    studyId: string;
    personaId: string;
    enrolledDate: string;
    conditions: string[];
    trackerNames: string[];
  };
  windowDays: number;
  aggregationNote: string;
  lastActivityAt: string | null;
  daysWithTrackerAnswers: number;
  longestGapDays: number;
  multiSubmissionDays: number;
  feelingSeries: Array<{ day: string; rank: number | null; label: string | null }>;
  feelingCounts: Record<string, number>;
  symptomDays: number;
  symptomCounts: Record<string, number>;
  yesNoHighlights: Array<{ key: string; label: string; yesDays: number; answeredDays: number }>;
  numberHighlights: Array<{
    key: string;
    label: string;
    unit?: string;
    avg: number | null;
    max: number | null;
    answeredDays: number;
  }>;
  choiceHighlights: Array<{
    key: string;
    label: string;
    counts: Record<string, number>;
    answeredDays: number;
  }>;
  medications: MedSummary[];
  spirometry: {
    available: boolean;
    sessionsInWindow: number;
    latestFev1: number | null;
    latestFev1Pct: number | null;
    avgFev1Pct: number | null;
    baselineFev1Pct: number | null;
    series: Array<{ day: string; fev1: number; fev1Pct: number | null }>;
  };
  actionPlan: {
    status: string | null;
    lastUpdated: string | null;
    expiration: string | null;
  };
  recentDays: DayMetric[];
  deviceName: string | null;
};

function parseCheckbox(value: string | undefined | null): string[] {
  if (!value || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map(String).filter((item) => !NONE_PATTERNS.some((re) => re.test(item)));
    }
  } catch {
    // plain string fallback
  }
  if (NONE_PATTERNS.some((re) => re.test(value.trim()))) return [];
  return [value.trim()];
}

function parseSpirometry(value: string): { fev1: number | null; sessionId: string | null } {
  if (!value || !value.trim()) return { fev1: null, sessionId: null };
  try {
    const parsed = JSON.parse(value) as { bestFev1?: number; sessionId?: string };
    return {
      fev1: typeof parsed.bestFev1 === "number" ? parsed.bestFev1 : null,
      sessionId: parsed.sessionId ?? null,
    };
  } catch {
    return { fev1: null, sessionId: null };
  }
}

function lastNonBlank(
  submissions: TrackerSubmission[],
  questionId: string,
): string | null {
  let found: string | null = null;
  for (const submission of submissions) {
    for (const response of submission.responses) {
      if (response.questionId === questionId && response.value?.trim()) {
        found = response.value;
      }
    }
  }
  return found;
}

function unionCheckboxes(
  submissions: TrackerSubmission[],
  questionId: string,
): string[] {
  const set = new Set<string>();
  for (const submission of submissions) {
    for (const response of submission.responses) {
      if (response.questionId === questionId) {
        for (const item of parseCheckbox(response.value)) set.add(item);
      }
    }
  }
  return [...set];
}

function anyYes(submissions: TrackerSubmission[], questionId: string): boolean | null {
  let answered = false;
  let yes = false;
  for (const submission of submissions) {
    for (const response of submission.responses) {
      if (response.questionId !== questionId || !response.value?.trim()) continue;
      answered = true;
      if (/^yes$/i.test(response.value.trim())) yes = true;
    }
  }
  if (!answered) return null;
  return yes;
}

function dailyMaxNumber(
  submissions: TrackerSubmission[],
  questionId: string,
): number | null {
  let max: number | null = null;
  for (const submission of submissions) {
    for (const response of submission.responses) {
      if (response.questionId !== questionId || !response.value?.trim()) continue;
      const n = Number(response.value);
      if (!Number.isFinite(n)) continue;
      max = max === null ? n : Math.max(max, n);
    }
  }
  return max;
}

function allQuestions(trackers: TrackerDefinition[]): TrackerQuestion[] {
  const seen = new Set<string>();
  const out: TrackerQuestion[] = [];
  for (const tracker of trackers) {
    for (const question of tracker.questions) {
      const key = question.metricKey ?? question.questionId;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(question);
    }
  }
  return out;
}

function expectedDailyDoses(med: Medication): number {
  if (!/^daily$/i.test(med.howOften)) return 0;
  const times = med.dosage.timing.timesOfDay?.length ?? 0;
  if (times > 0) return times;
  return 1;
}

function windowStart(endDay: string, windowDays: number): string {
  const end = new Date(`${endDay}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() - (windowDays - 1));
  return end.toISOString().slice(0, 10);
}

function enumerateDays(start: string, end: string): string[] {
  const days: string[] = [];
  const cursor = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (cursor <= last) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

function buildDayMetric(
  log: DailyLog | undefined,
  day: string,
  questions: TrackerQuestion[],
  predictedFev1: number | null,
): DayMetric {
  const submissions = log?.trackerResponses ?? [];
  const nonBlankSubs = submissions.filter((s) =>
    s.responses.some((r) => r.value?.trim()),
  );

  const feelingQ = questions.find((q) => q.metricKey === "feeling");
  const symptomQuestions = questions.filter(
    (q) => q.type === "checkbox" && (q.metricKey === "symptoms" || q.metricKey === "triggers"),
  );

  const feeling = feelingQ ? lastNonBlank(submissions, feelingQ.questionId) : null;

  const symptoms = [
    ...new Set(
      symptomQuestions.flatMap((q) => unionCheckboxes(submissions, q.questionId)),
    ),
  ];

  const yesNo: Record<string, boolean | null> = {};
  const numbers: Record<string, number | null> = {};
  const choices: Record<string, string | null> = {};

  for (const question of questions) {
    const key = question.metricKey ?? question.questionId;
    if (question.type === "yes_no") {
      yesNo[key] = anyYes(submissions, question.questionId);
    } else if (question.type === "number" || question.type === "scale_1_10") {
      numbers[key] = dailyMaxNumber(submissions, question.questionId);
    } else if (
      question.type === "single_choice" ||
      question.type === "icon_choice" ||
      question.type === "face_scale"
    ) {
      if (question.metricKey !== "feeling") {
        choices[key] = lastNonBlank(submissions, question.questionId);
      }
    }
  }

  const spiroQ = questions.find((q) => q.type === "spirometry");
  let fev1: number | null = null;
  if (spiroQ) {
    // Prefer last non-blank spirometry payload for the day.
    const raw = lastNonBlank(submissions, spiroQ.questionId);
    if (raw) fev1 = parseSpirometry(raw).fev1;
  }

  const medEvents: Record<string, number> = {};
  const medUnits: Record<string, number> = {};
  for (const dose of log?.medicationAdministrations ?? []) {
    const units = Number(dose.value);
    const add = Number.isFinite(units) ? units : 1;
    medEvents[dose.medicationId] = (medEvents[dose.medicationId] ?? 0) + 1;
    medUnits[dose.medicationId] = (medUnits[dose.medicationId] ?? 0) + add;
  }

  return {
    day,
    feeling,
    feelingRank: feeling ? (FEELING_RANK[feeling] ?? null) : null,
    symptoms,
    yesNo,
    numbers,
    choices,
    fev1,
    fev1Pct:
      fev1 !== null && predictedFev1 && predictedFev1 > 0
        ? Math.round((fev1 / predictedFev1) * 1000) / 10
        : null,
    trackerSubmitted: nonBlankSubs.length > 0,
    multiSubmission: nonBlankSubs.length > 1,
    medEvents,
    medUnits,
  };
}

export function summarizePatient(
  patient: PatientDocument,
  trackers: TrackerDefinition[],
  windowDays = 30,
): ClinicianSummary {
  const questions = allQuestions(trackers);
  const logsByDay = new Map(patient.dailyLogs.map((log) => [log.day, log]));
  const sortedDays = [...logsByDay.keys()].sort();
  const endDay = sortedDays.at(-1) ?? new Date().toISOString().slice(0, 10);
  const startDay = windowStart(endDay, windowDays);
  const days = enumerateDays(startDay, endDay);

  const baseline = patient.medicalDevices
    .flatMap((device) => device.baselineReadings ?? [])
    .find((reading) => reading.accepted && reading.fvcPlusResults);
  const baselineFev1 = baseline?.fvcPlusResults?.fev1 ?? null;
  const baselineFev1Pct = baseline?.fvcPlusResults?.fev1PercentPredicted ?? null;
  const predictedFev1 =
    baselineFev1 !== null && baselineFev1Pct && baselineFev1Pct > 0
      ? baselineFev1 / (baselineFev1Pct / 100)
      : null;

  const dayMetrics = days.map((day) =>
    buildDayMetric(logsByDay.get(day), day, questions, predictedFev1),
  );

  const answered = dayMetrics.filter((d) => d.trackerSubmitted);
  let longestGap = 0;
  let gap = 0;
  for (const day of dayMetrics) {
    if (day.trackerSubmitted) gap = 0;
    else {
      gap += 1;
      longestGap = Math.max(longestGap, gap);
    }
  }

  const feelingCounts: Record<string, number> = {};
  const symptomCounts: Record<string, number> = {};
  for (const day of answered) {
    if (day.feeling) feelingCounts[day.feeling] = (feelingCounts[day.feeling] ?? 0) + 1;
    for (const symptom of day.symptoms) {
      symptomCounts[symptom] = (symptomCounts[symptom] ?? 0) + 1;
    }
  }

  const yesNoHighlights = questions
    .filter((q) => q.type === "yes_no")
    .map((q) => {
      const key = q.metricKey ?? q.questionId;
      const answeredDays = dayMetrics.filter((d) => d.yesNo[key] !== null).length;
      const yesDays = dayMetrics.filter((d) => d.yesNo[key] === true).length;
      return { key, label: q.text, yesDays, answeredDays };
    })
    .filter((item) => item.answeredDays > 0);

  const numberHighlights = questions
    .filter((q) => q.type === "number" || q.type === "scale_1_10")
    .map((q) => {
      const key = q.metricKey ?? q.questionId;
      const values = dayMetrics
        .map((d) => d.numbers[key])
        .filter((n): n is number => n !== null && n !== undefined);
      const avg =
        values.length > 0
          ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
          : null;
      const max = values.length > 0 ? Math.max(...values) : null;
      return {
        key,
        label: q.text,
        unit: q.unit,
        avg,
        max,
        answeredDays: values.length,
      };
    })
    .filter((item) => item.answeredDays > 0);

  const choiceHighlights = questions
    .filter(
      (q) =>
        (q.type === "single_choice" || q.type === "icon_choice") &&
        q.metricKey !== "feeling",
    )
    .map((q) => {
      const key = q.metricKey ?? q.questionId;
      const counts: Record<string, number> = {};
      let answeredDays = 0;
      for (const day of dayMetrics) {
        const value = day.choices[key];
        if (!value) continue;
        answeredDays += 1;
        counts[value] = (counts[value] ?? 0) + 1;
      }
      return { key, label: q.text, counts, answeredDays };
    })
    .filter((item) => item.answeredDays > 0);

  const activeMeds = patient.medications.filter((med) => !med.archived);
  const medications: MedSummary[] = activeMeds.map((med) => {
    const expectedPerDay = expectedDailyDoses(med);
    let daysWithDose = 0;
    let doseEvents = 0;
    let totalUnits = 0;
    for (const day of dayMetrics) {
      const events = day.medEvents[med.id] ?? 0;
      const units = day.medUnits[med.id] ?? 0;
      if (events > 0) {
        daysWithDose += 1;
        doseEvents += events;
        totalUnits += units;
      }
    }
    // Adherence = reported dose events / scheduled dose times in the window.
    // Administration `value` is quantity (e.g. tablets), not an event count.
    const expected = expectedPerDay * dayMetrics.length;
    const adherencePct =
      expected > 0 ? Math.round((doseEvents / expected) * 1000) / 10 : null;
    return {
      id: med.id,
      name: med.name,
      howOften: med.howOften,
      relatedCondition: med.relatedCondition,
      doseUnit: med.dosage.doseUnit,
      expectedPerDay,
      daysWithDose,
      doseEvents,
      totalUnits,
      adherencePct,
      windowDays: dayMetrics.length,
    };
  });

  const spiroSeries = dayMetrics
    .filter((d) => d.fev1 !== null)
    .map((d) => ({
      day: d.day,
      fev1: d.fev1 as number,
      fev1Pct: d.fev1Pct,
    }));

  const avgFev1Pct =
    spiroSeries.filter((s) => s.fev1Pct !== null).length > 0
      ? Math.round(
          (spiroSeries
            .filter((s) => s.fev1Pct !== null)
            .reduce((a, b) => a + (b.fev1Pct as number), 0) /
            spiroSeries.filter((s) => s.fev1Pct !== null).length) *
            10,
        ) / 10
      : null;

  let lastActivityAt: string | null = null;
  for (const log of patient.dailyLogs) {
    for (const submission of log.trackerResponses) {
      if (!lastActivityAt || submission.submittedAt > lastActivityAt) {
        lastActivityAt = submission.submittedAt;
      }
    }
    for (const dose of log.medicationAdministrations) {
      if (!lastActivityAt || dose.administeredAt > lastActivityAt) {
        lastActivityAt = dose.administeredAt;
      }
    }
  }

  return {
    patient: {
      displayName: patient.displayName,
      age: patient.age,
      sex: patient.sex,
      studyId: patient.studyId,
      personaId: patient.personaId,
      enrolledDate: patient.enrolledDate,
      conditions: [
        ...new Set([
          ...trackers.map((t) => t.condition),
          ...activeMeds.map((m) => m.relatedCondition),
        ]),
      ].filter(Boolean),
      trackerNames: patient.assignedTrackers.map((t) => t.trackerName),
    },
    windowDays: dayMetrics.length,
    aggregationNote:
      "Per-day answers use the last non-blank tracker submission. Checkboxes union all submissions that day. Yes/No is Yes if any submission that day said Yes. Numbers use the daily maximum. Medication adherence counts reported dose events versus scheduled times — patient-reported, not verified.",
    lastActivityAt,
    daysWithTrackerAnswers: answered.length,
    longestGapDays: longestGap,
    multiSubmissionDays: dayMetrics.filter((d) => d.multiSubmission).length,
    feelingSeries: dayMetrics.map((d) => ({
      day: d.day,
      rank: d.feelingRank,
      label: d.feeling,
    })),
    feelingCounts,
    symptomDays: dayMetrics.filter((d) => d.symptoms.length > 0).length,
    symptomCounts,
    yesNoHighlights,
    numberHighlights,
    choiceHighlights,
    medications,
    spirometry: {
      available: spiroSeries.length > 0 || baselineFev1Pct !== null,
      sessionsInWindow: spiroSeries.length,
      latestFev1: spiroSeries.at(-1)?.fev1 ?? null,
      latestFev1Pct: spiroSeries.at(-1)?.fev1Pct ?? null,
      avgFev1Pct,
      baselineFev1Pct,
      series: spiroSeries,
    },
    actionPlan: {
      status: patient.asthmaTreatmentPlan?.status ?? null,
      lastUpdated: patient.asthmaTreatmentPlan?.lastUpdated ?? null,
      expiration: patient.asthmaTreatmentPlan?.expiration ?? null,
    },
    recentDays: dayMetrics.slice(-14),
    deviceName: patient.medicalDevices[0]?.name ?? null,
  };
}
