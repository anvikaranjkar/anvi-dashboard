import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE CONFIG ────────────────────────────────────────────────────────
const SUPABASE_URL = "https://iiwjnqfbhzfzwzvccapc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable__-SfW9o5Xr5tZiEYeoOFUw_bCbOHTzb";
const PASSCODE = "hsc2026";

// ─── DEFAULT DATA ───────────────────────────────────────────────────────────
const DEFAULT_DATA = {
  mainTodos: [],
  countdowns: [], // { id, title, date, subject, color }
  goals: {
    thisWeek: [],
    thisTerm: [],
    sixMonths: [],
    thisYear: [],
  },
  subjects: {
    HMS: { todos: [], goodAt: "", improve: "", keyNotes: "", keyLinks: [], color: "#FF6EB4" },
    Economics: { todos: [], goodAt: "", improve: "", keyNotes: "", keyLinks: [], color: "#FFD166" },
    Software: { todos: [], goodAt: "", improve: "", keyNotes: "", keyLinks: [], color: "#06D6A0" },
    Enterprise: { todos: [], goodAt: "", improve: "", keyNotes: "", keyLinks: [], color: "#C77DFF" },
    Maths: { todos: [], goodAt: "", improve: "", keyNotes: "", keyLinks: [], exercises: [], notionLink: "", color: "#4CC9F0" },
    English: { todos: [], goodAt: "", improve: "", keyNotes: "", keyLinks: [], color: "#FF6B35" },
  },
  extracurriculars: {
    todos: [],
    linkedin: "",
    genderLens: { todos: [], notes: "", links: [] },
    otherProjects: [],
  },
  bookmarks: [],
  quickNotes: "",
  visionBoard: [],
  heroImage: "",
  studySessions: [],
  dashWidgets: [],
  habits: [], // { id, name, color, icon, logs: { "YYYY-MM-DD": true } }
  settings: { theme: "anvi", name: "Anvi" },
};

// ─── UTILITIES ──────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().slice(0, 10);
const weekStart = () => {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + 1);
  return d.toISOString().slice(0, 10);
};
const fmtTime = (sec) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;
};
const fmtDuration = (sec) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};
const fmtDateTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("en-AU", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
};
const daysUntil = (dateStr) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
};

// ─── LIVE COUNTDOWN HOOK ────────────────────────────────────────────────────
function useLiveCountdown(dateStr) {
  const [timeLeft, setTimeLeft] = useState(() => calcTimeLeft(dateStr));
  useEffect(() => {
    const tick = () => setTimeLeft(calcTimeLeft(dateStr));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [dateStr]);
  return timeLeft;
}
function calcTimeLeft(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  target.setHours(23, 59, 59, 0);
  const diff = target - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, past: true };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds, past: false };
}

// ─── PIXEL SPIDER-MAN SVG ───────────────────────────────────────────────────
const SpiderManPixel = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="80" height="80" style={{ imageRendering:"pixelated", display:"block" }} shapeRendering="crispEdges">
    {/* body */}
    <rect x="11" y="14" width="10" height="12" fill="#CC1111"/>
    {/* legs */}
    <rect x="8" y="26" width="4" height="6" fill="#0000BB"/>
    <rect x="20" y="26" width="4" height="6" fill="#0000BB"/>
    <rect x="6" y="28" width="4" height="2" fill="#0000BB"/>
    <rect x="22" y="28" width="4" height="2" fill="#0000BB"/>
    {/* arms */}
    <rect x="4" y="15" width="7" height="3" fill="#CC1111"/>
    <rect x="21" y="15" width="7" height="3" fill="#CC1111"/>
    <rect x="2" y="13" width="4" height="3" fill="#CC1111"/>
    <rect x="26" y="13" width="4" height="3" fill="#CC1111"/>
    {/* hands */}
    <rect x="1" y="11" width="3" height="3" fill="#CC1111"/>
    <rect x="28" y="11" width="3" height="3" fill="#CC1111"/>
    {/* head */}
    <rect x="10" y="6" width="12" height="10" fill="#CC1111"/>
    {/* eyes */}
    <rect x="11" y="8" width="4" height="3" fill="white"/>
    <rect x="17" y="8" width="4" height="3" fill="white"/>
    <rect x="12" y="8" width="3" height="3" fill="#EEEEEE"/>
    <rect x="18" y="8" width="3" height="3" fill="#EEEEEE"/>
    {/* web lines on body */}
    <rect x="11" y="14" width="1" height="12" fill="#AA0000" opacity="0.5"/>
    <rect x="15" y="14" width="1" height="12" fill="#AA0000" opacity="0.5"/>
    <rect x="19" y="14" width="1" height="12" fill="#AA0000" opacity="0.5"/>
    <rect x="11" y="18" width="10" height="1" fill="#AA0000" opacity="0.5"/>
    <rect x="11" y="22" width="10" height="1" fill="#AA0000" opacity="0.5"/>
    {/* web lines on head */}
    <rect x="15" y="6" width="1" height="10" fill="#AA0000" opacity="0.5"/>
    <rect x="10" y="10" width="12" height="1" fill="#AA0000" opacity="0.5"/>
    {/* blue shorts */}
    <rect x="11" y="22" width="10" height="4" fill="#0000BB"/>
    {/* belt */}
    <rect x="11" y="22" width="10" height="2" fill="#0000BB"/>
    <rect x="14" y="22" width="4" height="2" fill="#FFD700"/>
    {/* web shooter on wrist */}
    <rect x="2" y="13" width="2" height="1" fill="#FFD700"/>
    <rect x="28" y="13" width="2" height="1" fill="#FFD700"/>
  </svg>
);

