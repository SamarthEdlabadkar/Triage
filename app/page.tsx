import { ClinicianApp } from "@/components/clinician/ClinicianApp";
import type { PageId } from "@/components/clinician/view-config";
import { buildClinicianModel, type PatientChoice } from "@/lib/clinician-model";
import { listPatientFiles, loadGroundTruth, loadPatient, loadTrackersForPatient } from "@/lib/load-data";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string; tracker?: string; page?: string }>;
}) {
  const params = await searchParams;
  const initialPage: PageId = params.page === "records" || params.page === "summary" ? params.page : "overview";
  const files = await listPatientFiles();
  const sourceFiles = files.filter((file) => !file.startsWith("demo-"));
  const uncoveredModules = ["demo-mood.json", "demo-adverse.json", "demo-diabetes.json"];
  const selectableFiles = [...sourceFiles, ...uncoveredModules.filter((file) => files.includes(file))];
  const patients: PatientChoice[] = [];

  for (const file of selectableFiles) {
    const document = await loadPatient(file);
    patients.push({
      file,
      name: file.startsWith("demo-") ? `${document.displayName} — ${document.assignedTrackers[0]?.trackerName ?? "Tracker"} demo` : document.displayName,
      trackers: document.assignedTrackers.map((tracker) => ({
        id: tracker.trackerId,
        name: tracker.trackerName,
      })),
    });
  }

  const file = params.patient && selectableFiles.includes(params.patient) ? params.patient : selectableFiles[0];
  const patient = await loadPatient(file);
  const trackers = await loadTrackersForPatient(patient);
  const tracker = trackers.find((item) => item.trackerId === params.tracker) ?? trackers[0];

  if (!tracker) {
    return (
      <main style={{ padding: 32 }}>
        <h1>No tracker on this record</h1>
        <p>{patient.displayName} has no assigned tracker definition in the dataset.</p>
      </main>
    );
  }

  const truth = await loadGroundTruth(patient.personaId);
  const model = buildClinicianModel(patient, file, tracker, truth);

  return <ClinicianApp key={`${file}:${tracker.trackerId}`} model={model} patients={patients} initialPage={initialPage} />;
}
