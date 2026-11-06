import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "smarthome";

if (!uri) {
  throw new Error("MONGODB_URI is not set. Add it to .env.local.");
}

const datasetRoot = path.join(process.cwd(), "datasets", "smarthome-dataset");

async function readJsonDir(folder) {
  const directory = path.join(datasetRoot, folder);
  const filenames = (await readdir(directory))
    .filter((filename) => filename.endsWith(".json"))
    .sort();
  const documents = [];

  for (const filename of filenames) {
    const raw = await readFile(path.join(directory, filename), "utf8");
    documents.push(JSON.parse(raw));
  }

  return documents;
}

const client = new MongoClient(uri);

try {
  const db = client.db(dbName);
  const patients = await readJsonDir("patients");
  const trackers = await readJsonDir("trackers");
  const groundTruth = await readJsonDir("ground_truth");

  const patientCollection = db.collection("patients");
  const trackerCollection = db.collection("trackers");
  const groundTruthCollection = db.collection("groundTruth");

  await patientCollection.createIndex({ personaId: 1 }, { unique: true });
  await trackerCollection.createIndex({ trackerId: 1 }, { unique: true });
  await groundTruthCollection.createIndex({ personaId: 1 }, { unique: true });

  for (const patient of patients) {
    await patientCollection.replaceOne({ personaId: patient.personaId }, patient, {
      upsert: true,
    });
  }

  for (const tracker of trackers) {
    await trackerCollection.replaceOne({ trackerId: tracker.trackerId }, tracker, {
      upsert: true,
    });
  }

  for (const truth of groundTruth) {
    await groundTruthCollection.replaceOne({ personaId: truth.personaId }, truth, {
      upsert: true,
    });
  }

  console.log(
    `Seeded ${dbName}: ${patients.length} patients, ${trackers.length} trackers, ${groundTruth.length} ground-truth files.`,
  );
} finally {
  await client.close();
}
