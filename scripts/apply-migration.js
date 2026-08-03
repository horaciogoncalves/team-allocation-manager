const { neon } = require("@neondatabase/serverless");
const fs = require("fs");
const path = require("path");

const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error("Usage: node scripts/apply-migration.js <path-to-migration.sql>");
  process.exit(1);
}

const envPath = path.join(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("Missing .env.local file");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf-8");
const databaseUrlMatch = envContent.match(/^DATABASE_URL=(.+)$/m);

if (!databaseUrlMatch) {
  console.error("Missing DATABASE_URL in .env.local");
  process.exit(1);
}

const databaseUrl = databaseUrlMatch[1].trim();

const sqlFilePath = path.resolve(migrationFile);
if (!fs.existsSync(sqlFilePath)) {
  console.error(`Migration file not found: ${sqlFilePath}`);
  process.exit(1);
}

const sqlContent = fs.readFileSync(sqlFilePath, "utf-8");

const sql = neon(databaseUrl);

async function run() {
  await sql.query(sqlContent);
  console.log(`Migration applied: ${path.basename(sqlFilePath)}`);
}

run().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
