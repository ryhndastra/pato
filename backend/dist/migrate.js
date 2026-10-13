import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pool } from "./db.js";
const sqlDir = path.join(process.cwd(), "sql");
async function main() {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
    const files = (await readdir(sqlDir)).filter((f) => f.endsWith(".sql")).sort();
    const { rows: applied } = await pool.query("SELECT filename FROM _migrations");
    const appliedSet = new Set(applied.map((r) => r.filename));
    for (const file of files) {
        if (appliedSet.has(file)) {
            console.log(`skip  ${file} (already applied)`);
            continue;
        }
        const sql = await readFile(path.join(sqlDir, file), "utf8");
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            await client.query(sql);
            await client.query("INSERT INTO _migrations (filename) VALUES ($1)", [file]);
            await client.query("COMMIT");
            console.log(`apply ${file}`);
        }
        catch (error) {
            await client.query("ROLLBACK");
            throw error;
        }
        finally {
            client.release();
        }
    }
    await pool.end();
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
//# sourceMappingURL=migrate.js.map