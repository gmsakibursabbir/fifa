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

    // Check if we are requesting a sub-playlist directory path (e.g., ?path=tracks-v1a1/mono.m3u8)
    const { searchParams } = new URL(request.url);
    const subPath = searchParams.get("path");

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

    const baseStreamUrl = channel.stream;
    const parsedBaseUrl = new URL(baseStreamUrl);
    const originUrl = parsedBaseUrl.origin;
    const lastSlashIdx = parsedBaseUrl.pathname.lastIndexOf("/");
    const basePath = lastSlashIdx !== -1 ? parsedBaseUrl.pathname.substring(0, lastSlashIdx + 1) : "/";

    // Resolve target URL to fetch (either base index or subpath)
    let targetUrl = baseStreamUrl;
    if (subPath) {
      if (subPath.startsWith("/")) {
        targetUrl = originUrl + subPath;
      } else {
        targetUrl = originUrl + basePath + subPath;
      }
    }

    const cleanUrl = targetUrl.split("?")[0].toLowerCase();
    const isHls = cleanUrl.endsWith(".m3u8") || targetUrl.includes("m3u8");

    if (!isHls) {
      return NextResponse.redirect(targetUrl);
    }

    // Attempt to proxy/rewrite the playlist manifest
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4-second timeout

      const res = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)",
        },
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        console.warn(`Manifest proxy failed with status ${res.status}, falling back to redirect.`);
        return NextResponse.redirect(targetUrl);
      }

      const text = await res.text();
      const lines = text.split("\n");
      
      const rewrittenLines = lines.map((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          // If this is a sub-playlist (.m3u8), route it back through this proxy
          if (trimmed.endsWith(".m3u8") || trimmed.includes(".m3u8")) {
            let relativePath = trimmed;
            if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
              try {
                const u = new URL(trimmed);
                if (u.origin === originUrl) {
                  relativePath = u.pathname.substring(basePath.length);
                }
              } catch {}
            }
            return `/api/stream/${channelId}/playlist.m3u8?path=${encodeURIComponent(relativePath)}`;
          }

          // If relative URL (no http:// or https://) for video segments (.ts)
          if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
            let currentDir = basePath;
            if (subPath) {
              const lastSubSlash = subPath.lastIndexOf("/");
              if (lastSubSlash !== -1) {
                currentDir = basePath + subPath.substring(0, lastSubSlash + 1);
              }
            }
            let absoluteUrl = originUrl + currentDir + trimmed;
            
            const baseParams = parsedBaseUrl.search;
            if (baseParams) {
              const separator = absoluteUrl.includes("?") ? "&" : "?";
              absoluteUrl = absoluteUrl + separator + baseParams.substring(1);
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
      return NextResponse.redirect(targetUrl);
    }

  } catch (error) {
    console.error("Stream route error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
