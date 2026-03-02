import mysql, { Pool } from "mysql";

declare global {
  // eslint-disable-next-line no-var
  var __mysqlPool: Pool | undefined;
}

const pool =
  global.__mysqlPool ||
  mysql.createPool({
    connectionLimit: 10,
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || "3306"),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "root",
    database: process.env.MYSQL_DATABASE || "surfboard",
    charset: "utf8mb4"
  });

if (process.env.NODE_ENV !== "production") {
  global.__mysqlPool = pool;
}

export const query = <T = unknown>(sql: string, values: unknown[] = []) =>
  new Promise<T[]>((resolve, reject) => {
    pool.query(sql, values, (err, rows) => {
      if (err) return reject(err);
      resolve(rows as T[]);
    });
  });

export const execute = (sql: string, values: unknown[] = []) =>
  new Promise<mysql.OkPacket>((resolve, reject) => {
    pool.query(sql, values, (err, result) => {
      if (err) return reject(err);
      resolve(result as mysql.OkPacket);
    });
  });
