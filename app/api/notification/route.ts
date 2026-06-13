import { NextRequest, NextResponse } from "next/server";
import { loadNotificationConfig, saveNotificationConfig, NotificationConfig } from "@/lib/notification";

export const dynamic = "force-dynamic";

function authCheck(request: NextRequest): boolean {
  return request.headers.get("x-admin-token") === process.env.ADMIN_PASSWORD;
}

export async function GET() {
  try {
    const config = await loadNotificationConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error("Failed to load notification config:", error);
    return NextResponse.json({ error: "Failed to load configuration" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!authCheck(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json() as NotificationConfig;
    const success = await saveNotificationConfig(body);
    if (success) {
      return NextResponse.json(body);
    } else {
      return NextResponse.json({ error: "Failed to save configuration" }, { status: 500 });
    }
  } catch (error) {
    console.error("Failed to save notification config:", error);
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
