import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { Channel } from "@/types/channel";

export const dynamic = "force-dynamic";

const DATA_PATH = join(process.cwd(), "data", "channels.json");

function loadChannels(): Channel[] {
  try {
    return JSON.parse(readFileSync(DATA_PATH, "utf-8")) as Channel[];
  } catch {
    return [];
  }
}

function saveChannels(channels: Channel[]): void {
  writeFileSync(DATA_PATH, JSON.stringify(channels, null, 2), "utf-8");
}

function authCheck(request: NextRequest): boolean {
  return request.headers.get("x-admin-token") === process.env.ADMIN_PASSWORD;
}

export async function GET() {
  return NextResponse.json(loadChannels());
}

// POST — single channel OR bulk array insert
export async function POST(request: NextRequest) {
  if (!authCheck(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as Partial<Channel> | Partial<Channel>[];
  const channels = loadChannels();

  if (Array.isArray(body)) {
    // Bulk insert
    const maxId = channels.reduce((max, c) => (c.id > max ? c.id : max), 0);
    const startId = Math.max(maxId, Date.now());
    const newChannels: Channel[] = body.map((ch, idx) => ({
      id: startId + idx + 1,
      name: ch.name || "New Channel",
      logo: ch.logo || "",
      stream: ch.stream || "",
      category: ch.category || "Sports",
      description: ch.description,
      language: ch.language,
      country: ch.country,
      isLive: ch.isLive ?? true,
      quality: ch.quality || "HD",
      featured: ch.featured ?? false,
    }));
    channels.push(...newChannels);
    saveChannels(channels);
    return NextResponse.json(newChannels, { status: 201 });
  }

  // Single insert
  const maxId = channels.reduce((max, c) => (c.id > max ? c.id : max), 0);
  const newChannel: Channel = {
    id: Math.max(maxId, Date.now()) + 1,
    name: body.name || "New Channel",
    logo: body.logo || "",
    stream: body.stream || "",
    category: body.category || "Sports",
    description: body.description,
    language: body.language,
    country: body.country,
    isLive: body.isLive ?? true,
    quality: body.quality || "HD",
    featured: body.featured ?? false,
  };
  channels.push(newChannel);
  saveChannels(channels);
  return NextResponse.json(newChannel, { status: 201 });
}

export async function PUT(request: NextRequest) {
  if (!authCheck(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as Channel;
  const channels = loadChannels();
  const idx = channels.findIndex((c) => c.id === body.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  channels[idx] = { ...channels[idx], ...body };
  saveChannels(channels);
  return NextResponse.json(channels[idx]);
}

// DELETE — single (?id=123), bulk (?ids=1,2,3), or all (?all=true)
export async function DELETE(request: NextRequest) {
  if (!authCheck(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "true";
  const idsParam = searchParams.get("ids");
  const idParam = searchParams.get("id");

  let channels = loadChannels();

  if (all) {
    saveChannels([]);
    return NextResponse.json({ success: true, deleted: channels.length });
  }

  if (idsParam) {
    const ids = new Set(idsParam.split(",").map((s) => parseInt(s, 10)).filter(Boolean));
    channels = channels.filter((c) => !ids.has(c.id));
    saveChannels(channels);
    return NextResponse.json({ success: true, deleted: ids.size });
  }

  const id = parseInt(idParam || "0", 10);
  channels = channels.filter((c) => c.id !== id);
  saveChannels(channels);
  return NextResponse.json({ success: true });
}
