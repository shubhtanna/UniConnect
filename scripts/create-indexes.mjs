import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("Set MONGODB_URI before creating indexes");
const databaseName = process.env.MONGODB_DB ?? "uniconnect";

await mongoose.connect(uri, { maxPoolSize: 5, dbName: databaseName });
const database = mongoose.connection.db;
if (!database) throw new Error("MongoDB connection did not provide a database");

await Promise.all([
  database.collection("users").createIndex({ email: 1 }, { unique: true }),
  database.collection("emailotps").createIndex({ email: 1 }, { unique: true }),
  database.collection("emailotps").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  database.collection("profiles").createIndex({ userId: 1 }, { unique: true }),
  database.collection("profiles").createIndex({ skills: 1 }),
  database.collection("profiles").createIndex({ interests: 1 }),
  database.collection("profiles").createIndex({ cohort: 1 }),
  database.collection("preloadedprofiles").createIndex({ email: 1 }, { unique: true }),
  database.collection("preloadedprofiles").createIndex({ status: 1, createdAt: -1 }),
  database.collection("profileviews").createIndex({ viewerUserId: 1, viewedUserId: 1 }, { unique: true }),
  database.collection("profileviews").createIndex({ viewedUserId: 1, lastViewedAt: -1 }),
  database.collection("brainstormgroups").createIndex({ status: 1, access: 1, updatedAt: -1 }),
  database.collection("brainstormgroups").createIndex({ memberIds: 1, updatedAt: -1 }),
  database.collection("brainstormmessages").createIndex({ groupId: 1, createdAt: 1 }),
  database.collection("posts").createIndex({ type: 1, createdAt: -1 }),
  database.collection("posts").createIndex({ authorId: 1, type: 1, createdAt: -1 }),
  database.collection("ratelimits").createIndex({ key: 1 }, { unique: true }),
  database.collection("ratelimits").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
]);

const vectorIndexName = process.env.ATLAS_VECTOR_INDEX ?? "profile_embedding";
const dimensions = Number(process.env.OPENAI_EMBEDDING_DIMENSIONS ?? 1536);
try {
  await database.command({
    createSearchIndexes: "profiles",
    indexes: [{
      name: vectorIndexName,
      type: "vectorSearch",
      definition: {
        fields: [{ type: "vector", path: "resumeEmbedding", numDimensions: dimensions, similarity: "cosine" }],
      },
    }],
  });
  console.log(`Created Atlas vector index: ${vectorIndexName}`);
} catch (error) {
  const message = error instanceof Error ? error.message : "unknown error";
  console.warn(`Conventional indexes are ready. Atlas vector index was not created: ${message}`);
}

await mongoose.disconnect();
console.log("MongoDB indexes are ready.");
