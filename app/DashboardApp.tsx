"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Tab = "dashboard" | "subjects" | "goals" | "resources" | "study" | "settings";
type Priority = "low" | "medium" | "high";
type Todo = { id: string; text: string; done: boolean; priority: Priority; reminder?: string };
type Subject = { id: string; name: string; color: string; goodAt: string; improve: string; todos: Todo[]; exercises?: Todo[] };
type Goal = { id: string; text: string; done: boolean };
type Countdown = { id: string; title: string; date: string; color: string };
type StudySession = { id: string; subject: string; startedAt: string; durationSeconds: number; note?: string };
type ImageItem = { id: string; url: string; caption: string };
type Bookmark = { id: string; title: string; url: string };
type AppData = {
  profile: { name: string; heroImage: string; quote: string };
  subjects: Subject[];
  overallTodos: Todo[];
  goals: Record<"week" | "term" | "sixMonths" | "year", Goal[]>;
  countdowns: Countdown[];
  bookmarks: Bookmark[];
  notes: string;
  visionImages: ImageItem[];
  dashboardImages: ImageItem[];
  studySessions: StudySession[];
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
  visionImages: [
    { id: "v1", url: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80", caption: "Room to breathe" },
    { id: "v2", url: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=80", caption: "Build something real" },
    { id: "v3", url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80", caption: "Good people, good energy" },
  ],
  dashboardImages: [{ id: "d1", url: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80", caption: "This week’s mood" }],
  studySessions: [],
};

const nav: { id: Tab; label: string; icon: string }[] = [
  { id: "dashboard", label: "Home", icon: "⌂" }, { id: "subjects", label: "Subjects", icon: "▤" },
  { id: "goals", label: "Goals", icon: "◎" }, { id: "resources", label: "Resources", icon: "◇" },
  { id: "study", label: "Study log", icon: "◷" }, { id: "settings", label: "Settings", icon: "⚙" },
];
const horizons = { week: "This Week", term: "This Term", sixMonths: "Next Six Months", year: "This Year · HSC Focus" } as const;
const swatches = ["#f2b8c6", "#a8c7fa", "#b8ddc0", "#c7b8ee", "#f6cf9e", "#d7dfa5", "#f0b7e3"];
const STORAGE_KEY = "anvis-dashboard-data";
const CONFIG_KEY = "anvis-dashboard-supabase";
const LEGACY_STORAGE_KEY = "daydream-desk-data";
const LEGACY_CONFIG_KEY = "daydream-desk-supabase";
const SUPABASE_URL = "https://iiwjnqfbhzfzwzvccapc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpd2pucWZiaHpmend6dmNjYXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4Njk2NTEsImV4cCI6MjA5NDQ0NTY1MX0.PX4XXr9fxtZHqN-hq5iwvkOV3-oYULXi459Zcis6h9Y";

function mergeData(value: Partial<AppData>): AppData {
  return { ...starter, ...value, profile: { ...starter.profile, ...(value.profile || {}) }, goals: { ...starter.goals, ...(value.goals || {}) } };
}

export default function DashboardApp() {
  const [data, setData] = useState<AppData>(starter);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [selectedSubject, setSelectedSubject] = useState("english");
  const [now, setNow] = useState(Date.now());
  const [toast, setToast] = useState("");
  const [notifications, setNotifications] = useState(false);
  const [pin, setPin] = useState("");
  const [syncStatus, setSyncStatus] = useState<"local" | "syncing" | "synced" | "error">("local");
  const [hydrated, setHydrated] = useState(false);
  const [timerSubject, setTimerSubject] = useState("English");
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [timerElapsed, setTimerElapsed] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    const config = localStorage.getItem(CONFIG_KEY) || localStorage.getItem(LEGACY_CONFIG_KEY);
    if (cached) { try { setData(mergeData(JSON.parse(cached))); } catch {} }
    if (config) { try { const c = JSON.parse(config); setPin(c.pin || ""); } catch {} }
    setNotifications(Notification?.permission === "granted");
    setHydrated(true);
  }, []);

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (!timerStart) return;
    const t = setInterval(() => setTimerElapsed(Math.floor((Date.now() - timerStart) / 1000)), 1000);
    return () => clearInterval(t);
  }, [timerStart]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (!pin) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSyncStatus("syncing");
    saveTimer.current = setTimeout(() => saveCloud(data), 900);
  }, [data, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const due = [...data.overallTodos, ...data.subjects.flatMap(s => [...s.todos, ...(s.exercises || [])])]
      .find(t => !t.done && t.reminder && new Date(t.reminder).getTime() <= now && new Date(t.reminder).getTime() > now - 2000);
    if (due) notify(`Reminder: ${due.text}`);
  }, [now]);

  async function cloudRequest(fn: string, body: object) {
    const base = SUPABASE_URL.replace(/\/$/, "");
    return fetch(`${base}/rest/v1/rpc/${fn}`, { method: "POST", headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  }
  async function saveCloud(next: AppData) {
    try {
      const r = await cloudRequest("save_student_dashboard", { access_pin: pin, new_payload: next });
      if (!r.ok) throw new Error(); setSyncStatus("synced");
    } catch { setSyncStatus("error"); }
  }
  async function connectCloud() {
    if (!pin.trim()) return showToast("Choose a private passphrase first");
    localStorage.setItem(CONFIG_KEY, JSON.stringify({ pin }));
    setSyncStatus("syncing");
    try {
      const r = await cloudRequest("load_student_dashboard", { access_pin: pin });
      if (!r.ok) throw new Error(await r.text());
      const payload = await r.json();
      if (payload && Object.keys(payload).length) setData(mergeData(payload)); else await saveCloud(data);
      setSyncStatus("synced"); showToast("Connected — this dashboard now syncs across devices");
    } catch { setSyncStatus("error"); showToast("Couldn’t connect. Check that the Supabase setup SQL has run."); }
  }
  function update(recipe: (draft: AppData) => AppData) { setData(prev => recipe(prev)); }
  function showToast(message: string) { setToast(message); setTimeout(() => setToast(""), 3200); }
  function notify(message: string) {
    if (notifications && Notification.permission === "granted") new Notification("Anvi’s Dashboard", { body: message });
    showToast(message);
  }
  async function toggleNotifications() {
    if (!("Notification" in window)) return showToast("Notifications aren’t supported in this browser");
    if (!notifications) { const p = await Notification.requestPermission(); setNotifications(p === "granted"); showToast(p === "granted" ? "Notifications are on" : "Notifications stayed off"); }
    else { setNotifications(false); showToast("Notifications are off"); }
  }

  function addTodo(subjectId?: string, exercise = false) {
    const text = prompt(exercise ? "Required exercise or chapter" : "What needs doing?"); if (!text?.trim()) return;
    const todo: Todo = { id: uid(), text: text.trim(), done: false, priority: "medium" };
    update(d => subjectId ? ({ ...d, subjects: d.subjects.map(s => s.id === subjectId ? { ...s, [exercise ? "exercises" : "todos"]: [...(exercise ? s.exercises || [] : s.todos), todo] } : s) }) : ({ ...d, overallTodos: [...d.overallTodos, todo] }));
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
  function stopTimer() {
    if (!timerStart || timerElapsed < 1) return;
    const session: StudySession = { id: uid(), subject: timerSubject, startedAt: new Date(timerStart).toISOString(), durationSeconds: timerElapsed };
    update(d => ({ ...d, studySessions: [...d.studySessions, session] })); setTimerStart(null); setTimerElapsed(0); showToast(`${formatDuration(session.durationSeconds)} logged for ${timerSubject}`);
  }
  async function uploadImage(event: ChangeEvent<HTMLInputElement>, target: "visionImages" | "dashboardImages") {
    const file = event.target.files?.[0]; if (!file) return;
    if (!pin) return showToast("Set your sync passphrase in Settings first");
    showToast("Uploading image…");
    try {
      const hash = await hashText(pin); const path = `${hash}/${uid()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const base = SUPABASE_URL.replace(/\/$/, "");
      const r = await fetch(`${base}/storage/v1/object/vision-board/${path}`, { method: "POST", headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": file.type, "x-upsert": "false" }, body: file });
      if (!r.ok) throw new Error();
      const url = `${base}/storage/v1/object/public/vision-board/${path}`;
      update(d => ({ ...d, [target]: [...d[target], { id: uid(), url, caption: file.name.replace(/\.[^.]+$/, "") }] })); showToast("Image added");
    } catch { showToast("Upload failed. Check that the storage setup SQL has run."); }
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
          <div><strong>{syncStatus === "synced" ? "Saved to cloud" : syncStatus === "syncing" ? "Saving…" : syncStatus === "error" ? "Local backup" : "Cloud ready"}</strong><small>{syncStatus === "synced" ? "Available everywhere" : "Set passphrase in Settings"}</small></div>
        </div>
      </aside>

      <section className="main-panel">
        <header className="mobile-header"><button className="brand" onClick={() => setTab("dashboard")}><span className="brand-mark">✦</span><span>Anvi’s <em>dashboard</em></span></button><span>{incomplete} open</span></header>
        <CountdownRail data={data} now={now} onAdd={() => addCountdown(update)} onRemove={id => update(d => ({ ...d, countdowns: d.countdowns.filter(c => c.id !== id) }))} />
        <div className="page-wrap">
          {tab === "dashboard" && <DashboardView data={data} now={now} weekSeconds={weekSeconds} setTab={setTab} toggleTodo={toggleTodo} addTodo={addTodo} removeTodo={removeTodo} setPriority={setTodoPriority} update={update} uploadImage={uploadImage} />}
          {tab === "subjects" && <SubjectsView data={data} selected={selectedSubject} setSelected={setSelectedSubject} update={update} addTodo={addTodo} toggleTodo={toggleTodo} removeTodo={removeTodo} setPriority={setTodoPriority} />}
          {tab === "goals" && <GoalsView data={data} update={update} />}
          {tab === "resources" && <ResourcesView data={data} update={update} uploadImage={uploadImage} />}
          {tab === "study" && <StudyView data={data} update={update} subject={timerSubject} setSubject={setTimerSubject} start={timerStart} elapsed={timerElapsed} startTimer={startTimer} stopTimer={stopTimer} showToast={showToast} />}
          {tab === "settings" && <SettingsView data={data} update={update} notifications={notifications} toggleNotifications={toggleNotifications} pin={pin} setPin={setPin} connect={connectCloud} status={syncStatus} />}
        </div>
        <nav className="mobile-nav">{nav.map(item => <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}><span>{item.icon}</span><small>{item.label}</small></button>)}</nav>
      </section>
      {toast && <div className="toast"><span>✦</span>{toast}</div>}
    </main>
  );
}

function CountdownRail({ data, now, onAdd, onRemove }: { data: AppData; now: number; onAdd: () => void; onRemove: (id: string) => void }) {
  return <div className="countdown-rail"><div className="rail-label"><span>◷</span><div><strong>Countdowns</strong><small>keep going</small></div></div><div className="countdown-scroll">{data.countdowns.map(c => { const diff = new Date(c.date).getTime() - now; const days = Math.max(0, Math.floor(diff / 86400000)); const hours = Math.max(0, Math.floor((diff % 86400000) / 3600000)); return <div className="countdown-chip" style={{ "--chip": c.color } as React.CSSProperties} key={c.id}><button className="chip-delete" onClick={() => onRemove(c.id)} aria-label={`Delete ${c.title}`}>×</button><span><b>{days}</b>d <b>{hours}</b>h</span><small>{c.title}</small></div> })}<button className="add-countdown" onClick={onAdd}>＋<span>Add date</span></button></div></div>;
}

function DashboardView({ data, weekSeconds, setTab, toggleTodo, addTodo, removeTodo, setPriority, update, uploadImage }: { data: AppData; now: number; weekSeconds: number; setTab: (t: Tab) => void; toggleTodo: (id: string) => void; addTodo: (s?: string, e?: boolean) => void; removeTodo: (id: string) => void; setPriority: (id: string, p: Priority) => void; update: (f: (d: AppData) => AppData) => void; uploadImage: (e: ChangeEvent<HTMLInputElement>, t: "visionImages" | "dashboardImages") => void }) {
  const date = new Intl.DateTimeFormat("en-AU", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  return <>
    <section className="hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(24,31,44,.82), rgba(24,31,44,.2)), url(${data.profile.heroImage})` }}><div><span className="eyebrow">{date}</span><h1>Hi {data.profile.name},<br /><em>make today count.</em></h1><p>{data.profile.quote}</p></div><div className="hero-stats"><span><b>{data.studySessions.filter(s => isToday(s.startedAt)).length}</b> sessions today</span><span><b>{formatDuration(weekSeconds)}</b> this week</span></div></section>
    <div className="dashboard-grid">
      <section className="card task-card"><CardHeading kicker="THE BIG PICTURE" title="Everything to do" action="＋ Add personal" onAction={() => addTodo()} /><div className="task-summary"><span><b>{countOpen(data)}</b> still open</span><div><i style={{ width: `${completion(data)}%` }} /></div><small>{completion(data)}% complete</small></div><TaskGroup title="Personal" color="#f6cf9e" todos={data.overallTodos} {...{ toggleTodo, removeTodo, setPriority }} />{data.subjects.map(s => <div key={s.id}><TaskGroup title={s.name} color={s.color} todos={s.todos} {...{ toggleTodo, removeTodo, setPriority }} /><button className="inline-add" onClick={() => addTodo(s.id)}>＋ Add {s.name} task</button>{s.exercises && <TaskGroup title="Required exercises / chapters" subtitle="Maths" color="#87b3f8" todos={s.exercises} nested {...{ toggleTodo, removeTodo, setPriority }} />}{s.exercises && <button className="inline-add nested-add" onClick={() => addTodo(s.id, true)}>＋ Add required exercise</button>}</div>)}</section>
      <aside className="dashboard-side"><section className="card today-card"><CardHeading kicker="FOCUS" title="This week" action="View goals →" onAction={() => setTab("goals")} />{data.goals.week.map(g => <label className="goal-line" key={g.id}><input type="checkbox" checked={g.done} onChange={() => update(d => ({ ...d, goals: { ...d.goals, week: d.goals.week.map(x => x.id === g.id ? { ...x, done: !x.done } : x) } }))} /><span>{g.text}</span></label>)}</section>
      <section className="card photo-card"><CardHeading kicker="PINBOARD" title="A little inspiration" />{data.dashboardImages[0] ? <div className="dashboard-photo"><img src={data.dashboardImages[0].url} alt={data.dashboardImages[0].caption} /><span>{data.dashboardImages[0].caption}</span></div> : <div className="empty-image">Add a mood image</div>}<div className="photo-actions"><label className="button secondary">Upload image<input hidden type="file" accept="image/*" onChange={e => uploadImage(e, "dashboardImages")} /></label><button className="text-button" onClick={() => addImageUrl(update, "dashboardImages")}>Paste URL</button></div></section>
      <section className="card quick-note"><CardHeading kicker="SCRATCHPAD" title="Quick note" /><textarea value={data.notes} onChange={e => update(d => ({ ...d, notes: e.target.value }))} aria-label="Quick notes" /><small>Saved automatically</small></section></aside>
    </div>
  </>;
}

function SubjectsView({ data, selected, setSelected, update, addTodo, toggleTodo, removeTodo, setPriority }: { data: AppData; selected: string; setSelected: (id: string) => void; update: (f: (d: AppData) => AppData) => void; addTodo: (s?: string, e?: boolean) => void; toggleTodo: (id: string) => void; removeTodo: (id: string) => void; setPriority: (id: string, p: Priority) => void }) {
  const subject = data.subjects.find(s => s.id === selected) || data.subjects[0];
  function change(field: "goodAt" | "improve", value: string) { update(d => ({ ...d, subjects: d.subjects.map(s => s.id === subject.id ? { ...s, [field]: value } : s) })); }
  return <><PageTitle eyebrow="ACADEMIC WORKSPACE" title="One place for every subject." copy="Choose a subject, see what matters, and keep your reflections close to the work." /><div className="subject-tabs">{data.subjects.map(s => <button key={s.id} className={selected === s.id ? "active" : ""} style={{ "--subject": s.color } as React.CSSProperties} onClick={() => setSelected(s.id)}><span style={{ background: s.color }}>{s.name.slice(0, 2)}</span>{s.name}</button>)}<button className="add-subject" onClick={() => addNewSubject(update)}>＋ New project</button></div><section className="subject-hero" style={{ "--subject": subject.color } as React.CSSProperties}><span>{subject.name.slice(0, 2)}</span><div><small>SUBJECT SPACE</small><h2>{subject.name}</h2><p>{subject.todos.filter(t => !t.done).length + (subject.exercises?.filter(t => !t.done).length || 0)} open items</p></div></section><div className="subject-grid"><section className="card"><CardHeading kicker="TO DO" title={`${subject.name} tasks`} action="＋ Add task" onAction={() => addTodo(subject.id)} /><TaskGroup title="Current work" color={subject.color} todos={subject.todos} hideHeading {...{ toggleTodo, removeTodo, setPriority }} />{subject.exercises && <><div className="exercise-header"><div><small>MATHS REQUIREMENT</small><h3>Required exercises / chapters</h3></div><button onClick={() => addTodo(subject.id, true)}>＋ Add</button></div><TaskGroup title="Exercises" color={subject.color} todos={subject.exercises} hideHeading {...{ toggleTodo, removeTodo, setPriority }} /></>}</section><section className="insight-stack"><label className="insight good"><span>✦</span><div><small>SUBJECT INSIGHT</small><strong>What I’m good at</strong></div><textarea value={subject.goodAt} onChange={e => change("goodAt", e.target.value)} /></label><label className="insight improve"><span>↗</span><div><small>NEXT STEP</small><strong>Where to improve</strong></div><textarea value={subject.improve} onChange={e => change("improve", e.target.value)} /></label></section></div></>;
}

function GoalsView({ data, update }: { data: AppData; update: (f: (d: AppData) => AppData) => void }) {
  return <><PageTitle eyebrow="TIME HORIZONS" title="Aim far. Move gently." copy="Turn the future into four clear distances, then focus on the next honest step." /><div className="goal-grid">{(Object.keys(horizons) as (keyof typeof horizons)[]).map((key, i) => <section className="goal-column card" key={key} style={{ "--subject": swatches[i] } as React.CSSProperties}><div className="goal-number">0{i + 1}</div><CardHeading kicker={key === "year" ? "HSC PREP" : "GOALS"} title={horizons[key]} />{data.goals[key].map(g => <div className={`goal-item ${g.done ? "done" : ""}`} key={g.id}><button onClick={() => update(d => ({ ...d, goals: { ...d.goals, [key]: d.goals[key].map(x => x.id === g.id ? { ...x, done: !x.done } : x) } }))}>{g.done ? "✓" : ""}</button><span>{g.text}</span><button className="delete" onClick={() => update(d => ({ ...d, goals: { ...d.goals, [key]: d.goals[key].filter(x => x.id !== g.id) } }))}>×</button></div>)}<button className="goal-add" onClick={() => addGoal(update, key)}>＋ Add a goal</button></section>)}</div></>;
}

function ResourcesView({ data, update, uploadImage }: { data: AppData; update: (f: (d: AppData) => AppData) => void; uploadImage: (e: ChangeEvent<HTMLInputElement>, t: "visionImages" | "dashboardImages") => void }) {
  return <><PageTitle eyebrow="RESOURCES & VISION" title="Keep the useful and beautiful close." copy="Links for quick access, a scratchpad for messy thoughts, and images that pull you forward." /><div className="resource-top"><section className="card"><CardHeading kicker="BOOKMARKS" title="Quick links" action="＋ Add link" onAction={() => addBookmark(update)} /><div className="bookmark-grid">{data.bookmarks.map((b, i) => <a href={normaliseUrl(b.url)} target="_blank" rel="noreferrer" key={b.id}><span style={{ background: swatches[i % swatches.length] }}>{b.title.slice(0, 1).toUpperCase()}</span><div><strong>{b.title}</strong><small>{b.url.replace(/^https?:\/\//, "")}</small></div><b>↗</b></a>)}</div></section><section className="card resource-notes"><CardHeading kicker="QUICK NOTES" title="Scratchpad" /><textarea value={data.notes} onChange={e => update(d => ({ ...d, notes: e.target.value }))} /><small>Autosaves as you type</small></section></div><section className="vision-section"><div className="vision-heading"><div><span className="eyebrow">VISION BOARD</span><h2>What I’m moving toward</h2></div><div><label className="button">Upload images<input hidden type="file" accept="image/*" onChange={e => uploadImage(e, "visionImages")} /></label><button className="button secondary" onClick={() => addImageUrl(update, "visionImages")}>Paste image URL</button></div></div><div className="vision-grid">{data.visionImages.map((img, i) => <figure className={`vision-${i % 5}`} key={img.id}><img src={img.url} alt={img.caption} /><figcaption>{img.caption}<button onClick={() => update(d => ({ ...d, visionImages: d.visionImages.filter(x => x.id !== img.id) }))}>×</button></figcaption></figure>)}</div></section></>;
}

function StudyView({ data, update, subject, setSubject, start, elapsed, startTimer, stopTimer, showToast }: { data: AppData; update: (f: (d: AppData) => AppData) => void; subject: string; setSubject: (s: string) => void; start: number | null; elapsed: number; startTimer: () => void; stopTimer: () => void; showToast: (message: string) => void }) {
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
        <div className={`timer-orbit ${start ? "running" : ""}`}><small>{start ? "FOCUSING ON" : "READY WHEN YOU ARE"}</small><strong>{formatClock(elapsed)}</strong><span>{subject}</span></div>
        <select value={subject} onChange={e => setSubject(e.target.value)} disabled={!!start} aria-label="Timer subject">{data.subjects.map(s => <option key={s.id}>{s.name}</option>)}</select>
        <button className={start ? "stop-button" : "start-button"} onClick={start ? stopTimer : startTimer}>{start ? "■  Stop & log session" : "▶  Start study session"}</button>
        <p>Sessions are saved when you press stop.</p>
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

function SettingsView({ data, update, notifications, toggleNotifications, pin, setPin, connect, status }: { data: AppData; update: (f: (d: AppData) => AppData) => void; notifications: boolean; toggleNotifications: () => void; pin: string; setPin: (s: string) => void; connect: () => void; status: string }) {
  function exportJson() { const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "anvis-dashboard-backup.json"; a.click(); URL.revokeObjectURL(a.href); }
  function importJson(e: ChangeEvent<HTMLInputElement>) { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { update(() => mergeData(JSON.parse(String(reader.result)))); } catch { alert("That file doesn’t look like an Anvi’s Dashboard backup."); } }; reader.readAsText(file); }
  return <><PageTitle eyebrow="SETTINGS" title="Make the desk yours." copy="Tune the visuals, connect your private cloud record, and keep a portable backup whenever you like." /><div className="settings-grid"><section className="card settings-card"><CardHeading kicker="AESTHETIC" title="Look & feel" /><label>Your name<input value={data.profile.name} onChange={e => update(d => ({ ...d, profile: { ...d.profile, name: e.target.value } }))} /></label><label>Dashboard hero image URL<input value={data.profile.heroImage} onChange={e => update(d => ({ ...d, profile: { ...d.profile, heroImage: e.target.value } }))} /></label><label>Daily line<input value={data.profile.quote} onChange={e => update(d => ({ ...d, profile: { ...d.profile, quote: e.target.value } }))} /></label><div className="preview-strip" style={{ backgroundImage: `url(${data.profile.heroImage})` }} /></section><section className="card settings-card"><CardHeading kicker="SUPABASE" title="Sync across every device" /><p>Your Supabase project is already connected. Use the same private passphrase on each device to open one shared dashboard record.</p><label>Private PIN or passphrase<input type="password" placeholder="Use something hard to guess" value={pin} onChange={e => setPin(e.target.value)} /></label><button className="button wide" onClick={connect}>{status === "syncing" ? "Connecting…" : status === "synced" ? "✓ Connected — refresh from cloud" : "Connect & sync"}</button><small className="privacy-note">Use a longer passphrase for better protection. This browser remembers only your passphrase on this device.</small></section><section className="card settings-card"><CardHeading kicker="NOTIFICATIONS" title="Gentle reminders" /><div className="setting-row"><div><strong>Browser notifications</strong><small>For high-priority tasks and reminder times</small></div><button className={`toggle ${notifications ? "on" : ""}`} onClick={toggleNotifications}><i /></button></div></section><section className="card settings-card"><CardHeading kicker="PORTABLE BACKUP" title="Export or import everything" /><p>Keep a human-readable JSON backup too. Importing replaces the current dashboard and then syncs it.</p><div className="backup-actions"><button className="button secondary" onClick={exportJson}>Export JSON</button><label className="button secondary">Import JSON<input hidden type="file" accept="application/json" onChange={importJson} /></label></div><details><summary>Edit raw data</summary><textarea value={JSON.stringify(data, null, 2)} onChange={e => { try { update(() => mergeData(JSON.parse(e.target.value))); } catch {} }} /></details></section></div></>;
}

function CardHeading({ kicker, title, action, onAction }: { kicker: string; title: string; action?: string; onAction?: () => void }) { return <div className="card-heading"><div><small>{kicker}</small><h2>{title}</h2></div>{action && <button onClick={onAction}>{action}</button>}</div>; }
function PageTitle({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) { return <header className="page-title"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{copy}</p></header>; }
function TaskGroup({ title, subtitle, color, todos, nested, hideHeading, toggleTodo, removeTodo, setPriority }: { title: string; subtitle?: string; color: string; todos: Todo[]; nested?: boolean; hideHeading?: boolean; toggleTodo: (id: string) => void; removeTodo: (id: string) => void; setPriority: (id: string, p: Priority) => void }) {
  return <div className={`task-group ${nested ? "nested" : ""}`}>{!hideHeading && <div className="task-group-title"><span style={{ background: color }}>{title.slice(0, 2)}</span><div><strong>{title}</strong>{subtitle && <small>{subtitle}</small>}</div><b>{todos.filter(t => !t.done).length}</b></div>}{todos.map(t => <div className={`todo-row ${t.done ? "done" : ""}`} key={t.id}><button className="check" onClick={() => toggleTodo(t.id)}>{t.done ? "✓" : ""}</button><span>{t.text}</span><select aria-label="Priority" value={t.priority} onChange={e => setPriority(t.id, e.target.value as Priority)} className={`priority ${t.priority}`}><option value="low">Low</option><option value="medium">Med</option><option value="high">High</option></select><button className="delete" onClick={() => removeTodo(t.id)}>×</button></div>)}{todos.length === 0 && <div className="empty-row">Nothing here — nice work.</div>}</div>;
}
function addCountdown(update: (f: (d: AppData) => AppData) => void) { const title = prompt("Countdown name"); if (!title) return; const date = prompt("Date and time (example: 2026-10-15 09:00)"); if (!date || Number.isNaN(new Date(date).getTime())) return; update(d => ({ ...d, countdowns: [...d.countdowns, { id: uid(), title, date: new Date(date).toISOString(), color: swatches[d.countdowns.length % swatches.length] }] })); }
function addGoal(update: (f: (d: AppData) => AppData) => void, key: keyof AppData["goals"]) { const text = prompt(`New goal for ${horizons[key]}`); if (text?.trim()) update(d => ({ ...d, goals: { ...d.goals, [key]: [...d.goals[key], { id: uid(), text: text.trim(), done: false }] } })); }
function addBookmark(update: (f: (d: AppData) => AppData) => void) { const title = prompt("Bookmark title"); if (!title) return; const url = prompt("Web address"); if (!url) return; update(d => ({ ...d, bookmarks: [...d.bookmarks, { id: uid(), title, url: normaliseUrl(url) }] })); }
function addImageUrl(update: (f: (d: AppData) => AppData) => void, target: "visionImages" | "dashboardImages") { const url = prompt("Paste an image URL"); if (!url) return; const caption = prompt("Short caption") || "Inspiration"; update(d => ({ ...d, [target]: [...d[target], { id: uid(), url, caption }] })); }
function addNewSubject(update: (f: (d: AppData) => AppData) => void) { const name = prompt("Project or subject name"); if (!name?.trim()) return; update(d => ({ ...d, subjects: [...d.subjects, { id: uid(), name: name.trim(), color: swatches[d.subjects.length % swatches.length], goodAt: "", improve: "", todos: [] }] })); }
function normaliseUrl(url: string) { return /^https?:\/\//i.test(url) ? url : `https://${url}`; }
function countOpen(d: AppData) { return [...d.overallTodos, ...d.subjects.flatMap(s => [...s.todos, ...(s.exercises || [])])].filter(t => !t.done).length; }
function completion(d: AppData) { const all = [...d.overallTodos, ...d.subjects.flatMap(s => [...s.todos, ...(s.exercises || [])])]; return all.length ? Math.round((all.filter(t => t.done).length / all.length) * 100) : 100; }
function formatClock(seconds: number) { const h = Math.floor(seconds / 3600); const m = Math.floor((seconds % 3600) / 60); const s = seconds % 60; return [h, m, s].map(n => String(n).padStart(2, "0")).join(":"); }
function formatDuration(seconds: number) { if (seconds < 60) return seconds ? `${seconds}s` : "0m"; const h = Math.floor(seconds / 3600); const m = Math.round((seconds % 3600) / 60); return h ? `${h}h ${m}m` : `${m}m`; }
function isToday(iso: string) { const d = new Date(iso), n = new Date(); return d.toDateString() === n.toDateString(); }
function withinDays(iso: string, days: number) { return new Date(iso).getTime() >= Date.now() - days * 86400000; }
function rangeTotal(sessions: StudySession[], fromDays: number, toDays: number) { const n = Date.now(); return sessions.filter(s => { const age = (n - new Date(s.startedAt).getTime()) / 86400000; return age >= fromDays && age < toDays; }).reduce((a, s) => a + s.durationSeconds, 0); }
function toDateInput(date: Date) { const offset = date.getTimezoneOffset() * 60000; return new Date(date.getTime() - offset).toISOString().slice(0, 10); }
function toTimeInput(date: Date) { return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`; }
function localDayKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function lastSevenDays() { return Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setHours(12, 0, 0, 0); date.setDate(date.getDate() - (6 - index)); return { key: localDayKey(date), label: date.toLocaleDateString("en-AU", { weekday: "short" }).slice(0, 2) }; }); }
async function hashText(text: string) { const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)); return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join(""); }
