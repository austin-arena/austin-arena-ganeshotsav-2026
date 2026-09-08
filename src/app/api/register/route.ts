import { NextResponse } from "next/server";
import { validateRegistration } from "@/domain/registration/schema";
import { submitRegistration } from "@/domain/registration/sink";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Very small in-memory throttle. Replace with Upstash/Redis for multi-instance use. */
const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { ok: false, message: "Too many submissions. Please try again in a minute." },
      { status: 429 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request body." }, { status: 400 });
  }

  const { errors, data } = validateRegistration(payload);

  if (!data) {
    return NextResponse.json(
      { ok: false, message: "Please correct the highlighted fields.", errors },
      { status: 422 },
    );
  }

  try {
    const result = await submitRegistration(data);
    return NextResponse.json({ ok: true, delivered: result.delivered, message: result.message });
  } catch (error) {
    console.error("[registration] delivery failed", error);
    return NextResponse.json(
      {
        ok: false,
        message: "We could not save your registration right now. Please try again shortly.",
      },
      { status: 502 },
    );
  }
}

