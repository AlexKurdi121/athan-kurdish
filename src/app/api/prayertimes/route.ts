// app/api/prayertimes/route.ts
import { NextRequest, NextResponse } from "next/server";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

// Open SQLite database
async function openDb() {
  return open({
    filename: "./player.db", // make sure path is correct
    driver: sqlite3.Database,
  });
}

export async function GET(req: NextRequest) {
  try {
    const db = await openDb();

    const rows = await db.all(`
      SELECT bayani, xorhalatn, niwaro, asr, eywara, esha, date
      FROM PrayerTimesforKurdistantable
      WHERE cities = 'Hawler'
        AND iso = 'IQ'
        AND date BETWEEN '02-18' AND '03-19'
      ORDER BY date ASC
    `);

    await db.close();

    // ✅ Return raw 24-hour times (NO conversion here)
    return NextResponse.json(rows);

  } catch (err) {
    console.error("SQL ERROR:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}