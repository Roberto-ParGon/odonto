// lib/db.ts
import mysql from "mysql2/promise";

export const db = mysql.createPool({
  host: "localhost",
  user: "odontouser",
  password: "root",
  database: "odontopediatria",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});