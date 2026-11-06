import { MongoClient, type Db } from "mongodb";

const globalForMongo = globalThis as typeof globalThis & {
  mongoClient?: MongoClient;
};

export function getDb(): Db {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Add it to .env.local.");
  }

  if (!globalForMongo.mongoClient) {
    globalForMongo.mongoClient = new MongoClient(uri);
  }

  return globalForMongo.mongoClient.db(process.env.MONGODB_DB || "smarthome");
}
