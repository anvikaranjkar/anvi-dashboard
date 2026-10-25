import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://iiwjnqfbhzfzwzvccapc.supabase.co";

function configuration() {
  return {
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  };
}

function serviceHeaders(serviceKey: string) {
  return { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };
}

export async function GET() {
  const { serviceKey, publicKey } = configuration();
  return NextResponse.json({ configured: Boolean(serviceKey && publicKey), publicKey });
}

export async function POST(request: NextRequest) {
  const { serviceKey, publicKey } = configuration();
  if (!serviceKey || !publicKey) return NextResponse.json({ error: "Background push is not configured." }, { status: 503 });
  const body = await request.json().catch(() => null) as { endpoint?: string; keys?: { p256dh?: string; auth?: string } } | null;
  if (!body?.endpoint || !body.keys?.p256dh || !body.keys.auth) return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
  const response = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?on_conflict=endpoint`, {
    method: "POST",
    headers: { ...serviceHeaders(serviceKey), Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ endpoint: body.endpoint, p256dh: body.keys.p256dh, auth: body.keys.auth, updated_at: new Date().toISOString() }),
  });
  if (!response.ok) return NextResponse.json({ error: "Could not register this device." }, { status: 502 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const { serviceKey } = configuration();
  if (!serviceKey) return NextResponse.json({ error: "Background push is not configured." }, { status: 503 });
  const body = await request.json().catch(() => null) as { endpoint?: string } | null;
  if (!body?.endpoint) return NextResponse.json({ error: "Missing endpoint." }, { status: 400 });
  const response = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(body.endpoint)}`, { method: "DELETE", headers: serviceHeaders(serviceKey) });
  if (!response.ok) return NextResponse.json({ error: "Could not remove this device." }, { status: 502 });
  return NextResponse.json({ ok: true });
}
