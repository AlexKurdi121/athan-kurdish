import sqlite3 from "sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "player.db");

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Database connection error:", err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});