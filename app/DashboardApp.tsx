"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Tab = "dashboard" | "subjects" | "goals" | "ideas" | "resources" | "study" | "settings";
type Priority = "low" | "medium" | "high";
type Todo = { id: string; text: string; done: boolean; priority: Priority; reminder?: string; dueDate?: string; note?: string };
type Subject = { id: string; name: string; color: string; goodAt: string; improve: string; notes?: string; resources?: Bookmark[]; todos: Todo[]; exercises?: Todo[] };
type Goal = { id: string; text: string; done: boolean };
type Countdown = { id: string; title: string; date: string; color: string };
type StudySession = { id: string; subject: string; startedAt: string; durationSeconds: number; note?: string };
type ImageItem = { id: string; url: string; caption: string };
type Bookmark = { id: string; title: string; url: string };
type Idea = { id: string; title: string; body: string; createdAt: string; color: string; pinned?: boolean };
type Meeting = { id: string; title: string; startsAt: string; endsAt?: string; details?: string; reminderMinutes?: number; allDay?: boolean; countdownId?: string };
type TodoComposerState = { subjectId?: string; exercise: boolean; todoId?: string };
type AppData = {
  profile: { name: string; heroImage: string; quote: string; spotifyUrl: string };
  subjects: Subject[];
  overallTodos: Todo[];
  goals: Record<"week" | "term" | "sixMonths" | "year", Goal[]>;
  countdowns: Countdown[];
  bookmarks: Bookmark[];
  notes: string;
  ideas: Idea[];
  visionImages: ImageItem[];
  dashboardImages: ImageItem[];
  studySessions: StudySession[];
  meetings: Meeting[];
  notificationSettings: { morningSummary: boolean; morningTime: string };
};

const uid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
const future = (days: number) => {
  const date = new Date(); date.setDate(date.getDate() + days); date.setHours(9, 0, 0, 0); return date.toISOString().slice(0, 16);
};

