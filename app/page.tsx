import { ClinicianDashboard } from "@/components/ClinicianDashboard";
import {
  labelForPatientFile,
  listPatientFiles,
  loadGroundTruth,
  loadPatient,
  loadTrackersForPatient,
} from "@/lib/load-data";
import { summarizePatient } from "@/lib/summarize";

type HomeProps = {
  searchParams: Promise<{ patient?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const patientFiles = await listPatientFiles();
  const requestedPatient = (await searchParams).patient;
  const selectedPatient = patientFiles.includes(requestedPatient ?? "")
    ? requestedPatient!
    : patientFiles[0];

  const patient = await loadPatient(selectedPatient);
  const trackers = await loadTrackersForPatient(patient);
  const groundTruth = await loadGroundTruth(patient.personaId);
  const summary = summarizePatient(patient, trackers, 30);

  return (
    <main>
      <ClinicianDashboard
        summary={summary}
        groundTruth={groundTruth}
        patientFiles={patientFiles}
        selectedPatient={selectedPatient}
        labelFor={labelForPatientFile}
      />
    </main>
  );
}
