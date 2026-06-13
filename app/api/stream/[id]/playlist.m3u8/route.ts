import { NextRequest, NextResponse } from "next/server";
import { loadChannels } from "@/lib/channels";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const channelId = parseInt(id, 10);
    const channels = await loadChannels();
    const channel = channels.find((c) => c.id === channelId);

    if (!channel || !channel.stream) {
      return new Response("Channel not found", { status: 404 });
    }

    // Hotlink protection: check referer/origin headers
    const referer = request.headers.get("referer");
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    const isAllowedHost = (urlStr: string) => {
      try {
        const url = new URL(urlStr);
        return (
          url.host === host ||
          url.host.includes("localhost") ||
          url.host.includes("127.0.0.1")
        );
      } catch {
        return false;
      }
    };

    if (referer && !isAllowedHost(referer)) {
      return new Response("Access Denied: Hotlinking forbidden", { status: 403 });
    }
    if (origin && !isAllowedHost(origin)) {
      return new Response("Access Denied: Hotlinking forbidden", { status: 403 });
    }

    const streamUrl = channel.stream;
    
    // Check if the stream is an HLS playlist (usually ends in .m3u8 or contains m3u8)
    const cleanUrl = streamUrl.split("?")[0].toLowerCase();
    const isHls = cleanUrl.endsWith(".m3u8") || streamUrl.includes("m3u8");

    if (!isHls) {
      // Direct redirect for MPEG-TS or other streams
      return NextResponse.redirect(streamUrl);
    }

    // Attempt to proxy/rewrite the playlist manifest
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4-second timeout

      const res = await fetch(streamUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)",
        },
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        console.warn(`Manifest proxy failed with status ${res.status}, falling back to redirect.`);
        return NextResponse.redirect(streamUrl);
      }

      const text = await res.text();
      
      const parsedUrl = new URL(streamUrl);
      const originUrl = parsedUrl.origin;
      const lastSlashIdx = parsedUrl.pathname.lastIndexOf("/");
      const basePath = lastSlashIdx !== -1 ? parsedUrl.pathname.substring(0, lastSlashIdx + 1) : "/";
      const searchParams = parsedUrl.search; // e.g. ?token=xyz

      // Rewrite relative URLs inside the playlist manifest
      const lines = text.split("\n");
      const rewrittenLines = lines.map((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          // If relative URL (no http:// or https://)
          if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
            let absoluteUrl = "";
            if (trimmed.startsWith("/")) {
              absoluteUrl = originUrl + trimmed;
            } else {
              absoluteUrl = originUrl + basePath + trimmed;
            }
            
            // Forward search parameters/credentials to the segment requests
            if (searchParams) {
              const separator = absoluteUrl.includes("?") ? "&" : "?";
              absoluteUrl = absoluteUrl + separator + searchParams.substring(1);
            }
            return absoluteUrl;
          }
        }
        return line;
      });

      const headers = new Headers();
      headers.set("Content-Type", "application/vnd.apple.mpegurl");
      headers.set("Access-Control-Allow-Origin", "*");
      headers.set("Cache-Control", "no-cache, no-store, must-revalidate");

      return new Response(rewrittenLines.join("\n"), {
        status: 200,
        headers,
      });

    } catch (err) {
      console.error("Manifest proxy error, falling back to redirect:", err);
      return NextResponse.redirect(streamUrl);
    }

  } catch (error) {
    console.error("Stream route error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
