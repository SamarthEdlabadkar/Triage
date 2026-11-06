import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import type { GroundTruth, PatientDocument, TrackerDefinition } from "./types";

const datasetRoot = path.join(process.cwd(), "datasets", "smarthome-dataset");

export function labelForPatientFile(filename: string) {
  return filename
    .replace(/\.json$/, "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" · ");
}

export async function listPatientFiles() {
  const files = await readdir(path.join(datasetRoot, "patients"));
  return files.filter((filename) => filename.endsWith(".json")).sort();
}

export async function loadPatient(filename: string): Promise<PatientDocument> {
  const raw = await readFile(path.join(datasetRoot, "patients", filename), "utf8");
  return JSON.parse(raw) as PatientDocument;
}

export async function loadTrackersForPatient(
  patient: PatientDocument,
): Promise<TrackerDefinition[]> {
  const trackerFiles = await readdir(path.join(datasetRoot, "trackers"));
  const definitions: TrackerDefinition[] = [];

  for (const filename of trackerFiles) {
    if (!filename.endsWith(".json")) continue;
    const raw = await readFile(path.join(datasetRoot, "trackers", filename), "utf8");
    const tracker = JSON.parse(raw) as TrackerDefinition;
    if (patient.assignedTrackers.some((assigned) => assigned.trackerId === tracker.trackerId)) {
      definitions.push(tracker);
    }
  }

  return definitions;
}

export async function loadGroundTruth(
  personaId: string,
): Promise<GroundTruth | null> {
  try {
    const raw = await readFile(
      path.join(datasetRoot, "ground_truth", `${personaId}.json`),
      "utf8",
    );
    return JSON.parse(raw) as GroundTruth;
  } catch {
    return null;
  }
}
