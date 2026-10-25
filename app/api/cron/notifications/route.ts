import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://iiwjnqfbhzfzwzvccapc.supabase.co";
const TIME_ZONE = "Australia/Sydney";

type Todo = { id: string; text: string; done?: boolean; archivedAt?: string; dueDate?: string; reminder?: string };
type Subject = { id: string; name: string; todos?: Todo[]; exercises?: Todo[] };
type Meeting = { id: string; title: string; startsAt: string; reminderMinutes?: number; subjectId?: string };
type Dashboard = { overallTodos?: Todo[]; subjects?: Subject[]; meetings?: Meeting[]; notificationSettings?: { morningSummary?: boolean; morningTime?: string; overdueNudges?: boolean; nudgeIntervalHours?: number; eveningSummary?: boolean; eveningTime?: string } };
type Subscription = { endpoint: string; p256dh: string; auth: string };
type Notice = { key: string; title: string; body: string; tag: string; url: string };

function headers(serviceKey: string) { return { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" }; }
function zoned(now: Date) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-AU", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now).map(part => [part.type, part.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}`, hour: Number(parts.hour), minute: Number(parts.minute) };
}
function minutesOf(value: string) { const [hour, minute] = value.split(":").map(Number); return hour * 60 + minute; }
function dueWithin(target: number, now: number, windowMinutes = 17) { return target <= now && target > now - windowMinutes * 60000; }

function noticesFor(data: Dashboard, now: Date): Notice[] {
  const local = zoned(now);
  const subjects = data.subjects || [];
  const todos = [
    ...(data.overallTodos || []).map(todo => ({ todo, subject: "Personal" })),
    ...subjects.flatMap(subject => [...(subject.todos || []), ...(subject.exercises || [])].map(todo => ({ todo, subject: subject.name }))),
  ].filter(item => !item.todo.done && !item.todo.archivedAt);
  const meetings = data.meetings || [];
  const settings = data.notificationSettings || {};
  const notices: Notice[] = [];

  for (const item of todos) {
    if (!item.todo.reminder) continue;
    const target = new Date(item.todo.reminder).getTime();
    if (dueWithin(target, now.getTime())) notices.push({ key: `todo-${item.todo.id}-${item.todo.reminder}`, title: `${item.subject} reminder`, body: item.todo.text, tag: `todo-${item.todo.id}`, url: "/" });
  }
  for (const meeting of meetings) {
    const target = new Date(meeting.startsAt).getTime() - (meeting.reminderMinutes ?? 15) * 60000;
    if (!dueWithin(target, now.getTime())) continue;
    const subject = subjects.find(item => item.id === meeting.subjectId)?.name;
    notices.push({ key: `meeting-${meeting.id}-${meeting.startsAt}-${meeting.reminderMinutes ?? 15}`, title: subject ? `${subject} event` : "Upcoming event", body: `${meeting.title} ${meeting.reminderMinutes ? `starts in ${meeting.reminderMinutes} minutes` : "starts now"}`, tag: `meeting-${meeting.id}`, url: "/" });
  }

  const dueToday = todos.filter(item => item.todo.dueDate === local.date);
  const overdue = todos.filter(item => item.todo.dueDate && item.todo.dueDate < local.date);
  const meetingsToday = meetings.filter(meeting => zoned(new Date(meeting.startsAt)).date === local.date);
  const currentMinutes = local.hour * 60 + local.minute;
  const morningMinutes = minutesOf(settings.morningTime || "07:30");
  if (settings.morningSummary && currentMinutes >= morningMinutes && currentMinutes < morningMinutes + 17) {
    const first = dueToday[0]?.todo.text || meetingsToday[0]?.title;
    notices.push({ key: `morning-${local.date}`, title: "Your day ahead", body: `${dueToday.length} due today · ${overdue.length} carried over · ${meetingsToday.length} events${first ? ` · First: ${first}` : ""}`, tag: `morning-${local.date}`, url: "/" });
  }
  const interval = Math.max(1, settings.nudgeIntervalHours || 4);
  if (settings.overdueNudges && overdue.length && local.minute < 17 && local.hour % interval === 0) {
    notices.push({ key: `overdue-${local.date}-${local.hour}`, title: "A gentle nudge", body: `${overdue.length} ${overdue.length === 1 ? "task has" : "tasks have"} carried into today. First: ${overdue[0].todo.text}`, tag: `overdue-${local.date}`, url: "/" });
  }
  const eveningMinutes = minutesOf(settings.eveningTime || "18:00");
  if (settings.eveningSummary && currentMinutes >= eveningMinutes && currentMinutes < eveningMinutes + 17) {
    const remaining = todos.filter(item => !item.todo.dueDate || item.todo.dueDate <= local.date);
    notices.push({ key: `evening-${local.date}`, title: "Evening check-in", body: remaining.length ? `${remaining.length} still open. First: ${remaining[0].todo.text}` : "Everything due is wrapped up. Enjoy the clear evening.", tag: `evening-${local.date}`, url: "/" });
  }
  return notices;
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET || "";
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
  const privateKey = process.env.VAPID_PRIVATE_KEY || "";
  if (!serviceKey || !publicKey || !privateKey) return NextResponse.json({ error: "Push environment variables are incomplete." }, { status: 503 });
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:notifications@anvi-dashboard.app", publicKey, privateKey);
  const [dashboardResponse, subscriptionResponse] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/student_dashboards?access_hash=eq.anvis-dashboard-primary&select=payload&limit=1`, { headers: headers(serviceKey), cache: "no-store" }),
    fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?select=endpoint,p256dh,auth`, { headers: headers(serviceKey), cache: "no-store" }),
  ]);
  if (!dashboardResponse.ok || !subscriptionResponse.ok) return NextResponse.json({ error: "Could not load notification data." }, { status: 502 });
  const dashboardRows = await dashboardResponse.json() as { payload: Dashboard }[];
  const subscriptions = await subscriptionResponse.json() as Subscription[];
  const notices = noticesFor(dashboardRows[0]?.payload || {}, new Date());
  let delivered = 0;
  for (const notice of notices) {
    const claim = await fetch(`${SUPABASE_URL}/rest/v1/push_notification_log`, { method: "POST", headers: { ...headers(serviceKey), Prefer: "return=minimal" }, body: JSON.stringify({ dedupe_key: notice.key }) });
    if (!claim.ok) continue;
    const payload = JSON.stringify(notice);
    const results = await Promise.allSettled(subscriptions.map(subscription => webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, payload, { TTL: 3600, urgency: "high" })));
    delivered += results.filter(result => result.status === "fulfilled").length;
    await Promise.all(results.map(async (result, index) => {
      if (result.status !== "rejected") return;
      const statusCode = (result.reason as { statusCode?: number })?.statusCode;
      if (statusCode !== 404 && statusCode !== 410) return;
      await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(subscriptions[index].endpoint)}`, { method: "DELETE", headers: headers(serviceKey) });
    }));
  }
  return NextResponse.json({ ok: true, notices: notices.length, devices: subscriptions.length, delivered });
}
