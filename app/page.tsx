import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

type HomeProps = {
  searchParams: Promise<{ patient?: string }>;
};

const patientDirectory = path.join(
  process.cwd(),
  "datasets",
  "smarthome-dataset",
  "patients",
);

function labelFor(filename: string) {
  return filename
    .replace(/\.json$/, "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" · ");
}

export default async function Home({ searchParams }: HomeProps) {
  const patientFiles = (await readdir(patientDirectory))
    .filter((filename) => filename.endsWith(".json"))
    .sort();
  const requestedPatient = (await searchParams).patient;
  const selectedPatient = patientFiles.includes(requestedPatient ?? "")
    ? requestedPatient!
    : patientFiles[0];
  const patient = JSON.parse(
    await readFile(path.join(patientDirectory, selectedPatient), "utf8"),
  ) as unknown;

  return (
    <main>
      <header className="page-header">
        <div>
          <p className="eyebrow">SMART@Home</p>
          <h1>Patient dataset</h1>
          <p className="lede">
            Synthetic hackathon data shown directly from the source JSON, without
            clinical interpretation.
          </p>
        </div>

        <form className="patient-picker">
          <label htmlFor="patient">Patient file</label>
          <div className="picker-controls">
            <select id="patient" name="patient" defaultValue={selectedPatient}>
              {patientFiles.map((filename) => (
                <option key={filename} value={filename}>
                  {labelFor(filename)}
                </option>
              ))}
            </select>
            <button type="submit">View JSON</button>
          </div>
        </form>
      </header>

      <section className="json-panel" aria-labelledby="json-title">
        <div className="panel-header">
          <div>
            <p className="panel-kicker">Raw source</p>
            <h2 id="json-title">{selectedPatient}</h2>
          </div>
          <span>{patientFiles.length} patient files</span>
        </div>
        <pre>
          <code>{JSON.stringify(patient, null, 2)}</code>
        </pre>
      </section>
    </main>
  );
}
