import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import type { GroundTruth, PatientDocument, TrackerDefinition } from "./types";

const datasetRoot = path.join(process.cwd(), "datasets", "smarthome-dataset");
const demoRoot = path.join(process.cwd(), "datasets", "demo-fixtures");

export function labelForPatientFile(filename: string) {
  return filename
    .replace(/\.json$/, "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" · ");
}

export async function listPatientFiles() {
  const [source, demos] = await Promise.all([
    readdir(path.join(datasetRoot, "patients")),
    readdir(path.join(demoRoot, "patients")),
  ]);
  return [...source.sort(), ...demos.sort()].filter((filename) => filename.endsWith(".json"));
}

export async function loadPatient(filename: string): Promise<PatientDocument> {
  const root = filename.startsWith("demo-") ? demoRoot : datasetRoot;
  const raw = await readFile(path.join(root, "patients", filename), "utf8");
  return JSON.parse(raw) as PatientDocument;
}

export async function loadTrackersForPatient(
  patient: PatientDocument,
): Promise<TrackerDefinition[]> {
  const [source, demos] = await Promise.all([
    readdir(path.join(datasetRoot, "trackers")),
    readdir(path.join(demoRoot, "trackers")),
  ]);
  const trackerFiles = [
    ...source.map((filename) => ({ root: datasetRoot, filename })),
    ...demos.map((filename) => ({ root: demoRoot, filename })),
  ];
  const definitions: TrackerDefinition[] = [];

  for (const { root, filename } of trackerFiles) {
    if (!filename.endsWith(".json")) continue;
    const raw = await readFile(path.join(root, "trackers", filename), "utf8");
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
