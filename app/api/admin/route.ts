import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json() as { password: string };
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

  if (body.password === ADMIN_PASSWORD) {
    return NextResponse.json({ success: true, token: ADMIN_PASSWORD });
  }

  return NextResponse.json({ error: "Invalid password" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get("x-admin-token");
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

  if (auth === ADMIN_PASSWORD) {
    return NextResponse.json({ authenticated: true });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}
