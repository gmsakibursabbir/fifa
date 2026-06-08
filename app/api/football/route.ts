import { NextRequest, NextResponse } from "next/server";
import {
  getLiveMatches,
  getTodayMatches,
  getMatchesByStatus,
  getUpcomingMatches,
  getStandings,
  getMatchById,
  getCompetitionMatches,
} from "@/lib/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action      = searchParams.get("action") || "today";
  const status      = searchParams.get("status") || "";
  const id          = searchParams.get("id") || "";
  const competition = searchParams.get("competition") || "";

  try {
    switch (action) {
      case "live":
        return NextResponse.json(await getLiveMatches());
      case "today":
        return NextResponse.json(await getTodayMatches());
      case "upcoming":
        return NextResponse.json(await getUpcomingMatches());
      case "match":
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
        return NextResponse.json(await getMatchById(id));
      case "standings":
        if (!competition) return NextResponse.json({ error: "competition required" }, { status: 400 });
        return NextResponse.json(await getStandings(competition));
      case "competition":
        if (!competition) return NextResponse.json({ error: "competition required" }, { status: 400 });
        return NextResponse.json(await getCompetitionMatches(competition, status || undefined));
      case "status":
        if (!status) return NextResponse.json({ error: "status required" }, { status: 400 });
        return NextResponse.json(await getMatchesByStatus(status));
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Football API route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
