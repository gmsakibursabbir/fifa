import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// In-memory cache for resolved logos (caches for the duration of the serverless instance)
const logoCache = new Map<string, string | null>();

const GRADIENTS = [
  { from: "#00f0ff", to: "#0072ff" }, // Cyber Cyan to Blue
  { from: "#ff0055", to: "#7a002e" }, // Hot Pink to Dark Red
  { from: "#fcee0a", to: "#9a8a00" }, // Cyber Yellow to Dark Gold
  { from: "#39ff14", to: "#008f00" }, // Neon Green to Forest Green
  { from: "#b000ff", to: "#4f0080" }, // Purple to Dark Indigo
  { from: "#ff5e00", to: "#8a2b00" }, // Neon Orange to Rust Orange
];

function cleanChannelName(name: string): string {
  return name
    .replace(/\b(HD|FHD|SD|4K|1080p|720p|HEVC|RAW|BACKUP|ALT|MULTIPLEX|MULTI|H264|H265|50FPS|60FPS)\b/gi, "")
    .replace(/[\[\]\(\)\-\|]/g, "")
    .replace(/\b(US|UK|CA|FR|ES|IT|DE|PT|IN|BD|PK|AR|BR|MX):/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getInitials(name: string): string {
  const clean = cleanChannelName(name);
  const words = clean.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].substring(0, Math.min(3, words[0].length)).toUpperCase();
  if (words.length === 2) return (words[0][0] + words[1][0]).toUpperCase();
  return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
}

function getGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[index];
}

function generateFallbackSvg(name: string): string {
  const initials = getInitials(name);
  const grad = getGradient(name);
  // Premium look: clean dark background with subtle neon grid or glow is simulated via gradient and bold typography
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>
      <linearGradient id="grad-${initials}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${grad.from};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${grad.to};stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="16" fill="url(#grad-${initials})" />
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="32" letter-spacing="-0.5">
      ${initials}
    </text>
  </svg>`;
}

async function fetchWikipediaLogo(channelName: string): Promise<string | null> {
  const cleanName = cleanChannelName(channelName);
  if (!cleanName) return null;

  // Try 1: Search Wikipedia for "<name> logo"
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanName + " logo")}&gsrlimit=1&prop=pageimages&pithumbsize=200&format=json&origin=*`;
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent": "FIFA-Live-Hub-Agent/1.0 (Sk; sk@example.com)",
      },
    });
    if (res.ok) {
      const data = await res.json();
      const pages = data?.query?.pages;
      if (pages) {
        const firstPage = Object.values(pages)[0] as any;
        if (firstPage?.thumbnail?.source) {
          return firstPage.thumbnail.source;
        }
      }
    }
  } catch (error) {
    console.error("Wikipedia Search Logo query error:", error);
  }

  // Try 2: Search Wikipedia for just the cleaned name
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanName)}&gsrlimit=1&prop=pageimages&pithumbsize=200&format=json&origin=*`;
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent": "FIFA-Live-Hub-Agent/1.0 (Sk; sk@example.com)",
      },
    });
    if (res.ok) {
      const data = await res.json();
      const pages = data?.query?.pages;
      if (pages) {
        const firstPage = Object.values(pages)[0] as any;
        if (firstPage?.thumbnail?.source) {
          return firstPage.thumbnail.source;
        }
      }
    }
  } catch (error) {
    console.error("Wikipedia Search Fallback query error:", error);
  }

  // Try 3: Direct page title lookup for the cleaned name
  try {
    const directUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(cleanName)}&prop=pageimages&pithumbsize=200&format=json&origin=*`;
    const res = await fetch(directUrl, {
      headers: {
        "User-Agent": "FIFA-Live-Hub-Agent/1.0 (Sk; sk@example.com)",
      },
    });
    if (res.ok) {
      const data = await res.json();
      const pages = data?.query?.pages;
      if (pages) {
        const firstPage = Object.values(pages)[0] as any;
        if (firstPage?.thumbnail?.source) {
          return firstPage.thumbnail.source;
        }
      }
    }
  } catch (error) {
    console.error("Wikipedia Direct Title query error:", error);
  }

  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name) {
    return new NextResponse("Missing channel name", { status: 400 });
  }

  // 1. Check cache
  if (logoCache.has(name)) {
    const cachedUrl = logoCache.get(name);
    if (cachedUrl) {
      return NextResponse.redirect(cachedUrl, 307);
    } else {
      // Return beautiful fallback SVG
      const svg = generateFallbackSvg(name);
      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
      });
    }
  }

  // 2. Resolve from Wikipedia
  const resolvedUrl = await fetchWikipediaLogo(name);

  // 3. Update cache
  logoCache.set(name, resolvedUrl);

  if (resolvedUrl) {
    return NextResponse.redirect(resolvedUrl, 307);
  }

  // 4. Return custom premium SVG
  const svg = generateFallbackSvg(name);
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
