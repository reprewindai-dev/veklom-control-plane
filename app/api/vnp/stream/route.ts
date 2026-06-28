export const dynamic = "force-dynamic";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export async function GET(req: Request) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/vnp/stream`, {
      headers: {
        Accept: "text/event-stream",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return new Response("Upstream stream unavailable", { status: res.status });
    }

    return new Response(res.body as ReadableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    return new Response("Internal Error", { status: 500 });
  }
}
