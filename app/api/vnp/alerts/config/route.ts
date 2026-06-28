import { NextResponse, NextRequest } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/vnp/alerts/config`, {
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ error: "Upstream unavailable" }, { status: res.status });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${API_BASE}/api/v1/vnp/alerts/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) return NextResponse.json({ error: "Upstream unavailable" }, { status: res.status });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to post" }, { status: 500 });
  }
}
