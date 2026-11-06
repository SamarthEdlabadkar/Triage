import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import AdmZip from "adm-zip";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const archivePath = join(
  projectRoot,
  "datasets",
  "smarthome-test-dataset.zip",
);
const extractedPath = join(projectRoot, "datasets", "smarthome-dataset");

if (!existsSync(archivePath)) {
  throw new Error(`Dataset archive not found: ${archivePath}`);
}

if (!existsSync(extractedPath)) {
  mkdirSync(dirname(extractedPath), { recursive: true });
  new AdmZip(archivePath).extractAllTo(dirname(extractedPath), true);
  console.log("Extracted SMART@Home dataset.");
}
