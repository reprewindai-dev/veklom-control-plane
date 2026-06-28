import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/vnp/alerts/triggered`, {
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ error: "Upstream unavailable" }, { status: res.status });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
