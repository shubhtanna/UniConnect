import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("Set MONGODB_URI before migrating data");

const argumentsSet = new Set(process.argv.slice(2));
const sourceName = valueAfter("--source") ?? "test";
const targetName = valueAfter("--target") ?? "uniconnect";
const apply = argumentsSet.has("--apply");

if (sourceName === targetName) throw new Error("Source and target databases must be different");
if (!/^[a-zA-Z0-9_-]{1,64}$/.test(sourceName) || !/^[a-zA-Z0-9_-]{1,64}$/.test(targetName)) {
  throw new Error("Database names may contain only letters, numbers, underscores, and hyphens");
}

const collections = [
  "users",
  "emailotps",
  "profiles",
  "preloadedprofiles",
  "posts",
  "ratelimits",
  "profileviews",
  "brainstormgroups",
  "brainstormmessages",
];

await mongoose.connect(uri, { maxPoolSize: 5, dbName: sourceName });
const client = mongoose.connection.getClient();
const source = client.db(sourceName);
const target = client.db(targetName);

try {
  const sourceCollections = new Set((await source.listCollections({}, { nameOnly: true }).toArray()).map((item) => item.name));
  const targetCollections = new Set((await target.listCollections({}, { nameOnly: true }).toArray()).map((item) => item.name));
  const plan = [];

  for (const name of collections) {
    const sourceCount = sourceCollections.has(name) ? await source.collection(name).countDocuments() : 0;
    const targetCount = targetCollections.has(name) ? await target.collection(name).countDocuments() : 0;
    plan.push({ name, sourceCount, targetCount });
  }

  console.table(plan);
  if (!apply) {
    console.log(`Dry run only. Rerun with --apply to copy ${sourceName} to ${targetName}. Source data will not be deleted.`);
  } else {
    const occupied = plan.filter((item) => item.targetCount > 0);
    if (occupied.length) {
      throw new Error(`Target database is not empty for: ${occupied.map((item) => item.name).join(", ")}. Migration stopped without overwriting data.`);
    }

    for (const { name, sourceCount } of plan) {
      if (!targetCollections.has(name)) await target.createCollection(name);
      if (sourceCount > 0) {
        const documents = await source.collection(name).find({}).toArray();
        await target.collection(name).insertMany(documents, { ordered: true });
      }

      if (sourceCollections.has(name)) {
        const indexes = await source.collection(name).indexes();
        for (const index of indexes.filter((item) => item.name !== "_id_")) {
          const { key, name: indexName, v: _version, ns: _namespace, ...options } = index;
          await target.collection(name).createIndex(key, { ...options, name: indexName });
        }
      }
    }

    for (const { name, sourceCount } of plan) {
      const targetCount = await target.collection(name).countDocuments();
      if (targetCount !== sourceCount) throw new Error(`${name} verification failed: expected ${sourceCount}, found ${targetCount}`);
      if (sourceCount > 0) {
        const sourceIds = await source.collection(name).find({}, { projection: { _id: 1 } }).sort({ _id: 1 }).toArray();
        const targetIds = await target.collection(name).find({}, { projection: { _id: 1 } }).sort({ _id: 1 }).toArray();
        if (JSON.stringify(sourceIds) !== JSON.stringify(targetIds)) throw new Error(`${name} identifier verification failed`);
      }
    }

    console.log(`Migration verified. ${sourceName} remains unchanged; UniConnect data is now copied to ${targetName}.`);
  }
} finally {
  await mongoose.disconnect();
}

function valueAfter(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}
