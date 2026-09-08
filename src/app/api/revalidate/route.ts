import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * On-demand refresh hook.
 *
 * Lets the committee publish sheet edits instantly instead of waiting for the
 * ISR window. Call with the shared secret:
 *
 *   POST /api/revalidate?secret=...
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;

  if (!secret) {
    return NextResponse.json(
      { ok: false, message: "Revalidation is not configured." },
      { status: 501 },
    );
  }

  const provided =
    new URL(request.url).searchParams.get("secret") ??
    request.headers.get("x-revalidate-secret") ??
    "";

  if (provided !== secret) {
    return NextResponse.json({ ok: false, message: "Invalid secret." }, { status: 401 });
  }

  // "max" expires the cached sheet response immediately on the next request.
  revalidateTag("events", "max");

  return NextResponse.json({ ok: true, revalidated: "events", at: new Date().toISOString() });
}

