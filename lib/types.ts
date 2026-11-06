export type TrackerQuestion = {
  questionId: string;
  text: string;
  type: string;
  required?: boolean;
  metricKey?: string;
  options?: string[];
  noneOption?: string;
  unit?: string;
  min?: number;
  max?: number;
};

export type TrackerDefinition = {
  trackerId: string;
  name: string;
  condition: string;
  version: number;
  questions: TrackerQuestion[];
};

export type Medication = {
  id: string;
  name: string;
  relatedCondition: string;
  howOften: string;
  icon?: string;
  dosage: {
    doseQuantity: number;
    doseUnit: string;
    timing: {
      periodUnit: string | null;
      interval: number | null;
      timesOfDay: string[];
      daysOfWeek: number[] | null;
    };
  };
  startDate: string;
  archived: boolean;
  index: number;
};

export type MedicationAdministration = {
  medicationId: string;
  name: string;
  administeredAt: string;
  value: string;
};

export type TrackerResponseValue = {
  questionId: string;
  value: string;
};

export type TrackerSubmission = {
  trackerId: string;
  trackerVersion: number;
  submittedAt: string;
  responses: TrackerResponseValue[];
};

export type DailyLog = {
  day: string;
  allMedicationsAdministered: boolean;
  trackerResponses: TrackerSubmission[];
  medicationAdministrations: MedicationAdministration[];
};

export type BaselineReading = {
  readingId: string;
  readingDate: string;
  accepted: boolean;
  fvcPlusResults?: {
    fvc: number;
    fev1: number;
    fev1PercentPredicted: number;
    fvcPercentPredicted: number;
    pefPercentPredicted: number;
  };
  qualityReport?: {
    sessionGrade: string;
  };
};

export type MedicalDevice = {
  id: string;
  name: string;
  serialNumber?: string;
  atsStandard?: string;
  baselineReadingDate?: string;
  baselineReadings?: BaselineReading[];
};

export type PatientDocument = {
  id: string;
  personaId: string;
  studyId: string;
  displayName: string;
  age: number;
  sex: string;
  dateOfBirth: string;
  heightCm?: number;
  enrolledDate: string;
  assignedTrackers: Array<{
    trackerId: string;
    trackerName: string;
    assignedDate: string;
  }>;
  medications: Medication[];
  medicalDevices: MedicalDevice[];
  asthmaTreatmentPlan?: {
    status: string;
    lastUpdated: string;
    expiration: string;
    retestTime: string | null;
  };
  dailyLogs: DailyLog[];
  earnedMedicationBadges?: unknown[];
  earnedTrackerBadges?: unknown[];
};

export type GroundTruth = {
  personaId: string;
  name: string;
  conditions: string[];
  viewers: string[];
  scenario: string;
  clinician30s: string;
  expectedFlags: string[];
  keyFindings: Record<string, string>;
};
