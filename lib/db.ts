import "server-only";
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Missing environment variable: DATABASE_URL");
}

/**
 * Server-only query function for Neon PostgreSQL.
 *
 * Use parameterized queries to prevent SQL injection:
 *   const rows = await query<Member>("SELECT * FROM members WHERE id = $1", [id]);
 */
export const sql = neon(databaseUrl);

export async function query<T = Record<string, unknown>>(
  queryText: string,
  params: unknown[] = []
): Promise<T[]> {
  return sql.query(queryText, params) as Promise<T[]>;
}
