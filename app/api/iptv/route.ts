import { NextRequest, NextResponse } from "next/server";
import { loadIPTVConfig, saveIPTVConfig, syncIPTVPlaylist, IPTVConfig } from "@/lib/iptv";

export const dynamic = "force-dynamic";

function authCheck(request: NextRequest): boolean {
  return request.headers.get("x-admin-token") === process.env.ADMIN_PASSWORD;
}

export async function GET(request: NextRequest) {
  if (!authCheck(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await loadIPTVConfig();
  return NextResponse.json(config || { playlistUrl: "", autoUpdate: false });
}

export async function POST(request: NextRequest) {
  if (!authCheck(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const triggerSync = searchParams.get("sync") === "true";

  try {
    const body = await request.json() as Partial<IPTVConfig>;
    
    // Fetch current config first to preserve fields like lastUpdated/channelCount if not provided
    const currentConfig = await loadIPTVConfig();
    const config: IPTVConfig = {
      playlistUrl: body.playlistUrl || currentConfig?.playlistUrl || "",
      autoUpdate: body.autoUpdate ?? currentConfig?.autoUpdate ?? false,
      syncMode: body.syncMode || currentConfig?.syncMode || "merge",
      lastUpdated: currentConfig?.lastUpdated,
      channelCount: currentConfig?.channelCount,
    };

    await saveIPTVConfig(config);

    if (triggerSync) {
      if (!config.playlistUrl) {
        return NextResponse.json({ error: "Cannot sync: Playlist URL is empty" }, { status: 400 });
      }
      const syncResult = await syncIPTVPlaylist();
      return NextResponse.json({
        success: true,
        config: await loadIPTVConfig(),
        sync: syncResult,
      });
    }

    return NextResponse.json({ success: true, config });
  } catch (error: any) {
    console.error("API IPTV POST error:", error);
    return NextResponse.json({ error: error.message || "Failed to process request" }, { status: 500 });
  }
}
