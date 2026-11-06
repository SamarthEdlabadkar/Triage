import { ClinicianApp } from "@/components/clinician/ClinicianApp";
import { buildClinicianModel, type PatientChoice } from "@/lib/clinician-model";
import { listPatients, loadGroundTruth, loadPatient, loadTrackersForPatient } from "@/lib/load-data";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string; tracker?: string }>;
}) {
  const params = await searchParams;
  const patients: PatientChoice[] = await listPatients();
  const files = patients.map((patient) => patient.file);
  const file = params.patient && files.includes(params.patient) ? params.patient : files[0];

  if (!file) {
    return (
      <main style={{ padding: 32 }}>
        <h1>No patients in the database</h1>
        <p>Set MONGODB_URI in .env.local, then run npm run seed.</p>
      </main>
    );
  }

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

  return <ClinicianApp key={`${file}:${tracker.trackerId}`} model={model} patients={patients} />;
}
