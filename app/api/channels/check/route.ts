import { NextRequest, NextResponse } from "next/server";
import { loadChannels } from "@/lib/channels";

export const dynamic = "force-dynamic";

function authCheck(request: NextRequest): boolean {
  return request.headers.get("x-admin-token") === process.env.ADMIN_PASSWORD;
}

async function checkStream(url: string): Promise<"online" | "offline"> {
  if (!url) return "offline";
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5 second timeout

    // Try HEAD request first
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)",
      },
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (res && res.ok) {
      return "online";
    }

    // Fallback to GET request with dynamic abort
    const getController = new AbortController();
    const getTimeoutId = setTimeout(() => getController.abort(), 2500);

    const getRes = await fetch(url, {
      method: "GET",
      signal: getController.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)",
      },
    });

    clearTimeout(getTimeoutId);

    if (getRes.body) {
      getRes.body.cancel().catch(() => {});
    }

    return getRes.ok ? "online" : "offline";
  } catch (err) {
    return "offline";
  }
}

export async function GET(request: NextRequest) {
  if (!authCheck(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const idParam = searchParams.get("id");

  const channels = await loadChannels();

  if (idParam) {
    const channelId = parseInt(idParam, 10);
    const channel = channels.find((c) => c.id === channelId);
    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }
    const status = await checkStream(channel.stream);
    return NextResponse.json({ id: channelId, status });
  }

  // Check all channels in chunks of e.g. 15 parallel requests
  const results: Record<number, "online" | "offline"> = {};
  const chunkSize = 15;

  for (let i = 0; i < channels.length; i += chunkSize) {
    const chunk = channels.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async (ch) => {
        results[ch.id] = await checkStream(ch.stream);
      })
    );
  }

  return NextResponse.json({ statuses: results });
}
