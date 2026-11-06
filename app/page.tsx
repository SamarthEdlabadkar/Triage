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
  const patients: PatientChoice[] = [];

  for (const file of files) {
    const document = await loadPatient(file);
    patients.push({
      file,
      name: document.displayName,
      trackers: document.assignedTrackers.map((tracker) => ({
        id: tracker.trackerId,
        name: tracker.trackerName,
      })),
    });
  }

  const file = params.patient && files.includes(params.patient) ? params.patient : files[0];
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
