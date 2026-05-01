import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

/** True when required MySQL env vars are present (password may be empty for local dev). */
export function isMysqlLessonsConfigured(): boolean {
  return Boolean(
    process.env.MYSQL_HOST?.trim() &&
      process.env.MYSQL_USER !== undefined &&
      process.env.MYSQL_DATABASE?.trim()
  );
}

/** Shared pool for API routes (Node runtime only). */
export function getMysqlPool(): mysql.Pool | null {
  if (!isMysqlLessonsConfigured()) return null;
  if (pool) return pool;

  const port = Number(process.env.MYSQL_PORT || "3306");
  pool = mysql.createPool({
    host: process.env.MYSQL_HOST!.trim(),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD ?? "",
    database: process.env.MYSQL_DATABASE!.trim(),
    port: Number.isFinite(port) ? port : 3306,
    waitForConnections: true,
    connectionLimit: Number(process.env.MYSQL_POOL_SIZE || "10"),
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });

  return pool;
}
