import type { GroundTruth, PatientDocument, TrackerDefinition } from "./types";
import { getDb } from "./db";

export function labelForPatientFile(filename: string) {
  return filename
    .replace(/\.json$/, "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" · ");
}

function personaIdFromFile(filename: string) {
  return filename.replace(/\.json$/, "");
}

export type PatientSummary = {
  file: string;
  name: string;
  trackers: Array<{ id: string; name: string }>;
};

export async function listPatients(): Promise<PatientSummary[]> {
  const documents = await getDb()
    .collection("patients")
    .find(
      {},
      { projection: { _id: 0, personaId: 1, displayName: 1, assignedTrackers: 1 } },
    )
    .toArray();

  return documents
    .map((document) => ({
      file: `${document.personaId}.json`,
      name: String(document.displayName),
      trackers: (document.assignedTrackers ?? []).map(
        (tracker: { trackerId: string; trackerName: string }) => ({
          id: tracker.trackerId,
          name: tracker.trackerName,
        }),
      ),
    }))
    .sort((a, b) => a.file.localeCompare(b.file));
}

export async function listPatientFiles() {
  const patients = await listPatients();
  return patients.map((patient) => patient.file);
}

export async function loadPatient(filename: string): Promise<PatientDocument> {
  const patient = await getDb()
    .collection("patients")
    .findOne({ personaId: personaIdFromFile(filename) }, { projection: { _id: 0 } });

  if (!patient) {
    throw new Error(`Patient not found: ${filename}`);
  }

  return patient as unknown as PatientDocument;
}

export async function loadTrackersForPatient(
  patient: PatientDocument,
): Promise<TrackerDefinition[]> {
  const trackerIds = patient.assignedTrackers.map((tracker) => tracker.trackerId);
  const trackers = await getDb()
    .collection("trackers")
    .find({ trackerId: { $in: trackerIds } }, { projection: { _id: 0 } })
    .toArray();

  return trackers as unknown as TrackerDefinition[];
}

export async function loadGroundTruth(personaId: string): Promise<GroundTruth | null> {
  const truth = await getDb()
    .collection("groundTruth")
    .findOne({ personaId }, { projection: { _id: 0 } });

  return (truth as unknown as GroundTruth | null) ?? null;
}