// ─── STYLES ─────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Pixelify+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #FDF0F8;
    --bg2: #FFF5FB;
    --pink: #FF3FA4;
    --pink-hot: #FF006E;
    --pink-light: #FFD6ED;
    --pink-mid: #FFB3DA;
    --yellow: #FFE600;
    --yellow-light: #FFFACC;
    --yellow-bright: #FFD700;
    --mint: #00F5A0;
    --mint-light: #CCFFF0;
    --cyan: #00E5FF;
    --cyan-light: #CCFAFF;
    --purple: #BF5FFF;
    --purple-light: #F0D9FF;
    --blue: #4CC9F0;
    --blue-light: #D0F4FF;
    --orange: #FF6B35;
    --orange-light: #FFE5D9;
    --lime: #B5FF3A;
    --lime-light: #F0FFD9;
    --text: #1A0530;
    --text-soft: #5C3A7A;
    --muted: #A07ABF;
    --sand: #F0E0F5;
    --border: #E5C5F0;
    --border-pixel: #C890E0;
    --sidebar-w: 250px;
    --radius: 0px;
    --radius-sm: 0px;
    --radius-xs: 0px;
    --shadow: 4px 4px 0px #C890E0;
    --shadow-hot: 4px 4px 0px #FF3FA4;
    --shadow-yellow: 4px 4px 0px #FFD700;
    --shadow-cyan: 4px 4px 0px #00E5FF;
    --transition: 0.15s ease;
    --font-pixel: 'Pixelify Sans', monospace;
    --font-mono: 'Space Mono', monospace;
    --font-body: 'Inter', system-ui, sans-serif;
    --pixel-border: 2px solid var(--border-pixel);
  }

  body { font-family: var(--font-body); background: var(--bg); color: var(--text); }

  /* ── DARK MODE ── */
  body.dark-mode {
    --bg: #0D0020;
    --bg2: #150030;
    --text: #F0E0FF;
    --text-soft: #C9A8E8;
    --muted: #7B5FA0;
    --sand: #1E0040;
    --border: #3D1A6E;
    --border-pixel: #6B2DA8;
    --shadow: 4px 4px 0px #6B2DA8;
    --shadow-hot: 4px 4px 0px #FF3FA4;
    --pink-light: #4A0030;
    --pink-mid: #6B0045;
    --yellow-light: #2A2000;
    --mint-light: #001A10;
    --cyan-light: #001A20;
    --purple-light: #1E0040;
    --orange-light: #2A1000;
    --lime-light: #1A2000;
    --blue-light: #001A2A;
  }
  body.dark-mode .sidebar { background: #070015; border-right-color: var(--pink); }
  body.dark-mode input[type="text"], body.dark-mode input[type="url"], body.dark-mode input[type="datetime-local"],
  body.dark-mode input[type="date"], body.dark-mode input[type="password"], body.dark-mode textarea, body.dark-mode select {
    background: #150030; color: var(--text); border-color: var(--border-pixel);
  }
  body.dark-mode input:focus, body.dark-mode textarea:focus, body.dark-mode select:focus {
    background: #1E0040; border-color: var(--pink); box-shadow: 3px 3px 0px var(--pink-light);
  }
  body.dark-mode .hero { background: linear-gradient(135deg, #0D0020 0%, #150030 50%, #070015 100%); }
  body.dark-mode .lock-card { background: #070015; }
  body.dark-mode .toast { background: #070015; }

  .app { display: flex; min-height: 100vh; width: 100vw; overflow-x: hidden; }

  /* ── Y2K PIXEL GRID BACKGROUND ── */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,62,164,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,62,164,0.04) 1px, transparent 1px);
    background-size: 24px 24px;
    pointer-events: none;
    z-index: 0;
  }

  /* ── SIDEBAR ── */
  .sidebar {
    width: var(--sidebar-w);
    background: #1A0530;
    border-right: 3px solid var(--pink);
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0; left: 0; bottom: 0;
    z-index: 100;
    transition: transform var(--transition);
    overflow-y: auto;
    image-rendering: pixelated;
  }
  .sidebar::after {
    content: '';
    position: absolute;
    top: 0; right: -6px;
    width: 3px; height: 100%;
    background: var(--purple);
    opacity: 0.5;
  }
  .sidebar-logo {
    padding: 28px 20px 20px;
    border-bottom: 2px solid rgba(255,62,164,0.3);
    position: relative;
  }
  .logo-text {
    font-family: var(--font-pixel);
    font-size: 20px;
    color: var(--pink);
    line-height: 1.2;
    text-shadow: 2px 2px 0px #FF006E, 4px 4px 0px rgba(255,0,110,0.3);
    letter-spacing: 0.05em;
  }
  .logo-sub {
    font-family: var(--font-mono);
    font-size: 9px;
    color: var(--cyan);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-top: 6px;
    opacity: 0.9;
  }
  .logo-pill {
    display: inline-block;
    margin-top: 10px;
    background: var(--pink);
    color: white;
    font-family: var(--font-pixel);
    font-size: 10px;
    letter-spacing: 0.08em;
    padding: 3px 10px;
    border: 1.5px solid #FF69B4;
    box-shadow: 2px 2px 0px #AA0055;
  }
  .nav-section { padding: 16px 10px 8px; }
  .nav-label {
    font-family: var(--font-pixel);
    font-size: 9px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--cyan);
    padding: 0 10px;
    margin-bottom: 6px;
    margin-top: 12px;
    opacity: 0.8;
  }
  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    cursor: pointer;
    font-family: var(--font-pixel);
    font-size: 13px;
    color: rgba(255,255,255,0.55);
    transition: all var(--transition);
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    border-left: 3px solid transparent;
    letter-spacing: 0.03em;
  }
  .nav-item:hover {
    background: rgba(255,62,164,0.12);
    color: var(--pink);
    border-left-color: var(--pink);
  }
  .nav-item.active {
    background: linear-gradient(90deg, rgba(255,62,164,0.25), transparent);
    color: var(--pink);
    border-left: 3px solid var(--pink);
    text-shadow: 0 0 8px rgba(255,62,164,0.5);
  }
  .nav-item.active .nav-icon { filter: drop-shadow(0 0 4px var(--pink)); }
  .nav-icon { font-size: 16px; }
  .sidebar-footer {
    margin-top: auto;
    padding: 14px 10px 20px;
    border-top: 2px solid rgba(255,62,164,0.2);
  }

  /* ── MAIN ── */
  .main {
    margin-left: var(--sidebar-w);
    flex: 1;
    min-height: 100vh;
    width: calc(100vw - var(--sidebar-w));
    position: relative;
    z-index: 1;
  }

  /* ── HERO ── */
  .hero {
    position: relative;
    min-height: 180px;
    background: linear-gradient(135deg, #2D0050 0%, #1A0040 40%, #0D002B 100%);
    overflow: hidden;
    display: flex;
    align-items: flex-end;
    padding: 28px 44px;
    border-bottom: 3px solid var(--pink);
  }
  .hero::after {
    content: '';
    position: absolute;
    bottom: -3px; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--pink), var(--purple), var(--cyan), var(--yellow), var(--pink));
    background-size: 200% 100%;
    animation: shimmer 3s linear infinite;
  }
  @keyframes shimmer { 0% { background-position: 0% } 100% { background-position: 200% } }
  .hero-scanlines {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px);
    pointer-events: none;
  }
  .hero-stars {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }
  .hero-star {
    position: absolute;
    color: white;
    font-size: 12px;
    animation: twinkle 2s ease-in-out infinite;
    opacity: 0.6;
  }
  @keyframes twinkle { 0%,100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
  .hero-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(50px);
    opacity: 0.4;
  }
  .hero-bg {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    opacity: 0.2;
  }
  .hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(26,5,48,0.97) 0%, transparent 70%);
  }
  .hero-content { position: relative; z-index: 1; }
  .hero-greeting {
    font-family: var(--font-pixel);
    font-size: 34px;
    color: white;
    line-height: 1.1;
    text-shadow: 3px 3px 0px var(--pink-hot), 6px 6px 0px rgba(255,0,110,0.25);
    letter-spacing: 0.04em;
  }
  .hero-date {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--cyan);
    margin-top: 8px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .hero-badges { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
  .hero-badge {
    background: rgba(255,255,255,0.07);
    border: 1.5px solid rgba(255,255,255,0.2);
    padding: 4px 12px;
    font-family: var(--font-pixel);
    font-size: 11px;
    color: white;
    box-shadow: 2px 2px 0px rgba(0,0,0,0.4);
    backdrop-filter: blur(4px);
  }

  /* ── PAGE ── */
  .page { padding: 32px 44px; width: 100%; }
  .page-title {
    font-family: var(--font-pixel);
    font-size: 26px;
    margin-bottom: 24px;
    color: var(--text);
    letter-spacing: 0.05em;
    position: relative;
    display: inline-block;
  }
  .page-title::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 100%;
    height: 3px;
    background: var(--pink);
    box-shadow: 2px 2px 0px var(--pink-hot);
  }

  /* ── CARDS ── */
  .card {
    background: var(--bg2);
    border: 2px solid var(--border-pixel);
    padding: 20px 24px;
    box-shadow: var(--shadow);
    position: relative;
  }
  .card::before {
    content: '';
    position: absolute;
    top: -2px; left: 4px; right: -4px; bottom: -4px;
    background: rgba(200,144,224,0.15);
    z-index: -1;
  }
  .card-sm { padding: 14px 18px; }
  .card-title {
    font-family: var(--font-pixel);
    font-size: 14px;
    color: var(--text);
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    letter-spacing: 0.04em;
  }
  .card-title-dot {
    width: 10px; height: 10px;
    background: var(--pink);
    flex-shrink: 0;
    box-shadow: 1px 1px 0px var(--pink-hot);
  }

  /* ── SECTION HEADERS ── */
  .section-header {
    font-family: var(--font-pixel);
    font-size: 16px;
    margin-bottom: 16px;
    margin-top: 8px;
    color: var(--text);
    letter-spacing: 0.06em;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 14px;
  }
  .section-header-subjects {
    background: linear-gradient(90deg, #FFD6ED, #F0D9FF, transparent);
    border-left: 4px solid var(--pink);
    box-shadow: 3px 3px 0px var(--pink-mid);
  }
  .section-header-extras {
    background: linear-gradient(90deg, #D0F4FF, #CCFFF0, transparent);
    border-left: 4px solid var(--cyan);
    box-shadow: 3px 3px 0px var(--cyan);
  }

  /* ── COUNTDOWN WIDGETS ── */
  .countdown-widget {
    border: 2px solid var(--border-pixel);
    padding: 14px 16px;
    background: var(--bg2);
    box-shadow: var(--shadow);
    position: relative;
    overflow: hidden;
    transition: transform var(--transition), box-shadow var(--transition);
  }
  .countdown-widget:hover {
    transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0px var(--border-pixel);
  }
  .countdown-widget::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: var(--color, var(--pink));
  }
  .countdown-days {
    font-family: var(--font-pixel);
    font-size: 40px;
    line-height: 1;
    color: var(--color, var(--pink));
    text-shadow: 2px 2px 0px rgba(0,0,0,0.15);
  }
  .countdown-label {
    font-family: var(--font-mono);
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--muted);
    margin-top: 2px;
  }
  .countdown-title {
    font-family: var(--font-pixel);
    font-size: 12px;
    color: var(--text);
    margin-top: 6px;
    letter-spacing: 0.03em;
  }
  .countdown-subject {
    font-family: var(--font-pixel);
    font-size: 10px;
    margin-top: 4px;
    padding: 2px 8px;
    display: inline-block;
  }
  .countdown-urgent { animation: pulse-countdown 1.5s ease-in-out infinite; }
  @keyframes pulse-countdown { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }

  /* ── GRID ── */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
  .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
  .grid-auto { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 18px; }
  .countdown-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; }

  /* ── TODO ── */
  .todo-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 9px 0;
    border-bottom: 1px dashed var(--border);
    font-size: 13px;
  }
  .todo-item:last-child { border-bottom: none; }
  .todo-check {
    width: 18px; height: 18px;
    border: 2px solid var(--border-pixel);
    cursor: pointer;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition);
    background: none;
    margin-top: 2px;
  }
  .todo-check.done {
    background: var(--mint);
    border-color: var(--mint);
    color: #003322;
    font-size: 11px;
    font-weight: 700;
  }
  .todo-body { flex: 1; }
  .todo-text { line-height: 1.4; font-family: var(--font-body); }
  .todo-text.done { text-decoration: line-through; color: var(--muted); }
  .todo-due { font-size: 11px; color: var(--muted); margin-top: 2px; font-family: var(--font-mono); }
  .todo-due.overdue { color: #ef4444; }
  .todo-del {
    background: none;
    border: none;
    color: var(--muted);
    cursor: pointer;
    font-size: 18px;
    opacity: 0;
    transition: opacity var(--transition);
    padding: 0 4px;
    line-height: 1;
  }
  .todo-item:hover .todo-del { opacity: 1; }

  /* ── BADGE ── */
  .badge {
    font-family: var(--font-pixel);
    font-size: 9px;
    padding: 3px 8px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    flex-shrink: 0;
  }
  .badge-high { background: #fee2e2; color: #ef4444; border: 1px solid #ef4444; }
  .badge-med { background: var(--yellow-light); color: #D97706; border: 1px solid #FFD700; }
  .badge-low { background: var(--mint-light); color: #059669; border: 1px solid var(--mint); }

  /* ── INPUT ── */
  input[type="text"], input[type="url"], input[type="datetime-local"], input[type="date"], input[type="password"], textarea, select {
    width: 100%;
    border: 2px solid var(--border-pixel);
    padding: 9px 12px;
    font-family: var(--font-body);
    font-size: 13px;
    background: var(--bg);
    color: var(--text);
    outline: none;
    transition: border-color var(--transition), box-shadow var(--transition);
    border-radius: 0;
  }
  input:focus, textarea:focus, select:focus {
    border-color: var(--pink);
    box-shadow: 3px 3px 0px var(--pink-light);
    background: white;
  }
  textarea { resize: vertical; min-height: 80px; line-height: 1.6; }

  /* ── BUTTON ── */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 9px 18px;
    font-family: var(--font-pixel);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition);
    border: 2px solid transparent;
    letter-spacing: 0.05em;
    border-radius: 0;
  }
  .btn-primary {
    background: var(--pink);
    color: white;
    border-color: var(--pink-hot);
    box-shadow: 3px 3px 0px var(--pink-hot);
  }
  .btn-primary:hover { background: var(--pink-hot); transform: translate(-1px,-1px); box-shadow: 4px 4px 0px #AA0044; }
  .btn-primary:active { transform: translate(2px,2px); box-shadow: 1px 1px 0px var(--pink-hot); }
  .btn-ghost {
    background: transparent;
    border: 2px solid var(--border-pixel);
    color: var(--text-soft);
    box-shadow: 2px 2px 0px var(--border-pixel);
  }
  .btn-ghost:hover { background: var(--pink-light); border-color: var(--pink); color: var(--pink); transform: translate(-1px,-1px); box-shadow: 3px 3px 0px var(--pink-mid); }
  .btn-yellow {
    background: var(--yellow);
    color: #1A0530;
    border-color: var(--yellow-bright);
    box-shadow: 3px 3px 0px var(--yellow-bright);
  }
  .btn-cyan {
    background: var(--cyan);
    color: #001A20;
    border-color: #00AACC;
    box-shadow: 3px 3px 0px #00AACC;
  }
  .btn-sm { padding: 6px 12px; font-size: 11px; }
  .btn-xs { padding: 4px 8px; font-size: 10px; }
  .btn-icon { padding: 7px; }

  /* ── TABS ── */
  .tabs { display: flex; gap: 0; margin-bottom: 22px; flex-wrap: wrap; border-bottom: 2px solid var(--border-pixel); }
  .tab {
    padding: 8px 16px;
    border: 2px solid transparent;
    border-bottom: none;
    font-family: var(--font-pixel);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    background: var(--bg);
    color: var(--text-soft);
    transition: all var(--transition);
    letter-spacing: 0.06em;
    margin-bottom: -2px;
    position: relative;
  }
  .tab.active {
    background: var(--pink);
    color: white;
    border-color: var(--pink-hot);
    border-bottom: 2px solid var(--pink);
    box-shadow: 2px 0px 0px var(--pink-hot), -1px 0px 0px var(--pink-hot);
    z-index: 1;
  }
  .tab:hover:not(.active) { background: var(--pink-light); color: var(--pink); border-color: var(--pink-mid); border-bottom: 2px solid var(--pink-mid); }

  /* ── DASHBOARD TABS ── */
  .dash-tabs { display: flex; gap: 8px; margin-bottom: 22px; flex-wrap: wrap; }
  .dash-tab {
    padding: 8px 18px;
    border: 2px solid var(--border-pixel);
    font-family: var(--font-pixel);
    font-size: 11px;
    cursor: pointer;
    background: var(--bg2);
    color: var(--text-soft);
    transition: all var(--transition);
    box-shadow: 2px 2px 0px var(--border-pixel);
    letter-spacing: 0.05em;
  }
  .dash-tab.active-pink {
    background: var(--pink);
    color: white;
    border-color: var(--pink-hot);
    box-shadow: 3px 3px 0px var(--pink-hot);
    transform: translate(-1px,-1px);
  }
  .dash-tab.active-cyan {
    background: var(--cyan);
    color: #001A20;
    border-color: #00AACC;
    box-shadow: 3px 3px 0px #00AACC;
    transform: translate(-1px,-1px);
  }
  .dash-tab.active-yellow {
    background: var(--yellow);
    color: #1A0530;
    border-color: var(--yellow-bright);
    box-shadow: 3px 3px 0px var(--yellow-bright);
    transform: translate(-1px,-1px);
  }
  .dash-tab:hover:not(.active-pink):not(.active-cyan):not(.active-yellow) {
    background: var(--pink-light);
    border-color: var(--pink);
    color: var(--pink);
    transform: translate(-1px,-1px);
    box-shadow: 3px 3px 0px var(--pink-mid);
  }

  /* ── SUBJECT CARD ── */
  .subject-card {
    background: var(--bg2);
    border: 2px solid var(--border-pixel);
    box-shadow: var(--shadow);
  }
  .subject-header {
    padding: 16px 24px;
    border-bottom: 2px solid var(--border-pixel);
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .subject-dot { width: 14px; height: 14px; flex-shrink: 0; }
  .subject-name {
    font-family: var(--font-pixel);
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.05em;
  }
  .subject-body { padding: 20px 24px; }
  .insight-area {
    background: var(--bg);
    border: 2px solid var(--border);
    padding: 12px 14px;
    margin-bottom: 10px;
  }
  .insight-label {
    font-family: var(--font-pixel);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--muted);
    margin-bottom: 6px;
  }
  .insight-area textarea {
    background: transparent;
    border: none;
    padding: 0;
    font-size: 13px;
    min-height: 60px;
    box-shadow: none;
  }
  .insight-area textarea:focus { border: none; background: transparent; box-shadow: none; }
  .insight-area input { background: transparent; border: none; padding: 0; box-shadow: none; }
  .insight-area input:focus { border: none; background: transparent; box-shadow: none; }

  /* ── SUBJECT TABS (internal) ── */
  .subject-inner-tabs {
    display: flex;
    gap: 0;
    margin-bottom: 18px;
    border-bottom: 2px solid var(--border-pixel);
  }
  .subject-inner-tab {
    padding: 8px 16px;
    border: none;
    background: none;
    font-family: var(--font-pixel);
    font-size: 11px;
    cursor: pointer;
    color: var(--muted);
    position: relative;
    transition: color var(--transition);
    letter-spacing: 0.05em;
  }
  .subject-inner-tab.active { color: var(--pink); }
  .subject-inner-tab.active::after {
    content: '';
    position: absolute;
    bottom: -2px; left: 0; right: 0;
    height: 2px;
    background: var(--pink);
  }

  /* ── GOALS ── */
  .goal-horizon {
    background: var(--bg2);
    border: 2px solid var(--border-pixel);
    padding: 20px 24px;
    box-shadow: var(--shadow);
  }
  .horizon-label {
    font-family: var(--font-pixel);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--muted);
    margin-bottom: 14px;
  }

  /* ── STAT CARDS ── */
  .stat-card {
    background: var(--bg2);
    border: 2px solid var(--border-pixel);
    padding: 18px 20px;
    box-shadow: var(--shadow);
    position: relative;
    overflow: hidden;
    transition: transform var(--transition), box-shadow var(--transition);
  }
  .stat-card:hover {
    transform: translate(-2px,-2px);
    box-shadow: 6px 6px 0px var(--border-pixel);
  }
  .stat-num {
    font-family: var(--font-pixel);
    font-size: 30px;
    color: var(--text);
    letter-spacing: 0.04em;
    line-height: 1;
  }
  .stat-label {
    font-family: var(--font-mono);
    font-size: 9px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-top: 4px;
  }

  /* ── BAR CHART ── */
  .bar-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; font-size: 12px; }
  .bar-label { width: 90px; color: var(--text-soft); font-family: var(--font-pixel); font-size: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .bar-track { flex: 1; height: 10px; background: var(--sand); border: 1px solid var(--border-pixel); }
  .bar-fill { height: 100%; transition: width 0.6s cubic-bezier(0.4,0,0.2,1); }
  .bar-val { width: 40px; text-align: right; color: var(--muted); font-family: var(--font-mono); font-size: 10px; }

  /* ── TIMER ── */
  .timer-display {
    font-family: var(--font-pixel);
    font-size: 64px;
    color: var(--text);
    line-height: 1;
    letter-spacing: 4px;
    text-shadow: 3px 3px 0px var(--pink-light);
  }

  /* ── SESSION LOG ── */
  .session-log-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 9px 0;
    border-bottom: 1px dashed var(--border);
    font-size: 12px;
  }
  .session-log-item:last-child { border-bottom: none; }

  /* ── VISION BOARD ── */
  .vision-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
  .vision-img { aspect-ratio: 1; object-fit: cover; width: 100%; background: var(--sand); border: 2px solid var(--border-pixel); }
  .vision-add {
    aspect-ratio: 1;
    border: 2px dashed var(--pink-mid);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--pink);
    font-family: var(--font-pixel);
    font-size: 11px;
    gap: 6px;
    transition: all var(--transition);
    background: var(--pink-light);
  }
  .vision-add:hover { border-color: var(--pink); background: var(--pink-mid); }

  /* ── BOOKMARK ── */
  .bookmark-card {
    background: var(--bg);
    border: 2px solid var(--border-pixel);
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    box-shadow: 2px 2px 0px var(--border-pixel);
    transition: all var(--transition);
  }
  .bookmark-card:hover { transform: translate(-2px,-2px); box-shadow: 4px 4px 0px var(--border-pixel); }
  .bookmark-title { font-family: var(--font-pixel); font-size: 12px; }
  .bookmark-url { font-size: 11px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  /* ── TOAST ── */
  .toast-container { position: fixed; bottom: 24px; right: 24px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; }
  .toast {
    background: #1A0530;
    color: white;
    border: 2px solid var(--pink);
    padding: 11px 20px;
    font-family: var(--font-pixel);
    font-size: 12px;
    box-shadow: 4px 4px 0px var(--pink-hot);
    animation: slideIn 0.3s ease;
    max-width: 340px;
    letter-spacing: 0.03em;
  }
  @keyframes slideIn { from { transform: translateX(60px); opacity: 0; } to { transform: none; opacity: 1; } }

  /* ── LOCK SCREEN ── */
  .lockscreen {
    min-height: 100vh;
    width: 100vw;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0D0020;
    flex-direction: column;
    gap: 24px;
    position: relative;
    overflow: hidden;
  }
  .lockscreen::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,62,164,0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,62,164,0.08) 1px, transparent 1px);
    background-size: 30px 30px;
  }
  .lock-card {
    background: #1A0530;
    border: 3px solid var(--pink);
    padding: 48px;
    width: 380px;
    text-align: center;
    box-shadow: 8px 8px 0px var(--pink-hot), 16px 16px 0px rgba(255,0,110,0.2);
    position: relative;
    z-index: 1;
  }
  .lock-title {
    font-family: var(--font-pixel);
    font-size: 28px;
    margin-bottom: 8px;
    color: white;
    text-shadow: 3px 3px 0px var(--pink-hot);
    letter-spacing: 0.06em;
  }
  .lock-sub { color: var(--cyan); font-family: var(--font-mono); font-size: 11px; margin-bottom: 24px; letter-spacing: 0.1em; text-transform: uppercase; }
  .passcode-dots { display: flex; gap: 14px; justify-content: center; margin: 20px 0; }
  .passcode-dot { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); transition: all var(--transition); }
  .passcode-dot.filled { background: var(--pink); border-color: var(--pink); box-shadow: 2px 2px 0px var(--pink-hot); }

  /* ── ADD ROW ── */
  .add-row { display: flex; gap: 8px; margin-top: 10px; align-items: flex-start; }
  .add-row input, .add-row select { flex: 1; }

  /* ── DROPDOWN ── */
  .dropdown-section { border: 2px solid var(--border-pixel); margin-bottom: 10px; box-shadow: 2px 2px 0px var(--border-pixel); }
  .dropdown-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    cursor: pointer;
    background: var(--bg);
    font-family: var(--font-pixel);
    font-size: 12px;
    user-select: none;
    transition: background var(--transition);
    letter-spacing: 0.04em;
  }
  .dropdown-header:hover { background: var(--pink-light); }
  .dropdown-body { background: var(--bg2); border-top: 2px solid var(--border-pixel); padding: 14px; }

  /* ── COLOUR CHIPS ── */
  .subject-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    font-family: var(--font-pixel);
    font-size: 12px;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all var(--transition);
    letter-spacing: 0.04em;
    box-shadow: 2px 2px 0px rgba(0,0,0,0.1);
  }
  .subject-chip:hover { transform: translate(-1px,-1px); }

  /* ── LINK TAGS ── */
  .link-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    background: var(--purple-light);
    color: var(--purple);
    border: 2px solid var(--purple);
    font-family: var(--font-pixel);
    font-size: 10px;
    text-decoration: none;
    transition: all var(--transition);
    box-shadow: 2px 2px 0px var(--purple);
  }
  .link-tag:hover { background: var(--purple); color: white; transform: translate(-1px,-1px); box-shadow: 3px 3px 0px #8800CC; }

  /* ── MISC ── */
  .flex { display: flex; }
  .flex-col { flex-direction: column; }
  .flex-wrap { flex-wrap: wrap; }
  .gap-1 { gap: 8px; }
  .gap-2 { gap: 16px; }
  .gap-3 { gap: 24px; }
  .items-center { align-items: center; }
  .justify-between { justify-content: space-between; }
  .justify-end { justify-content: flex-end; }
  .mb-1 { margin-bottom: 8px; }
  .mb-2 { margin-bottom: 16px; }
  .mb-3 { margin-bottom: 24px; }
  .mt-1 { margin-top: 8px; }
  .mt-2 { margin-top: 16px; }
  .text-sm { font-size: 12px; }
  .text-xs { font-size: 10px; }
  .text-muted { color: var(--muted); }
  .text-pink { color: var(--pink); }
  .font-pixel { font-family: var(--font-pixel); }
  .font-mono { font-family: var(--font-mono); }
  .w-full { width: 100%; }
  .divider { height: 2px; background: var(--border); margin: 18px 0; }
  .section-gap { margin-bottom: 28px; }

  /* ── PIXEL DECORATIONS ── */
  .pixel-star { display: inline-block; font-size: 14px; animation: spin-slow 4s linear infinite; }
  @keyframes spin-slow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  .blink { animation: blink 1.2s step-end infinite; }
  @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }

  /* ── SPIDERMAN STICKER ── */
  .spidey-sticker {
    position: fixed;
    bottom: 18px;
    left: calc(var(--sidebar-w) + 12px);
    z-index: 200;
    cursor: pointer;
    filter: drop-shadow(0 0 8px rgba(204,17,17,0.7));
    animation: spidey-float 3s ease-in-out infinite;
    transition: transform 0.2s ease;
  }
  .spidey-sticker:hover { transform: scale(1.18) rotate(-5deg); }
  @keyframes spidey-float {
    0%,100% { transform: translateY(0px); }
    50% { transform: translateY(-6px); }
  }
  .spidey-web {
    position: fixed;
    bottom: 98px;
    left: calc(var(--sidebar-w) + 50px);
    width: 2px;
    height: 80px;
    background: linear-gradient(to bottom, rgba(200,200,200,0.6), rgba(200,200,200,0.1));
    z-index: 199;
    animation: spidey-float 3s ease-in-out infinite;
  }

  /* ── LIVE COUNTDOWN ── */
  .live-cd-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 10px; }
  .live-cd-unit {
    background: rgba(0,0,0,0.08);
    border: 1px solid currentColor;
    padding: 6px 4px 4px;
    text-align: center;
    opacity: 0.9;
  }
  .live-cd-num { font-family: var(--font-pixel); font-size: 20px; line-height: 1; display: block; }
  .live-cd-label { font-family: var(--font-mono); font-size: 7px; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 3px; display: block; opacity: 0.7; }
  .countdown-widget-expanded { grid-column: span 2; }

  @media (max-width: 900px) {
    .sidebar { transform: translateX(-100%); }
    .sidebar.open { transform: none; }
    .main { margin-left: 0; width: 100vw; }
    .page { padding: 18px; }
    .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
    .hero { padding: 20px; }
    .spidey-sticker, .spidey-web { left: 12px; bottom: 12px; }
    .dash-two-col { grid-template-columns: 1fr !important; }
  }

  /* ── STUDY CAL HEATMAP ── */
  .heatmap-cell:hover { transform: scale(1.3); z-index: 2; }

  /* ── HABIT TRACKER ── */
  .habit-check-btn:hover { transform: scale(1.03); }

  /* ── WIDGETS ── */
  .btn-yellow { background: var(--yellow); color: #3A2A00; border: 2px solid var(--yellow-bright); box-shadow: 2px 2px 0px var(--yellow-bright); font-family: var(--font-pixel); font-size: 12px; cursor: pointer; padding: 8px 14px; }
  .btn-yellow:hover { background: var(--yellow-bright); }
  .btn-cyan { background: var(--cyan); color: #003344; border: 2px solid #00AACC; box-shadow: 2px 2px 0px #00AACC; font-family: var(--font-pixel); font-size: 12px; cursor: pointer; padding: 10px 16px; width: 100%; letter-spacing: 0.05em; }
  .btn-cyan:hover { background: #00AACC; }
`;

// ─── SUPABASE CLIENT ─────────────────────────────────────────────────────────
let supabase = null;
try {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (e) {}

// ─── SCHEDULE NOTIFICATION ──────────────────────────────────────────────────
const scheduleNotification = (todo) => {
  if (!todo.dueDate || !("Notification" in window) || Notification.permission !== "granted") return;
  const due = new Date(todo.dueDate).getTime();
  const now = Date.now();
  if (due <= now) return;
  const delay = due - now;
  setTimeout(() => {
    new Notification("Anvi's Dashboard ✨", {
      body: `⏰ Due now: ${todo.text}`,
    });
  }, delay);
};

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState(false);
  const [data, setData] = useState(DEFAULT_DATA);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [toasts, setToasts] = useState([]);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [subjectView, setSubjectView] = useState("HMS");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    setDarkMode(localStorage.getItem("anvi_dark") === "1");
  }, []);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSec, setTimerSec] = useState(0);
  const [timerSubject, setTimerSubject] = useState("HMS");
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  const supabaseReady = SUPABASE_URL !== "https://YOUR_PROJECT.supabase.co";

  useEffect(() => {
    if (supabaseReady && unlocked) loadFromSupabase();
  }, [unlocked]);

  const loadFromSupabase = async () => {
    try {
      const { data: row } = await supabase.from("hsc_dashboard").select("*").eq("id", 1).single();
      if (row?.payload) setData({ ...DEFAULT_DATA, ...row.payload });
    } catch (e) {}
  };

  const saveData = useCallback(async (newData) => {
    setData(newData);
    if (!supabaseReady) return;
    setSaving(true);
    try {
      await supabase.from("hsc_dashboard").upsert({ id: 1, payload: newData });
    } catch (e) {}
    setSaving(false);
  }, [supabaseReady]);

  const update = (path, value) => {
    const parts = path.split(".");
    const newData = JSON.parse(JSON.stringify(data));
    let ref = newData;
    for (let i = 0; i < parts.length - 1; i++) ref = ref[parts[i]];
    ref[parts[parts.length - 1]] = value;
    saveData(newData);
  };

  const tryUnlock = () => {
    if (passcodeInput === PASSCODE) {
      setUnlocked(true);
    } else {
      setPasscodeError(true);
      setPasscodeInput("");
      setTimeout(() => setPasscodeError(false), 1000);
    }
  };

  const toast = (msg) => {
    const id = uid();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };

  const startTimer = () => {
    setTimerRunning(true);
    startTimeRef.current = Date.now() - timerSec * 1000;
    timerRef.current = setInterval(() => {
      setTimerSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(timerRef.current);
    setTimerRunning(false);
    if (timerSec < 30) { setTimerSec(0); return; }
    const session = { id: uid(), subject: timerSubject, duration: timerSec, date: today(), ts: new Date().toISOString() };
    const newData = JSON.parse(JSON.stringify(data));
    newData.studySessions = [...(newData.studySessions || []), session];
    saveData(newData);
    toast(`✓ Logged ${fmtTime(timerSec)} for ${timerSubject}`);
    setTimerSec(0);
  };

  const addMainTodo = (text, priority = "med", dueDate = "", isToday = false) => {
    if (!text.trim()) return;
    const newData = JSON.parse(JSON.stringify(data));
    const todo = { id: uid(), text, done: false, priority, dueDate, section: "general", isToday };
    newData.mainTodos = [...(newData.mainTodos || []), todo];
    saveData(newData);
    if (dueDate) scheduleNotification(todo);
    if (priority === "high") toast(`🔴 High priority added`);
    else if (isToday) toast(`📌 Added to today's focus!`);
  };
  const toggleTodayFlag = (id) => {
    const newData = JSON.parse(JSON.stringify(data));
    const t = newData.mainTodos.find((x) => x.id === id);
    if (t) t.isToday = !t.isToday;
    saveData(newData);
  };
  const logStudyManual = (subject, label, hours, minutes) => {
    const totalSec = (parseInt(hours)||0)*3600 + (parseInt(minutes)||0)*60;
    if (totalSec < 60) { toast("⚠ Enter at least 1 minute"); return; }
    const session = {
      id: uid(),
      subject,
      label: label.trim() || subject,
      duration: totalSec,
      date: today(),
      ts: new Date().toISOString(),
      manual: true
    };
    const newData = JSON.parse(JSON.stringify(data));
    newData.studySessions = [...(newData.studySessions || []), session];
    saveData(newData);
    toast(`✓ Logged ${hours||0}h ${minutes||0}m for "${session.label}"`);
  };
  const toggleMainTodo = (id) => {
    const newData = JSON.parse(JSON.stringify(data));
    const t = newData.mainTodos.find((x) => x.id === id);
    if (t) t.done = !t.done;
    saveData(newData);
  };
  const deleteMainTodo = (id) => {
    const newData = JSON.parse(JSON.stringify(data));
    newData.mainTodos = newData.mainTodos.filter((x) => x.id !== id);
    saveData(newData);
  };

  const addTodo = (subject, text, priority = "med", dueDate = "", field = "todos") => {
    if (!text.trim()) return;
    const newData = JSON.parse(JSON.stringify(data));
    const todo = { id: uid(), text, done: false, priority, dueDate };
    newData.subjects[subject][field] = [...(newData.subjects[subject][field] || []), todo];
    saveData(newData);
    if (dueDate) scheduleNotification({ ...todo, text: `[${subject}] ${text}` });
  };
  const toggleTodo = (subject, id, field = "todos") => {
    const newData = JSON.parse(JSON.stringify(data));
    const t = newData.subjects[subject][field].find((x) => x.id === id);
    if (t) t.done = !t.done;
    saveData(newData);
  };
  const deleteTodo = (subject, id, field = "todos") => {
    const newData = JSON.parse(JSON.stringify(data));
    newData.subjects[subject][field] = newData.subjects[subject][field].filter((x) => x.id !== id);
    saveData(newData);
  };

  // ── Countdowns ─────────────────────────────────────────────────────────────
  const addCountdown = (title, date, subject, color) => {
    if (!title.trim() || !date) return;
    const newData = JSON.parse(JSON.stringify(data));
    newData.countdowns = [...(newData.countdowns || []), { id: uid(), title, date, subject, color }];
    saveData(newData);
    toast(`⏳ Countdown added!`);
  };
  const deleteCountdown = (id) => {
    const newData = JSON.parse(JSON.stringify(data));
    newData.countdowns = newData.countdowns.filter((c) => c.id !== id);
    saveData(newData);
  };

  const addGoal = (horizon, text) => {
    if (!text.trim()) return;
    const newData = JSON.parse(JSON.stringify(data));
    newData.goals[horizon].push({ id: uid(), text, done: false });
    saveData(newData);
  };
  const toggleGoal = (horizon, id) => {
    const newData = JSON.parse(JSON.stringify(data));
    const g = newData.goals[horizon].find((x) => x.id === id);
    if (g) g.done = !g.done;
    saveData(newData);
  };
  const deleteGoal = (horizon, id) => {
    const newData = JSON.parse(JSON.stringify(data));
    newData.goals[horizon] = newData.goals[horizon].filter((x) => x.id !== id);
    saveData(newData);
  };

  const toggleDark = () => {
    setDarkMode(d => {
      const next = !d;
      localStorage.setItem("anvi_dark", next ? "1" : "0");
      return next;
    });
  };

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
  }, [darkMode]);

  const toggleNotif = async () => {
    if (!notifEnabled) {
      if ("Notification" in window) {
        const perm = await Notification.requestPermission();
        if (perm === "granted") { setNotifEnabled(true); toast("🔔 Notifications enabled!"); }
      }
    } else {
      setNotifEnabled(false);
    }
  };

  // ── Study stats ─────────────────────────────────────────────────────────────
  const todaySessions = (data.studySessions || []).filter((s) => s.date === today());
  const todayTotal = todaySessions.reduce((a, s) => a + s.duration, 0);
  const thisWeekStart = weekStart();
  const thisWeekSessions = (data.studySessions || []).filter((s) => s.date >= thisWeekStart);
  const thisWeekTotal = thisWeekSessions.reduce((a, s) => a + s.duration, 0);
  const subjectTotals = Object.keys(data.subjects).reduce((acc, sub) => {
    const total = thisWeekSessions.filter((s) => s.subject === sub).reduce((a, s) => a + s.duration, 0);
    if (total > 0) acc[sub] = total;
    return acc;
  }, {});
  const maxSubjectTotal = Math.max(1, ...Object.values(subjectTotals));

  // ── Lock screen ─────────────────────────────────────────────────────────────
  if (!unlocked) {
    return (
      <>
        <style>{styles}</style>
        <div className="lockscreen">
          {/* Floating pixel stars */}
          {["✦","★","✧","✦","★","✧","✦"].map((s, i) => (
            <div key={i} style={{ position:"absolute", color: i%2===0?"var(--pink)":"var(--cyan)", fontSize:i%3===0?20:14, top:`${10+i*12}%`, left:`${5+i*14}%`, animation:`twinkle ${2+i*0.3}s ease-in-out infinite`, animationDelay:`${i*0.4}s`, opacity:0.7 }}>{s}</div>
          ))}
          <div className="lock-card">
            <div style={{ fontSize: 36, marginBottom: 8 }}>✦</div>
            <div className="lock-title">ANVI'S SPACE</div>
            <div className="lock-sub">// enter passcode to continue //</div>
            <div className="passcode-dots">
              {Array.from({ length: PASSCODE.length }).map((_, i) => (
                <div key={i} className={`passcode-dot ${i < passcodeInput.length ? "filled" : ""}`} />
              ))}
            </div>
            <input
              type="password"
              placeholder="passcode"
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
              style={{ textAlign: "center", letterSpacing: "4px", marginBottom: "12px", border: passcodeError ? "2px solid #ef4444" : undefined, background:"rgba(255,255,255,0.06)", color:"white" }}
            />
            {passcodeError && <div style={{ color: "#ef4444", fontSize: 11, marginBottom: 8, fontFamily:"var(--font-pixel)" }}>ERROR: INCORRECT PASSCODE ✗</div>}
            <button className="btn btn-primary w-full" onClick={tryUnlock}>UNLOCK →</button>
          </div>
        </div>
      </>
    );
  }

  const allSubjectTodos = Object.entries(data.subjects).flatMap(([sub, s]) => {
    const todos = (s.todos || []).filter((t) => !t.done).map((t) => ({ ...t, subject: sub }));
    const exercises = sub === "Maths" ? (s.exercises || []).filter((t) => !t.done).map((t) => ({ ...t, subject: "Maths", priority: t.priority || "med", _isExercise: true })) : [];
    return [...todos, ...exercises];
  });
  const urgentCount = allSubjectTodos.filter((t) => t.priority === "high").length;
  const mainPendingCount = (data.mainTodos || []).filter((t) => !t.done).length;
  const upcomingCountdowns = (data.countdowns || []).filter(c => daysUntil(c.date) >= 0).sort((a,b) => daysUntil(a.date) - daysUntil(b.date)).slice(0, 3);

  const dateStr = new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" });

  const navItems = [
    { id: "dashboard", icon: "✦", label: "Dashboard" },
    { id: "todos", icon: "◈", label: "All To-Dos" },
    { id: "goals", icon: "★", label: "Goals & Life" },
    { id: "subjects", icon: "◉", label: "Subjects" },
    { id: "extracurriculars", icon: "◆", label: "Work & Extras" },
    { id: "countdowns", icon: "⏳", label: "Countdowns" },
    { id: "timer", icon: "◷", label: "Study Timer" },
    { id: "study-cal", icon: "📅", label: "Study Calendar" },
    { id: "habits", icon: "🔥", label: "Habit Tracker" },
    { id: "widgets", icon: "🖼", label: "My Widgets" },
    { id: "resources", icon: "⊞", label: "Resources" },
    { id: "settings", icon: "⚙", label: "Settings" },
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        {/* SIDEBAR */}
        <div className={`sidebar ${mobileNavOpen ? "open" : ""}`}>
          <div className="sidebar-logo">
            <div className="logo-text">ANVI'S SPACE ✦</div>
            <div className="logo-sub">// HSC Dashboard 2026</div>
            <div className="logo-pill">✦ LIFE OS</div>
          </div>
          <div className="nav-section">
            <div className="nav-label">// MAIN</div>
            {navItems.slice(0,3).map((n) => (
              <button key={n.id} className={`nav-item ${tab === n.id ? "active" : ""}`} onClick={() => { setTab(n.id); setMobileNavOpen(false); }}>
                <span className="nav-icon" style={{fontFamily:"var(--font-pixel)"}}>{n.icon}</span>
                {n.label}
              </button>
            ))}
            <div className="nav-label">// ACADEMICS</div>
            {navItems.slice(3,5).map((n) => (
              <button key={n.id} className={`nav-item ${tab === n.id ? "active" : ""}`} onClick={() => { setTab(n.id); setMobileNavOpen(false); }}>
                <span className="nav-icon" style={{fontFamily:"var(--font-pixel)"}}>{n.icon}</span>
                {n.label}
              </button>
            ))}
            <div className="nav-label">// TOOLS</div>
            {navItems.slice(5,10).map((n) => (
              <button key={n.id} className={`nav-item ${tab === n.id ? "active" : ""}`} onClick={() => { setTab(n.id); setMobileNavOpen(false); }}>
                <span className="nav-icon" style={{fontFamily:"var(--font-pixel)"}}>{n.icon}</span>
                {n.label}
              </button>
            ))}
            <div className="nav-label">// SETTINGS</div>
            {navItems.slice(10).map((n) => (
              <button key={n.id} className={`nav-item ${tab === n.id ? "active" : ""}`} onClick={() => { setTab(n.id); setMobileNavOpen(false); }}>
                <span className="nav-icon" style={{fontFamily:"var(--font-pixel)"}}>{n.icon}</span>
                {n.label}
              </button>
            ))}
          </div>
          <div className="sidebar-footer">
            <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"rgba(255,255,255,0.35)", paddingLeft:4, marginBottom:8, letterSpacing:"0.1em", textTransform:"uppercase" }}>
              {saving ? "saving..." : supabaseReady ? "✓ synced" : "local only"}
            </div>
            <button className="btn btn-ghost btn-sm w-full" style={{ color:"rgba(255,255,255,0.6)", borderColor:"rgba(255,255,255,0.15)" }} onClick={toggleNotif}>
              {notifEnabled ? "🔔 Notifs on" : "🔕 Enable notifs"}
            </button>
            <button className="btn btn-ghost btn-sm w-full" style={{ marginTop:6, color:"rgba(255,255,255,0.6)", borderColor:"rgba(255,255,255,0.15)" }} onClick={toggleDark}>
              {darkMode ? "☀ Day Mode" : "🌙 Night Mode"}
            </button>
          </div>
        </div>

        {/* SPIDEY STICKER */}
        <div className="spidey-web" />
        <div className="spidey-sticker" title="Your friendly neighbourhood dashboard spider-man 🕷️">
          <SpiderManPixel />
        </div>

        {/* MAIN */}
        <div className="main">
          {/* HERO */}
          <div className="hero">
            <div className="hero-scanlines" />
            <div className="hero-stars">
              {["✦","★","✧","✦","✧","★","✦","✧"].map((s, i) => (
                <div key={i} className="hero-star" style={{ top:`${10+i*10}%`, left:`${5+i*13}%`, animationDelay:`${i*0.4}s`, fontSize: i%3===0?16:10 }}>{s}</div>
              ))}
            </div>
            <div className="hero-blob" style={{ width:280, height:280, background:"#FF3FA4", top:-100, right:250 }} />
            <div className="hero-blob" style={{ width:220, height:220, background:"#BF5FFF", top:-80, right:-60 }} />
            <div className="hero-blob" style={{ width:180, height:180, background:"#00E5FF", bottom:-80, right:420 }} />
            {data.heroImage && <div className="hero-bg" style={{ backgroundImage:`url(${data.heroImage})` }} />}
            <div className="hero-overlay" />
            <div className="hero-content">
              <div className="hero-greeting">HELLO, {(data.settings?.name || "ANVI").toUpperCase()} ✦</div>
              <div className="hero-date">// {dateStr.toUpperCase()} //</div>
              <div className="hero-badges">
                <span className="hero-badge" style={{ borderColor:"#ef4444", color:"#FF8888" }}>🔴 {urgentCount} URGENT</span>
                <span className="hero-badge" style={{ borderColor:"var(--yellow-bright)", color:"var(--yellow)" }}>◈ {mainPendingCount} TO-DOS</span>
                <span className="hero-badge" style={{ borderColor:"var(--cyan)", color:"var(--cyan)" }}>◷ {fmtDuration(thisWeekTotal) || "0m"} THIS WEEK</span>
                {upcomingCountdowns.length > 0 && (
                  <span className="hero-badge" style={{ borderColor:"var(--mint)", color:"var(--mint)" }}>⏳ {daysUntil(upcomingCountdowns[0].date)}D — {upcomingCountdowns[0].title.toUpperCase()}</span>
                )}
              </div>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              style={{ position:"absolute", top:16, right:16, background:"rgba(255,255,255,0.08)", border:"2px solid rgba(255,255,255,0.2)", color:"white" }}
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
            >☰</button>
          </div>

          {/* PAGES */}
          <div className="page">
            {tab === "dashboard" && (
              <DashboardPage
                data={data} todayTotal={todayTotal} thisWeekTotal={thisWeekTotal}
                todaySessions={todaySessions} subjectTotals={subjectTotals}
                maxSubjectTotal={maxSubjectTotal} setTab={setTab}
                urgentCount={urgentCount} mainPendingCount={mainPendingCount}
                saveData={saveData} toast={toast}
                addMainTodo={addMainTodo} toggleMainTodo={toggleMainTodo}
                deleteMainTodo={deleteMainTodo} toggleTodayFlag={toggleTodayFlag}
              />
            )}
            {tab === "todos" && (
              <TodosPage
                data={data} addMainTodo={addMainTodo} toggleMainTodo={toggleMainTodo}
                deleteMainTodo={deleteMainTodo} addTodo={addTodo} toggleTodo={toggleTodo}
                deleteTodo={deleteTodo} toggleTodayFlag={toggleTodayFlag}
              />
            )}
            {tab === "goals" && (
              <GoalsPage data={data} addGoal={addGoal} toggleGoal={toggleGoal} deleteGoal={deleteGoal} />
            )}
            {tab === "subjects" && (
              <SubjectsPage
                data={data} subjectView={subjectView} setSubjectView={setSubjectView}
                addTodo={addTodo} toggleTodo={toggleTodo} deleteTodo={deleteTodo}
                update={update} saveData={saveData} toast={toast}
                addCountdown={addCountdown}
              />
            )}
            {tab === "extracurriculars" && (
              <ExtracurricularsPage data={data} update={update} saveData={saveData} toast={toast} />
            )}
            {tab === "countdowns" && (
              <CountdownsPage data={data} addCountdown={addCountdown} deleteCountdown={deleteCountdown} />
            )}
            {tab === "timer" && (
              <TimerPage
                data={data} timerRunning={timerRunning} timerSec={timerSec}
                timerSubject={timerSubject} setTimerSubject={setTimerSubject}
                startTimer={startTimer} stopTimer={stopTimer}
                todaySessions={todaySessions} thisWeekSessions={thisWeekSessions}
                todayTotal={todayTotal} thisWeekTotal={thisWeekTotal}
                subjectTotals={subjectTotals} maxSubjectTotal={maxSubjectTotal}
                logStudyManual={logStudyManual} toast={toast}
              />
            )}
            {tab === "resources" && (
              <ResourcesPage data={data} saveData={saveData} update={update} toast={toast} />
            )}
            {tab === "settings" && (
              <SettingsPage data={data} update={update} saveData={saveData} />
            )}
            {tab === "study-cal" && (
              <StudyCalendarPage data={data} />
            )}
            {tab === "habits" && (
              <HabitTrackerPage data={data} saveData={saveData} toast={toast} />
            )}
            {tab === "widgets" && (
              <WidgetsPage data={data} saveData={saveData} toast={toast} />
            )}
          </div>
        </div>

        <div className="toast-container">
          {toasts.map((t) => <div key={t.id} className="toast">{t.msg}</div>)}
        </div>
      </div>
    </>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardPage({ data, todayTotal, thisWeekTotal, todaySessions, subjectTotals, maxSubjectTotal, setTab, urgentCount, mainPendingCount, saveData, toast, addMainTodo, toggleMainTodo, deleteMainTodo, toggleTodayFlag }) {
  const [dashTab, setDashTab] = useState("overview");
  const [todayInput, setTodayInput] = useState("");
  const [todayPriority, setTodayPriority] = useState("med");

  const todayTodos = (data.mainTodos || []).filter(t => t.isToday && !t.done);
  const todayDone = (data.mainTodos || []).filter(t => t.isToday && t.done);

  const urgentTodos = Object.entries(data.subjects).flatMap(([sub, s]) => {
    const todos = (s.todos || []).filter((t) => !t.done && t.priority === "high").map((t) => ({ ...t, subject: sub }));
    const exercises = sub === "Maths" ? (s.exercises || []).filter((t) => !t.done && t.priority === "high").map((t) => ({ ...t, subject: "Maths 📐" })) : [];
    return [...todos, ...exercises];
  });
  const upcomingTodos = [
    ...(data.mainTodos || []).filter((t) => !t.done && t.dueDate).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)),
    ...Object.entries(data.subjects).flatMap(([sub, s]) => {
      const todos = (s.todos || []).filter((t) => !t.done && t.dueDate).map((t) => ({ ...t, subject: sub }));
      const exercises = sub === "Maths" ? (s.exercises || []).filter((t) => !t.done && t.dueDate).map((t) => ({ ...t, subject: "Maths 📐" })) : [];
      return [...todos, ...exercises];
    }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)),
  ].slice(0, 6);

  const allCountdowns = (data.countdowns || []).filter(c => daysUntil(c.date) >= 0).sort((a,b) => daysUntil(a.date) - daysUntil(b.date));
  const allPendingTodos = [
    ...(data.mainTodos || []).filter(t => !t.done).map(t => ({ ...t, source: "General" })),
    ...Object.entries(data.subjects).flatMap(([sub, s]) => [
      ...(s.todos||[]).filter(t=>!t.done).map(t=>({...t, source:sub})),
      ...(sub==="Maths"?(s.exercises||[]).filter(t=>!t.done).map(t=>({...t, source:"Maths 📐", _isEx:true})):[])
    ])
  ];
  const extraTodos = (data.extracurriculars?.todos || []).filter(t => !t.done);
  const dashWidgets = data.dashWidgets || [];

  return (
    <>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div className="page-title">OVERVIEW</div>
        <div style={{ fontFamily:"var(--font-pixel)", fontSize:11, color:"var(--pink)", animation:"blink 1.2s step-end infinite" }}>● LIVE</div>
      </div>

      {/* STAT CARDS */}
      <div className="grid-4 mb-3">
        {[
          { num: fmtDuration(todayTotal) || "0m", label: "Today's study", dot: "#FF3FA4", bg: "#FFD6ED" },
          { num: fmtDuration(thisWeekTotal) || "0m", label: "This week", dot: "#BF5FFF", bg: "#F0D9FF" },
          { num: urgentCount, label: "Urgent tasks", dot: "#ef4444", bg: "#fee2e2" },
          { num: mainPendingCount, label: "General to-dos", dot: "#FFE600", bg: "#FFFACC" },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ borderTop:`3px solid ${s.dot}` }}>
            <div className="stat-num" style={{ color: s.dot }}>{s.num}</div>
            <div className="stat-label">{s.label}</div>
            <div style={{ position:"absolute", bottom:10, right:12, fontSize:20, opacity:0.15 }}>✦</div>
          </div>
        ))}
      </div>

      {/* MAIN DASHBOARD GRID: always-visible todos + countdowns on right */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:18, marginBottom:18 }}>

        {/* LEFT: tabbed content area */}
        <div>
          <div className="dash-tabs" style={{ marginBottom:16 }}>
            <button className={`dash-tab ${dashTab==="overview" ? "active-pink" : ""}`} onClick={() => setDashTab("overview")}>✦ Overview</button>
            <button className={`dash-tab ${dashTab==="subjects" ? "active-pink" : ""}`} onClick={() => setDashTab("subjects")}>◉ Subjects</button>
            <button className={`dash-tab ${dashTab==="extras" ? "active-cyan" : ""}`} onClick={() => setDashTab("extras")}>◆ Extras</button>
            <button className={`dash-tab ${dashTab==="widgets" ? "active-yellow" : ""}`} onClick={() => setDashTab("widgets")}>🖼 Widgets</button>
          </div>

          {/* OVERVIEW TAB */}
          {dashTab === "overview" && (
            <>
              <div className="grid-2 mb-3">
                <div className="card">
                  <div className="card-title"><span className="card-title-dot" style={{ background:"#ef4444" }} />URGENT TASKS 🔴</div>
                  {urgentTodos.length === 0
                    ? <div className="text-sm text-muted" style={{fontFamily:"var(--font-mono)"}}>// no urgent tasks — you're crushing it 🎉</div>
                    : urgentTodos.slice(0, 6).map((t) => (
                        <div key={t.id} className="todo-item">
                          <span className="badge badge-high">{t.subject}</span>
                          <div className="todo-body">
                            <div className="todo-text">{t.text}</div>
                            {t.dueDate && <div className="todo-due">{fmtDateTime(t.dueDate)}</div>}
                          </div>
                        </div>
                      ))
                  }
                </div>
                <div className="card">
                  <div className="card-title"><span className="card-title-dot" style={{ background:"var(--purple)" }} />COMING UP 📅</div>
                  {upcomingTodos.length === 0
                    ? <div className="text-sm text-muted" style={{fontFamily:"var(--font-mono)"}}>// no scheduled tasks — add due dates!</div>
                    : upcomingTodos.map((t) => (
                        <div key={t.id} className="todo-item">
                          {t.subject && <span className="badge badge-med">{t.subject}</span>}
                          <div className="todo-body">
                            <div className="todo-text">{t.text}</div>
                            <div className={`todo-due ${new Date(t.dueDate) < new Date() ? "overdue" : ""}`}>{fmtDateTime(t.dueDate)}</div>
                          </div>
                        </div>
                      ))
                  }
                </div>
              </div>
              {Object.keys(subjectTotals).length > 0 && (
                <div className="card">
                  <div className="card-title"><span className="card-title-dot" style={{ background:"var(--blue)" }} />THIS WEEK BY SUBJECT</div>
                  {Object.entries(subjectTotals).sort((a, b) => b[1] - a[1]).map(([sub, sec]) => (
                    <div key={sub} className="bar-row">
                      <div className="bar-label">{sub}</div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width:`${(sec/maxSubjectTotal)*100}%`, background:data.subjects[sub]?.color || "var(--pink)" }} />
                      </div>
                      <div className="bar-val">{fmtDuration(sec)}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* SUBJECTS TAB */}
          {dashTab === "subjects" && (
            <>
              <div className="section-header section-header-subjects mb-3">◉ SUBJECTS AT A GLANCE</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:14 }}>
                {Object.entries(data.subjects).map(([name, s]) => {
                  const pending = (s.todos || []).filter((t) => !t.done).length;
                  const exercises = name === "Maths" ? (s.exercises||[]).filter(t=>!t.done).length : 0;
                  const high = (s.todos || []).filter((t) => !t.done && t.priority==="high").length;
                  return (
                    <div key={name} className="card" style={{ borderTop:`3px solid ${s.color}`, padding:"14px 16px", cursor:"pointer" }} onClick={() => setTab("subjects")}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                        <div style={{ fontFamily:"var(--font-pixel)", fontSize:13, color:s.color }}>{name}</div>
                        {high > 0 && <span className="badge badge-high">{high} urgent</span>}
                      </div>
                      <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted)", marginBottom:6 }}>
                        {pending} tasks{exercises > 0 ? ` · ${exercises} exercises` : ""}
                      </div>
                      <div className="bar-track" style={{ height:5, marginBottom:6 }}>
                        <div className="bar-fill" style={{ width:`${Math.min(100, (pending+exercises)*15)}%`, background:s.color }} />
                      </div>
                      {(s.todos||[]).filter(t=>!t.done).slice(0,2).map(t => (
                        <div key={t.id} style={{ fontFamily:"var(--font-body)", fontSize:11, color:"var(--text-soft)", padding:"2px 0", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>• {t.text}</div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* EXTRAS TAB */}
          {dashTab === "extras" && (
            <>
              <div className="section-header section-header-extras mb-3">◆ WORK & EXTRACURRICULARS</div>
              <div className="grid-2">
                <div className="card" style={{ borderTop:"3px solid var(--cyan)" }}>
                  <div className="card-title"><span className="card-title-dot" style={{ background:"var(--cyan)" }} />WORK & EXTRAS TO-DOs</div>
                  {extraTodos.length === 0
                    ? <div className="text-sm text-muted" style={{fontFamily:"var(--font-mono)"}}>// all clear!</div>
                    : extraTodos.slice(0,6).map(t => (
                        <div key={t.id} className="todo-item">
                          <div className="todo-body"><div className="todo-text">{t.text}</div>{t.dueDate && <div className="todo-due">{fmtDateTime(t.dueDate)}</div>}</div>
                          <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                        </div>
                      ))
                  }
                </div>
                <div className="card" style={{ borderTop:"3px solid var(--mint)" }}>
                  <div className="card-title"><span className="card-title-dot" style={{ background:"var(--mint)" }} />OTHER PROJECTS</div>
                  {(data.extracurriculars?.otherProjects || []).length === 0
                    ? <div className="text-sm text-muted" style={{fontFamily:"var(--font-mono)"}}>// no projects yet</div>
                    : (data.extracurriculars?.otherProjects || []).map(p => (
                        <div key={p.id} style={{ padding:"7px 0", borderBottom:"1px dashed var(--border)", fontFamily:"var(--font-pixel)", fontSize:12 }}>◆ {p.title}</div>
                      ))
                  }
                </div>
              </div>
              <div className="card mt-3" style={{ borderTop:"3px solid var(--purple)" }}>
                <div className="card-title"><span className="card-title-dot" style={{ background:"var(--purple)" }} />GENDER LENS TASKS</div>
                {(data.extracurriculars?.genderLens?.todos || []).filter(t=>!t.done).length === 0
                  ? <div className="text-sm text-muted" style={{fontFamily:"var(--font-mono)"}}>// no tasks yet</div>
                  : (data.extracurriculars?.genderLens?.todos || []).filter(t=>!t.done).map(t => (
                      <div key={t.id} className="todo-item"><div className="todo-text">{t.text}</div></div>
                    ))
                }
              </div>
            </>
          )}

          {/* IMAGE WIDGETS TAB — now has its own page */}
          {dashTab === "widgets" && (
            <div style={{ textAlign:"center", padding:"48px 0" }}>
              <div style={{ fontSize:48, marginBottom:16 }}>🖼</div>
              <div style={{ fontFamily:"var(--font-pixel)", fontSize:16, color:"var(--text)", marginBottom:12 }}>WIDGETS HAVE THEIR OWN SPACE NOW</div>
              <div style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--muted)", marginBottom:24 }}>// go to My Widgets for the full gallery with layouts ✦</div>
              <button className="btn btn-primary" onClick={()=>setTab("widgets")}>GO TO MY WIDGETS →</button>
            </div>
          )}
        </div>

        {/* RIGHT SIDE: Persistent todos + countdowns panels */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          {/* TODAY'S FOCUS — quick-add and view */}
          <div className="card" style={{ borderTop:"3px solid var(--mint)", background:"linear-gradient(135deg, var(--mint-light) 0%, var(--bg2) 100%)" }}>
            <div className="card-title" style={{ justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span className="card-title-dot" style={{background:"var(--mint)"}} />
                TODAY'S FOCUS 📌
              </div>
              <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--muted)" }}>{new Date().toLocaleDateString("en-AU",{weekday:"short",day:"numeric",month:"short"})}</div>
            </div>
            {/* Quick add */}
            <div style={{ display:"flex", gap:6, marginBottom:10 }}>
              <input
                type="text"
                placeholder="Add task for today…"
                value={todayInput}
                onChange={e=>setTodayInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter"&&todayInput.trim()){ addMainTodo(todayInput,todayPriority,"",true); setTodayInput(""); } }}
                style={{ flex:1, fontSize:12 }}
              />
              <select value={todayPriority} onChange={e=>setTodayPriority(e.target.value)} style={{ width:72, fontSize:11 }}>
                <option value="high">🔴 High</option>
                <option value="med">🟡 Med</option>
                <option value="low">🟢 Low</option>
              </select>
              <button className="btn btn-sm" style={{ background:"var(--mint)", color:"#003322", border:"2px solid #00C880", boxShadow:"2px 2px 0px #00C880", fontFamily:"var(--font-pixel)", fontSize:11, whiteSpace:"nowrap" }}
                onClick={()=>{ if(todayInput.trim()){ addMainTodo(todayInput,todayPriority,"",true); setTodayInput(""); } }}>
                + ADD
              </button>
            </div>
            {/* Today todos list */}
            {todayTodos.length === 0 && todayDone.length === 0 ? (
              <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted)", padding:"6px 0" }}>// no tasks set for today yet ✦</div>
            ) : (
              <div style={{ maxHeight:200, overflowY:"auto" }}>
                {todayTodos.map(t => (
                  <div key={t.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 0", borderBottom:"1px dashed var(--border)" }}>
                    <button className={`todo-check ${t.done?"done":""}`} onClick={()=>toggleMainTodo(t.id)} style={{width:16,height:16,fontSize:9}}>{t.done&&"✓"}</button>
                    <div style={{ flex:1, fontFamily:"var(--font-body)", fontSize:12, color:"var(--text)" }}>{t.text}</div>
                    <span className={`badge badge-${t.priority}`} style={{fontSize:8}}>{t.priority}</span>
                    <button onClick={()=>deleteMainTodo(t.id)} style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:14,lineHeight:1,opacity:0.6}}>×</button>
                  </div>
                ))}
                {todayDone.length > 0 && (
                  <div style={{ marginTop:6 }}>
                    <div style={{ fontFamily:"var(--font-pixel)", fontSize:9, color:"var(--muted)", letterSpacing:"0.08em", marginBottom:4 }}>✓ DONE ({todayDone.length})</div>
                    {todayDone.map(t => (
                      <div key={t.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 0", opacity:0.5 }}>
                        <button className="todo-check done" onClick={()=>toggleMainTodo(t.id)} style={{width:16,height:16,fontSize:9}}>✓</button>
                        <div style={{ flex:1, fontFamily:"var(--font-body)", fontSize:11, textDecoration:"line-through", color:"var(--muted)" }}>{t.text}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {todayTodos.length > 0 && (
              <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ flex:1, height:6, background:"var(--border)", border:"1px solid var(--border-pixel)" }}>
                  <div style={{ height:"100%", background:"var(--mint)", width:`${Math.round(todayDone.length/(todayDone.length+todayTodos.length)*100)}%`, transition:"width 0.5s" }} />
                </div>
                <div style={{ fontFamily:"var(--font-pixel)", fontSize:9, color:"var(--mint)", whiteSpace:"nowrap" }}>
                  {todayDone.length}/{todayDone.length+todayTodos.length}
                </div>
              </div>
            )}
          </div>

          {/* ALWAYS-VISIBLE TODOS PANEL */}
          <div className="card" style={{ borderTop:"3px solid var(--pink)", flex:"none" }}>
            <div className="card-title" style={{ justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span className="card-title-dot" />
                ALL TO-DOS
              </div>
              <button onClick={() => setTab("todos")} style={{ fontFamily:"var(--font-pixel)", fontSize:9, color:"var(--pink)", background:"none", border:"none", cursor:"pointer", letterSpacing:"0.06em" }}>VIEW ALL →</button>
            </div>
            <div style={{ maxHeight:260, overflowY:"auto" }}>
              {allPendingTodos.length === 0 ? (
                <div className="text-sm text-muted" style={{fontFamily:"var(--font-mono)"}}>// all done! 🎉</div>
              ) : allPendingTodos.slice(0,15).map(t => (
                <div key={t.id+t.source} className="todo-item" style={{ padding:"5px 0" }}>
                  <div style={{ width:7, height:7, borderRadius:0, background: t.source==="General" ? "var(--yellow)" : (data.subjects[t.source.replace(" 📐","")]?.color || "var(--pink)"), flexShrink:0, marginTop:6 }} />
                  <div className="todo-body">
                    <div className="todo-text" style={{ fontSize:11 }}>
                      {t._isEx && <span style={{ fontSize:8, color:"var(--blue)", marginRight:4 }}>📐</span>}
                      {t.text}
                    </div>
                    <div style={{ fontFamily:"var(--font-pixel)", fontSize:8, color:"var(--muted)", marginTop:1 }}>{t.source}</div>
                  </div>
                  <span className={`badge badge-${t.priority||"med"}`} style={{ fontSize:7 }}>{t.priority||"med"}</span>
                  {t.source === "General" && (
                    <button
                      title={t.isToday ? "Remove from today" : "Pin to today"}
                      onClick={()=>toggleTodayFlag(t.id)}
                      style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, opacity: t.isToday ? 1 : 0.3, color:"var(--mint)", padding:"0 2px", transition:"opacity 0.15s" }}
                    >📌</button>
                  )}
                </div>
              ))}
              {allPendingTodos.length > 15 && (
                <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted)", textAlign:"center", padding:"6px 0" }}>+{allPendingTodos.length-15} more</div>
              )}
            </div>
          </div>

          {/* ALWAYS-VISIBLE COUNTDOWNS PANEL */}
          <div className="card" style={{ borderTop:"3px solid var(--yellow-bright)", flex:"none" }}>
            <div className="card-title" style={{ justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span className="card-title-dot" style={{background:"var(--yellow)"}} />
                COUNTDOWNS ⏳
              </div>
              <button onClick={() => setTab("countdowns")} style={{ fontFamily:"var(--font-pixel)", fontSize:9, color:"var(--yellow-bright)", background:"none", border:"none", cursor:"pointer", letterSpacing:"0.06em" }}>MANAGE →</button>
            </div>
            {allCountdowns.length === 0 ? (
              <div className="text-sm text-muted" style={{fontFamily:"var(--font-mono)"}}>// no countdowns yet</div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:320, overflowY:"auto" }}>
                {allCountdowns.map(c => {
                  const clr = c.color || data.subjects[c.subject]?.color || "var(--pink)";
                  const tl = null; // mini version — show days only
                  const days = daysUntil(c.date);
                  return (
                    <MiniCountdown key={c.id} c={c} color={clr} />
                  );
                })}
              </div>
            )}
          </div>

          {/* DASHBOARD IMAGE WIDGETS preview strip */}
          {dashWidgets.length > 0 && (
            <div className="card" style={{ borderTop:"3px solid var(--purple)", padding:"14px" }}>
              <div className="card-title" style={{ marginBottom:10, fontSize:12, justifyContent:"space-between" }}>
                <span style={{display:"flex",alignItems:"center",gap:8}}><span className="card-title-dot" style={{background:"var(--purple)"}}/>MY WIDGETS 🖼</span>
                <button onClick={()=>setTab("widgets")} style={{ fontFamily:"var(--font-pixel)", fontSize:9, color:"var(--purple)", background:"none", border:"none", cursor:"pointer" }}>VIEW ALL →</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
                {dashWidgets.slice(0,6).map(w => (
                  <img key={w.id} src={w.url} alt="widget" style={{ width:"100%", aspectRatio:"1", objectFit:"cover", border:"2px solid var(--border-pixel)" }} onError={e=>{e.target.style.background="var(--sand)"}} />
                ))}
              </div>
              {dashWidgets.length > 6 && <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--muted)", marginTop:6, textAlign:"center" }}>+{dashWidgets.length-6} more</div>}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── MINI COUNTDOWN (for dashboard sidebar panel) ─────────────────────────────
function MiniCountdown({ c, color }) {
  const tl = useLiveCountdown(c.date);
  const days = tl ? tl.days : daysUntil(c.date);
  const isUrgent = days <= 7 && !tl?.past;
  const pad = (n) => String(n).padStart(2, "0");
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", border:`2px solid ${color}22`, borderLeft:`3px solid ${color}`, background:`${color}08`, animation:isUrgent?"pulse-countdown 1.5s ease-in-out infinite":"none" }}>
      <div style={{ textAlign:"center", minWidth:36 }}>
        <div style={{ fontFamily:"var(--font-pixel)", fontSize:22, color, lineHeight:1 }}>{tl?.past ? "✓" : days}</div>
        <div style={{ fontFamily:"var(--font-mono)", fontSize:7, color:"var(--muted)", textTransform:"uppercase" }}>days</div>
      </div>
      <div style={{ flex:1, overflow:"hidden" }}>
        <div style={{ fontFamily:"var(--font-pixel)", fontSize:11, color:"var(--text)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.title}</div>
        {c.subject && <div style={{ fontFamily:"var(--font-pixel)", fontSize:9, color, marginTop:2 }}>{c.subject}</div>}
        {tl && !tl.past && (
          <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--muted)", marginTop:2 }}>{pad(tl.hours)}:{pad(tl.minutes)}:{pad(tl.seconds)}</div>
        )}
      </div>
      {isUrgent && !tl?.past && <div style={{ fontFamily:"var(--font-pixel)", fontSize:8, color:"#ef4444" }}>⚠</div>}
    </div>
  );
}

// ─── LIVE COUNTDOWN WIDGET ────────────────────────────────────────────────────
function LiveCountdownWidget({ c, onDelete, showDelete = false }) {
  const tl = useLiveCountdown(c.date);
  const days = tl ? tl.days : daysUntil(c.date);
  const isUrgent = days <= 7 && !tl?.past;
  const sColor = c.color || "#FF3FA4";
  const pad = (n) => String(n).padStart(2, "0");

  return (
    <div className={`countdown-widget ${isUrgent && !tl?.past ? "countdown-urgent" : ""}`} style={{ "--color": sColor }}>
      {showDelete && (
        <div style={{ display:"flex", justifyContent:"flex-end" }}>
          <button onClick={onDelete} style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:16, lineHeight:1, marginBottom:4 }}>×</button>
        </div>
      )}
      {tl?.past ? (
        <div style={{ fontFamily:"var(--font-pixel)", fontSize:14, color:"var(--muted)", textDecoration:"line-through" }}>PAST</div>
      ) : (
        <>
          <div className="countdown-days">{tl ? tl.days : days}</div>
          <div className="countdown-label">days left</div>
          {tl && (
            <div className="live-cd-grid" style={{ color: sColor }}>
              <div className="live-cd-unit">
                <span className="live-cd-num">{pad(tl.hours)}</span>
                <span className="live-cd-label">hrs</span>
              </div>
              <div className="live-cd-unit">
                <span className="live-cd-num">{pad(tl.minutes)}</span>
                <span className="live-cd-label">min</span>
              </div>
              <div className="live-cd-unit">
                <span className="live-cd-num">{pad(tl.seconds)}</span>
                <span className="live-cd-label">sec</span>
              </div>
              <div className="live-cd-unit">
                <span className="live-cd-num" style={{ fontSize:13 }}>{new Date(c.date).toLocaleDateString("en-AU", { day:"numeric", month:"short" })}</span>
                <span className="live-cd-label">date</span>
              </div>
            </div>
          )}
        </>
      )}
      <div className="countdown-title" style={{ marginTop: 8 }}>{c.title}</div>
      {c.subject && (
        <div className="countdown-subject" style={{ background: sColor + "22", color: sColor, border:`1px solid ${sColor}` }}>{c.subject}</div>
      )}
      {isUrgent && days > 0 && (
        <div style={{ fontFamily:"var(--font-pixel)", fontSize:9, color:"#ef4444", marginTop:4 }}>⚠ SOON!</div>
      )}
      {days === 0 && !tl?.past && (
        <div style={{ fontFamily:"var(--font-pixel)", fontSize:9, color:"var(--yellow)", marginTop:4 }}>★ TODAY!</div>
      )}
    </div>
  );
}

// ─── COUNTDOWNS PAGE ──────────────────────────────────────────────────────────
function CountdownsPage({ data, addCountdown, deleteCountdown }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [subject, setSubject] = useState("");
  const [color, setColor] = useState("#FF3FA4");

  const allCountdowns = (data.countdowns || []).sort((a, b) => daysUntil(a.date) - daysUntil(b.date));
  const upcoming = allCountdowns.filter(c => daysUntil(c.date) >= 0);
  const past = allCountdowns.filter(c => daysUntil(c.date) < 0);

  const colorOptions = [
    "#FF3FA4", "#FFE600", "#00E5FF", "#BF5FFF", "#00F5A0",
    "#FF6B35", "#4CC9F0", "#06D6A0", "#FF9EBC", "#FFFFFF"
  ];

  const handleAdd = () => {
    if (!title.trim() || !date) return;
    const finalColor = data.subjects[subject]?.color || color;
    addCountdown(title, date, subject, finalColor);
    setTitle(""); setDate(""); setSubject("");
  };

  const subjectNames = Object.keys(data.subjects);

  return (
    <>
      <div className="page-title" style={{ marginBottom:28 }}>COUNTDOWNS ⏳</div>

      {/* Add form */}
      <div className="card mb-3" style={{ borderTop:"3px solid var(--yellow-bright)" }}>
        <div className="card-title"><span className="card-title-dot" style={{ background:"var(--yellow)" }} />ADD ASSESSMENT COUNTDOWN</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr auto", gap:10, alignItems:"flex-end" }}>
          <div>
            <div className="insight-label mb-1">Title</div>
            <input type="text" placeholder="e.g. Economics Trial" value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key==="Enter" && handleAdd()} />
          </div>
          <div>
            <div className="insight-label mb-1">Date</div>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <div className="insight-label mb-1">Subject (optional)</div>
            <select value={subject} onChange={e => setSubject(e.target.value)}>
              <option value="">No subject</option>
              {subjectNames.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button className="btn btn-yellow" onClick={handleAdd}>ADD ✦</button>
        </div>
        {!subject && (
          <div style={{ marginTop:14 }}>
            <div className="insight-label mb-2">Custom Color</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {colorOptions.map(c => (
                <button key={c} onClick={() => setColor(c)} style={{
                  width:28, height:28, background:c, border:color===c?"3px solid var(--text)":"2px solid var(--border-pixel)",
                  cursor:"pointer", boxShadow:color===c?"2px 2px 0px var(--text)":"none"
                }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <>
          <div className="section-header" style={{ background:"linear-gradient(90deg, var(--yellow-light), transparent)", borderLeft:"4px solid var(--yellow-bright)", boxShadow:"3px 3px 0px var(--yellow-bright)", marginBottom:16 }}>
            ⏳ UPCOMING ({upcoming.length})
          </div>
          <div className="countdown-grid mb-3">
            {upcoming.map(c => (
              <LiveCountdownWidget key={c.id} c={{ ...c, color: c.color || data.subjects[c.subject]?.color || "var(--pink)" }} onDelete={() => deleteCountdown(c.id)} showDelete={true} />
            ))}
          </div>
        </>
      )}

      {upcoming.length === 0 && (
        <div className="card" style={{ textAlign:"center", padding:"40px" }}>
          <div style={{ fontFamily:"var(--font-pixel)", fontSize:40, marginBottom:12, opacity:0.3 }}>⏳</div>
          <div style={{ fontFamily:"var(--font-pixel)", fontSize:13, color:"var(--muted)" }}>No upcoming countdowns!</div>
          <div style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--muted)", marginTop:6 }}>// Add assessments above to track deadlines</div>
        </div>
      )}

      {past.length > 0 && (
        <>
          <div className="section-header" style={{ marginTop:16, background:"linear-gradient(90deg, var(--sand), transparent)", borderLeft:"4px solid var(--muted)", boxShadow:"none", marginBottom:14 }}>
            ✓ PAST ({past.length})
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
            {past.map(c => (
              <div key={c.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 12px", border:"2px solid var(--border)", background:"var(--bg)", opacity:0.6 }}>
                <span style={{ fontFamily:"var(--font-pixel)", fontSize:11, color:"var(--muted)", textDecoration:"line-through" }}>{c.title}</span>
                <button onClick={() => deleteCountdown(c.id)} style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:14 }}>×</button>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

// ─── ALL TODOS PAGE ───────────────────────────────────────────────────────────
function TodosPage({ data, addMainTodo, toggleMainTodo, deleteMainTodo, addTodo, toggleTodo, deleteTodo, toggleTodayFlag }) {
  const [input, setInput] = useState("");
  const [priority, setPriority] = useState("med");
  const [dueDate, setDueDate] = useState("");
  const [isToday, setIsToday] = useState(false);
  const [openSections, setOpenSections] = useState({});

  const toggleSection = (key) => setOpenSections((s) => ({ ...s, [key]: !s[key] }));
  const pendingMain = (data.mainTodos || []).filter((t) => !t.done);
  const doneMain = (data.mainTodos || []).filter((t) => t.done);
  const todayPending = pendingMain.filter(t => t.isToday);
  const subjectNames = Object.keys(data.subjects);
  const isOverdue = (dueDate) => dueDate && new Date(dueDate) < new Date();

  return (
    <>
      <div className="page-title">ALL TO-DOS ◈</div>

      {/* TODAY'S FOCUS SECTION */}
      {todayPending.length > 0 && (
        <div className="card mb-3" style={{ borderTop:"3px solid var(--mint)", background:"linear-gradient(135deg, var(--mint-light) 0%, var(--bg2) 100%)" }}>
          <div className="card-title"><span className="card-title-dot" style={{background:"var(--mint)"}}/>TODAY'S FOCUS 📌 <span style={{fontFamily:"var(--font-mono)",fontSize:10,color:"var(--muted)",fontWeight:"normal"}}>— {new Date().toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"short"})}</span></div>
          {todayPending.map((t) => (
            <div key={t.id} className="todo-item" style={{ background:"rgba(0,245,160,0.06)", padding:"8px 6px", marginBottom:2 }}>
              <button className={`todo-check ${t.done?"done":""}`} onClick={() => toggleMainTodo(t.id)}>{t.done && "✓"}</button>
              <div className="todo-body">
                <div className="todo-text">{t.text}</div>
                {t.dueDate && <div className={`todo-due ${isOverdue(t.dueDate) ? "overdue":""}`}>{isOverdue(t.dueDate) ? "⚠ Overdue · ":"📅 "}{fmtDateTime(t.dueDate)}</div>}
              </div>
              <span className={`badge badge-${t.priority}`}>{t.priority}</span>
              <button title="Remove from today" onClick={()=>toggleTodayFlag(t.id)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, color:"var(--mint)", padding:"0 2px" }}>📌</button>
              <button className="todo-del" onClick={() => deleteMainTodo(t.id)}>×</button>
            </div>
          ))}
        </div>
      )}

      <div className="card mb-3" style={{ borderTop:"3px solid var(--pink)" }}>
        <div className="card-title"><span className="card-title-dot" />ADD TO-DO</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr auto auto auto auto", gap:8, alignItems:"flex-start" }}>
          <input type="text" placeholder="What do you need to do?" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { addMainTodo(input, priority, dueDate, isToday); setInput(""); setDueDate(""); setIsToday(false); } }} />
          <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={{ width:190 }} />
          <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ width:90 }}>
            <option value="high">🔴 High</option>
            <option value="med">🟡 Med</option>
            <option value="low">🟢 Low</option>
          </select>
          <button
            title="Pin to today's focus"
            onClick={()=>setIsToday(v=>!v)}
            style={{ padding:"8px 10px", border:`2px solid ${isToday?"var(--mint)":"var(--border-pixel)"}`, background:isToday?"var(--mint-light)":"var(--bg2)", cursor:"pointer", fontSize:14, borderRadius:0, boxShadow:isToday?"2px 2px 0px var(--mint)":"2px 2px 0px var(--border-pixel)", transition:"all 0.15s" }}
          >📌</button>
          <button className="btn btn-primary btn-sm" onClick={() => { addMainTodo(input, priority, dueDate, isToday); setInput(""); setDueDate(""); setIsToday(false); }}>ADD +</button>
        </div>
        <div className="text-xs text-muted mt-1" style={{fontFamily:"var(--font-mono)"}}>
          // {isToday ? "📌 will appear in today's focus on dashboard" : "click 📌 to pin this task to today's focus"} · set a time for browser notifications
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-title"><span className="card-title-dot" />GENERAL ({pendingMain.length} pending)</div>
        {pendingMain.length === 0 && <div className="text-sm text-muted" style={{fontFamily:"var(--font-mono)"}}>// no pending general to-dos 🎉</div>}
        {pendingMain.map((t) => (
          <div key={t.id} className="todo-item">
            <button className={`todo-check ${t.done?"done":""}`} onClick={() => toggleMainTodo(t.id)}>{t.done && "✓"}</button>
            <div className="todo-body">
              <div className="todo-text">{t.text}</div>
              {t.dueDate && <div className={`todo-due ${isOverdue(t.dueDate) ? "overdue":""}`}>{isOverdue(t.dueDate) ? "⚠ Overdue · ":"📅 "}{fmtDateTime(t.dueDate)}</div>}
            </div>
            <span className={`badge badge-${t.priority}`}>{t.priority}</span>
            <button
              title={t.isToday ? "Remove from today's focus" : "Pin to today's focus"}
              onClick={()=>toggleTodayFlag(t.id)}
              style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, opacity:t.isToday?1:0.25, color:"var(--mint)", padding:"0 2px", transition:"opacity 0.15s" }}
            >📌</button>
            <button className="todo-del" onClick={() => deleteMainTodo(t.id)}>×</button>
          </div>
        ))}
        {doneMain.length > 0 && (
          <div className="mt-2">
            <div className="text-xs text-muted mb-1" style={{ fontFamily:"var(--font-pixel)", letterSpacing:"0.08em" }}>COMPLETED ({doneMain.length})</div>
            {doneMain.map((t) => (
              <div key={t.id} className="todo-item" style={{ opacity:0.5 }}>
                <button className="todo-check done" onClick={() => toggleMainTodo(t.id)}>✓</button>
                <span className="todo-text done">{t.text}</span>
                <button className="todo-del" onClick={() => deleteMainTodo(t.id)}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ fontFamily:"var(--font-pixel)", fontSize:16, marginBottom:14, letterSpacing:"0.06em" }}>BY SUBJECT 📚</div>
      {subjectNames.map((sub) => {
        const s = data.subjects[sub];
        const pending = (s.todos || []).filter((t) => !t.done);
        const done = (s.todos || []).filter((t) => t.done);
        const pendingEx = sub === "Maths" ? (s.exercises || []).filter((t) => !t.done).map(t => ({ ...t, _isExercise: true })) : [];
        const doneEx = sub === "Maths" ? (s.exercises || []).filter((t) => t.done).map(t => ({ ...t, _isExercise: true })) : [];
        const totalPending = pending.length + pendingEx.length;
        const isOpen = openSections[sub];
        return (
          <div key={sub} className="dropdown-section" style={{ borderLeft:`3px solid ${s.color}` }}>
            <div className="dropdown-header" onClick={() => toggleSection(sub)}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:10, height:10, background:s.color }} />
                <span style={{ color:s.color }}>{sub}</span>
                <span style={{ color:"var(--muted)", fontFamily:"var(--font-mono)", fontSize:10 }}>({totalPending} pending{pendingEx.length > 0 ? `, incl. ${pendingEx.length} exercises` : ""})</span>
              </div>
              <span style={{ color:"var(--muted)" }}>{isOpen ? "▲" : "▼"}</span>
            </div>
            {isOpen && (
              <div className="dropdown-body">
                <SubjectTodoList subject={sub} todos={[...pending, ...pendingEx, ...done, ...doneEx]}
                  onToggle={(id, isEx) => toggleTodo(sub, id, isEx ? "exercises" : "todos")}
                  onDelete={(id, isEx) => deleteTodo(sub, id, isEx ? "exercises" : "todos")}
                  onAdd={(text, pri, due) => addTodo(sub, text, pri, due)} color={s.color} />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

function SubjectTodoList({ subject, todos, onToggle, onDelete, onAdd, color }) {
  const [input, setInput] = useState("");
  const [priority, setPriority] = useState("med");
  const [dueDate, setDueDate] = useState("");

  const handleAdd = () => {
    if (!input.trim()) return;
    onAdd(input, priority, dueDate);
    setInput(""); setDueDate("");
  };

  return (
    <div>
      {todos.map((t) => (
        <div key={t.id} className="todo-item">
          <button className={`todo-check ${t.done?"done":""}`} onClick={() => onToggle(t.id, t._isExercise)}>{t.done && "✓"}</button>
          <div className="todo-body">
            <div className={`todo-text ${t.done?"done":""}`}>
              {t._isExercise && <span style={{ fontFamily:"var(--font-pixel)", fontSize:9, marginRight:6, color:"var(--blue)" }}>📐</span>}
              {t.text}
            </div>
            {t.dueDate && <div className="todo-due">📅 {fmtDateTime(t.dueDate)}</div>}
          </div>
          <span className={`badge badge-${t.priority || "med"}`}>{t._isExercise ? "exercise" : t.priority}</span>
          <button className="todo-del" onClick={() => onDelete(t.id, t._isExercise)}>×</button>
        </div>
      ))}
      <div style={{ display:"grid", gridTemplateColumns:"1fr auto auto auto", gap:8, marginTop:12 }}>
        <input type="text" placeholder="Add task…" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key==="Enter" && handleAdd()} />
        <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={{ width:180 }} />
        <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ width:80 }}>
          <option value="high">High</option>
          <option value="med">Med</option>
          <option value="low">Low</option>
        </select>
        <button className="btn btn-primary btn-xs" onClick={handleAdd}>+</button>
      </div>
    </div>
  );
}

// ─── GOALS PAGE ───────────────────────────────────────────────────────────────
function GoalsPage({ data, addGoal, toggleGoal, deleteGoal }) {
  const [goalTab, setGoalTab] = useState("thisWeek");
  const [inputs, setInputs] = useState({ thisWeek:"", thisTerm:"", sixMonths:"", thisYear:"" });

  const horizons = [
    { key:"thisWeek", label:"This Week", icon:"🗓", color:"var(--pink)" },
    { key:"thisTerm", label:"This Term", icon:"📆", color:"var(--purple)" },
    { key:"sixMonths", label:"6 Months", icon:"🗺", color:"var(--mint)" },
    { key:"thisYear", label:"This Year", icon:"🌟", color:"var(--yellow)" },
  ];

  return (
    <>
      <div className="page-title">GOALS & LIFE ★</div>
      <div className="tabs">
        {horizons.map((h) => (
          <button key={h.key} className={`tab ${goalTab===h.key?"active":""}`} onClick={() => setGoalTab(h.key)}>
            {h.icon} {h.label}
          </button>
        ))}
      </div>
      {horizons.filter((h) => h.key === goalTab).map((h) => (
        <div key={h.key} className="goal-horizon" style={{ borderTop:`3px solid ${h.color}` }}>
          <div className="horizon-label" style={{ color:h.color }}>◉ {h.label.toUpperCase()} GOALS</div>
          {(data.goals?.[h.key] || []).length === 0 && (
            <div className="text-sm text-muted mb-3" style={{fontFamily:"var(--font-mono)"}}>// what do you want to achieve? add your first goal ✨</div>
          )}
          {(data.goals?.[h.key] || []).map((g) => (
            <div key={g.id} className="todo-item">
              <button className={`todo-check ${g.done?"done":""}`} onClick={() => toggleGoal(h.key, g.id)}>{g.done && "✓"}</button>
              <span className={`todo-text ${g.done?"done":""}`}>{g.text}</span>
              <button className="todo-del" onClick={() => deleteGoal(h.key, g.id)}>×</button>
            </div>
          ))}
          <div className="add-row mt-2">
            <input type="text" placeholder={`Add a ${h.label.toLowerCase()} goal…`} value={inputs[h.key]} onChange={(e) => setInputs({ ...inputs, [h.key]:e.target.value })} onKeyDown={(e) => { if (e.key==="Enter") { addGoal(h.key, inputs[h.key]); setInputs({ ...inputs, [h.key]:"" }); } }} />
            <button className="btn btn-primary btn-sm" onClick={() => { addGoal(h.key, inputs[h.key]); setInputs({ ...inputs, [h.key]:"" }); }}>ADD</button>
          </div>
        </div>
      ))}
    </>
  );
}

// ─── SUBJECTS PAGE ────────────────────────────────────────────────────────────
function SubjectsPage({ data, subjectView, setSubjectView, addTodo, toggleTodo, deleteTodo, update, saveData, toast, addCountdown }) {
  const [innerTab, setInnerTab] = useState("todos");
  const [todoInput, setTodoInput] = useState("");
  const [todoPriority, setTodoPriority] = useState("med");
  const [todoDue, setTodoDue] = useState("");
  const [exerciseInput, setExerciseInput] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [cdTitle, setCdTitle] = useState("");
  const [cdDate, setCdDate] = useState("");

  const subjectNames = Object.keys(data.subjects);
  const s = data.subjects[subjectView];

  const addLink = () => {
    if (!linkTitle.trim() || !linkUrl.trim()) return;
    const newData = JSON.parse(JSON.stringify(data));
    newData.subjects[subjectView].keyLinks = [...(newData.subjects[subjectView].keyLinks || []), { id: uid(), title: linkTitle, url: linkUrl }];
    saveData(newData);
    setLinkTitle(""); setLinkUrl("");
    toast("Link saved ✓");
  };

  const deleteLink = (id) => {
    const newData = JSON.parse(JSON.stringify(data));
    newData.subjects[subjectView].keyLinks = newData.subjects[subjectView].keyLinks.filter((l) => l.id !== id);
    saveData(newData);
  };

  const handleAddCountdown = () => {
    if (!cdTitle.trim() || !cdDate) return;
    addCountdown(cdTitle, cdDate, subjectView, s.color);
    setCdTitle(""); setCdDate("");
    toast("⏳ Countdown added to dashboard!");
  };

  return (
    <>
      <div className="page-title">SUBJECTS ◉</div>

      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:24 }}>
        {subjectNames.map((name) => {
          const sub = data.subjects[name];
          const isActive = subjectView === name;
          return (
            <button key={name} className="subject-chip" onClick={() => { setSubjectView(name); setInnerTab("todos"); }} style={{
              background: isActive ? sub.color : "var(--bg2)",
              color: isActive ? "white" : "var(--text-soft)",
              border: `2px solid ${isActive ? sub.color : "var(--border-pixel)"}`,
              boxShadow: isActive ? `3px 3px 0px ${sub.color}99` : "2px 2px 0px var(--border-pixel)",
              transform: isActive ? "translate(-1px,-1px)" : "none",
            }}>
              {name}
            </button>
          );
        })}
      </div>

      <div className="subject-card">
        <div className="subject-header" style={{ background:`${s.color}18`, borderBottom:`2px solid ${s.color}44` }}>
          <div className="subject-dot" style={{ background:s.color }} />
          <div className="subject-name" style={{ color:s.color }}>{subjectView}</div>
        </div>

        <div style={{ borderBottom:"2px solid var(--border-pixel)" }}>
          <div className="subject-inner-tabs" style={{ margin:"0 24px", borderBottom:"none" }}>
            {["todos","insights","notes","links","countdowns"].concat(subjectView==="Maths"?["exercises"]:[]).map((t) => (
              <button key={t} className={`subject-inner-tab ${innerTab===t?"active":""}`} onClick={() => setInnerTab(t)}
                style={innerTab===t ? { color:s.color } : {}}
              >
                {{ todos:"◈ Tasks", insights:"💡 Insights", notes:"📝 Notes", links:"🔗 Links", countdowns:"⏳ Countdowns", exercises:"📐 Exercises" }[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="subject-body">
          {innerTab === "todos" && (
            <>
              {/* For Maths: show exercises inline with tasks */}
              {subjectView === "Maths" && (s.exercises || []).filter(t=>!t.done).length > 0 && (
                <div style={{ marginBottom:14, padding:"10px 14px", background:"var(--blue-light)", border:"2px solid var(--blue)", borderLeft:"4px solid var(--blue)" }}>
                  <div style={{ fontFamily:"var(--font-pixel)", fontSize:10, color:"var(--blue)", letterSpacing:"0.1em", marginBottom:8 }}>📐 EXERCISES (included below)</div>
                </div>
              )}
              {[...(s.todos || []), ...(subjectView==="Maths" ? (s.exercises||[]).map(e=>({...e,_isExercise:true})) : [])].map((t) => (
                <div key={t.id} className="todo-item">
                  <button className={`todo-check ${t.done?"done":""}`} onClick={() => toggleTodo(subjectView, t.id, t._isExercise?"exercises":"todos")}>{t.done && "✓"}</button>
                  <div className="todo-body">
                    <div className={`todo-text ${t.done?"done":""}`}>
                      {t._isExercise && <span style={{ fontFamily:"var(--font-pixel)", fontSize:9, marginRight:6, padding:"1px 5px", background:"var(--blue-light)", color:"var(--blue)", border:"1px solid var(--blue)" }}>📐 EX</span>}
                      {t.text}
                    </div>
                    {t.dueDate && <div className="todo-due">📅 {fmtDateTime(t.dueDate)}</div>}
                  </div>
                  <span className={`badge badge-${t.priority||"med"}`}>{t._isExercise ? "exercise" : t.priority}</span>
                  <button className="todo-del" onClick={() => deleteTodo(subjectView, t.id, t._isExercise?"exercises":"todos")}>×</button>
                </div>
              ))}
              {(s.todos || []).length === 0 && !(subjectView==="Maths" && (s.exercises||[]).length>0) && <div className="text-sm text-muted mb-3" style={{fontFamily:"var(--font-mono)"}}>// no tasks yet for {subjectView} 🎉</div>}
              <div style={{ display:"grid", gridTemplateColumns:"1fr auto auto auto", gap:8, marginTop:14 }}>
                <input type="text" placeholder={`Add ${subjectView} task…`} value={todoInput} onChange={(e) => setTodoInput(e.target.value)} onKeyDown={(e) => { if (e.key==="Enter") { addTodo(subjectView, todoInput, todoPriority, todoDue); setTodoInput(""); setTodoDue(""); } }} />
                <input type="datetime-local" value={todoDue} onChange={(e) => setTodoDue(e.target.value)} style={{ width:190 }} />
                <select value={todoPriority} onChange={(e) => setTodoPriority(e.target.value)} style={{ width:80 }}>
                  <option value="high">High</option>
                  <option value="med">Med</option>
                  <option value="low">Low</option>
                </select>
                <button className="btn btn-primary btn-sm" onClick={() => { addTodo(subjectView, todoInput, todoPriority, todoDue); setTodoInput(""); setTodoDue(""); }}>ADD</button>
              </div>
              {subjectView === "Maths" && (
                <div style={{ marginTop:14, paddingTop:14, borderTop:"1px dashed var(--border)" }}>
                  <div style={{ fontFamily:"var(--font-pixel)", fontSize:10, color:"var(--blue)", letterSpacing:"0.1em", marginBottom:8 }}>📐 ADD MATHS EXERCISE</div>
                  <div style={{ display:"flex", gap:8 }}>
                    <input type="text" placeholder="Exercise or chapter name…" value={exerciseInput} onChange={(e) => setExerciseInput(e.target.value)} onKeyDown={(e) => { if (e.key==="Enter") { addTodo("Maths", exerciseInput, "med", "", "exercises"); setExerciseInput(""); } }} />
                    <button className="btn btn-sm" style={{ background:"var(--blue)", color:"white", border:"2px solid #00AACC", boxShadow:"2px 2px 0px #00AACC", fontFamily:"var(--font-pixel)", fontSize:11 }} onClick={() => { addTodo("Maths", exerciseInput, "med", "", "exercises"); setExerciseInput(""); }}>ADD 📐</button>
                  </div>
                </div>
              )}
            </>
          )}

          {innerTab === "insights" && (
            <div className="grid-2">
              <div className="insight-area">
                <div className="insight-label">💪 WHAT I'M GOOD AT</div>
                <textarea value={s.goodAt||""} onChange={(e) => update(`subjects.${subjectView}.goodAt`, e.target.value)} placeholder="Write your strengths here…" />
              </div>
              <div className="insight-area">
                <div className="insight-label">🎯 WHERE TO IMPROVE</div>
                <textarea value={s.improve||""} onChange={(e) => update(`subjects.${subjectView}.improve`, e.target.value)} placeholder="Areas for growth…" />
              </div>
            </div>
          )}

          {innerTab === "notes" && (
            <div className="insight-area">
              <div className="insight-label">📝 KEY NOTES FOR {subjectView}</div>
              <textarea value={s.keyNotes||""} onChange={(e) => update(`subjects.${subjectView}.keyNotes`, e.target.value)} placeholder="Important concepts, formulas, tips…" style={{ minHeight:200 }} />
            </div>
          )}

          {innerTab === "links" && (
            <>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:8, marginBottom:14 }}>
                <input type="text" placeholder="Link title…" value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} />
                <input type="url" placeholder="https://…" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} onKeyDown={(e) => e.key==="Enter" && addLink()} />
                <button className="btn btn-primary btn-sm" onClick={addLink}>SAVE</button>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
                {(s.keyLinks || []).map((l) => (
                  <div key={l.id} style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <a href={l.url} target="_blank" rel="noreferrer" className="link-tag">🔗 {l.title}</a>
                    <button style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:16 }} onClick={() => deleteLink(l.id)}>×</button>
                  </div>
                ))}
                {(s.keyLinks || []).length === 0 && <div className="text-sm text-muted" style={{fontFamily:"var(--font-mono)"}}>// no links added yet. add useful resources, past papers, YouTube videos…</div>}
              </div>
            </>
          )}

          {/* COUNTDOWNS IN SUBJECT */}
          {innerTab === "countdowns" && (
            <>
              <div className="insight-area mb-3" style={{ borderLeft:`3px solid ${s.color}` }}>
                <div className="insight-label">⏳ ADD ASSESSMENT COUNTDOWN</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:10, marginTop:8 }}>
                  <input type="text" placeholder="e.g. Trial Exam" value={cdTitle} onChange={e => setCdTitle(e.target.value)} onKeyDown={e => e.key==="Enter" && handleAddCountdown()} />
                  <input type="date" value={cdDate} onChange={e => setCdDate(e.target.value)} />
                  <button className="btn btn-primary btn-sm" style={{ background:s.color, borderColor:s.color }} onClick={handleAddCountdown}>ADD ⏳</button>
                </div>
                <div className="text-xs text-muted mt-2" style={{fontFamily:"var(--font-mono)"}}>// countdowns appear as live widgets on your dashboard ✦</div>
              </div>
              {/* Show countdowns for this subject with live timers */}
              <div style={{ fontFamily:"var(--font-pixel)", fontSize:11, marginBottom:12, color:"var(--muted)", letterSpacing:"0.08em" }}>COUNTDOWNS FOR {subjectView.toUpperCase()}</div>
              {(data.countdowns || []).filter(c => c.subject === subjectView && daysUntil(c.date) >= 0).length === 0 ? (
                <div className="text-sm text-muted" style={{fontFamily:"var(--font-mono)"}}>// no upcoming countdowns for {subjectView}</div>
              ) : (
                <div className="countdown-grid">
                  {(data.countdowns || []).filter(c => c.subject === subjectView && daysUntil(c.date) >= 0).sort((a,b) => daysUntil(a.date)-daysUntil(b.date)).map(c => (
                    <LiveCountdownWidget key={c.id} c={{ ...c, color: c.color || s.color }} />
                  ))}
                </div>
              )}
            </>
          )}

          {innerTab === "exercises" && subjectView === "Maths" && (
            <>
              <div className="insight-area mb-2">
                <div className="insight-label">📎 NOTION LINK (GOOD PROBLEMS)</div>
                <input type="url" value={s.notionLink||""} onChange={(e) => update("subjects.Maths.notionLink", e.target.value)} placeholder="https://notion.so/your-maths-page" />
                {s.notionLink && (
                  <a href={s.notionLink} target="_blank" rel="noreferrer" className="link-tag mt-2" style={{ display:"inline-flex" }}>Open Notion →</a>
                )}
              </div>
              <div className="insight-label mb-1">📐 EXERCISES & CHAPTERS TO DO</div>
              {(s.exercises || []).map((t) => (
                <div key={t.id} className="todo-item">
                  <button className={`todo-check ${t.done?"done":""}`} onClick={() => toggleTodo("Maths", t.id, "exercises")}>{t.done && "✓"}</button>
                  <span className={`todo-text ${t.done?"done":""}`}>{t.text}</span>
                  <button className="todo-del" onClick={() => deleteTodo("Maths", t.id, "exercises")}>×</button>
                </div>
              ))}
              <div className="add-row mt-2">
                <input type="text" placeholder="Exercise or chapter name…" value={exerciseInput} onChange={(e) => setExerciseInput(e.target.value)} onKeyDown={(e) => { if (e.key==="Enter") { addTodo("Maths", exerciseInput, "med", "", "exercises"); setExerciseInput(""); } }} />
                <button className="btn btn-primary btn-sm" onClick={() => { addTodo("Maths", exerciseInput, "med", "", "exercises"); setExerciseInput(""); }}>ADD</button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── EXTRACURRICULARS PAGE ────────────────────────────────────────────────────
function ExtracurricularsPage({ data, update, saveData, toast }) {
  const [extTab, setExtTab] = useState("main");
  const [todoInput, setTodoInput] = useState("");
  const [todoPriority, setTodoPriority] = useState("med");
  const [todoDue, setTodoDue] = useState("");
  const [glTodoInput, setGlTodoInput] = useState("");
  const [glLinkTitle, setGlLinkTitle] = useState("");
  const [glLinkUrl, setGlLinkUrl] = useState("");
  const [projectInput, setProjectInput] = useState("");

  const extras = data.extracurriculars || {};
  const todos = extras.todos || [];
  const genderLens = extras.genderLens || {};
  const glTodos = genderLens.todos || [];
  const glLinks = genderLens.links || [];

  const addExtraTodo = () => {
    if (!todoInput.trim()) return;
    const newData = JSON.parse(JSON.stringify(data));
    const todo = { id: uid(), text: todoInput, done: false, priority: todoPriority, dueDate: todoDue };
    newData.extracurriculars.todos = [...(newData.extracurriculars.todos || []), todo];
    saveData(newData);
    setTodoInput(""); setTodoDue("");
    toast("Task added ✓");
  };
  const toggleExtraTodo = (id) => {
    const newData = JSON.parse(JSON.stringify(data));
    const t = newData.extracurriculars.todos.find(x => x.id === id);
    if (t) t.done = !t.done;
    saveData(newData);
  };
  const deleteExtraTodo = (id) => {
    const newData = JSON.parse(JSON.stringify(data));
    newData.extracurriculars.todos = newData.extracurriculars.todos.filter(x => x.id !== id);
    saveData(newData);
  };
  const addGlTodo = () => {
    if (!glTodoInput.trim()) return;
    const newData = JSON.parse(JSON.stringify(data));
    newData.extracurriculars.genderLens.todos = [...glTodos, { id: uid(), text: glTodoInput, done: false }];
    saveData(newData);
    setGlTodoInput("");
  };
  const toggleGlTodo = (id) => {
    const newData = JSON.parse(JSON.stringify(data));
    const t = newData.extracurriculars.genderLens.todos.find(x => x.id === id);
    if (t) t.done = !t.done;
    saveData(newData);
  };
  const addGlLink = () => {
    if (!glLinkTitle.trim() || !glLinkUrl.trim()) return;
    const newData = JSON.parse(JSON.stringify(data));
    newData.extracurriculars.genderLens.links = [...glLinks, { id: uid(), title: glLinkTitle, url: glLinkUrl }];
    saveData(newData);
    setGlLinkTitle(""); setGlLinkUrl("");
    toast("Link saved ✓");
  };
  const addProject = () => {
    if (!projectInput.trim()) return;
    const newData = JSON.parse(JSON.stringify(data));
    newData.extracurriculars.otherProjects = [...(newData.extracurriculars.otherProjects || []), { id: uid(), title: projectInput }];
    saveData(newData);
    setProjectInput("");
    toast("Project added ✓");
  };

  return (
    <>
      <div className="page-title">WORK & EXTRAS ◆</div>
      <div className="tabs">
        {[
          { key:"main", label:"◆ Main Tasks" },
          { key:"linkedin", label:"💼 LinkedIn" },
          { key:"genderlens", label:"◈ GenderLens" },
          { key:"projects", label:"🚀 Projects" },
        ].map((t) => (
          <button key={t.key} className={`tab ${extTab===t.key?"active":""}`} onClick={() => setExtTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {extTab === "main" && (
        <div className="card" style={{ borderTop:"3px solid var(--cyan)" }}>
          <div className="card-title"><span className="card-title-dot" style={{ background:"var(--cyan)" }} />WORK & EXTRAS TO-DOs</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr auto auto auto", gap:8, marginBottom:14 }}>
            <input type="text" placeholder="Add task…" value={todoInput} onChange={(e) => setTodoInput(e.target.value)} onKeyDown={(e) => e.key==="Enter" && addExtraTodo()} />
            <input type="datetime-local" value={todoDue} onChange={(e) => setTodoDue(e.target.value)} style={{ width:190 }} />
            <select value={todoPriority} onChange={(e) => setTodoPriority(e.target.value)} style={{ width:80 }}>
              <option value="high">High</option>
              <option value="med">Med</option>
              <option value="low">Low</option>
            </select>
            <button className="btn btn-primary btn-sm" onClick={addExtraTodo}>ADD</button>
          </div>
          {todos.filter(t => !t.done).map(t => (
            <div key={t.id} className="todo-item">
              <button className={`todo-check ${t.done?"done":""}`} onClick={() => toggleExtraTodo(t.id)}>{t.done && "✓"}</button>
              <div className="todo-body">
                <div className="todo-text">{t.text}</div>
                {t.dueDate && <div className="todo-due">📅 {fmtDateTime(t.dueDate)}</div>}
              </div>
              <span className={`badge badge-${t.priority}`}>{t.priority}</span>
              <button className="todo-del" onClick={() => deleteExtraTodo(t.id)}>×</button>
            </div>
          ))}
          {todos.filter(t => !t.done).length === 0 && <div className="text-sm text-muted" style={{fontFamily:"var(--font-mono)"}}>// all clear! no pending tasks 🎉</div>}
        </div>
      )}

      {extTab === "linkedin" && (
        <div className="card" style={{ borderTop:"3px solid #0A66C2" }}>
          <div className="card-title"><span className="card-title-dot" style={{ background:"#0A66C2" }} />LINKEDIN</div>
          <div className="insight-area mb-2">
            <div className="insight-label">YOUR LINKEDIN PROFILE URL</div>
            <input type="url" value={extras.linkedin||""} onChange={(e) => update("extracurriculars.linkedin", e.target.value)} placeholder="https://linkedin.com/in/your-profile" />
          </div>
          {extras.linkedin && <a href={extras.linkedin} target="_blank" rel="noreferrer" className="btn btn-sm" style={{ background:"#0A66C2", color:"white", border:"2px solid #004A99", boxShadow:"2px 2px 0px #004A99" }}>Open LinkedIn →</a>}
          <div className="divider" />
          <div className="insight-area">
            <div className="insight-label">LINKEDIN NOTES & STRATEGY</div>
            <textarea value={extras.linkedinNotes||""} onChange={(e) => update("extracurriculars.linkedinNotes", e.target.value)} placeholder="Posts to write, connections to make, experiences to add…" style={{ minHeight:120 }} />
          </div>
        </div>
      )}

      {extTab === "genderlens" && (
        <>
          <div className="card mb-3" style={{ borderTop:"3px solid var(--purple)" }}>
            <div className="card-title"><span className="card-title-dot" style={{ background:"var(--purple)" }} />GENDERLENS TO-DOs</div>
            {glTodos.map(t => (
              <div key={t.id} className="todo-item">
                <button className={`todo-check ${t.done?"done":""}`} onClick={() => toggleGlTodo(t.id)}>{t.done && "✓"}</button>
                <span className={`todo-text ${t.done?"done":""}`}>{t.text}</span>
              </div>
            ))}
            <div className="add-row mt-2">
              <input type="text" placeholder="Add GenderLens task…" value={glTodoInput} onChange={(e) => setGlTodoInput(e.target.value)} onKeyDown={(e) => e.key==="Enter" && addGlTodo()} />
              <button className="btn btn-primary btn-sm" onClick={addGlTodo}>ADD</button>
            </div>
          </div>
          <div className="card mb-3" style={{ borderTop:"3px solid var(--purple)" }}>
            <div className="card-title"><span className="card-title-dot" style={{ background:"var(--purple)" }} />NOTES</div>
            <textarea value={genderLens.notes||""} onChange={(e) => update("extracurriculars.genderLens.notes", e.target.value)} placeholder="Project notes, meeting notes, ideas…" style={{ minHeight:120 }} />
          </div>
          <div className="card" style={{ borderTop:"3px solid var(--purple)" }}>
            <div className="card-title"><span className="card-title-dot" style={{ background:"var(--purple)" }} />KEY LINKS</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:8, marginBottom:12 }}>
              <input type="text" placeholder="Link title…" value={glLinkTitle} onChange={(e) => setGlLinkTitle(e.target.value)} />
              <input type="url" placeholder="https://…" value={glLinkUrl} onChange={(e) => setGlLinkUrl(e.target.value)} />
              <button className="btn btn-primary btn-sm" onClick={addGlLink}>SAVE</button>
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
              {glLinks.map(l => <a key={l.id} href={l.url} target="_blank" rel="noreferrer" className="link-tag">🔗 {l.title}</a>)}
              {glLinks.length === 0 && <div className="text-sm text-muted" style={{fontFamily:"var(--font-mono)"}}>// no links yet</div>}
            </div>
          </div>
        </>
      )}

      {extTab === "projects" && (
        <div className="card" style={{ borderTop:"3px solid var(--mint)" }}>
          <div className="card-title"><span className="card-title-dot" style={{ background:"var(--mint)" }} />OTHER PROJECTS</div>
          <div className="add-row mb-3">
            <input type="text" placeholder="New project name…" value={projectInput} onChange={(e) => setProjectInput(e.target.value)} onKeyDown={(e) => e.key==="Enter" && addProject()} />
            <button className="btn btn-cyan btn-sm" onClick={addProject}>ADD PROJECT</button>
          </div>
          {(extras.otherProjects || []).length === 0 && <div className="text-sm text-muted" style={{fontFamily:"var(--font-mono)"}}>// no other projects yet</div>}
          {(extras.otherProjects || []).map(p => (
            <div key={p.id} style={{ background:"var(--mint-light)", border:"2px solid var(--mint)", padding:"12px 16px", marginBottom:8, boxShadow:"2px 2px 0px var(--mint)", display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ fontFamily:"var(--font-pixel)", color:"#006644", fontSize:13 }}>◆ {p.title}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ─── TIMER PAGE ───────────────────────────────────────────────────────────────
function TimerPage({ data, timerRunning, timerSec, timerSubject, setTimerSubject, startTimer, stopTimer, todaySessions, thisWeekSessions, todayTotal, thisWeekTotal, subjectTotals, maxSubjectTotal, logStudyManual, toast }) {
  const subjectNames = Object.keys(data.subjects);
  const [manualSubject, setManualSubject] = useState(subjectNames[0] || "");
  const [manualLabel, setManualLabel] = useState("");
  const [manualHours, setManualHours] = useState("");
  const [manualMinutes, setManualMinutes] = useState("");
  const [timerTab, setTimerTab] = useState("timer");

  return (
    <>
      <div className="page-title">STUDY TIMER ◷</div>

      <div className="tabs" style={{ marginBottom:24 }}>
        <button className={`tab ${timerTab==="timer"?"active":""}`} onClick={()=>setTimerTab("timer")}>⏱ Live Timer</button>
        <button className={`tab ${timerTab==="manual"?"active":""}`} onClick={()=>setTimerTab("manual")}>✏ Log Manually</button>
        <button className={`tab ${timerTab==="log"?"active":""}`} onClick={()=>setTimerTab("log")}>📋 Session Log</button>
      </div>

      {timerTab === "timer" && (
        <div className="grid-2 mb-3">
          <div className="card" style={{ textAlign:"center", borderTop:`3px solid ${timerRunning?"var(--pink)":"var(--border-pixel)"}` }}>
            <div className="timer-display" style={{ color: timerRunning ? "var(--pink)" : "var(--text)", textShadow: timerRunning ? "3px 3px 0px var(--pink-hot)" : "3px 3px 0px var(--sand)" }}>
              {String(Math.floor(timerSec/3600)).padStart(2,"0")}:{String(Math.floor((timerSec%3600)/60)).padStart(2,"0")}:{String(timerSec%60).padStart(2,"0")}
            </div>
            <div style={{ marginTop:16, marginBottom:16 }}>
              <select value={timerSubject} onChange={(e) => setTimerSubject(e.target.value)} style={{ maxWidth:200, margin:"0 auto" }}>
                {subjectNames.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
              {!timerRunning
                ? <button className="btn btn-primary" onClick={startTimer}>▶ START</button>
                : <button className="btn btn-ghost" onClick={stopTimer} style={{ borderColor:"#ef4444", color:"#ef4444", boxShadow:"2px 2px 0px #ef4444" }}>⏹ STOP & LOG</button>
              }
            </div>
            {timerRunning && (
              <div style={{ marginTop:14, fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted)" }}>
                // studying: <span style={{color:"var(--pink)"}}>{timerSubject}</span>
              </div>
            )}
          </div>
          <div className="card">
            <div className="card-title"><span className="card-title-dot" />STATS</div>
            <div className="grid-2 mb-2">
              <div className="stat-card" style={{ padding:14 }}>
                <div className="stat-num" style={{ fontSize:22 }}>{fmtDuration(todayTotal) || "0m"}</div>
                <div className="stat-label">Today</div>
              </div>
              <div className="stat-card" style={{ padding:14 }}>
                <div className="stat-num" style={{ fontSize:22 }}>{fmtDuration(thisWeekTotal) || "0m"}</div>
                <div className="stat-label">This Week</div>
              </div>
            </div>
            {Object.entries(subjectTotals).sort((a,b) => b[1]-a[1]).map(([sub, sec]) => (
              <div key={sub} className="bar-row">
                <div className="bar-label">{sub}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width:`${(sec/maxSubjectTotal)*100}%`, background:data.subjects[sub]?.color || "var(--pink)" }} />
                </div>
                <div className="bar-val">{fmtDuration(sec)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {timerTab === "manual" && (
        <div className="grid-2 mb-3">
          <div className="card" style={{ borderTop:"3px solid var(--cyan)" }}>
            <div className="card-title"><span className="card-title-dot" style={{background:"var(--cyan)"}}/>LOG STUDY TIME MANUALLY ✏</div>
            <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted)", marginBottom:16 }}>
              // forgot to start the timer? log time directly here
            </div>

            <div className="mb-2">
              <div className="insight-label mb-1">SUBJECT</div>
              <select value={manualSubject} onChange={e=>setManualSubject(e.target.value)} style={{ width:"100%" }}>
                {subjectNames.map(s => <option key={s} value={s}>{s}</option>)}
                <option value="General">General / Other</option>
                <option value="Extracurriculars">Extracurriculars</option>
              </select>
            </div>

            <div className="mb-2">
              <div className="insight-label mb-1">WHAT DID YOU STUDY? <span style={{fontWeight:"normal",textTransform:"none",letterSpacing:0}}>(optional custom label)</span></div>
              <input
                type="text"
                placeholder={`e.g. "${manualSubject} past papers", "Chapter 4 revision"…`}
                value={manualLabel}
                onChange={e=>setManualLabel(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <div className="insight-label mb-1">DURATION</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div>
                  <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted)", marginBottom:4 }}>Hours</div>
                  <input
                    type="number"
                    min="0" max="12"
                    placeholder="0"
                    value={manualHours}
                    onChange={e=>setManualHours(e.target.value)}
                    style={{ textAlign:"center", fontFamily:"var(--font-pixel)", fontSize:22 }}
                  />
                </div>
                <div>
                  <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted)", marginBottom:4 }}>Minutes</div>
                  <input
                    type="number"
                    min="0" max="59"
                    placeholder="0"
                    value={manualMinutes}
                    onChange={e=>setManualMinutes(e.target.value)}
                    style={{ textAlign:"center", fontFamily:"var(--font-pixel)", fontSize:22 }}
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            {(manualHours || manualMinutes) && (
              <div style={{ padding:"10px 14px", background:"var(--cyan-light)", border:"2px solid var(--cyan)", marginBottom:14 }}>
                <div style={{ fontFamily:"var(--font-pixel)", fontSize:11, color:"#006688" }}>
                  ◷ Logging {manualHours||0}h {manualMinutes||0}m for <span style={{color:"var(--cyan)"}}>{manualLabel.trim() || manualSubject}</span>
                </div>
              </div>
            )}

            <button
              className="btn btn-cyan w-full"
              onClick={()=>{ logStudyManual(manualSubject, manualLabel, manualHours, manualMinutes); setManualLabel(""); setManualHours(""); setManualMinutes(""); }}
            >
              ✓ LOG THIS SESSION
            </button>
          </div>

          <div className="card">
            <div className="card-title"><span className="card-title-dot"/>STATS</div>
            <div className="grid-2 mb-2">
              <div className="stat-card" style={{ padding:14 }}>
                <div className="stat-num" style={{ fontSize:22 }}>{fmtDuration(todayTotal) || "0m"}</div>
                <div className="stat-label">Today</div>
              </div>
              <div className="stat-card" style={{ padding:14 }}>
                <div className="stat-num" style={{ fontSize:22 }}>{fmtDuration(thisWeekTotal) || "0m"}</div>
                <div className="stat-label">This Week</div>
              </div>
            </div>
            {Object.entries(subjectTotals).sort((a,b) => b[1]-a[1]).map(([sub, sec]) => (
              <div key={sub} className="bar-row">
                <div className="bar-label">{sub}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width:`${(sec/maxSubjectTotal)*100}%`, background:data.subjects[sub]?.color || "var(--pink)" }} />
                </div>
                <div className="bar-val">{fmtDuration(sec)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {timerTab === "log" && (
        <div className="card">
          <div className="card-title"><span className="card-title-dot"/>SESSION LOG 📋</div>
          {todaySessions.length === 0 ? (
            <div className="text-sm text-muted" style={{fontFamily:"var(--font-mono)"}}>// no sessions logged today yet</div>
          ) : (
            <>
              <div style={{ fontFamily:"var(--font-pixel)", fontSize:10, color:"var(--muted)", letterSpacing:"0.1em", marginBottom:10 }}>TODAY</div>
              {[...todaySessions].reverse().map(s => (
                <div key={s.id} className="session-log-item">
                  <span className="badge badge-med" style={{ background: data.subjects[s.subject]?.color+"22", borderColor: data.subjects[s.subject]?.color, color: data.subjects[s.subject]?.color }}>{s.subject}</span>
                  {s.label && s.label !== s.subject && (
                    <span style={{ fontFamily:"var(--font-body)", fontSize:12, color:"var(--text-soft)", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.label}</span>
                  )}
                  {s.manual && <span style={{ fontFamily:"var(--font-pixel)", fontSize:8, color:"var(--cyan)", border:"1px solid var(--cyan)", padding:"1px 5px" }}>MANUAL</span>}
                  <span className="text-muted text-sm" style={{fontFamily:"var(--font-mono)"}}>{new Date(s.ts).toLocaleTimeString("en-AU", { hour:"2-digit", minute:"2-digit" })}</span>
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:12 }}>{fmtTime(s.duration)}</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </>
  );
}

// ─── RESOURCES PAGE ───────────────────────────────────────────────────────────
function ResourcesPage({ data, saveData, update, toast }) {
  const [bookmarkTitle, setBookmarkTitle] = useState("");
  const [bookmarkUrl, setBookmarkUrl] = useState("");
  const [visionUrl, setVisionUrl] = useState("");
  const [visionCaption, setVisionCaption] = useState("");
  const [resTab, setResTab] = useState("bookmarks");
  const visionFileRef = useRef(null);

  const addBookmark = () => {
    if (!bookmarkTitle.trim() || !bookmarkUrl.trim()) return;
    const newData = JSON.parse(JSON.stringify(data));
    newData.bookmarks = [...(newData.bookmarks || []), { id:uid(), title:bookmarkTitle, url:bookmarkUrl }];
    saveData(newData);
    setBookmarkTitle(""); setBookmarkUrl("");
    toast("Bookmark saved ✓");
  };
  const deleteBookmark = (id) => {
    const newData = JSON.parse(JSON.stringify(data));
    newData.bookmarks = newData.bookmarks.filter(b => b.id !== id);
    saveData(newData);
  };
  const addVisionImage = () => {
    if (!visionUrl.trim()) return;
    const newData = JSON.parse(JSON.stringify(data));
    newData.visionBoard = [...(newData.visionBoard || []), { id:uid(), url:visionUrl, caption:visionCaption }];
    saveData(newData);
    setVisionUrl(""); setVisionCaption("");
    toast("✦ Vision image added!");
  };
  const addVisionFile = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    let loaded = 0;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const newData = JSON.parse(JSON.stringify(data));
        newData.visionBoard = [...(newData.visionBoard || []), { id:uid(), url:ev.target.result, caption:"" }];
        saveData(newData);
        loaded++;
        if (loaded === files.length) toast(`✦ ${files.length} image${files.length>1?"s":""} added to vision board!`);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };
  const deleteVision = (id) => {
    const newData = JSON.parse(JSON.stringify(data));
    newData.visionBoard = newData.visionBoard.filter(v => v.id !== id);
    saveData(newData);
  };

  return (
    <>
      <div className="page-title">RESOURCES ⊞</div>
      <div className="tabs">
        {[{ key:"bookmarks", label:"🔖 Bookmarks" }, { key:"notes", label:"📝 Quick Notes" }, { key:"vision", label:"🌅 Vision Board" }].map(t => (
          <button key={t.key} className={`tab ${resTab===t.key?"active":""}`} onClick={() => setResTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {resTab === "bookmarks" && (
        <>
          <div className="card mb-3">
            <div className="card-title">ADD BOOKMARK</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:8 }}>
              <input type="text" placeholder="Title" value={bookmarkTitle} onChange={(e) => setBookmarkTitle(e.target.value)} />
              <input type="url" placeholder="https://…" value={bookmarkUrl} onChange={(e) => setBookmarkUrl(e.target.value)} onKeyDown={(e) => e.key==="Enter" && addBookmark()} />
              <button className="btn btn-primary btn-sm" onClick={addBookmark}>SAVE</button>
            </div>
          </div>
          <div className="grid-auto">
            {(data.bookmarks || []).map(b => (
              <div key={b.id} className="bookmark-card" style={{ position:"relative" }}>
                <button onClick={() => deleteBookmark(b.id)} style={{ position:"absolute", top:8, right:8, background:"none", border:"none", cursor:"pointer", color:"var(--muted)", fontSize:18 }}>×</button>
                <div className="bookmark-title">{b.title}</div>
                <a href={b.url} target="_blank" rel="noreferrer" className="bookmark-url">{b.url}</a>
              </div>
            ))}
          </div>
          {(data.bookmarks || []).length === 0 && <div className="text-sm text-muted" style={{fontFamily:"var(--font-mono)"}}>// no bookmarks yet</div>}
        </>
      )}

      {resTab === "notes" && (
        <div className="card">
          <div className="card-title">QUICK NOTES</div>
          <textarea value={data.quickNotes||""} onChange={(e) => update("quickNotes", e.target.value)} placeholder="Jot anything down here…" style={{ minHeight:320, fontSize:14, lineHeight:1.8 }} />
        </div>
      )}

      {resTab === "vision" && (
        <>
          <div className="card mb-3" style={{ borderTop:"3px solid var(--purple)" }}>
            <div className="card-title"><span className="card-title-dot" style={{background:"var(--purple)"}}/>VISION BOARD 🌅</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:8, marginBottom:10 }}>
              <input type="url" placeholder="Or paste image URL…" value={visionUrl} onChange={(e) => setVisionUrl(e.target.value)} onKeyDown={(e) => e.key==="Enter" && addVisionImage()} />
              <button className="btn btn-primary btn-sm" onClick={addVisionImage}>ADD URL</button>
            </div>
            <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => visionFileRef.current?.click()} style={{ borderColor:"var(--purple)", color:"var(--purple)" }}>
                📁 Upload Images (multiple)
              </button>
              <input ref={visionFileRef} type="file" accept="image/*" multiple style={{ display:"none" }} onChange={addVisionFile} />
              <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted)" }}>// jpg, png, gif, webp supported · select multiple!</div>
            </div>
          </div>
          <div className="vision-grid">
            {(data.visionBoard || []).map(v => (
              <div key={v.id} style={{ position:"relative", borderRadius:0 }}>
                <img src={v.url} className="vision-img" alt={v.caption||"vision"} onError={(e) => { e.target.style.background="var(--sand)"; }} />
                <button onClick={() => deleteVision(v.id)} style={{ position:"absolute", top:6, right:6, background:"rgba(0,0,0,0.6)", border:"2px solid white", width:26, height:26, color:"white", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
                {v.caption && <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"rgba(0,0,0,0.65)", padding:"4px 8px", fontFamily:"var(--font-pixel)", fontSize:9, color:"white", letterSpacing:"0.04em" }}>{v.caption}</div>}
              </div>
            ))}
            <div className="vision-add" onClick={() => visionFileRef.current?.click()}>
              <span style={{ fontSize:28 }}>📸</span>
              <span>Upload / Add</span>
              <span style={{ fontFamily:"var(--font-mono)", fontSize:9, opacity:0.7 }}>click to browse</span>
            </div>
          </div>
          {(data.visionBoard || []).length === 0 && (
            <div style={{ textAlign:"center", padding:"40px 0", fontFamily:"var(--font-mono)", fontSize:11, color:"var(--muted)" }}>
              // your vision board is empty — upload images or paste URLs above to manifest your goals ✦
            </div>
          )}
        </>
      )}
    </>
  );
}

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────
function SettingsPage({ data, update, saveData }) {
  const [showJson, setShowJson] = useState(false);
  const [jsonText, setJsonText] = useState("");

  const exportJson = () => {
    setJsonText(JSON.stringify(data, null, 2));
    setShowJson(true);
  };
  const importJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      saveData(parsed);
      alert("Data imported successfully!");
    } catch (e) {
      alert("Invalid JSON. Please check and try again.");
    }
  };

  return (
    <>
      <div className="page-title">SETTINGS ⚙</div>
      <div className="grid-2 mb-3">
        <div className="card">
          <div className="card-title">PROFILE</div>
          <div className="mb-2">
            <div className="insight-label mb-1">YOUR NAME</div>
            <input type="text" value={data.settings?.name||""} onChange={(e) => update("settings.name", e.target.value)} placeholder="Your name" />
          </div>
        </div>
        <div className="card">
          <div className="card-title">HERO IMAGE</div>
          <div className="mb-2">
            <div className="insight-label mb-1">HERO BACKGROUND IMAGE URL</div>
            <input type="url" value={data.heroImage||""} onChange={(e) => update("heroImage", e.target.value)} placeholder="https://your-image.jpg" />
          </div>
        </div>
      </div>
      <div className="card mb-3">
        <div className="card-title">SUPABASE SYNC</div>
        <div className="text-sm text-muted mb-2" style={{ lineHeight:1.7, fontFamily:"var(--font-mono)", fontSize:11 }}>
          Dashboard syncs via Supabase. Table: <code style={{ background:"var(--sand)", padding:"1px 6px" }}>hsc_dashboard</code> with columns <code style={{ background:"var(--sand)", padding:"1px 6px" }}>id (int8)</code> and <code style={{ background:"var(--sand)", padding:"1px 6px" }}>payload (jsonb)</code>.
        </div>
        <a href="https://supabase.com" target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">Open Supabase →</a>
      </div>
      <div className="card">
        <div className="card-title">EXPORT / IMPORT</div>
        <div className="flex gap-1 mb-2">
          <button className="btn btn-ghost btn-sm" onClick={exportJson}>EXPORT JSON</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowJson(!showJson)}>{showJson ? "HIDE EDITOR" : "IMPORT JSON"}</button>
        </div>
        {showJson && (
          <>
            <textarea value={jsonText} onChange={(e) => setJsonText(e.target.value)} style={{ minHeight:200, fontFamily:"var(--font-mono)", fontSize:11 }} />
            <button className="btn btn-primary btn-sm mt-1" onClick={importJson}>IMPORT THIS DATA</button>
          </>
        )}
      </div>
    </>
  );
}
// ─── STUDY CALENDAR PAGE ─────────────────────────────────────────────────────
function StudyCalendarPage({ data }) {
  const sessions = data.studySessions || [];
  const subjectColors = Object.fromEntries(
    Object.entries(data.subjects).map(([k,v]) => [k, v.color])
  );

  // Build per-day totals for last 90 days (heatmap)
  const today = new Date();
  const days90 = Array.from({ length: 90 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (89 - i));
    return d.toISOString().slice(0, 10);
  });
  const dayTotals = {};
  sessions.forEach(s => {
    dayTotals[s.date] = (dayTotals[s.date] || 0) + s.duration;
  });
  const maxDay = Math.max(1, ...Object.values(dayTotals));

  // Selected day view
  const [selectedDay, setSelectedDay] = useState(today.toISOString().slice(0,10));
  const daySessions = sessions.filter(s => s.date === selectedDay).sort((a,b) => new Date(a.ts)-new Date(b.ts));
  const dayTotal = daySessions.reduce((a,s) => a+s.duration, 0);

  // Month grouping of the 90 days
  const weeks = [];
  let week = [];
  // Pad first week
  const firstDayOfWeek = new Date(days90[0]).getDay(); // 0=Sun
  for (let p = 0; p < firstDayOfWeek; p++) week.push(null);
  days90.forEach(d => {
    week.push(d);
    if (week.length === 7) { weeks.push(week); week = []; }
  });
  if (week.length) { while(week.length < 7) week.push(null); weeks.push(week); }

  const heatColor = (sec) => {
    if (!sec) return "var(--sand)";
    const pct = sec / maxDay;
    if (pct < 0.25) return "#FFD6ED";
    if (pct < 0.5)  return "#FF9FD0";
    if (pct < 0.75) return "#FF3FA4";
    return "#FF006E";
  };

  // Weekly bar chart (last 8 weeks)
  const weekLabels = [];
  const weekTotals = [];
  for (let w = 7; w >= 0; w--) {
    const wStart = new Date(today);
    wStart.setDate(wStart.getDate() - wStart.getDay() - w * 7 + 1);
    const wEnd = new Date(wStart); wEnd.setDate(wEnd.getDate() + 6);
    const label = wStart.toLocaleDateString("en-AU",{day:"numeric",month:"short"});
    const total = sessions.filter(s => s.date >= wStart.toISOString().slice(0,10) && s.date <= wEnd.toISOString().slice(0,10)).reduce((a,s)=>a+s.duration,0);
    weekLabels.push(label); weekTotals.push(total);
  }
  const maxWeek = Math.max(1, ...weekTotals);

  const fmtHM = (sec) => {
    const h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <>
      <div className="page-title">STUDY CALENDAR 📅</div>

      {/* HEATMAP */}
      <div className="card mb-3" style={{ borderTop:"3px solid var(--pink)" }}>
        <div className="card-title"><span className="card-title-dot"/>ACTIVITY HEATMAP — LAST 90 DAYS</div>
        <div style={{ display:"flex", gap:3, overflowX:"auto", paddingBottom:8 }}>
          {weeks.map((wk, wi) => (
            <div key={wi} style={{ display:"flex", flexDirection:"column", gap:3 }}>
              {wk.map((d, di) => d ? (
                <div
                  key={di}
                  title={`${d}: ${fmtHM(dayTotals[d]||0)}`}
                  onClick={() => setSelectedDay(d)}
                  style={{
                    width:14, height:14,
                    background: heatColor(dayTotals[d]||0),
                    border: d === selectedDay ? "2px solid var(--text)" : "1px solid var(--border)",
                    cursor:"pointer",
                    transition:"transform 0.1s",
                    boxShadow: d === selectedDay ? "0 0 0 1px var(--pink)" : "none",
                  }}
                />
              ) : <div key={di} style={{width:14,height:14}}/>)}
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:6, alignItems:"center", marginTop:10, fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted)" }}>
          less
          {["var(--sand)","#FFD6ED","#FF9FD0","#FF3FA4","#FF006E"].map((c,i) => (
            <div key={i} style={{width:12,height:12,background:c,border:"1px solid var(--border)"}}/>
          ))}
          more
        </div>
      </div>

      <div className="grid-2 mb-3">
        {/* DAY VIEW */}
        <div className="card" style={{ borderTop:`3px solid var(--cyan)` }}>
          <div className="card-title" style={{ justifyContent:"space-between" }}>
            <span style={{ display:"flex",alignItems:"center",gap:8 }}><span className="card-title-dot" style={{background:"var(--cyan)"}}/>
              {new Date(selectedDay+"T12:00:00").toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"long"})}
            </span>
            <span style={{ fontFamily:"var(--font-pixel)", fontSize:11, color:"var(--cyan)" }}>{fmtHM(dayTotal)}</span>
          </div>
          {daySessions.length === 0 ? (
            <div style={{fontFamily:"var(--font-mono)",fontSize:11,color:"var(--muted)",padding:"16px 0"}}>// no sessions recorded on this day<br/>// click a heatmap cell to explore</div>
          ) : (
            <div style={{ position:"relative", paddingLeft:20 }}>
              {/* timeline line */}
              <div style={{ position:"absolute", left:7, top:0, bottom:0, width:2, background:"var(--border)", borderRadius:2 }} />
              {daySessions.map((s,i) => {
                const clr = subjectColors[s.subject] || "var(--pink)";
                const time = new Date(s.ts).toLocaleTimeString("en-AU",{hour:"2-digit",minute:"2-digit"});
                return (
                  <div key={s.id} style={{ position:"relative", marginBottom:14 }}>
                    {/* dot */}
                    <div style={{ position:"absolute", left:-16, top:4, width:10, height:10, background:clr, border:"2px solid white", boxShadow:`0 0 0 2px ${clr}` }} />
                    <div style={{ padding:"10px 12px", background:`${clr}18`, border:`2px solid ${clr}44`, borderLeft:`3px solid ${clr}` }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                        <div>
                          <div style={{ fontFamily:"var(--font-pixel)", fontSize:12, color:clr }}>{s.subject}</div>
                          {s.label && s.label !== s.subject && (
                            <div style={{ fontFamily:"var(--font-body)", fontSize:12, color:"var(--text-soft)", marginTop:2 }}>{s.label}</div>
                          )}
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontFamily:"var(--font-pixel)", fontSize:13, color:"var(--text)" }}>{fmtHM(s.duration)}</div>
                          <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--muted)", marginTop:2 }}>{time}{s.manual?" · manual":""}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* day total */}
              <div style={{ padding:"8px 12px", background:"var(--sand)", border:"2px solid var(--border-pixel)", display:"flex", justifyContent:"space-between", marginTop:4 }}>
                <span style={{fontFamily:"var(--font-pixel)",fontSize:11,color:"var(--text)"}}>TOTAL</span>
                <span style={{fontFamily:"var(--font-pixel)",fontSize:13,color:"var(--pink)"}}>{fmtHM(dayTotal)}</span>
              </div>
            </div>
          )}
        </div>

        {/* WEEKLY BARS */}
        <div className="card" style={{ borderTop:"3px solid var(--purple)" }}>
          <div className="card-title"><span className="card-title-dot" style={{background:"var(--purple)"}}/>WEEKLY OVERVIEW (8 WEEKS)</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {weekLabels.map((label, i) => (
              <div key={i} className="bar-row">
                <div className="bar-label" style={{ width:70, fontSize:10 }}>{label}</div>
                <div className="bar-track" style={{ flex:1 }}>
                  <div className="bar-fill" style={{ width:`${(weekTotals[i]/maxWeek)*100}%`, background: i===7?"var(--pink)":"var(--purple)", opacity: i===7?1:0.6+i*0.05 }} />
                </div>
                <div className="bar-val">{weekTotals[i] ? fmtHM(weekTotals[i]) : "—"}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SUBJECT BREAKDOWN for selected day */}
      {daySessions.length > 0 && (
        <div className="card" style={{ borderTop:"3px solid var(--yellow-bright)" }}>
          <div className="card-title"><span className="card-title-dot" style={{background:"var(--yellow)"}}/>BREAKDOWN — {new Date(selectedDay+"T12:00:00").toLocaleDateString("en-AU",{day:"numeric",month:"short"})}</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px,1fr))", gap:12 }}>
            {Object.entries(
              daySessions.reduce((acc, s) => { acc[s.subject]=(acc[s.subject]||0)+s.duration; return acc; }, {})
            ).sort((a,b)=>b[1]-a[1]).map(([sub,sec]) => {
              const clr = subjectColors[sub] || "var(--pink)";
              const pct = Math.round(sec/dayTotal*100);
              return (
                <div key={sub} style={{ padding:"12px 14px", border:`2px solid ${clr}44`, borderTop:`3px solid ${clr}` }}>
                  <div style={{ fontFamily:"var(--font-pixel)", fontSize:12, color:clr, marginBottom:6 }}>{sub}</div>
                  <div style={{ fontFamily:"var(--font-pixel)", fontSize:20, color:"var(--text)" }}>{fmtHM(sec)}</div>
                  <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--muted)", marginTop:4 }}>{pct}% of today</div>
                  <div style={{ marginTop:8, height:5, background:"var(--border)" }}>
                    <div style={{ height:"100%", width:`${pct}%`, background:clr }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

// ─── HABIT TRACKER PAGE ────────────────────────────────────────────────────────
function HabitTrackerPage({ data, saveData, toast }) {
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitIcon, setNewHabitIcon] = useState("⭐");
  const [newHabitColor, setNewHabitColor] = useState("#FF3FA4");
  const [showAdd, setShowAdd] = useState(false);
  const todayStr = new Date().toISOString().slice(0,10);

  const habits = data.habits || [];

  const addHabit = () => {
    if (!newHabitName.trim()) return;
    const newData = JSON.parse(JSON.stringify(data));
    newData.habits = [...(newData.habits||[]), { id:uid(), name:newHabitName, icon:newHabitIcon, color:newHabitColor, logs:{} }];
    saveData(newData); toast(`${newHabitIcon} Habit added!`);
    setNewHabitName(""); setShowAdd(false);
  };
  const deleteHabit = (id) => {
    const newData = JSON.parse(JSON.stringify(data));
    newData.habits = newData.habits.filter(h=>h.id!==id); saveData(newData);
  };
  const toggleLog = (id, dateStr) => {
    const newData = JSON.parse(JSON.stringify(data));
    const h = newData.habits.find(h=>h.id===id);
    if (!h) return;
    h.logs = h.logs || {};
    if (h.logs[dateStr]) delete h.logs[dateStr]; else h.logs[dateStr] = true;
    saveData(newData);
  };

  // Build last 30 days
  const last30 = Array.from({length:30},(_,i)=>{
    const d = new Date(); d.setDate(d.getDate()-(29-i));
    return d.toISOString().slice(0,10);
  });

  const calcStreak = (logs) => {
    let streak = 0;
    const d = new Date();
    while (true) {
      const s = d.toISOString().slice(0,10);
      if (logs[s]) { streak++; d.setDate(d.getDate()-1); }
      else break;
    }
    return streak;
  };

  const calcLongestStreak = (logs) => {
    const sorted = Object.keys(logs).filter(k=>logs[k]).sort();
    let max=0, cur=0;
    for (let i=0; i<sorted.length; i++) {
      if (i===0) { cur=1; }
      else {
        const prev = new Date(sorted[i-1]); prev.setDate(prev.getDate()+1);
        if (prev.toISOString().slice(0,10)===sorted[i]) cur++;
        else cur=1;
      }
      max=Math.max(max,cur);
    }
    return max;
  };

  const ICONS = ["⭐","💪","📚","🧘","💧","🏃","🥗","😴","✍️","🎯","🧠","🎵","📝","🌱","☀️","🔥"];
  const COLORS = ["#FF3FA4","#BF5FFF","#00E5FF","#00F5A0","#FFD700","#FF6B35","#4CC9F0","#06D6A0"];

  return (
    <>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div className="page-title">HABIT TRACKER 🔥</div>
        <button className="btn btn-primary btn-sm" onClick={()=>setShowAdd(v=>!v)}>
          {showAdd ? "✕ CANCEL" : "+ NEW HABIT"}
        </button>
      </div>

      {showAdd && (
        <div className="card mb-3" style={{ borderTop:"3px solid var(--mint)" }}>
          <div className="card-title"><span className="card-title-dot" style={{background:"var(--mint)"}}/>ADD NEW HABIT</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr auto auto", gap:10, marginBottom:14 }}>
            <input type="text" placeholder="Habit name e.g. Drink 2L water, Exercise 30min…" value={newHabitName} onChange={e=>setNewHabitName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addHabit()} />
            <input type="color" value={newHabitColor} onChange={e=>setNewHabitColor(e.target.value)} style={{ width:48, height:44, padding:4, cursor:"pointer", border:"2px solid var(--border-pixel)" }} title="Pick colour" />
            <button className="btn btn-primary btn-sm" onClick={addHabit}>ADD +</button>
          </div>
          <div className="insight-label mb-2">PICK ICON</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {ICONS.map(ic => (
              <button key={ic} onClick={()=>setNewHabitIcon(ic)} style={{ fontSize:20, width:40, height:40, cursor:"pointer", border: ic===newHabitIcon ? `2px solid var(--pink)` : "2px solid var(--border)", background: ic===newHabitIcon ? "var(--pink-light)" : "var(--bg2)", boxShadow: ic===newHabitIcon ? "var(--shadow-hot)" : "2px 2px 0px var(--border-pixel)" }}>{ic}</button>
            ))}
          </div>
        </div>
      )}

      {habits.length === 0 && !showAdd && (
        <div style={{ textAlign:"center", padding:"60px 0", fontFamily:"var(--font-mono)", fontSize:12, color:"var(--muted)" }}>
          // no habits yet — click "+ NEW HABIT" to start tracking ✦
        </div>
      )}

      {/* TODAY'S CHECK-IN */}
      {habits.length > 0 && (
        <div className="card mb-3" style={{ borderTop:"3px solid var(--yellow-bright)" }}>
          <div className="card-title">
            <span className="card-title-dot" style={{background:"var(--yellow)"}}/>
            TODAY'S CHECK-IN
            <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted)", marginLeft:10 }}>
              {new Date().toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"short"})}
            </span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:12 }}>
            {habits.map(h => {
              const done = !!(h.logs||{})[todayStr];
              const streak = calcStreak(h.logs||{});
              return (
                <button
                  key={h.id}
                  onClick={()=>toggleLog(h.id, todayStr)}
                  style={{
                    display:"flex", flexDirection:"column", alignItems:"center", gap:8,
                    padding:"18px 12px", cursor:"pointer",
                    border: done ? `3px solid ${h.color}` : "2px solid var(--border-pixel)",
                    background: done ? `${h.color}22` : "var(--bg2)",
                    boxShadow: done ? `3px 3px 0px ${h.color}` : "3px 3px 0px var(--border-pixel)",
                    transition:"all 0.15s", position:"relative",
                  }}
                >
                  <div style={{ fontSize:28 }}>{h.icon}</div>
                  <div style={{ fontFamily:"var(--font-pixel)", fontSize:11, color: done ? h.color : "var(--text)", textAlign:"center" }}>{h.name}</div>
                  {streak > 0 && (
                    <div style={{ fontFamily:"var(--font-pixel)", fontSize:10, color:"#FF6B35" }}>🔥 {streak} day streak</div>
                  )}
                  <div style={{
                    position:"absolute", top:8, right:8,
                    width:20, height:20,
                    background: done ? h.color : "var(--border)",
                    border: `2px solid ${done ? h.color : "var(--border-pixel)"}`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontFamily:"var(--font-pixel)", fontSize:12, color:"white"
                  }}>{done ? "✓" : ""}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* PROGRESS GRID (last 30 days) */}
      {habits.length > 0 && (
        <div className="card mb-3" style={{ borderTop:"3px solid var(--purple)" }}>
          <div className="card-title"><span className="card-title-dot" style={{background:"var(--purple)"}}/>30-DAY PROGRESS GRID</div>
          {/* Day headers */}
          <div style={{ overflowX:"auto" }}>
            <div style={{ minWidth:700 }}>
              <div style={{ display:"grid", gridTemplateColumns:"160px repeat(30, 1fr)", gap:3, marginBottom:4 }}>
                <div />
                {last30.map(d => (
                  <div key={d} style={{ fontFamily:"var(--font-mono)", fontSize:8, color:"var(--muted)", textAlign:"center", lineHeight:1 }}>
                    {new Date(d+"T12:00:00").getDate()}
                  </div>
                ))}
              </div>
              {habits.map(h => {
                const streak = calcStreak(h.logs||{});
                const longest = calcLongestStreak(h.logs||{});
                const total = Object.values(h.logs||{}).filter(Boolean).length;
                const rate = Math.round(total/30*100);
                return (
                  <div key={h.id} style={{ display:"grid", gridTemplateColumns:"160px repeat(30, 1fr)", gap:3, marginBottom:6, alignItems:"center" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, paddingRight:8 }}>
                      <span style={{fontSize:16}}>{h.icon}</span>
                      <div>
                        <div style={{ fontFamily:"var(--font-pixel)", fontSize:10, color:h.color, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:110 }}>{h.name}</div>
                        <div style={{ fontFamily:"var(--font-mono)", fontSize:8, color:"var(--muted)" }}>{rate}% this month</div>
                      </div>
                      <button onClick={()=>deleteHabit(h.id)} style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", color:"var(--muted)", fontSize:14, padding:"0 2px", flexShrink:0 }}>×</button>
                    </div>
                    {last30.map(d => {
                      const done = !!(h.logs||{})[d];
                      const isToday2 = d === todayStr;
                      return (
                        <div
                          key={d}
                          title={`${d}`}
                          onClick={()=>toggleLog(h.id,d)}
                          style={{
                            height:22,
                            background: done ? h.color : "var(--sand)",
                            border: isToday2 ? `2px solid var(--text)` : "1px solid var(--border)",
                            cursor:"pointer",
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:10, color:"white", fontFamily:"var(--font-pixel)",
                            opacity: done ? 1 : 0.5,
                            transition:"all 0.1s",
                          }}
                        >{done ? "✓" : ""}</div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* HABIT STATS */}
      {habits.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:14 }}>
          {habits.map(h => {
            const streak = calcStreak(h.logs||{});
            const longest = calcLongestStreak(h.logs||{});
            const total30 = last30.filter(d=>(h.logs||{})[d]).length;
            const totalAll = Object.values(h.logs||{}).filter(Boolean).length;
            return (
              <div key={h.id} className="card" style={{ borderTop:`3px solid ${h.color}`, padding:"14px 16px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                  <span style={{fontSize:24}}>{h.icon}</span>
                  <div>
                    <div style={{ fontFamily:"var(--font-pixel)", fontSize:12, color:h.color }}>{h.name}</div>
                    <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--muted)" }}>{totalAll} total check-ins</div>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, textAlign:"center" }}>
                  {[
                    { val: streak, label:"Current streak", unit:"🔥"},
                    { val: longest, label:"Best streak", unit:"🏆"},
                    { val: `${Math.round(total30/30*100)}%`, label:"Last 30 days", unit:"📊"},
                  ].map((s,i) => (
                    <div key={i} style={{ padding:"8px 4px", background:`${h.color}12`, border:`1px solid ${h.color}33` }}>
                      <div style={{ fontFamily:"var(--font-pixel)", fontSize:18, color:h.color }}>{s.val}</div>
                      <div style={{ fontFamily:"var(--font-pixel)", fontSize:8, color:"var(--muted)", marginTop:2 }}>{s.unit} {s.label}</div>
                    </div>
                  ))}
                </div>
                {/* mini 4-week bar */}
                <div style={{ marginTop:12, display:"flex", gap:3 }}>
                  {last30.slice(-28).map((d,i) => (
                    <div key={d} style={{ flex:1, height:8, background:(h.logs||{})[d]?h.color:"var(--sand)", border:"1px solid var(--border)", opacity:0.8+(i/28)*0.2 }} />
                  ))}
                </div>
                <div style={{ fontFamily:"var(--font-mono)", fontSize:8, color:"var(--muted)", marginTop:4 }}>last 28 days ↑</div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ─── WIDGETS PAGE ─────────────────────────────────────────────────────────────
function WidgetsPage({ data, saveData, toast }) {
  const [imgUrl, setImgUrl] = useState("");
  const [imgCaption, setImgCaption] = useState("");
  const [layout, setLayout] = useState("masonry");
  const fileRef = useRef(null);
  const widgets = data.dashWidgets || [];

  const addUrl = () => {
    if (!imgUrl.trim()) return;
    const newData = JSON.parse(JSON.stringify(data));
    newData.dashWidgets = [...(newData.dashWidgets||[]), { id:uid(), url:imgUrl, caption:imgCaption }];
    saveData(newData); setImgUrl(""); setImgCaption("");
    toast("🖼 Widget added!");
  };
  const addFile = (e) => {
    const files = Array.from(e.target.files||[]);
    if (!files.length) return;
    let done = 0;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        const newData = JSON.parse(JSON.stringify(data));
        newData.dashWidgets = [...(newData.dashWidgets||[]), { id:uid(), url:ev.target.result, caption:"" }];
        saveData(newData); done++;
        if (done===files.length) toast(`🖼 ${done} image${done>1?"s":""} added!`);
      };
      reader.readAsDataURL(file);
    });
    e.target.value="";
  };
  const removeWidget = (id) => {
    const newData = JSON.parse(JSON.stringify(data));
    newData.dashWidgets = (newData.dashWidgets||[]).filter(w=>w.id!==id);
    saveData(newData);
  };
  const updateCaption = (id, caption) => {
    const newData = JSON.parse(JSON.stringify(data));
    const w = newData.dashWidgets.find(w=>w.id===id);
    if (w) w.caption = caption;
    saveData(newData);
  };

  const LAYOUTS = [
    { id:"masonry", label:"Masonry" },
    { id:"grid2", label:"2-col" },
    { id:"grid3", label:"3-col" },
    { id:"grid4", label:"4-col" },
    { id:"large", label:"Large" },
  ];

  const gridStyle = {
    masonry: { columns:"3 200px", gap:12 },
    grid2: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 },
    grid3: { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 },
    grid4: { display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:12 },
    large: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 },
  }[layout];

  return (
    <>
      <div className="page-title">MY WIDGETS 🖼</div>

      {/* ADD PANEL */}
      <div className="card mb-3" style={{ borderTop:"3px solid var(--yellow-bright)" }}>
        <div className="card-title"><span className="card-title-dot" style={{background:"var(--yellow)"}}/>ADD IMAGE WIDGET</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:10, marginBottom:10 }}>
          <input type="url" placeholder="Paste image URL…" value={imgUrl} onChange={e=>setImgUrl(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addUrl()} />
          <input type="text" placeholder="Caption (optional)" value={imgCaption} onChange={e=>setImgCaption(e.target.value)} />
          <button className="btn btn-yellow btn-sm" onClick={addUrl}>ADD URL</button>
        </div>
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          <button className="btn btn-ghost btn-sm" onClick={()=>fileRef.current?.click()} style={{ borderColor:"var(--yellow-bright)", color:"var(--yellow)" }}>
            📁 Upload Images (multiple)
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={addFile} />
          <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted)" }}>// select multiple files at once · jpg, png, gif, webp</span>
        </div>
      </div>

      {/* LAYOUT SWITCHER */}
      {widgets.length > 0 && (
        <div style={{ display:"flex", gap:8, marginBottom:20, alignItems:"center" }}>
          <span style={{ fontFamily:"var(--font-pixel)", fontSize:10, color:"var(--muted)", marginRight:4 }}>LAYOUT:</span>
          {LAYOUTS.map(l => (
            <button key={l.id} onClick={()=>setLayout(l.id)} style={{ fontFamily:"var(--font-pixel)", fontSize:10, padding:"4px 10px", border: layout===l.id?"2px solid var(--pink)":"2px solid var(--border-pixel)", background: layout===l.id?"var(--pink-light)":"var(--bg2)", color: layout===l.id?"var(--pink)":"var(--text)", cursor:"pointer", boxShadow: layout===l.id?"2px 2px 0px var(--pink)":"2px 2px 0px var(--border-pixel)" }}>
              {l.label}
            </button>
          ))}
          <span style={{ marginLeft:"auto", fontFamily:"var(--font-pixel)", fontSize:10, color:"var(--muted)" }}>{widgets.length} widget{widgets.length!==1?"s":""}</span>
        </div>
      )}

      {widgets.length === 0 ? (
        <div style={{ textAlign:"center", padding:"80px 0", fontFamily:"var(--font-mono)", fontSize:12, color:"var(--muted)" }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🖼</div>
          // no widgets yet<br/>// upload images or paste URLs above to fill this space ✦
        </div>
      ) : (
        <div style={gridStyle}>
          {widgets.map(w => (
            <div key={w.id} style={{ breakInside:"avoid", marginBottom: layout==="masonry"?12:0, position:"relative", border:"2px solid var(--border-pixel)", boxShadow:"3px 3px 0px var(--border-pixel)" }}>
              <img
                src={w.url} alt={w.caption||"widget"}
                style={{ width:"100%", display:"block", objectFit:"cover", aspectRatio: layout==="large"?"4/3":layout==="masonry"?"auto":"1" }}
                onError={e=>{e.target.style.background="var(--sand)";e.target.style.minHeight="120px";}}
              />
              <div style={{ padding:"8px 10px", display:"flex", alignItems:"center", gap:8, background:"var(--bg2)", borderTop:"1px solid var(--border)" }}>
                <input
                  type="text"
                  placeholder="Add caption…"
                  value={w.caption||""}
                  onChange={e=>updateCaption(w.id,e.target.value)}
                  style={{ flex:1, border:"none", background:"transparent", fontFamily:"var(--font-pixel)", fontSize:10, color:"var(--text-soft)", padding:0, outline:"none" }}
                />
                <button onClick={()=>removeWidget(w.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--muted)", fontSize:16, padding:"0 4px", flexShrink:0, opacity:0.6 }}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
