import { NextResponse } from "next/server";
import prayerData from "@/data/prayerTimes.json";

export async function GET() {

  return NextResponse.json(prayerData);

}