const starter: AppData = {
  profile: {
    name: "Anvi",
    heroImage: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=85",
    quote: "Small steps, clear mind, good work.",
    spotifyUrl: "",
  },
  overallTodos: [
    { id: "o1", text: "Plan the week and choose three priorities", done: false, priority: "medium" },
    { id: "o2", text: "Pack tomorrow’s bag", done: true, priority: "low" },
  ],
  subjects: [
    { id: "english", name: "English", color: "#f2b8c6", goodAt: "Finding strong themes and evidence.", improve: "Write sharper topic sentences under time pressure.", todos: [{ id: "e1", text: "Draft Module A paragraph", done: false, priority: "high" }] },
    { id: "maths", name: "Maths", color: "#a8c7fa", goodAt: "Algebraic manipulation and patterns.", improve: "Show every step and check signs.", todos: [{ id: "m1", text: "Review calculus notes", done: false, priority: "medium" }], exercises: [{ id: "mx1", text: "Chapter 7 — Exercises 7D–7F", done: false, priority: "high" }, { id: "mx2", text: "Mixed revision set 3", done: false, priority: "medium" }] },
    { id: "hms", name: "HMS", color: "#b8ddc0", goodAt: "Applying concepts to real examples.", improve: "Use precise syllabus terminology.", todos: [{ id: "h1", text: "Summarise energy systems", done: false, priority: "medium" }] },
    { id: "software", name: "Software", color: "#c7b8ee", goodAt: "Breaking problems into systems.", improve: "Document testing decisions clearly.", todos: [{ id: "s1", text: "Finish algorithm test table", done: false, priority: "high" }] },
    { id: "enterprise", name: "Enterprise", color: "#f6cf9e", goodAt: "Creative opportunity generation.", improve: "Support claims with market evidence.", todos: [{ id: "en1", text: "Refine value proposition", done: false, priority: "medium" }] },
    { id: "economics", name: "Economics", color: "#d7dfa5", goodAt: "Linking cause and effect.", improve: "Memorise current statistics and diagrams.", todos: [{ id: "ec1", text: "Practice inflation response", done: false, priority: "medium" }] },
    { id: "extracurriculars", name: "Extracurriculars", color: "#f0b7e3", goodAt: "Starting ambitious ideas.", improve: "Protect a consistent weekly block.", todos: [{ id: "x1", text: "Plan next club meeting", done: false, priority: "low" }] },
  ],
  goals: {
    week: [{ id: "g1", text: "Complete two timed responses", done: false }],
    term: [{ id: "g2", text: "Build consistent revision routines", done: false }],
    sixMonths: [{ id: "g3", text: "Finish a polished software project", done: false }],
    year: [{ id: "g4", text: "Feel calm and prepared for every HSC exam", done: false }],
  },
  countdowns: [
    { id: "c1", title: "Trial exams", date: future(42), color: "#a8c7fa" },
    { id: "c2", title: "Major project", date: future(67), color: "#f2b8c6" },
    { id: "c3", title: "HSC begins", date: future(104), color: "#b8ddc0" },
  ],
  bookmarks: [{ id: "b1", title: "NESA", url: "https://educationstandards.nsw.edu.au" }, { id: "b2", title: "Google Drive", url: "https://drive.google.com" }],
  notes: "Ideas, reminders, half-finished thoughts…",
  ideas: [],
  visionImages: [
    { id: "v1", url: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80", caption: "Room to breathe" },
    { id: "v2", url: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=80", caption: "Build something real" },
    { id: "v3", url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80", caption: "Good people, good energy" },
  ],
  dashboardImages: [{ id: "d1", url: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80", caption: "This week’s mood" }],
  studySessions: [],
  meetings: [],
  notificationSettings: { morningSummary: true, morningTime: "07:30" },
};

const nav: { id: Tab; label: string; icon: string }[] = [
  { id: "dashboard", label: "Home", icon: "⌂" }, { id: "subjects", label: "Subjects", icon: "▤" },
  { id: "goals", label: "Goals", icon: "◎" }, { id: "ideas", label: "Ideas", icon: "✧" }, { id: "resources", label: "Resources", icon: "◇" },
  { id: "study", label: "Study log", icon: "◷" }, { id: "settings", label: "Settings", icon: "⚙" },
];
const horizons = { week: "This Week", term: "This Term", sixMonths: "Next Six Months", year: "This Year · HSC Focus" } as const;
const swatches = ["#f2b8c6", "#a8c7fa", "#b8ddc0", "#c7b8ee", "#f6cf9e", "#d7dfa5", "#f0b7e3"];
const REQUIRED_SUBJECT_IDS = new Set(["english", "maths", "hms", "software", "enterprise", "economics", "extracurriculars"]);
const STORAGE_KEY = "anvis-dashboard-data";
const LEGACY_STORAGE_KEY = "daydream-desk-data";
const NOTIFICATION_LOG_KEY = "anvis-dashboard-notification-log";
const MORNING_SENT_KEY = "anvis-dashboard-morning-summary";
const NOTIFICATIONS_ENABLED_KEY = "anvis-dashboard-notifications-enabled";
const SPOTIFY_CLIENT_ID = "8d00c73eed1441b6ac0c8c43ecaadfec";
const SPOTIFY_TOKEN_KEY = "anvis-dashboard-spotify-token";
const SPOTIFY_VERIFIER_KEY = "anvis-dashboard-spotify-verifier";
const SPOTIFY_STATE_KEY = "anvis-dashboard-spotify-state";
const SPOTIFY_LAST_PLAYED_KEY = "anvis-dashboard-spotify-last-played";
const SUPABASE_URL = "https://iiwjnqfbhzfzwzvccapc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpd2pucWZiaHpmend6dmNjYXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4Njk2NTEsImV4cCI6MjA5NDQ0NTY1MX0.PX4XXr9fxtZHqN-hq5iwvkOV3-oYULXi459Zcis6h9Y";

function mergeData(value: Partial<AppData>): AppData {
  return { ...starter, ...value, profile: { ...starter.profile, ...(value.profile || {}) }, ideas: value.ideas || starter.ideas, goals: { ...starter.goals, ...(value.goals || {}) }, notificationSettings: { ...starter.notificationSettings, ...(value.notificationSettings || {}) } };
}

export default function DashboardApp() {
  const [data, setData] = useState<AppData>(starter);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [selectedSubject, setSelectedSubject] = useState("english");
  const [now, setNow] = useState(Date.now());
  const [toast, setToast] = useState("");
  const [notifications, setNotifications] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"local" | "syncing" | "synced" | "error">("local");
  const [hydrated, setHydrated] = useState(false);
  const [cloudReady, setCloudReady] = useState(false);
  const [todoComposer, setTodoComposer] = useState<TodoComposerState | null>(null);
  const [timerSubject, setTimerSubject] = useState("English");
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [timerElapsed, setTimerElapsed] = useState(0);
  const [timerNote, setTimerNote] = useState("");
  const [timerTargetMinutes, setTimerTargetMinutes] = useState<number | null>(25);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    let initial = starter;
    if (cached) { try { initial = mergeData(JSON.parse(cached)); setData(initial); } catch {} }
    const notificationsEnabled = localStorage.getItem(NOTIFICATIONS_ENABLED_KEY) !== "false";
    setNotifications("Notification" in window && Notification.permission === "granted" && notificationsEnabled);
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js");
    setHydrated(true);
    void loadCloud(initial);
  }, []);

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (!timerStart) return;
    const t = setInterval(() => setTimerElapsed(Math.floor((Date.now() - timerStart) / 1000)), 1000);
    return () => clearInterval(t);
  }, [timerStart]);

  useEffect(() => {
    if (!timerStart || !timerTargetMinutes || timerElapsed < timerTargetMinutes * 60) return;
    stopTimer(true);
  }, [timerElapsed, timerStart, timerTargetMinutes]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (!cloudReady) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSyncStatus("syncing");
    saveTimer.current = setTimeout(() => saveCloud(data), 900);
  }, [data, hydrated, cloudReady]);

  useEffect(() => {
    if (!hydrated) return;
    function checkReminders() {
      const sent = new Set<string>();
      try { JSON.parse(localStorage.getItem(NOTIFICATION_LOG_KEY) || "[]").forEach((id: string) => sent.add(id)); } catch {}
      let changed = false;
      allTodos(data).filter(todo => !todo.done && todo.reminder && new Date(todo.reminder).getTime() <= Date.now()).forEach(todo => {
        const key = `todo-${todo.id}-${todo.reminder}`;
        if (sent.has(key)) return;
        notify(`Reminder: ${todo.text}`, key); sent.add(key); changed = true;
      });
      data.meetings.forEach(meeting => {
        const until = new Date(meeting.startsAt).getTime() - Date.now();
        const reminderMinutes = meeting.reminderMinutes ?? 15;
        const key = `meeting-${meeting.id}-${meeting.startsAt}-${reminderMinutes}`;
        if (until < -60000 || until > reminderMinutes * 60 * 1000 || sent.has(key)) return;
        notify(until <= 60000 ? `${meeting.title} starts now` : `${meeting.title} starts in ${Math.ceil(until / 60000)} minutes`, key); sent.add(key); changed = true;
      });
      if (changed) localStorage.setItem(NOTIFICATION_LOG_KEY, JSON.stringify([...sent].slice(-250)));
    }
    checkReminders();
    const timer = setInterval(checkReminders, 30000);
    return () => clearInterval(timer);
  }, [data, hydrated, notifications]);

  useEffect(() => {
    if (!hydrated || !notifications || !data.notificationSettings.morningSummary) return;
    function checkMorningSummary() {
      const current = new Date();
      const today = toDateInput(current);
      const currentTime = `${String(current.getHours()).padStart(2, "0")}:${String(current.getMinutes()).padStart(2, "0")}`;
      if (currentTime < data.notificationSettings.morningTime || localStorage.getItem(MORNING_SENT_KEY) === today) return;
      const open = allTodos(data).filter(todo => !todo.done);
      const dueToday = open.filter(todo => todo.dueDate === today);
      const overdue = open.filter(todo => todo.dueDate && todo.dueDate < today);
      const meetingsToday = data.meetings.filter(meeting => localDayKey(new Date(meeting.startsAt)) === today);
      const parts = [`${dueToday.length} ${dueToday.length === 1 ? "task" : "tasks"} due today`, `${overdue.length} overdue`, `${meetingsToday.length} ${meetingsToday.length === 1 ? "meeting" : "meetings"}`];
      const first = dueToday[0]?.text || meetingsToday[0]?.title;
      const body = `${parts.join(" · ")}${first ? `. First up: ${first}` : ". You have a clear day."}`;
      void showNativeNotification("Your day ahead", body, `morning-${today}`);
      showToast("Your morning summary is ready");
      localStorage.setItem(MORNING_SENT_KEY, today);
    }
    checkMorningSummary();
    const timer = setInterval(checkMorningSummary, 30000);
    return () => clearInterval(timer);
  }, [data, hydrated, notifications]);

  async function cloudRequest(fn: string, body: object) {
    const base = SUPABASE_URL.replace(/\/$/, "");
    return fetch(`${base}/rest/v1/rpc/${fn}`, { method: "POST", headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  }
  async function writeCloud(next: AppData) {
    const r = await cloudRequest("save_student_dashboard", { new_payload: next });
    if (!r.ok) throw new Error(await r.text());
  }
  async function saveCloud(next: AppData) {
    try {
      await writeCloud(next); setSyncStatus("synced");
    } catch { setSyncStatus("error"); }
  }
  async function loadCloud(fallback: AppData) {
    setSyncStatus("syncing");
    try {
      const r = await cloudRequest("load_student_dashboard", {});
      if (!r.ok) throw new Error(await r.text());
      const payload = await r.json();
      if (payload && Object.keys(payload).length) {
        const cloudData = mergeData(payload);
        setData(cloudData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData));
      } else {
        await writeCloud(fallback);
      }
      setCloudReady(true);
      setSyncStatus("synced");
    } catch { setCloudReady(false); setSyncStatus("error"); }
  }
  function update(recipe: (draft: AppData) => AppData) { setData(prev => recipe(prev)); }
  function showToast(message: string) { setToast(message); setTimeout(() => setToast(""), 3200); }
  async function showNativeNotification(title: string, body: string, tag: string) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, { body, tag, icon: "/icon-192.png", badge: "/icon-192.png", data: { url: "/" } });
      } else {
        new Notification(title, { body, tag, icon: "/icon-192.png" });
      }
    } catch { new Notification(title, { body, tag, icon: "/icon-192.png" }); }
  }
  function notify(message: string, tag = `notice-${Date.now()}`) {
    if (notifications) void showNativeNotification("Anvi’s Dashboard", message, tag);
    showToast(message);
  }
  async function toggleNotifications() {
    if (!("Notification" in window)) return showToast("On iPhone, add the dashboard to your Home Screen first");
    if (!notifications) {
      const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      const enabled = permission === "granted";
      setNotifications(enabled); localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, String(enabled));
      if (enabled) void showNativeNotification("Notifications are on", "Reminders and your morning summary are ready.", "notifications-enabled");
      showToast(enabled ? "Notifications are on" : permission === "denied" ? "Notifications are blocked in browser settings" : "Notifications stayed off");
    } else {
      setNotifications(false); localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, "false"); showToast("Notifications are off");
    }
  }
  function sendTestNotification() {
    if (!notifications) return showToast("Enable notifications first");
    void showNativeNotification("Anvi’s Dashboard", "Your reminders are working ✦", `test-${Date.now()}`);
    showToast("Test notification sent");
  }

  function addTodo(subjectId?: string, exercise = false) {
    setTodoComposer({ subjectId, exercise });
  }
  function editTodo(id: string) {
    if (data.overallTodos.some(todo => todo.id === id)) return setTodoComposer({ exercise: false, todoId: id });
    for (const subject of data.subjects) {
      if (subject.todos.some(todo => todo.id === id)) return setTodoComposer({ subjectId: subject.id, exercise: false, todoId: id });
      if ((subject.exercises || []).some(todo => todo.id === id)) return setTodoComposer({ subjectId: subject.id, exercise: true, todoId: id });
    }
  }
  function saveTodo(text: string, dueDate?: string, reminder?: string, note?: string) {
    if (!todoComposer) return;
    const { subjectId, exercise, todoId } = todoComposer;
    if (todoId) {
      const replace = (items: Todo[]) => items.map(todo => todo.id === todoId ? { ...todo, text: text.trim(), dueDate, reminder, note: note?.trim() || undefined } : todo);
      update(d => ({ ...d, overallTodos: replace(d.overallTodos), subjects: d.subjects.map(subject => ({ ...subject, todos: replace(subject.todos), exercises: subject.exercises ? replace(subject.exercises) : undefined })) }));
      setTodoComposer(null);
      showToast("To-do updated");
      return;
    }
    const todo: Todo = { id: uid(), text: text.trim(), done: false, priority: "medium", dueDate, reminder, note: note?.trim() || undefined };
    update(d => subjectId ? ({ ...d, subjects: d.subjects.map(s => s.id === subjectId ? { ...s, [exercise ? "exercises" : "todos"]: [...(exercise ? s.exercises || [] : s.todos), todo] } : s) }) : ({ ...d, overallTodos: [...d.overallTodos, todo] }));
    setTodoComposer(null);
  }
  function toggleTodo(id: string) {
    const flip = (items: Todo[]) => items.map(t => t.id === id ? { ...t, done: !t.done } : t);
    update(d => ({ ...d, overallTodos: flip(d.overallTodos), subjects: d.subjects.map(s => ({ ...s, todos: flip(s.todos), exercises: s.exercises ? flip(s.exercises) : undefined })) }));
  }
  function removeTodo(id: string) {
    const cut = (items: Todo[]) => items.filter(t => t.id !== id);
    update(d => ({ ...d, overallTodos: cut(d.overallTodos), subjects: d.subjects.map(s => ({ ...s, todos: cut(s.todos), exercises: s.exercises ? cut(s.exercises) : undefined })) }));
  }
  function setTodoPriority(id: string, priority: Priority) {
    const set = (items: Todo[]) => items.map(t => t.id === id ? { ...t, priority } : t);
    update(d => ({ ...d, overallTodos: set(d.overallTodos), subjects: d.subjects.map(s => ({ ...s, todos: set(s.todos), exercises: s.exercises ? set(s.exercises) : undefined })) }));
    if (priority === "high") notify("High-priority task added to your focus list");
  }
  function startTimer() { setTimerStart(Date.now()); setTimerElapsed(0); }
  function stopTimer(completed = false) {
    if (!timerStart || timerElapsed < 1) return;
    const targetSeconds = timerTargetMinutes ? timerTargetMinutes * 60 : timerElapsed;
    const session: StudySession = { id: uid(), subject: timerSubject, startedAt: new Date(timerStart).toISOString(), durationSeconds: completed ? targetSeconds : timerElapsed, note: timerNote.trim() || undefined };
    update(d => ({ ...d, studySessions: [...d.studySessions, session] }));
    setTimerStart(null); setTimerElapsed(0); setTimerNote("");
    if (completed) notify(`${timerTargetMinutes}-minute focus finished — lovely work ✦`, `pomodoro-${session.id}`);
    else showToast(`${formatDuration(session.durationSeconds)} logged for ${timerSubject}`);
  }
  async function uploadImages(event: ChangeEvent<HTMLInputElement>, target: "visionImages" | "dashboardImages" | "heroImage") {
    const files = Array.from(event.target.files || []); if (!files.length) return;
    const valid = files.filter(file => file.type.startsWith("image/") && file.size <= 10 * 1024 * 1024);
    if (!valid.length) { showToast("Choose image files smaller than 10 MB"); event.target.value = ""; return; }
    showToast(`Uploading ${valid.length} ${valid.length === 1 ? "image" : "images"}…`);
    const base = SUPABASE_URL.replace(/\/$/, "");
    const results = await Promise.allSettled(valid.map(async file => {
      const path = `anvis-dashboard/${uid()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const r = await fetch(`${base}/storage/v1/object/vision-board/${path}`, { method: "POST", headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": file.type, "x-upsert": "false" }, body: file });
      if (!r.ok) throw new Error(await r.text());
      const url = `${base}/storage/v1/object/public/vision-board/${path}`;
      return { id: uid(), url, caption: file.name.replace(/\.[^.]+$/, "") } as ImageItem;
    }));
    const uploaded = results.flatMap(result => result.status === "fulfilled" ? [result.value] : []);
    if (uploaded.length) update(d => target === "heroImage" ? ({ ...d, profile: { ...d.profile, heroImage: uploaded[0].url } }) : ({ ...d, [target]: [...d[target], ...uploaded] }));
    const failed = valid.length - uploaded.length;
    showToast(failed ? `${uploaded.length} added · ${failed} failed` : `${uploaded.length} ${uploaded.length === 1 ? "image" : "images"} added`);
    event.target.value = "";
  }

  const incomplete = [...data.overallTodos, ...data.subjects.flatMap(s => [...s.todos, ...(s.exercises || [])])].filter(t => !t.done).length;
  const weekSeconds = rangeTotal(data.studySessions, 0, 7);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setTab("dashboard")}><span className="brand-mark">✦</span><span>Anvi’s<br /><em>dashboard</em></span></button>
        <nav>{nav.map(item => <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}><span>{item.icon}</span>{item.label}{item.id === "dashboard" && <b>{incomplete}</b>}</button>)}</nav>
        <div className="sidebar-footer">
          <div className={`sync-dot ${syncStatus}`} />
          <div><strong>{syncStatus === "synced" ? "Saved to Supabase" : syncStatus === "syncing" ? "Saving…" : syncStatus === "error" ? "Local backup" : "Connecting…"}</strong><small>{syncStatus === "synced" ? "Automatic cloud sync" : syncStatus === "error" ? "Supabase setup required" : "Loading shared dashboard"}</small></div>
        </div>
      </aside>

      <section className="main-panel">
        <header className="mobile-header"><button className="brand" onClick={() => setTab("dashboard")}><span className="brand-mark">✦</span><span>Anvi’s <em>dashboard</em></span></button><span>{incomplete} open</span></header>
        <CountdownRail data={data} now={now} onAdd={() => addCountdown(update)} onEdit={countdown => editCountdown(update, countdown)} onRemove={id => update(d => ({ ...d, countdowns: d.countdowns.filter(c => c.id !== id) }))} />
        <div className="page-wrap">
          {tab === "dashboard" && <DashboardView data={data} now={now} weekSeconds={weekSeconds} setTab={setTab} toggleTodo={toggleTodo} addTodo={addTodo} editTodo={editTodo} removeTodo={removeTodo} setPriority={setTodoPriority} update={update} uploadImages={uploadImages} />}
          {tab === "subjects" && <SubjectsView data={data} selected={selectedSubject} setSelected={setSelectedSubject} update={update} addTodo={addTodo} editTodo={editTodo} toggleTodo={toggleTodo} removeTodo={removeTodo} setPriority={setTodoPriority} />}
          {tab === "goals" && <GoalsView data={data} update={update} />}
          {tab === "ideas" && <IdeasView data={data} update={update} />}
          {tab === "resources" && <ResourcesView data={data} update={update} uploadImages={uploadImages} />}
          {tab === "study" && <StudyView data={data} update={update} subject={timerSubject} setSubject={setTimerSubject} start={timerStart} elapsed={timerElapsed} note={timerNote} setNote={setTimerNote} targetMinutes={timerTargetMinutes} setTargetMinutes={setTimerTargetMinutes} startTimer={startTimer} stopTimer={() => stopTimer(false)} showToast={showToast} />}
          {tab === "settings" && <SettingsView data={data} update={update} notifications={notifications} toggleNotifications={toggleNotifications} sendTestNotification={sendTestNotification} status={syncStatus} />}
        </div>
        <nav className="mobile-nav">{nav.map(item => <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}><span>{item.icon}</span><small>{item.label}</small></button>)}</nav>
      </section>
      {toast && <div className="toast"><span>✦</span><div><small>ANVI’S DASHBOARD</small><strong>{toast}</strong></div></div>}
      {todoComposer && <TodoComposer target={todoComposer} subjects={data.subjects} initial={todoComposer.todoId ? allTodos(data).find(todo => todo.id === todoComposer.todoId) : undefined} onSave={saveTodo} onClose={() => setTodoComposer(null)} />}
    </main>
  );
}

function CountdownRail({ data, now, onAdd, onEdit, onRemove }: { data: AppData; now: number; onAdd: () => void; onEdit: (countdown: Countdown) => void; onRemove: (id: string) => void }) {
  const ordered = [...data.countdowns].sort((a, b) => {
    const aTime = new Date(a.date).getTime(), bTime = new Date(b.date).getTime();
    if ((aTime < now) !== (bTime < now)) return aTime < now ? 1 : -1;
    return aTime - bTime;
  });
  return <div className="countdown-rail"><div className="rail-label"><span>◷</span><div><strong>Countdowns</strong><small>next dates first</small></div></div><div className="countdown-scroll">{ordered.map(c => { const diff = Math.max(0, new Date(c.date).getTime() - now); const days = Math.floor(diff / 86400000); const hours = Math.floor((diff % 86400000) / 3600000); return <div className="countdown-chip" style={{ "--chip": c.color } as React.CSSProperties} key={c.id}><div className="chip-actions"><button onClick={() => onEdit(c)} aria-label={`Edit ${c.title}`}>✎</button><button onClick={() => onRemove(c.id)} aria-label={`Delete ${c.title}`}>×</button></div><span><b>{days}</b>d <b>{hours}</b>h</span><small>{c.title}</small></div> })}<button className="add-countdown" onClick={onAdd}>＋<span>Add date</span></button></div></div>;
}

function DashboardView({ data, weekSeconds, setTab, toggleTodo, addTodo, editTodo, removeTodo, setPriority, update, uploadImages }: { data: AppData; now: number; weekSeconds: number; setTab: (t: Tab) => void; toggleTodo: (id: string) => void; addTodo: (s?: string, e?: boolean) => void; editTodo: (id: string) => void; removeTodo: (id: string) => void; setPriority: (id: string, p: Priority) => void; update: (f: (d: AppData) => AppData) => void; uploadImages: (e: ChangeEvent<HTMLInputElement>, t: "visionImages" | "dashboardImages" | "heroImage") => void }) {
  const date = new Intl.DateTimeFormat("en-AU", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const today = toDateInput(new Date());
  const todayItems = [
    ...data.overallTodos.map(todo => ({ todo, source: "Personal", color: "#f6cf9e" })),
    ...data.subjects.flatMap(subject => [...subject.todos, ...(subject.exercises || [])].map(todo => ({ todo, source: subject.name, color: subject.color }))),
  ].filter(item => !item.todo.done && item.todo.dueDate === today);
  return <>
    <section className="hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(24,31,44,.82), rgba(24,31,44,.2)), url(${data.profile.heroImage})` }}><label className="hero-upload">↥ Change cover<input hidden type="file" accept="image/*" onChange={event => uploadImages(event, "heroImage")} /></label><div><span className="eyebrow">{date}</span><h1>Hi {data.profile.name},<br /><em>make today count.</em></h1><p>{data.profile.quote}</p></div><div className="hero-stats"><span><b>{data.studySessions.filter(s => isToday(s.startedAt)).length}</b> sessions today</span><span><b>{formatDuration(weekSeconds)}</b> this week</span></div></section>
    <PlannerHub data={data} update={update} toggleTodo={toggleTodo} editTodo={editTodo} />
    <div className="focus-row">
      <section className="card day-plan"><CardHeading kicker="TODAY" title="What to do for the day" /><p>{todayItems.length ? `${todayItems.length} ${todayItems.length === 1 ? "thing" : "things"} due today. Finish one, and it disappears from this list.` : "Nothing due today — your day is clear."}</p>{todayItems.map(item => <div className="day-plan-row" key={item.todo.id}><button className="check" onClick={() => toggleTodo(item.todo.id)} aria-label={`Complete ${item.todo.text}`} /><i style={{ background: item.color }} /><div><strong>{item.todo.text}</strong><small>{item.source}</small></div><button className="row-edit" onClick={() => editTodo(item.todo.id)} aria-label={`Edit ${item.todo.text}`}>Edit</button></div>)}</section>
      <SpotifyNowPlaying />
    </div>
    <div className="dashboard-grid">
      <section className="card task-card"><CardHeading kicker="THE BIG PICTURE" title="Everything to do" action="＋ Add personal" onAction={() => addTodo()} /><div className="task-summary"><span><b>{countOpen(data)}</b> still open</span><div><i style={{ width: `${completion(data)}%` }} /></div><small>{completion(data)}% complete</small></div><TaskGroup title="Personal" color="#f6cf9e" todos={data.overallTodos} {...{ toggleTodo, editTodo, removeTodo, setPriority }} />{data.subjects.map(s => <div key={s.id}><TaskGroup title={s.name} color={s.color} todos={s.todos} {...{ toggleTodo, editTodo, removeTodo, setPriority }} /><button className="inline-add" onClick={() => addTodo(s.id)}>＋ Add {s.name} task</button>{s.exercises && <TaskGroup title="Required exercises / chapters" subtitle="Maths" color="#87b3f8" todos={s.exercises} nested {...{ toggleTodo, editTodo, removeTodo, setPriority }} />}{s.exercises && <button className="inline-add nested-add" onClick={() => addTodo(s.id, true)}>＋ Add required exercise</button>}</div>)}</section>
      <aside className="dashboard-side"><section className="card today-card"><CardHeading kicker="FOCUS" title="This week" action="View goals →" onAction={() => setTab("goals")} />{data.goals.week.map(g => <label className="goal-line" key={g.id}><input type="checkbox" checked={g.done} onChange={() => update(d => ({ ...d, goals: { ...d.goals, week: d.goals.week.map(x => x.id === g.id ? { ...x, done: !x.done } : x) } }))} /><span>{g.text}</span></label>)}</section>
      <section className="card quick-note"><CardHeading kicker="SCRATCHPAD" title="Quick note" /><textarea value={data.notes} onChange={e => update(d => ({ ...d, notes: e.target.value }))} aria-label="Quick notes" /><small>Saved automatically</small></section></aside>
    </div>
  </>;
}

type SpotifyToken = { access_token: string; refresh_token?: string; expires_at: number };
type SpotifyPlayback = { is_playing: boolean; progress_ms: number; item?: { id: string; name: string; duration_ms: number; external_urls?: { spotify?: string }; artists?: { name: string }[]; album?: { name: string; images?: { url: string }[] } } };

function SpotifyNowPlaying() {
  const [token, setToken] = useState<SpotifyToken | null>(null);
  const [playback, setPlayback] = useState<SpotifyPlayback | null>(null);
  const [lastPlayback, setLastPlayback] = useState<SpotifyPlayback | null>(null);
  const [status, setStatus] = useState<"loading" | "disconnected" | "ready" | "idle" | "error">("loading");

  useEffect(() => {
    let stored: SpotifyToken | null = null;
    try { stored = JSON.parse(localStorage.getItem(SPOTIFY_TOKEN_KEY) || "null"); } catch {}
    try { setLastPlayback(JSON.parse(localStorage.getItem(SPOTIFY_LAST_PLAYED_KEY) || "null")); } catch {}
    const params = new URLSearchParams(window.location.search);
    const code = params.get("spotify_code");
    const returnedState = params.get("spotify_state");
    if (code) {
      const verifier = localStorage.getItem(SPOTIFY_VERIFIER_KEY);
      const expectedState = localStorage.getItem(SPOTIFY_STATE_KEY);
      history.replaceState({}, "", window.location.pathname);
      if (!verifier || !returnedState || returnedState !== expectedState) { setStatus("error"); return; }
      void exchangeSpotifyCode(code, verifier).then(next => {
        saveSpotifyToken(next); setToken(next); setStatus("ready");
        localStorage.removeItem(SPOTIFY_VERIFIER_KEY); localStorage.removeItem(SPOTIFY_STATE_KEY);
      }).catch(() => setStatus("error"));
      return;
    }
    setToken(stored);
    setStatus(stored ? "ready" : "disconnected");
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    async function refreshPlayback() {
      try {
        const active = await validSpotifyToken(token!);
        if (cancelled) return;
        if (active.access_token !== token!.access_token) setToken(active);
        const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", { headers: { Authorization: `Bearer ${active.access_token}` } });
        if (response.status === 204) { setPlayback(null); setStatus("idle"); return; }
        if (!response.ok) throw new Error("Spotify playback unavailable");
        const current = await response.json() as SpotifyPlayback;
        setPlayback(current);
        if (current.item) { setLastPlayback(current); localStorage.setItem(SPOTIFY_LAST_PLAYED_KEY, JSON.stringify(current)); }
        setStatus(current.item ? "ready" : "idle");
      } catch { if (!cancelled) setStatus("error"); }
    }
    void refreshPlayback();
    const interval = setInterval(refreshPlayback, 10000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [token?.access_token]);

  function disconnect() {
    localStorage.removeItem(SPOTIFY_TOKEN_KEY); localStorage.removeItem(SPOTIFY_LAST_PLAYED_KEY); setToken(null); setPlayback(null); setLastPlayback(null); setStatus("disconnected");
  }

  const track = playback?.item || lastPlayback?.item;
  const isLive = status === "ready" && Boolean(playback?.item);
  const progress = isLive && track?.duration_ms ? Math.min(100, Math.max(0, (playback?.progress_ms || 0) / track.duration_ms * 100)) : 0;
  return <section className="card spotify-card">
    <CardHeading kicker="LIVE FROM SPOTIFY" title="Now playing" action={token ? "Disconnect" : undefined} onAction={disconnect} />
    {status === "loading" && <div className="spotify-empty"><span>♫</span><p>Checking your Spotify connection…</p></div>}
    {status === "disconnected" && <div className="spotify-connect"><span>♫</span><div><strong>See what you’re playing, live.</strong><p>Connect once, then this card updates automatically while your dashboard is open.</p><button className="button spotify-button" onClick={() => void connectSpotify()}>Connect Spotify</button></div></div>}
    {status === "error" && <div className="spotify-connect"><span>!</span><div><strong>Spotify needs reconnecting.</strong><p>Your session may have expired or Spotify could not read playback.</p><button className="button spotify-button" onClick={() => void connectSpotify()}>Reconnect Spotify</button></div></div>}
    {status === "idle" && !track && <div className="spotify-empty"><span>Ⅱ</span><p>Nothing is playing right now. Start Spotify on any device and this card will update.</p></div>}
    {(status === "ready" || status === "idle") && track && <a className="spotify-now" href={track.external_urls?.spotify} target="_blank" rel="noreferrer">
      {track.album?.images?.[0]?.url ? <img src={track.album.images[0].url} alt="" /> : <span className="spotify-art">♫</span>}
      <div className="spotify-track"><span>{isLive && playback?.is_playing ? "PLAYING NOW" : isLive ? "PAUSED" : "LAST PLAYED"}</span><strong>{track.name}</strong><p>{track.artists?.map(artist => artist.name).join(", ") || track.album?.name}</p>{isLive && <div className="spotify-progress"><i style={{ width: `${progress}%` }} /></div>}</div>
    </a>}
  </section>;
}

async function connectSpotify() {
  const verifier = randomSpotifyString(64);
  const state = randomSpotifyString(24);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  localStorage.setItem(SPOTIFY_VERIFIER_KEY, verifier); localStorage.setItem(SPOTIFY_STATE_KEY, state);
  const redirectUri = `${window.location.origin}/spotify/callback`;
  const params = new URLSearchParams({ client_id: SPOTIFY_CLIENT_ID, response_type: "code", redirect_uri: redirectUri, scope: "user-read-currently-playing user-read-playback-state", code_challenge_method: "S256", code_challenge: challenge, state });
  window.location.assign(`https://accounts.spotify.com/authorize?${params}`);
}
function randomSpotifyString(length: number) { const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"; const values = crypto.getRandomValues(new Uint8Array(length)); return Array.from(values, value => chars[value % chars.length]).join(""); }
async function exchangeSpotifyCode(code: string, verifier: string) {
  const response = await fetch("https://accounts.spotify.com/api/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: SPOTIFY_CLIENT_ID, grant_type: "authorization_code", code, redirect_uri: `${window.location.origin}/spotify/callback`, code_verifier: verifier }) });
  if (!response.ok) throw new Error("Spotify authorization failed");
  const body = await response.json();
  return { access_token: body.access_token, refresh_token: body.refresh_token, expires_at: Date.now() + body.expires_in * 1000 - 60000 } as SpotifyToken;
}
async function validSpotifyToken(token: SpotifyToken) {
  if (token.expires_at > Date.now()) return token;
  if (!token.refresh_token) throw new Error("Spotify refresh token missing");
  const response = await fetch("https://accounts.spotify.com/api/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: SPOTIFY_CLIENT_ID, grant_type: "refresh_token", refresh_token: token.refresh_token }) });
  if (!response.ok) throw new Error("Spotify refresh failed");
  const body = await response.json();
  const next = { access_token: body.access_token, refresh_token: body.refresh_token || token.refresh_token, expires_at: Date.now() + body.expires_in * 1000 - 60000 };
  saveSpotifyToken(next); return next;
}
function saveSpotifyToken(token: SpotifyToken) { localStorage.setItem(SPOTIFY_TOKEN_KEY, JSON.stringify(token)); }

function SubjectsView({ data, selected, setSelected, update, addTodo, editTodo, toggleTodo, removeTodo, setPriority }: { data: AppData; selected: string; setSelected: (id: string) => void; update: (f: (d: AppData) => AppData) => void; addTodo: (s?: string, e?: boolean) => void; editTodo: (id: string) => void; toggleTodo: (id: string) => void; removeTodo: (id: string) => void; setPriority: (id: string, p: Priority) => void }) {
  const subject = data.subjects.find(s => s.id === selected) || data.subjects[0];
  function change(field: "goodAt" | "improve", value: string) { update(d => ({ ...d, subjects: d.subjects.map(s => s.id === subject.id ? { ...s, [field]: value } : s) })); }
  function removeSubject() {
    if (REQUIRED_SUBJECT_IDS.has(subject.id) || !confirm(`Remove ${subject.name} and all of its tasks?`)) return;
    update(d => ({ ...d, subjects: d.subjects.filter(item => item.id !== subject.id) }));
    setSelected("english");
  }
  return <><PageTitle eyebrow="ACADEMIC WORKSPACE" title="One place for every subject." copy="Choose a subject, see what matters, and keep your reflections close to the work." /><div className="subject-tabs">{data.subjects.map(s => <button key={s.id} className={selected === s.id ? "active" : ""} style={{ "--subject": s.color } as React.CSSProperties} onClick={() => setSelected(s.id)}><span style={{ background: s.color }}>{s.name.slice(0, 2)}</span>{s.name}</button>)}<button className="add-subject" onClick={() => addNewSubject(update)}>＋ New project</button></div><section className="subject-hero" style={{ "--subject": subject.color } as React.CSSProperties}><span>{subject.name.slice(0, 2)}</span><div><small>SUBJECT SPACE</small><h2>{subject.name}</h2><p>{subject.todos.filter(t => !t.done).length + (subject.exercises?.filter(t => !t.done).length || 0)} open items</p></div>{!REQUIRED_SUBJECT_IDS.has(subject.id) && <button className="remove-subject" onClick={removeSubject}>Remove subject</button>}</section><div className="subject-grid"><section className="card"><CardHeading kicker="TO DO" title={`${subject.name} tasks`} action="＋ Add task" onAction={() => addTodo(subject.id)} /><TaskGroup title="Current work" color={subject.color} todos={subject.todos} hideHeading {...{ toggleTodo, editTodo, removeTodo, setPriority }} />{subject.exercises && <><div className="exercise-header"><div><small>MATHS REQUIREMENT</small><h3>Required exercises / chapters</h3></div><button onClick={() => addTodo(subject.id, true)}>＋ Add</button></div><TaskGroup title="Exercises" color={subject.color} todos={subject.exercises} hideHeading {...{ toggleTodo, editTodo, removeTodo, setPriority }} /></>}</section><section className="insight-stack"><label className="insight good"><span>✦</span><div><small>SUBJECT INSIGHT</small><strong>What I’m good at</strong></div><textarea value={subject.goodAt} onChange={e => change("goodAt", e.target.value)} /></label><label className="insight improve"><span>↗</span><div><small>NEXT STEP</small><strong>Where to improve</strong></div><textarea value={subject.improve} onChange={e => change("improve", e.target.value)} /></label></section></div><SubjectLibrary subject={subject} update={update} /></>;
}

function SubjectLibrary({ subject, update }: { subject: Subject; update: (f: (d: AppData) => AppData) => void }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  function addResource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !url.trim()) return;
    const resource: Bookmark = { id: uid(), title: title.trim(), url: normaliseUrl(url.trim()) };
    update(d => ({ ...d, subjects: d.subjects.map(item => item.id === subject.id ? { ...item, resources: [...(item.resources || []), resource] } : item) }));
    setTitle(""); setUrl("");
  }
  function changeNotes(notes: string) { update(d => ({ ...d, subjects: d.subjects.map(item => item.id === subject.id ? { ...item, notes } : item) })); }
  function removeResource(id: string) { update(d => ({ ...d, subjects: d.subjects.map(item => item.id === subject.id ? { ...item, resources: (item.resources || []).filter(resource => resource.id !== id) } : item) })); }
  return <section className="subject-library"><div className="card subject-notes"><CardHeading kicker="SUBJECT NOTES" title={`${subject.name} notebook`} /><textarea value={subject.notes || ""} onChange={event => changeNotes(event.target.value)} placeholder="Class notes, formulas, essay ideas, feedback…" /><small>Autosaves with this subject</small></div><div className="card subject-resources"><CardHeading kicker="LINKS & RESOURCES" title={`${subject.name} resources`} /><form onSubmit={addResource}><input aria-label="Resource title" value={title} onChange={event => setTitle(event.target.value)} placeholder="Resource title" required /><input aria-label="Resource URL" value={url} onChange={event => setUrl(event.target.value)} placeholder="https://…" required /><button className="button" type="submit">＋ Add</button></form><div className="subject-resource-list">{(subject.resources || []).map(resource => <div key={resource.id}><a href={normaliseUrl(resource.url)} target="_blank" rel="noreferrer"><span style={{ background: subject.color }}>{resource.title.slice(0, 1).toUpperCase()}</span><div><strong>{resource.title}</strong><small>{resource.url.replace(/^https?:\/\//, "")}</small></div></a><button className="delete" onClick={() => removeResource(resource.id)} aria-label={`Delete ${resource.title}`}>×</button></div>)}{!(subject.resources || []).length && <div className="empty-state">Add syllabus pages, videos, documents or practice sites.</div>}</div></div></section>;
}

function GoalsView({ data, update }: { data: AppData; update: (f: (d: AppData) => AppData) => void }) {
  return <><PageTitle eyebrow="TIME HORIZONS" title="Aim far. Move gently." copy="Turn the future into four clear distances, then focus on the next honest step." /><div className="goal-grid">{(Object.keys(horizons) as (keyof typeof horizons)[]).map((key, i) => <section className="goal-column card" key={key} style={{ "--subject": swatches[i] } as React.CSSProperties}><div className="goal-number">0{i + 1}</div><CardHeading kicker={key === "year" ? "HSC PREP" : "GOALS"} title={horizons[key]} />{data.goals[key].map(g => <div className={`goal-item ${g.done ? "done" : ""}`} key={g.id}><button onClick={() => update(d => ({ ...d, goals: { ...d.goals, [key]: d.goals[key].map(x => x.id === g.id ? { ...x, done: !x.done } : x) } }))}>{g.done ? "✓" : ""}</button><span>{g.text}</span><button className="delete" onClick={() => update(d => ({ ...d, goals: { ...d.goals, [key]: d.goals[key].filter(x => x.id !== g.id) } }))}>×</button></div>)}<button className="goal-add" onClick={() => addGoal(update, key)}>＋ Add a goal</button></section>)}</div></>;
}

function IdeasView({ data, update }: { data: AppData; update: (f: (d: AppData) => AppData) => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const ordered = [...data.ideas].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  function addIdea(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() && !body.trim()) return;
    const idea: Idea = { id: uid(), title: title.trim() || "Untitled thought", body: body.trim(), createdAt: new Date().toISOString(), color: swatches[data.ideas.length % swatches.length] };
    update(d => ({ ...d, ideas: [idea, ...d.ideas] })); setTitle(""); setBody("");
  }
  function changeIdea(id: string, field: "title" | "body", value: string) { update(d => ({ ...d, ideas: d.ideas.map(idea => idea.id === id ? { ...idea, [field]: value } : idea) })); }
  return <><PageTitle eyebrow="IDEAS & NOTES" title="Catch it before it disappears." copy="A quiet page for project sparks, questions, rough plans and anything that does not belong on a to-do list yet." /><form className="card idea-composer" onSubmit={addIdea}><div><span>NEW THOUGHT</span><h2>What’s on your mind?</h2></div><input aria-label="Idea title" value={title} onChange={event => setTitle(event.target.value)} placeholder="Give it a short title" /><textarea aria-label="Idea details" value={body} onChange={event => setBody(event.target.value)} placeholder="Write the idea, note, question or messy first draft here…" /><button className="button" type="submit">Save idea ✦</button></form><div className="idea-grid">{ordered.map(idea => <article className={`idea-card ${idea.pinned ? "pinned" : ""}`} style={{ "--idea": idea.color } as React.CSSProperties} key={idea.id}><div className="idea-card-top"><span>{idea.pinned ? "PINNED" : new Date(idea.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</span><div><button onClick={() => update(d => ({ ...d, ideas: d.ideas.map(item => item.id === idea.id ? { ...item, pinned: !item.pinned } : item) }))} aria-label={idea.pinned ? `Unpin ${idea.title}` : `Pin ${idea.title}`}>{idea.pinned ? "◆" : "◇"}</button><button onClick={() => update(d => ({ ...d, ideas: d.ideas.filter(item => item.id !== idea.id) }))} aria-label={`Delete ${idea.title}`}>×</button></div></div><input aria-label="Idea title" value={idea.title} onChange={event => changeIdea(idea.id, "title", event.target.value)} /><textarea aria-label={`${idea.title} notes`} value={idea.body} onChange={event => changeIdea(idea.id, "body", event.target.value)} placeholder="Keep developing this thought…" /></article>)}{!ordered.length && <div className="card ideas-empty"><span>✧</span><h2>Your next good idea starts here.</h2><p>Add a thought above. Everything saves automatically to your dashboard.</p></div>}</div></>;
}

function ResourcesView({ data, update, uploadImages }: { data: AppData; update: (f: (d: AppData) => AppData) => void; uploadImages: (e: ChangeEvent<HTMLInputElement>, t: "visionImages" | "dashboardImages") => void }) {
  return <><PageTitle eyebrow="RESOURCES & VISION" title="Keep the useful and beautiful close." copy="Links for quick access, a scratchpad for messy thoughts, and images that pull you forward." /><div className="resource-top"><section className="card"><CardHeading kicker="BOOKMARKS" title="Quick links" action="＋ Add link" onAction={() => addBookmark(update)} /><div className="bookmark-grid">{data.bookmarks.map((b, i) => <a href={normaliseUrl(b.url)} target="_blank" rel="noreferrer" key={b.id}><span style={{ background: swatches[i % swatches.length] }}>{b.title.slice(0, 1).toUpperCase()}</span><div><strong>{b.title}</strong><small>{b.url.replace(/^https?:\/\//, "")}</small></div><b>↗</b></a>)}</div></section><section className="card resource-notes"><CardHeading kicker="QUICK NOTES" title="Scratchpad" /><textarea value={data.notes} onChange={e => update(d => ({ ...d, notes: e.target.value }))} /><small>Autosaves as you type</small></section></div><section className="vision-section"><div className="vision-heading"><div><span className="eyebrow">VISION BOARD</span><h2>What I’m moving toward</h2></div><div><label className="button">Bulk upload photos<input hidden multiple type="file" accept="image/*" onChange={e => uploadImages(e, "visionImages")} /></label><button className="button secondary" onClick={() => addImageUrl(update, "visionImages")}>Paste image URL</button></div></div><div className="vision-grid">{data.visionImages.map(img => <figure key={img.id}><img src={img.url} alt={img.caption} /><figcaption>{img.caption}<button onClick={() => update(d => ({ ...d, visionImages: d.visionImages.filter(x => x.id !== img.id) }))}>×</button></figcaption></figure>)}</div></section></>;
}

function StudyView({ data, update, subject, setSubject, start, elapsed, note, setNote, targetMinutes, setTargetMinutes, startTimer, stopTimer, showToast }: { data: AppData; update: (f: (d: AppData) => AppData) => void; subject: string; setSubject: (s: string) => void; start: number | null; elapsed: number; note: string; setNote: (value: string) => void; targetMinutes: number | null; setTargetMinutes: (value: number | null) => void; startTimer: () => void; stopTimer: () => void; showToast: (message: string) => void }) {
  const current = new Date();
  const [manualDate, setManualDate] = useState(toDateInput(current));
  const [manualTime, setManualTime] = useState(toTimeInput(current));
  const [manualSubject, setManualSubject] = useState(data.subjects[0]?.name || "English");
  const [manualMinutes, setManualMinutes] = useState("45");
  const [manualNote, setManualNote] = useState("");

  const stats = useMemo(() => {
    const todaySeconds = data.studySessions.filter(s => isToday(s.startedAt)).reduce((a, s) => a + s.durationSeconds, 0);
    const weekSeconds = rangeTotal(data.studySessions, 0, 7);
    const previousSeconds = rangeTotal(data.studySessions, 7, 14);
    const allTimeSeconds = data.studySessions.reduce((a, s) => a + s.durationSeconds, 0);
    const averageSeconds = data.studySessions.length ? Math.round(allTimeSeconds / data.studySessions.length) : 0;
    const longestSeconds = data.studySessions.reduce((longest, session) => Math.max(longest, session.durationSeconds), 0);
    const activeDays = new Set(data.studySessions.filter(s => withinDays(s.startedAt, 7)).map(s => localDayKey(new Date(s.startedAt)))).size;
    const delta = previousSeconds ? Math.round(((weekSeconds - previousSeconds) / previousSeconds) * 100) : weekSeconds ? 100 : 0;
    return { todaySeconds, weekSeconds, previousSeconds, allTimeSeconds, averageSeconds, longestSeconds, activeDays, delta };
  }, [data.studySessions]);

  const bySubject = data.subjects.map(s => ({ name: s.name, color: s.color, seconds: data.studySessions.filter(x => x.subject === s.name && withinDays(x.startedAt, 7)).reduce((a, x) => a + x.durationSeconds, 0) })).sort((a, b) => b.seconds - a.seconds);
  const maxSubject = Math.max(...bySubject.map(s => s.seconds), 1);
  const daily = lastSevenDays().map(day => ({ ...day, seconds: data.studySessions.filter(s => localDayKey(new Date(s.startedAt)) === day.key).reduce((a, s) => a + s.durationSeconds, 0) }));
  const maxDay = Math.max(...daily.map(d => d.seconds), 1);
  const sessions = [...data.studySessions].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  const displayedSeconds = start && targetMinutes ? Math.max(0, targetMinutes * 60 - elapsed) : elapsed;

  function addManualSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const minutes = Number(manualMinutes);
    const startedAt = new Date(`${manualDate}T${manualTime}`);
    if (!manualDate || !manualTime || Number.isNaN(startedAt.getTime()) || !Number.isFinite(minutes) || minutes <= 0) {
      showToast("Add a valid date, time and duration");
      return;
    }
    const session: StudySession = {
      id: uid(),
      subject: manualSubject,
      startedAt: startedAt.toISOString(),
      durationSeconds: Math.round(minutes * 60),
      note: manualNote.trim() || undefined,
    };
    update(d => ({ ...d, studySessions: [...d.studySessions, session] }));
    setManualNote("");
    showToast(`${formatDuration(session.durationSeconds)} added for ${session.subject}`);
  }

  function deleteSession(id: string) {
    update(d => ({ ...d, studySessions: d.studySessions.filter(session => session.id !== id) }));
    showToast("Study session removed");
  }

  return <>
    <PageTitle eyebrow="STUDY TRACKER" title="Make every study session count." copy="Run the live timer or add past sessions manually. Your dashboard turns every entry into clear daily, weekly and subject statistics." />
    <div className="study-grid">
      <section className="timer-card">
        <div className={`timer-orbit ${start ? "running" : ""}`}><small>{start ? targetMinutes ? "TIME LEFT" : "FOCUSING ON" : "READY WHEN YOU ARE"}</small><strong>{formatClock(displayedSeconds)}</strong><span>{subject}</span></div>
        <div className="timer-setup">
          <label>Subject<select value={subject} onChange={e => setSubject(e.target.value)} disabled={!!start} aria-label="Timer subject">{data.subjects.map(s => <option key={s.id}>{s.name}</option>)}</select></label>
          <label>What are you working on?<input value={note} onChange={e => setNote(e.target.value)} disabled={!!start} placeholder="e.g. Calculus chapter 7D" /></label>
          <div className="timer-length"><small>SESSION LENGTH</small><div>{[{ label: "Open", value: null }, { label: "25 min", value: 25 }, { label: "50 min", value: 50 }].map(option => <button type="button" disabled={!!start} className={targetMinutes === option.value ? "active" : ""} onClick={() => setTargetMinutes(option.value)} key={option.label}>{option.label}</button>)}<label>Custom<input disabled={!!start} type="number" min="1" max="360" value={targetMinutes ?? ""} onChange={e => setTargetMinutes(e.target.value ? Math.max(1, Math.min(360, Number(e.target.value))) : null)} /><span>min</span></label></div></div>
        </div>
        <button className={start ? "stop-button" : "start-button"} onClick={start ? stopTimer : startTimer}>{start ? "■  Stop & log session" : "▶  Start study session"}</button>
        <p>{targetMinutes ? `This session logs automatically after ${targetMinutes} minutes.` : "Open sessions are saved when you press stop."}</p>
      </section>
      <section className="stats-column">
        <div className="mini-stats expanded">
          <div><small>TODAY</small><strong>{formatDuration(stats.todaySeconds)}</strong><span>{data.studySessions.filter(s => isToday(s.startedAt)).length} sessions</span></div>
          <div><small>THIS WEEK</small><strong>{formatDuration(stats.weekSeconds)}</strong><span className={stats.delta >= 0 ? "up" : "down"}>{stats.delta >= 0 ? "↑" : "↓"} {Math.abs(stats.delta)}% vs last week</span></div>
          <div><small>ALL TIME</small><strong>{formatDuration(stats.allTimeSeconds)}</strong><span>{data.studySessions.length} sessions logged</span></div>
          <div><small>AVERAGE</small><strong>{formatDuration(stats.averageSeconds)}</strong><span>per session</span></div>
          <div><small>CONSISTENCY</small><strong>{stats.activeDays}/7</strong><span>active days this week</span></div>
          <div><small>LONGEST</small><strong>{formatDuration(stats.longestSeconds)}</strong><span>single session</span></div>
        </div>
        <form className="card manual-entry" onSubmit={addManualSession}>
          <CardHeading kicker="MANUAL ENTRY" title="Log a study session" />
          <div className="manual-form-grid">
            <label>Date<input type="date" max={toDateInput(current)} value={manualDate} onChange={e => setManualDate(e.target.value)} required /></label>
            <label>Start time<input type="time" value={manualTime} onChange={e => setManualTime(e.target.value)} required /></label>
            <label>Subject<select value={manualSubject} onChange={e => setManualSubject(e.target.value)}>{data.subjects.map(s => <option key={s.id}>{s.name}</option>)}</select></label>
            <label>Duration (minutes)<input type="number" min="1" max="1440" step="1" value={manualMinutes} onChange={e => setManualMinutes(e.target.value)} required /></label>
            <label className="manual-note">What did you study?<textarea placeholder="e.g. Completed calculus exercises 7D–7F and reviewed mistakes" value={manualNote} onChange={e => setManualNote(e.target.value)} /></label>
          </div>
          <button className="button wide" type="submit">＋ Add to study log</button>
        </form>
      </section>
    </div>
    <div className="analytics-grid">
      <section className="card daily-chart"><CardHeading kicker="LAST 7 DAYS" title="Daily study rhythm" /><div className="day-columns">{daily.map(day => <div key={day.key}><b>{day.seconds ? formatDuration(day.seconds) : "—"}</b><span><i style={{ height: `${Math.max(day.seconds ? 8 : 0, (day.seconds / maxDay) * 100)}%` }} /></span><small>{day.label}</small></div>)}</div></section>
      <section className="card subject-bars"><CardHeading kicker="LAST 7 DAYS" title="Time by subject" />{bySubject.map(s => <div className="bar-row" key={s.name}><span>{s.name}</span><div><i style={{ width: `${(s.seconds / maxSubject) * 100}%`, background: s.color }} /></div><b>{formatDuration(s.seconds)}</b></div>)}</section>
    </div>
    <section className="card session-list"><CardHeading kicker="HISTORY" title="Study session log" />{sessions.length ? sessions.slice(0, 30).map(s => <div className="session-row" key={s.id}><span className="session-badge" style={{ background: data.subjects.find(x => x.name === s.subject)?.color }}>{s.subject.slice(0, 2)}</span><div className="session-main"><strong>{s.subject}</strong><small>{new Date(s.startedAt).toLocaleString("en-AU", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</small>{s.note && <p>{s.note}</p>}</div><b>{formatDuration(s.durationSeconds)}</b><button className="delete session-delete" onClick={() => deleteSession(s.id)} aria-label={`Delete ${s.subject} session`}>×</button></div>) : <div className="empty-state">Your first finished or manually added session will appear here.</div>}</section>
  </>;
}

function TodoComposer({ target, subjects, initial, onSave, onClose }: { target: TodoComposerState; subjects: Subject[]; initial?: Todo; onSave: (text: string, dueDate?: string, reminder?: string, note?: string) => void; onClose: () => void }) {
  const [text, setText] = useState(initial?.text || "");
  const [dueDate, setDueDate] = useState(initial?.dueDate || "");
  const [reminder, setReminder] = useState(initial?.reminder ? toDateTimeInput(new Date(initial.reminder)) : "");
  const [note, setNote] = useState(initial?.note || "");
  const subject = subjects.find(s => s.id === target.subjectId);
  const title = initial ? "Edit to-do" : target.exercise ? "Add required exercise" : subject ? `Add ${subject.name} task` : "Add personal todo";
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim()) return;
    onSave(text, dueDate || undefined, reminder ? new Date(reminder).toISOString() : undefined, note);
  }
  return <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><form className="todo-composer" role="dialog" aria-modal="true" aria-label={title} onSubmit={submit}><button className="modal-close" type="button" onClick={onClose} aria-label="Close">×</button><span className="eyebrow">{initial ? "UPDATE TO-DO" : "NEW TO-DO"}</span><h2>{title}</h2><label>What needs doing?<input autoFocus value={text} onChange={event => setText(event.target.value)} placeholder={target.exercise ? "Exercise or chapter" : "Task name"} required /></label><label>Complete by <small>optional</small><input type="date" value={dueDate} onChange={event => setDueDate(event.target.value)} /></label><label>Remind me <small>optional</small><input type="datetime-local" value={reminder} onChange={event => setReminder(event.target.value)} /></label><label>Notes <small>optional</small><textarea value={note} onChange={event => setNote(event.target.value)} placeholder="Extra details, links or a reminder to yourself" /></label><div className="composer-actions"><button className="button secondary" type="button" onClick={onClose}>Cancel</button><button className="button" type="submit">{initial ? "Save changes" : "Add to-do"}</button></div></form></div>;
}

function PlannerHub({ data, update, toggleTodo, editTodo }: { data: AppData; update: (f: (d: AppData) => AppData) => void; toggleTodo: (id: string) => void; editTodo: (id: string) => void }) {
  const initialMonth = new Date(); initialMonth.setDate(1); initialMonth.setHours(12, 0, 0, 0);
  const [month, setMonth] = useState(initialMonth);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState(toDateInput(new Date()));
  const [meetingTime, setMeetingTime] = useState("16:00");
  const [meetingEndTime, setMeetingEndTime] = useState("17:00");
  const [meetingDetails, setMeetingDetails] = useState("");
  const [meetingReminder, setMeetingReminder] = useState("15");
  const [eventAllDay, setEventAllDay] = useState(false);
  const [eventCountdown, setEventCountdown] = useState(false);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [meetingError, setMeetingError] = useState("");
  const todayKey = toDateInput(new Date());
  const [selectedDay, setSelectedDay] = useState(todayKey);
  const datedTodos = [
    ...data.overallTodos.filter(todo => todo.dueDate).map(todo => ({ todo, source: "Personal", color: "#f6cf9e" })),
    ...data.subjects.flatMap(subject => [
      ...subject.todos.filter(todo => todo.dueDate).map(todo => ({ todo, source: subject.name, color: subject.color })),
      ...(subject.exercises || []).filter(todo => todo.dueDate).map(todo => ({ todo, source: `${subject.name} exercises`, color: subject.color })),
    ]),
  ];
  const dueAgenda = datedTodos.filter(item => !item.todo.done).sort((a, b) => (a.todo.dueDate || "").localeCompare(b.todo.dueDate || "")).slice(0, 7);
  const selectedTodos = datedTodos.filter(item => item.todo.dueDate === selectedDay);
  const selectedMeetings = data.meetings.filter(meeting => localDayKey(new Date(meeting.startsAt)) === selectedDay).sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const selectedStudy = data.studySessions.filter(session => localDayKey(new Date(session.startedAt)) === selectedDay).sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
  const selectedDate = new Date(`${selectedDay}T12:00:00`);
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const upcomingMeetings = [...data.meetings].filter(meeting => new Date(meeting.startsAt).getTime() >= startOfToday.getTime()).sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const leadingBlanks = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: (number | null)[] = [...Array.from({ length: leadingBlanks }, () => null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];

  function changeMonth(offset: number) { setMonth(current => new Date(current.getFullYear(), current.getMonth() + offset, 1, 12)); }
  function resetMeetingForm() {
    setMeetingTitle(""); setMeetingDetails(""); setMeetingReminder("15"); setEventAllDay(false); setEventCountdown(false); setEditingMeetingId(null); setMeetingError(""); setShowMeetingForm(false);
  }
  function openNewMeeting(date = selectedDay) {
    if (showMeetingForm && !editingMeetingId) return resetMeetingForm();
    setEditingMeetingId(null); setMeetingTitle(""); setMeetingDetails(""); setMeetingDate(date); setMeetingTime("16:00"); setMeetingEndTime("17:00"); setMeetingReminder("15"); setEventAllDay(false); setEventCountdown(false); setMeetingError(""); setShowMeetingForm(true);
  }
  function editMeeting(meeting: Meeting) {
    const startsAt = new Date(meeting.startsAt);
    const endsAt = meeting.endsAt ? new Date(meeting.endsAt) : new Date(startsAt.getTime() + 60 * 60 * 1000);
    setEditingMeetingId(meeting.id); setMeetingTitle(meeting.title); setMeetingDate(toDateInput(startsAt)); setMeetingTime(toTimeInput(startsAt)); setMeetingEndTime(toTimeInput(endsAt)); setMeetingDetails(meeting.details || ""); setMeetingReminder(String(meeting.reminderMinutes ?? 15)); setEventAllDay(Boolean(meeting.allDay)); setEventCountdown(Boolean(meeting.countdownId)); setMeetingError(""); setShowMeetingForm(true);
  }
  function saveMeeting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const startsAt = new Date(`${meetingDate}T${eventAllDay ? "12:00" : meetingTime}`);
    const endsAt = eventAllDay ? undefined : new Date(`${meetingDate}T${meetingEndTime}`);
    if (!meetingTitle.trim() || Number.isNaN(startsAt.getTime())) return;
    if (endsAt && (Number.isNaN(endsAt.getTime()) || endsAt <= startsAt)) { setMeetingError("End time needs to be after the start time."); return; }
    const existing = editingMeetingId ? data.meetings.find(item => item.id === editingMeetingId) : undefined;
    const countdownId = eventCountdown ? existing?.countdownId || uid() : undefined;
    const meeting: Meeting = { id: editingMeetingId || uid(), title: meetingTitle.trim(), startsAt: startsAt.toISOString(), endsAt: endsAt?.toISOString(), details: meetingDetails.trim() || undefined, reminderMinutes: Number(meetingReminder), allDay: eventAllDay, countdownId };
    update(d => {
      const countdowns = existing?.countdownId ? d.countdowns.filter(item => item.id !== existing.countdownId) : d.countdowns;
      const nextCountdowns = countdownId ? [...countdowns, { id: countdownId, title: meeting.title, date: meeting.startsAt, color: swatches[countdowns.length % swatches.length] }] : countdowns;
      return { ...d, meetings: editingMeetingId ? d.meetings.map(item => item.id === editingMeetingId ? meeting : item) : [...d.meetings, meeting], countdowns: nextCountdowns };
    });
    resetMeetingForm();
  }

  return <section className="planner-grid">
    <div className="card calendar-card">
      <div className="planner-heading"><div><small>CALENDAR</small><h2>{month.toLocaleDateString("en-AU", { month: "long", year: "numeric" })}</h2></div><div className="calendar-nav"><button onClick={() => changeMonth(-1)} aria-label="Previous month">←</button><button onClick={() => { const today = new Date(); setMonth(new Date(today.getFullYear(), today.getMonth(), 1, 12)); setSelectedDay(todayKey); }}>Today</button><button onClick={() => changeMonth(1)} aria-label="Next month">→</button></div></div>
      <div className="calendar-weekdays">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => <span key={day}>{day}</span>)}</div>
      <div className="calendar-grid">{cells.map((day, index) => {
        if (!day) return <div className="calendar-cell blank" key={`blank-${index}`} />;
        const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const taskEvents = datedTodos.filter(item => !item.todo.done && item.todo.dueDate === key);
        const meetingEvents = data.meetings.filter(meeting => localDayKey(new Date(meeting.startsAt)) === key);
        const events = [...taskEvents.map(item => ({ id: item.todo.id, label: `${item.source}: ${item.todo.text}`, color: item.color, type: "task" })), ...meetingEvents.map(meeting => ({ id: meeting.id, label: `${meeting.allDay ? "All day · " : ""}${meeting.title}`, color: "#c7b8ee", type: "meeting" }))];
        return <button type="button" className={`calendar-cell ${key === todayKey ? "today" : ""} ${key === selectedDay ? "selected" : ""}`} key={key} onClick={() => setSelectedDay(key)} aria-label={`Open ${new Date(`${key}T12:00:00`).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}`}><b>{day}</b><div>{events.slice(0, 2).map(event => <span className={`calendar-event ${event.type}`} style={{ "--event": event.color } as React.CSSProperties} title={event.label} key={`${event.type}-${event.id}`}><i />{event.label}</span>)}{events.length > 2 && <small>+{events.length - 2} more</small>}</div></button>;
      })}</div>
      <section className="selected-day"><div className="selected-day-heading"><div><small>DAY DETAILS</small><h3>{selectedDate.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}</h3></div><div className="selected-day-actions"><span>{selectedTodos.length + selectedMeetings.length + selectedStudy.length} items</span><button onClick={() => openNewMeeting(selectedDay)}>＋ Add event</button></div></div><div className="day-detail-grid"><div><h4>Timings & events</h4>{selectedMeetings.map(meeting => <div className="day-timeline-row meeting" key={meeting.id}><time>{formatMeetingTime(meeting)}</time><i /><div><strong>{meeting.title}</strong>{meeting.details && <small>{meeting.details}</small>}</div><button onClick={() => editMeeting(meeting)}>Edit</button></div>)}{selectedStudy.map(session => <div className="day-timeline-row study" key={session.id}><time>{new Date(session.startedAt).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })}</time><i /><div><strong>{session.subject} study</strong><small>{formatDuration(session.durationSeconds)}{session.note ? ` · ${session.note}` : ""}</small></div></div>)}{!selectedMeetings.length && !selectedStudy.length && <div className="day-empty">No events or study sessions.</div>}</div><div><h4>To-dos</h4>{selectedTodos.map(item => <div className={`day-todo ${item.todo.done ? "done" : ""}`} key={item.todo.id}><button className="check" onClick={() => toggleTodo(item.todo.id)}>{item.todo.done ? "✓" : ""}</button><i style={{ background: item.color }} /><div><strong>{item.todo.text}</strong><small>{item.source}{item.todo.note ? ` · ${item.todo.note}` : ""}{item.todo.reminder ? ` · ${formatReminder(item.todo.reminder)}` : ""}</small></div><button className="row-edit" onClick={() => editTodo(item.todo.id)}>Edit</button></div>)}{!selectedTodos.length && <div className="day-empty">No to-dos due on this day.</div>}</div></div></section>
      <div className="due-agenda"><div className="agenda-title"><strong>What’s due next</strong><small>Tasks with completion dates</small></div>{dueAgenda.length ? dueAgenda.map(item => <div className="due-agenda-row" key={item.todo.id}><i style={{ background: item.color }} /><div><strong>{item.todo.text}</strong><small>{item.source}</small></div><time className={(item.todo.dueDate || "") < todayKey ? "overdue" : ""}>{(item.todo.dueDate || "") < todayKey ? "Overdue · " : ""}{formatDueDate(item.todo.dueDate || "")}</time></div>) : <div className="empty-state">Add a completion date to a to-do and it will appear here.</div>}</div>
    </div>
    <div className="card meetings-card"><CardHeading kicker="SCHEDULE" title="Upcoming events" action={showMeetingForm && !editingMeetingId ? "Close" : "＋ Add event"} onAction={() => openNewMeeting(selectedDay)} />{showMeetingForm && <form className="meeting-form" onSubmit={saveMeeting}><span className="form-mode">{editingMeetingId ? "EDIT EVENT" : "NEW EVENT"}</span><label>Event<input autoFocus value={meetingTitle} onChange={event => setMeetingTitle(event.target.value)} placeholder="Event title" required /></label><div><label>Date<input type="date" value={meetingDate} onChange={event => setMeetingDate(event.target.value)} required /></label>{!eventAllDay && <><label>Start time<input type="time" value={meetingTime} onChange={event => setMeetingTime(event.target.value)} required /></label><label>End time<input type="time" value={meetingEndTime} onChange={event => setMeetingEndTime(event.target.value)} required /></label></>}<label>Alert me<select value={meetingReminder} onChange={event => setMeetingReminder(event.target.value)}>{[[0, "At start"], [5, "5 min before"], [10, "10 min before"], [15, "15 min before"], [30, "30 min before"], [60, "1 hour before"], [1440, "1 day before"]].map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div><div className="event-options"><label><input type="checkbox" checked={eventAllDay} onChange={event => setEventAllDay(event.target.checked)} />All day</label><label><input type="checkbox" checked={eventCountdown} onChange={event => setEventCountdown(event.target.checked)} />Also add to countdowns</label></div><label>Details <small>optional</small><input value={meetingDetails} onChange={event => setMeetingDetails(event.target.value)} placeholder="Location, link or notes" /></label>{meetingError && <p className="form-error">{meetingError}</p>}<div className="meeting-form-actions"><button className="button secondary" type="button" onClick={resetMeetingForm}>Cancel</button><button className="button" type="submit">{editingMeetingId ? "Save changes" : "Save event"}</button></div></form>}<div className="meeting-list">{upcomingMeetings.length ? upcomingMeetings.map(meeting => <div className="meeting-row" key={meeting.id}><time><b>{new Date(meeting.startsAt).getDate()}</b><span>{new Date(meeting.startsAt).toLocaleDateString("en-AU", { month: "short" })}</span></time><div><strong>{meeting.title}</strong><small>{formatMeetingTime(meeting)}{meeting.details ? ` · ${meeting.details}` : ""}</small><span className="meeting-reminder">{meeting.countdownId ? "In countdowns · " : ""}Alert {formatReminderLead(meeting.reminderMinutes ?? 15)}</span></div><div className="meeting-actions"><button onClick={() => editMeeting(meeting)}>Edit</button><button onClick={() => update(d => ({ ...d, meetings: d.meetings.filter(item => item.id !== meeting.id), countdowns: meeting.countdownId ? d.countdowns.filter(countdown => countdown.id !== meeting.countdownId) : d.countdowns }))}>Cancel</button></div></div>) : <div className="empty-state">No upcoming events yet.</div>}</div></div>
  </section>;
}

function SettingsView({ data, update, notifications, toggleNotifications, sendTestNotification, status }: { data: AppData; update: (f: (d: AppData) => AppData) => void; notifications: boolean; toggleNotifications: () => void; sendTestNotification: () => void; status: string }) {
  function exportJson() { const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "anvis-dashboard-backup.json"; a.click(); URL.revokeObjectURL(a.href); }
  function importJson(e: ChangeEvent<HTMLInputElement>) { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { update(() => mergeData(JSON.parse(String(reader.result)))); } catch { alert("That file doesn’t look like an Anvi’s Dashboard backup."); } }; reader.readAsText(file); }
  return <><PageTitle eyebrow="SETTINGS" title="Make the desk yours." copy="Tune the visuals, reminders and installation options, and keep a portable backup whenever you like." /><div className="settings-grid">
    <section className="card settings-card"><CardHeading kicker="AESTHETIC" title="Look & feel" /><label>Your name<input value={data.profile.name} onChange={e => update(d => ({ ...d, profile: { ...d.profile, name: e.target.value } }))} /></label><label>Dashboard hero image URL<input value={data.profile.heroImage} onChange={e => update(d => ({ ...d, profile: { ...d.profile, heroImage: e.target.value } }))} /></label><label>Spotify track, album or playlist URL<input value={data.profile.spotifyUrl} onChange={e => update(d => ({ ...d, profile: { ...d.profile, spotifyUrl: e.target.value } }))} placeholder="https://open.spotify.com/playlist/…" /></label><label>Daily line<input value={data.profile.quote} onChange={e => update(d => ({ ...d, profile: { ...d.profile, quote: e.target.value } }))} /></label><div className="preview-strip" style={{ backgroundImage: `url(${data.profile.heroImage})` }} /></section>
    <section className="card settings-card"><CardHeading kicker="SUPABASE" title="Automatic cloud sync" /><p>There is nothing to enter or connect. This dashboard opens its shared Supabase record automatically and saves every change as you make it.</p><div className="setting-row"><div><strong>{status === "synced" ? "✓ Connected to Supabase" : status === "syncing" ? "Connecting to Supabase…" : status === "error" ? "Supabase setup required" : "Preparing cloud sync…"}</strong><small>{status === "synced" ? "Your data is available across devices" : status === "error" ? "Run the included setup SQL once" : "Loading your dashboard"}</small></div><span className={`sync-dot ${status}`} /></div></section>
    <section className="card settings-card notification-card"><CardHeading kicker="NOTIFICATIONS" title="Reminders & mornings" /><div className="setting-row"><div><strong>Web notifications</strong><small>Todo reminders and your chosen meeting alert times</small></div><button className={`toggle ${notifications ? "on" : ""}`} onClick={toggleNotifications} aria-label="Toggle web notifications"><i /></button></div><div className="setting-row"><div><strong>Morning day-ahead summary</strong><small>Tasks due, overdue items and today’s meetings</small></div><button className={`toggle ${data.notificationSettings.morningSummary ? "on" : ""}`} onClick={() => update(d => ({ ...d, notificationSettings: { ...d.notificationSettings, morningSummary: !d.notificationSettings.morningSummary } }))} aria-label="Toggle morning summary"><i /></button></div><label className="morning-time">Morning summary time<input type="time" value={data.notificationSettings.morningTime} onChange={event => update(d => ({ ...d, notificationSettings: { ...d.notificationSettings, morningTime: event.target.value } }))} /></label><button className="button secondary test-notification" onClick={sendTestNotification}>Send test notification</button><small className="privacy-note">The summary appears the first time the dashboard is open at or after this time. Fully closed-app delivery needs a server push scheduler.</small></section>
    <section className="card settings-card install-card"><CardHeading kicker="MAC & IPHONE" title="Install as an app" /><p>Install Anvi’s Dashboard for its own icon, app window and the best notification support.</p><div className="install-step"><span>iPhone</span><div><strong>Safari → Share → Add to Home Screen</strong><small>Turn on “Open as Web App”, open it from the new icon, then enable notifications here.</small></div></div><div className="install-step"><span>Mac</span><div><strong>Safari → File → Add to Dock</strong><small>Open the new Dock app and enable notifications from its Settings page.</small></div></div><div className="widget-note"><strong>About Apple widgets</strong><p>A true Home Screen, Lock Screen or Mac desktop widget requires a native WidgetKit app. The installed web app is the closest web-only option.</p></div></section>
    <section className="card settings-card"><CardHeading kicker="PORTABLE BACKUP" title="Export or import everything" /><p>Keep a human-readable JSON backup too. Importing replaces the current dashboard and then syncs it.</p><div className="backup-actions"><button className="button secondary" onClick={exportJson}>Export JSON</button><label className="button secondary">Import JSON<input hidden type="file" accept="application/json" onChange={importJson} /></label></div><details><summary>Edit raw data</summary><textarea value={JSON.stringify(data, null, 2)} onChange={e => { try { update(() => mergeData(JSON.parse(e.target.value))); } catch {} }} /></details></section>
  </div></>;
}

function CardHeading({ kicker, title, action, onAction }: { kicker: string; title: string; action?: string; onAction?: () => void }) { return <div className="card-heading"><div><small>{kicker}</small><h2>{title}</h2></div>{action && <button onClick={onAction}>{action}</button>}</div>; }
function PageTitle({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) { return <header className="page-title"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{copy}</p></header>; }
function TaskGroup({ title, subtitle, color, todos, nested, hideHeading, toggleTodo, editTodo, removeTodo, setPriority }: { title: string; subtitle?: string; color: string; todos: Todo[]; nested?: boolean; hideHeading?: boolean; toggleTodo: (id: string) => void; editTodo: (id: string) => void; removeTodo: (id: string) => void; setPriority: (id: string, p: Priority) => void }) {
  const today = toDateInput(new Date());
  return <div className={`task-group ${nested ? "nested" : ""}`}>{!hideHeading && <div className="task-group-title"><span style={{ background: color }}>{title.slice(0, 2)}</span><div><strong>{title}</strong>{subtitle && <small>{subtitle}</small>}</div><b>{todos.filter(t => !t.done).length}</b></div>}{todos.map(t => <div className={`todo-row ${t.done ? "done" : ""}`} key={t.id}><button className="check" onClick={() => toggleTodo(t.id)}>{t.done ? "✓" : ""}</button><span className="todo-copy"><span className="todo-text">{t.text}</span>{t.note && <small className="todo-note">{t.note}</small>}{t.dueDate && <small className={`due-chip ${!t.done && t.dueDate < today ? "overdue" : ""}`}>{!t.done && t.dueDate < today ? "Overdue" : "Due"} {formatDueDate(t.dueDate)}</small>}{t.reminder && <small className="due-chip reminder-chip">Remind {formatReminder(t.reminder)}</small>}</span><select aria-label="Priority" value={t.priority} onChange={e => setPriority(t.id, e.target.value as Priority)} className={`priority ${t.priority}`}><option value="low">Low</option><option value="medium">Med</option><option value="high">High</option></select><div className="todo-actions"><button className="row-edit" onClick={() => editTodo(t.id)} aria-label={`Edit ${t.text}`}>Edit</button><button className="delete" onClick={() => removeTodo(t.id)} aria-label={`Delete ${t.text}`}>×</button></div></div>)}{todos.length === 0 && <div className="empty-row">Nothing here — nice work.</div>}</div>;
}
function addCountdown(update: (f: (d: AppData) => AppData) => void) { const title = prompt("Countdown name"); if (!title) return; const date = prompt("Date and time (example: 2026-10-15 09:00)"); if (!date || Number.isNaN(new Date(date).getTime())) return; update(d => ({ ...d, countdowns: [...d.countdowns, { id: uid(), title, date: new Date(date).toISOString(), color: swatches[d.countdowns.length % swatches.length] }] })); }
function editCountdown(update: (f: (d: AppData) => AppData) => void, countdown: Countdown) { const title = prompt("Countdown name", countdown.title); if (!title?.trim()) return; const current = toDateTimeInput(new Date(countdown.date)).replace("T", " "); const date = prompt("Date and time", current); if (!date || Number.isNaN(new Date(date).getTime())) return; update(d => ({ ...d, countdowns: d.countdowns.map(item => item.id === countdown.id ? { ...item, title: title.trim(), date: new Date(date).toISOString() } : item) })); }
function addGoal(update: (f: (d: AppData) => AppData) => void, key: keyof AppData["goals"]) { const text = prompt(`New goal for ${horizons[key]}`); if (text?.trim()) update(d => ({ ...d, goals: { ...d.goals, [key]: [...d.goals[key], { id: uid(), text: text.trim(), done: false }] } })); }
function addBookmark(update: (f: (d: AppData) => AppData) => void) { const title = prompt("Bookmark title"); if (!title) return; const url = prompt("Web address"); if (!url) return; update(d => ({ ...d, bookmarks: [...d.bookmarks, { id: uid(), title, url: normaliseUrl(url) }] })); }
function addImageUrl(update: (f: (d: AppData) => AppData) => void, target: "visionImages" | "dashboardImages") { const url = prompt("Paste an image URL"); if (!url) return; const caption = prompt("Short caption") || "Inspiration"; update(d => ({ ...d, [target]: [...d[target], { id: uid(), url, caption }] })); }
function addNewSubject(update: (f: (d: AppData) => AppData) => void) { const name = prompt("Project or subject name"); if (!name?.trim()) return; update(d => ({ ...d, subjects: [...d.subjects, { id: uid(), name: name.trim(), color: swatches[d.subjects.length % swatches.length], goodAt: "", improve: "", notes: "", resources: [], todos: [] }] })); }
function setSpotifyLink(update: (f: (d: AppData) => AppData) => void, current: string) { const url = prompt("Paste a Spotify track, album, artist, podcast or playlist link", current); if (url === null) return; if (url.trim() && !spotifyEmbedUrl(url)) return alert("That doesn’t look like a Spotify share link."); update(d => ({ ...d, profile: { ...d.profile, spotifyUrl: url.trim() } })); }
function spotifyEmbedUrl(value: string) {
  const text = value.trim(); if (!text) return "";
  const uri = text.match(/^spotify:(track|album|playlist|artist|show|episode):([a-zA-Z0-9]+)$/i);
  if (uri) return `https://open.spotify.com/embed/${uri[1].toLowerCase()}/${uri[2]}?utm_source=generator&theme=0`;
  try {
    const url = new URL(text);
    if (url.hostname !== "open.spotify.com") return "";
    const parts = url.pathname.split("/").filter(Boolean);
    const typeIndex = parts.findIndex(part => ["track", "album", "playlist", "artist", "show", "episode"].includes(part));
    if (typeIndex < 0 || !/^[a-zA-Z0-9]+$/.test(parts[typeIndex + 1] || "")) return "";
    return `https://open.spotify.com/embed/${parts[typeIndex]}/${parts[typeIndex + 1]}?utm_source=generator&theme=0`;
  } catch { return ""; }
}
function normaliseUrl(url: string) { return /^https?:\/\//i.test(url) ? url : `https://${url}`; }
function allTodos(d: AppData) { return [...d.overallTodos, ...d.subjects.flatMap(subject => [...subject.todos, ...(subject.exercises || [])])]; }
function countOpen(d: AppData) { return [...d.overallTodos, ...d.subjects.flatMap(s => [...s.todos, ...(s.exercises || [])])].filter(t => !t.done).length; }
function completion(d: AppData) { const all = [...d.overallTodos, ...d.subjects.flatMap(s => [...s.todos, ...(s.exercises || [])])]; return all.length ? Math.round((all.filter(t => t.done).length / all.length) * 100) : 100; }
function formatClock(seconds: number) { const h = Math.floor(seconds / 3600); const m = Math.floor((seconds % 3600) / 60); const s = seconds % 60; return [h, m, s].map(n => String(n).padStart(2, "0")).join(":"); }
function formatDuration(seconds: number) { if (seconds < 60) return seconds ? `${seconds}s` : "0m"; const h = Math.floor(seconds / 3600); const m = Math.round((seconds % 3600) / 60); return h ? `${h}h ${m}m` : `${m}m`; }
function isToday(iso: string) { const d = new Date(iso), n = new Date(); return d.toDateString() === n.toDateString(); }
function withinDays(iso: string, days: number) { return new Date(iso).getTime() >= Date.now() - days * 86400000; }
function rangeTotal(sessions: StudySession[], fromDays: number, toDays: number) { const n = Date.now(); return sessions.filter(s => { const age = (n - new Date(s.startedAt).getTime()) / 86400000; return age >= fromDays && age < toDays; }).reduce((a, s) => a + s.durationSeconds, 0); }
function toDateInput(date: Date) { const offset = date.getTimezoneOffset() * 60000; return new Date(date.getTime() - offset).toISOString().slice(0, 10); }
function toTimeInput(date: Date) { return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`; }
function toDateTimeInput(date: Date) { return `${toDateInput(date)}T${toTimeInput(date)}`; }
function localDayKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function formatDueDate(value: string) { const date = new Date(`${value}T12:00:00`); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-AU", { day: "numeric", month: "short" }); }
function formatReminder(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }); }
function formatMeetingTime(meeting: Meeting) { if (meeting.allDay) return "All day"; const start = new Date(meeting.startsAt).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" }); const end = meeting.endsAt ? new Date(meeting.endsAt).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" }) : ""; return end ? `${start}–${end}` : start; }
function formatReminderLead(minutes: number) { if (minutes === 0) return "at start"; if (minutes === 1440) return "1 day before"; if (minutes >= 60) return `${minutes / 60}h before`; return `${minutes} min before`; }
function lastSevenDays() { return Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setHours(12, 0, 0, 0); date.setDate(date.getDate() - (6 - index)); return { key: localDayKey(date), label: date.toLocaleDateString("en-AU", { weekday: "short" }).slice(0, 2) }; }); }
