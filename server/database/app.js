/**
 * MongoDB seed loader for the Cars Dealership capstone.
 *
 * The reference architecture keeps the dealership catalogue in MongoDB.  The
 * Django application in this repository talks to SQLite/PostgreSQL, but the
 * same JSON documents in server/database/data can be loaded into MongoDB with
 * this script so both storage options stay in sync.
 *
 *   cd server/database
 *   npm install
 *   MONGODB_URL="mongodb://localhost:27017" npm run seed
 */
const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

const DATA_DIR = path.join(__dirname, "data");
const read = (file) =>
  JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf-8"));

async function main() {
  const url = process.env.MONGODB_URL || "mongodb://localhost:27017";
  const client = new MongoClient(url);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "dealerships");

  const dealers = await db.collection("dealerships");
  await dealers.deleteMany({});
  await dealers.insertMany(read("dealerships.json"));

  const cars = await db.collection("cars");
  await cars.deleteMany({});
  await cars.insertMany(read("car_models.json"));

  const reviews = await db.collection("reviews");
  await reviews.deleteMany({});
  await reviews.insertMany(read("reviews.json"));

  console.log(
    `Loaded ${read("dealerships.json").length} dealers, ` +
      `${read("car_models.json").length} car makes and ` +
      `${read("reviews.json").length} reviews into MongoDB`
  );
  await client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
