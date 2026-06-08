import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

const DATA_PATH = join(process.cwd(), "data", "banners.json");

export async function GET() {
  try {
    const banners = JSON.parse(readFileSync(DATA_PATH, "utf-8"));
    return NextResponse.json(banners);
  } catch (error) {
    console.error("Failed to load banners:", error);
    return NextResponse.json({ error: "Failed to load banners" }, { status: 500 });
  }
}
