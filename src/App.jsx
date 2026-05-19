import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE CONFIG ────────────────────────────────────────────────────────
const SUPABASE_URL = "https://iiwjnqfbhzfzwzvccapc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable__-SfW9o5Xr5tZiEYeoOFUw_bCbOHTzb";
const PASSCODE = "hsc2026";

// ─── DEFAULT DATA ───────────────────────────────────────────────────────────
const DEFAULT_DATA = {
  mainTodos: [],
  countdowns: [],
  goals: { thisWeek: [], thisTerm: [], sixMonths: [], thisYear: [] },
  subjects: {
    HMS: { todos: [], goodAt: "", improve: "", keyNotes: "", keyLinks: [], color: "#E63946" },
    Economics: { todos: [], goodAt: "", improve: "", keyNotes: "", keyLinks: [], color: "#F4A261" },
    Software: { todos: [], goodAt: "", improve: "", keyNotes: "", keyLinks: [], color: "#2A9D8F" },
    Enterprise: { todos: [], goodAt: "", improve: "", keyNotes: "", keyLinks: [], color: "#7B2FBE" },
    Maths: { todos: [], goodAt: "", improve: "", keyNotes: "", keyLinks: [], exercises: [], notionLink: "", color: "#1A8FE3" },
    English: { todos: [], goodAt: "", improve: "", keyNotes: "", keyLinks: [], color: "#E76F51" },
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
  dashboardWidgets: [],
  heroImage: "",
  studySessions: [],
  settings: { theme: "spidey", name: "Anvi" },
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

// ─── WEB ICON SVG ────────────────────────────────────────────────────────────
const WebIcon = ({ size = 20, color = "#E63946" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" />
    <line x1="12" y1="2" x2="12" y2="22" stroke={color} strokeWidth="1.5" />
    <line x1="2" y1="12" x2="22" y2="12" stroke={color} strokeWidth="1.5" />
    <path d="M12 2 Q17 7 17 12 Q17 17 12 22 Q7 17 7 12 Q7 7 12 2" stroke={color} strokeWidth="1.5" fill="none" />
  </svg>
);

// ─── STYLES ─────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bangers&family=Nunito:wght@400;500;600;700;800&family=Roboto+Mono:wght@400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --red: #E63946;
    --red-dark: #B5202C;
    --red-light: #FDECEA;
    --blue: #1A4FA0;
    --blue-bright: #1E6FE8;
    --blue-light: #E0EDFF;
    --web: #2C2C2C;
    --bg: #F8F9FB;
    --bg2: #FFFFFF;
    --bg3: #F2F4F8;
    --text: #1A1A2E;
    --text-soft: #4A4A6A;
    --muted: #9090A8;
    --border: #E2E4EF;
    --gold: #F5A623;
    --gold-light: #FFF6E0;
    --green: #2DC653;
    --green-light: #E6FAE9;
    --sidebar-w: 260px;
    --right-w: 320px;
    --radius: 12px;
    --radius-sm: 8px;
    --shadow: 0 2px 12px rgba(26,79,160,0.1);
    --shadow-card: 0 4px 20px rgba(26,79,160,0.08);
    --shadow-red: 0 4px 20px rgba(230,57,70,0.2);
    --transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    --font-display: 'Bangers', cursive;
    --font-body: 'Nunito', system-ui, sans-serif;
    --font-mono: 'Roboto Mono', monospace;
  }

  body { font-family: var(--font-body); background: var(--bg); color: var(--text); min-height: 100vh; }

  /* ── WEB PATTERN BACKGROUND ── */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: radial-gradient(circle, rgba(230,57,70,0.04) 1px, transparent 1px);
    background-size: 28px 28px;
    pointer-events: none;
    z-index: 0;
  }

  /* ── DARK MODE ── */
  body.dark-mode {
    --bg: #0D0F1A;
    --bg2: #141928;
    --bg3: #1A1F35;
    --text: #F0F0FF;
    --text-soft: #A0A8CC;
    --muted: #606080;
    --border: #2A3050;
    --red-light: #2A0E12;
    --blue-light: #0D1A30;
    --gold-light: #1A1200;
    --green-light: #0A1A0E;
    --shadow: 0 2px 12px rgba(0,0,0,0.4);
    --shadow-card: 0 4px 20px rgba(0,0,0,0.3);
  }
  body.dark-mode .sidebar { background: #090B15; border-right: 1px solid rgba(230,57,70,0.2); }
  body.dark-mode input, body.dark-mode textarea, body.dark-mode select {
    background: var(--bg3); color: var(--text); border-color: var(--border);
  }
  body.dark-mode input:focus, body.dark-mode textarea:focus, body.dark-mode select:focus {
    border-color: var(--red); background: var(--bg2);
  }

  .app { display: flex; min-height: 100vh; width: 100vw; overflow-x: hidden; }

  /* ── SIDEBAR ── */
  .sidebar {
    width: var(--sidebar-w);
    background: #0D1B3E;
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0; left: 0; bottom: 0;
    z-index: 100;
    transition: transform var(--transition);
    overflow-y: auto;
    overflow-x: hidden;
  }
  .sidebar-logo {
    padding: 28px 22px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    background: linear-gradient(180deg, #0A1428 0%, #0D1B3E 100%);
  }
  .logo-text {
    font-family: var(--font-display);
    font-size: 32px;
    color: var(--red);
    letter-spacing: 3px;
    line-height: 1;
    text-shadow: 2px 2px 0 #7A0010, -1px -1px 0 rgba(255,255,255,0.1);
  }
  .logo-web {
    font-family: var(--font-body);
    font-size: 11px;
    color: rgba(255,255,255,0.5);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-top: 4px;
    font-weight: 600;
  }
  .logo-badge {
    display: inline-block;
    margin-top: 10px;
    background: var(--red);
    color: white;
    font-family: var(--font-body);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.08em;
    padding: 3px 10px;
    border-radius: 20px;
    text-transform: uppercase;
  }
  .nav-section { padding: 12px 10px 8px; }
  .nav-label {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.35);
    padding: 0 12px;
    margin-bottom: 6px;
    margin-top: 14px;
  }
  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    cursor: pointer;
    font-size: 13.5px;
    font-weight: 600;
    color: rgba(255,255,255,0.55);
    transition: all var(--transition);
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    border-radius: 8px;
    margin-bottom: 1px;
  }
  .nav-item:hover { background: rgba(255,255,255,0.08); color: white; }
  .nav-item.active {
    background: linear-gradient(90deg, rgba(230,57,70,0.3), rgba(230,57,70,0.1));
    color: white;
    border-left: 3px solid var(--red);
    padding-left: 9px;
  }
  .nav-icon { font-size: 16px; width: 20px; text-align: center; flex-shrink: 0; }
  .sidebar-footer {
    margin-top: auto;
    padding: 12px 10px 20px;
    border-top: 1px solid rgba(255,255,255,0.08);
  }

  /* ── MAIN LAYOUT ── */
  .main {
    margin-left: var(--sidebar-w);
    margin-right: var(--right-w);
    flex: 1;
    min-height: 100vh;
    position: relative;
    z-index: 1;
  }
  .main.no-right-panel {
    margin-right: 0;
  }

  /* ── RIGHT PANEL ── */
  .right-panel {
    width: var(--right-w);
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    background: var(--bg2);
    border-left: 1px solid var(--border);
    overflow-y: auto;
    z-index: 90;
    display: flex;
    flex-direction: column;
  }
  .right-panel-section {
    border-bottom: 1px solid var(--border);
    padding: 18px 16px;
  }
  .right-panel-title {
    font-family: var(--font-display);
    font-size: 18px;
    letter-spacing: 1.5px;
    color: var(--text);
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .right-panel-title-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--red);
    flex-shrink: 0;
  }

  /* ── HERO ── */
  .hero {
    position: relative;
    min-height: 200px;
    background: linear-gradient(135deg, #0A1428 0%, #0D1B3E 50%, #1A0810 100%);
    overflow: hidden;
    display: flex;
    align-items: flex-end;
    padding: 32px 40px;
    border-bottom: 3px solid var(--red);
  }
  .hero-web-lines {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    opacity: 0.12;
  }
  .hero-web-svg {
    position: absolute;
    right: -20px;
    top: -20px;
    width: 340px;
    height: 340px;
  }
  .hero-bg {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center top;
    opacity: 0.15;
    filter: saturate(0.8);
  }
  .hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(10,20,40,0.98) 0%, rgba(10,20,40,0.6) 60%, transparent 100%);
  }
  .hero-content { position: relative; z-index: 1; }
  .hero-greeting {
    font-family: var(--font-display);
    font-size: 44px;
    color: white;
    line-height: 1;
    letter-spacing: 3px;
    text-shadow: 3px 3px 0 rgba(230,57,70,0.5);
  }
  .hero-greeting span { color: var(--red); }
  .hero-date {
    font-size: 12px;
    font-weight: 700;
    color: rgba(255,255,255,0.5);
    margin-top: 8px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }
  .hero-badges { display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap; }
  .hero-badge {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    padding: 5px 14px;
    font-size: 11px;
    font-weight: 700;
    color: white;
    border-radius: 20px;
    letter-spacing: 0.05em;
    backdrop-filter: blur(4px);
  }
  .hero-badge-red { background: rgba(230,57,70,0.3); border-color: rgba(230,57,70,0.6); }

  /* ── PAGE ── */
  .page { padding: 28px 36px; width: 100%; }
  .page-title {
    font-family: var(--font-display);
    font-size: 30px;
    margin-bottom: 24px;
    color: var(--text);
    letter-spacing: 2px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .page-title::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 28px;
    background: var(--red);
    border-radius: 3px;
    flex-shrink: 0;
  }

  /* ── CARDS ── */
  .card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px;
    box-shadow: var(--shadow-card);
    position: relative;
    overflow: hidden;
  }
  .card-accent { border-top: 3px solid var(--red); }
  .card-title {
    font-size: 11px;
    font-weight: 800;
    color: var(--text-soft);
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .card-title-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--red);
    flex-shrink: 0;
  }

  /* ── STAT CARDS ── */
  .stat-card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 18px 20px;
    box-shadow: var(--shadow-card);
    position: relative;
    overflow: hidden;
    transition: transform var(--transition), box-shadow var(--transition);
  }
  .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(26,79,160,0.12); }
  .stat-num {
    font-family: var(--font-display);
    font-size: 36px;
    color: var(--text);
    letter-spacing: 1px;
    line-height: 1;
  }
  .stat-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-top: 4px;
  }

  /* ── COUNTDOWN WIDGET ── */
  .countdown-widget {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px;
    background: var(--bg2);
    box-shadow: var(--shadow-card);
    position: relative;
    overflow: hidden;
    transition: transform var(--transition), box-shadow var(--transition);
  }
  .countdown-widget:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
  .countdown-widget::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: var(--color, var(--red));
    border-radius: 3px 3px 0 0;
  }
  .countdown-days {
    font-family: var(--font-display);
    font-size: 42px;
    line-height: 1;
    color: var(--color, var(--red));
    letter-spacing: 2px;
  }
  .countdown-label {
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--muted);
    margin-top: 2px;
  }
  .countdown-title {
    font-size: 12px;
    font-weight: 700;
    color: var(--text);
    margin-top: 8px;
  }
  .countdown-subject {
    font-size: 9px;
    font-weight: 800;
    margin-top: 4px;
    padding: 2px 8px;
    display: inline-block;
    border-radius: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .countdown-urgent { animation: pulse-cd 2s ease-in-out infinite; }
  @keyframes pulse-cd { 0%,100% { box-shadow: 0 0 0 0 rgba(230,57,70,0.4); } 50% { box-shadow: 0 0 0 6px rgba(230,57,70,0); } }

  .live-cd-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin-top: 8px; }
  .live-cd-unit {
    background: rgba(0,0,0,0.05);
    border-radius: 6px;
    padding: 6px 4px 4px;
    text-align: center;
  }
  body.dark-mode .live-cd-unit { background: rgba(255,255,255,0.05); }
  .live-cd-num { font-family: var(--font-display); font-size: 18px; line-height: 1; display: block; color: var(--color, var(--red)); letter-spacing: 1px; }
  .live-cd-label { font-size: 7px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 2px; display: block; color: var(--muted); }

  /* ── MINI COUNTDOWN (right panel) ── */
  .mini-countdown {
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 10px 12px;
    background: var(--bg);
    position: relative;
    overflow: hidden;
    margin-bottom: 8px;
  }
  .mini-countdown::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: var(--color, var(--red));
    border-radius: 2px 0 0 2px;
  }
  .mini-countdown-title { font-size: 12px; font-weight: 700; color: var(--text); }
  .mini-countdown-days { font-family: var(--font-display); font-size: 24px; color: var(--color, var(--red)); line-height: 1; letter-spacing: 1px; }
  .mini-countdown-time { font-size: 10px; font-weight: 600; color: var(--muted); font-family: var(--font-mono); }

  /* ── TODO ── */
  .todo-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 9px 0;
    border-bottom: 1px solid var(--border);
    font-size: 13px;
  }
  .todo-item:last-child { border-bottom: none; }
  .todo-check {
    width: 18px; height: 18px;
    border: 2px solid var(--border);
    border-radius: 50%;
    cursor: pointer;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition);
    background: none;
    margin-top: 1px;
    font-size: 10px;
    font-weight: 800;
    color: white;
  }
  .todo-check:hover { border-color: var(--red); }
  .todo-check.done { background: var(--green); border-color: var(--green); }
  .todo-body { flex: 1; min-width: 0; }
  .todo-text { line-height: 1.4; font-weight: 600; }
  .todo-text.done { text-decoration: line-through; color: var(--muted); font-weight: 400; }
  .todo-due { font-size: 10px; color: var(--muted); margin-top: 2px; font-weight: 600; }
  .todo-due.overdue { color: var(--red); }
  .todo-del {
    background: none;
    border: none;
    color: var(--muted);
    cursor: pointer;
    font-size: 16px;
    opacity: 0;
    transition: opacity var(--transition);
    padding: 0 2px;
    line-height: 1;
    flex-shrink: 0;
  }
  .todo-item:hover .todo-del { opacity: 1; }

  /* ── MINI TODO (right panel) ── */
  .mini-todo {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 7px 0;
    border-bottom: 1px solid var(--border);
    font-size: 12px;
  }
  .mini-todo:last-child { border-bottom: none; }
  .mini-todo-check {
    width: 14px; height: 14px;
    border: 2px solid var(--border);
    border-radius: 50%;
    cursor: pointer;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition);
    background: none;
    margin-top: 1px;
    font-size: 8px;
    font-weight: 800;
    color: white;
  }
  .mini-todo-check:hover { border-color: var(--red); }
  .mini-todo-check.done { background: var(--green); border-color: var(--green); }
  .mini-todo-text { flex: 1; font-weight: 600; color: var(--text); line-height: 1.3; }
  .mini-todo-text.done { text-decoration: line-through; color: var(--muted); font-weight: 400; }

  /* ── BADGE ── */
  .badge {
    font-size: 9px;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: 20px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    flex-shrink: 0;
  }
  .badge-high { background: #FDECEA; color: var(--red); }
  .badge-med { background: var(--gold-light); color: #9A6000; }
  .badge-low { background: var(--green-light); color: #187D35; }

  /* ── SUBJECT CHIP ── */
  .subject-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 16px;
    font-size: 13px;
    font-weight: 700;
    border: 2px solid transparent;
    border-radius: 24px;
    cursor: pointer;
    transition: all var(--transition);
  }
  .subject-chip:hover { transform: translateY(-1px); }

  /* ── INPUT ── */
  input[type="text"], input[type="url"], input[type="datetime-local"], input[type="date"], input[type="password"], textarea, select {
    width: 100%;
    border: 1.5px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 9px 12px;
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 500;
    background: var(--bg);
    color: var(--text);
    outline: none;
    transition: border-color var(--transition), box-shadow var(--transition);
  }
  input:focus, textarea:focus, select:focus {
    border-color: var(--red);
    box-shadow: 0 0 0 3px rgba(230,57,70,0.1);
    background: var(--bg2);
  }
  textarea { resize: vertical; min-height: 80px; line-height: 1.6; }

  /* ── BUTTON ── */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 9px 18px;
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all var(--transition);
    border: none;
    border-radius: var(--radius-sm);
    letter-spacing: 0.02em;
  }
  .btn-primary {
    background: var(--red);
    color: white;
    box-shadow: 0 2px 8px rgba(230,57,70,0.3);
  }
  .btn-primary:hover { background: var(--red-dark); transform: translateY(-1px); box-shadow: 0 4px 16px rgba(230,57,70,0.4); }
  .btn-primary:active { transform: translateY(0); }
  .btn-ghost {
    background: transparent;
    border: 1.5px solid var(--border);
    color: var(--text-soft);
  }
  .btn-ghost:hover { background: var(--bg3); border-color: var(--text-soft); color: var(--text); }
  .btn-blue {
    background: var(--blue);
    color: white;
    box-shadow: 0 2px 8px rgba(26,79,160,0.3);
  }
  .btn-blue:hover { background: var(--blue-bright); transform: translateY(-1px); }
  .btn-sm { padding: 6px 12px; font-size: 12px; }
  .btn-xs { padding: 4px 8px; font-size: 11px; }

  /* ── TABS ── */
  .tabs { display: flex; gap: 0; margin-bottom: 22px; flex-wrap: wrap; border-bottom: 2px solid var(--border); }
  .tab {
    padding: 9px 18px;
    border: none;
    background: transparent;
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    color: var(--muted);
    transition: all var(--transition);
    letter-spacing: 0.02em;
    position: relative;
    margin-bottom: -2px;
  }
  .tab.active { color: var(--red); }
  .tab.active::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 2px;
    background: var(--red);
    border-radius: 2px 2px 0 0;
  }
  .tab:hover:not(.active) { color: var(--text); }

  /* ── SUBJECT CARD ── */
  .subject-card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: var(--shadow-card);
  }
  .subject-header {
    padding: 18px 24px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .subject-dot { width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0; }
  .subject-name { font-family: var(--font-display); font-size: 24px; letter-spacing: 2px; }
  .subject-body { padding: 22px 24px; }
  .subject-inner-tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border); margin: 0 -24px; padding: 0 24px; }
  .subject-inner-tab {
    padding: 10px 16px;
    border: none;
    background: none;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    color: var(--muted);
    position: relative;
    transition: color var(--transition);
    letter-spacing: 0.03em;
  }
  .subject-inner-tab.active { color: var(--red); }
  .subject-inner-tab.active::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 2px;
    background: var(--red);
  }

  /* ── INSIGHT AREAS ── */
  .insight-area {
    background: var(--bg3);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 12px 14px;
    margin-bottom: 10px;
  }
  .insight-label {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--muted);
    margin-bottom: 6px;
  }
  .insight-area textarea { background: transparent; border: none; padding: 0; box-shadow: none; font-size: 13px; min-height: 60px; }
  .insight-area textarea:focus { border: none; background: transparent; box-shadow: none; }
  .insight-area input { background: transparent; border: none; padding: 0; box-shadow: none; }
  .insight-area input:focus { border: none; background: transparent; box-shadow: none; }

  /* ── GOAL ── */
  .goal-horizon {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 22px;
    box-shadow: var(--shadow-card);
  }
  .horizon-label {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--muted);
    margin-bottom: 14px;
  }

  /* ── BAR CHART ── */
  .bar-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; font-size: 12px; }
  .bar-label { width: 80px; color: var(--text-soft); font-size: 11px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .bar-track { flex: 1; height: 8px; background: var(--bg3); border-radius: 4px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 4px; transition: width 0.6s cubic-bezier(0.4,0,0.2,1); }
  .bar-val { width: 40px; text-align: right; color: var(--muted); font-family: var(--font-mono); font-size: 10px; }

  /* ── TIMER ── */
  .timer-display {
    font-family: var(--font-display);
    font-size: 72px;
    color: var(--text);
    line-height: 1;
    letter-spacing: 4px;
  }

  /* ── SESSION LOG ── */
  .session-log-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 9px 0;
    border-bottom: 1px solid var(--border);
    font-size: 12px;
  }
  .session-log-item:last-child { border-bottom: none; }

  /* ── VISION BOARD ── */
  .vision-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
  .vision-img { aspect-ratio: 1; object-fit: cover; width: 100%; border-radius: 10px; border: 2px solid var(--border); }
  .vision-add {
    aspect-ratio: 1;
    border: 2px dashed var(--border);
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--muted);
    font-size: 12px;
    font-weight: 700;
    gap: 6px;
    transition: all var(--transition);
    background: var(--bg3);
  }
  .vision-add:hover { border-color: var(--red); color: var(--red); background: var(--red-light); }

  /* ── BOOKMARK ── */
  .bookmark-card {
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    transition: all var(--transition);
  }
  .bookmark-card:hover { border-color: var(--red); box-shadow: 0 4px 16px rgba(230,57,70,0.1); }
  .bookmark-title { font-size: 13px; font-weight: 700; }
  .bookmark-url { font-size: 11px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  /* ── LINK TAG ── */
  .link-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    background: var(--blue-light);
    color: var(--blue);
    border: 1.5px solid rgba(26,143,227,0.3);
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    text-decoration: none;
    transition: all var(--transition);
  }
  .link-tag:hover { background: var(--blue); color: white; transform: translateY(-1px); }

  /* ── TOAST ── */
  .toast-container { position: fixed; bottom: 24px; right: calc(var(--right-w) + 24px); z-index: 9999; display: flex; flex-direction: column; gap: 8px; }
  .toast {
    background: var(--text);
    color: var(--bg2);
    border-radius: var(--radius-sm);
    padding: 11px 18px;
    font-size: 13px;
    font-weight: 700;
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    animation: slideIn 0.3s ease;
    max-width: 320px;
  }
  @keyframes slideIn { from { transform: translateX(60px); opacity: 0; } to { transform: none; opacity: 1; } }

  /* ── LOCK SCREEN ── */
  .lockscreen {
    min-height: 100vh;
    width: 100vw;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0A1020;
    flex-direction: column;
    gap: 24px;
    position: relative;
    overflow: hidden;
  }
  .lock-web {
    position: absolute;
    inset: 0;
    overflow: hidden;
    opacity: 0.12;
  }
  .lock-card {
    background: #0D1B3E;
    border: 2px solid rgba(230,57,70,0.4);
    border-radius: 20px;
    padding: 48px 44px;
    width: 400px;
    text-align: center;
    box-shadow: 0 24px 80px rgba(230,57,70,0.2), inset 0 1px 0 rgba(255,255,255,0.08);
    position: relative;
    z-index: 1;
  }
  .lock-title {
    font-family: var(--font-display);
    font-size: 38px;
    margin-bottom: 6px;
    color: white;
    letter-spacing: 4px;
  }
  .lock-title span { color: var(--red); }
  .lock-sub { color: rgba(255,255,255,0.4); font-size: 12px; font-weight: 700; margin-bottom: 28px; letter-spacing: 0.12em; text-transform: uppercase; }
  .passcode-dots { display: flex; gap: 12px; justify-content: center; margin: 20px 0; }
  .passcode-dot { width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); transition: all var(--transition); }
  .passcode-dot.filled { background: var(--red); border-color: var(--red); box-shadow: 0 0 12px rgba(230,57,70,0.6); }

  /* ── DROPDOWN SECTION ── */
  .dropdown-section { border: 1px solid var(--border); border-radius: var(--radius-sm); margin-bottom: 8px; overflow: hidden; }
  .dropdown-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    cursor: pointer;
    background: var(--bg2);
    font-size: 13px;
    font-weight: 700;
    user-select: none;
    transition: background var(--transition);
  }
  .dropdown-header:hover { background: var(--bg3); }
  .dropdown-body { background: var(--bg); border-top: 1px solid var(--border); padding: 16px; }

  /* ── COUNTDOWN GRID ── */
  .countdown-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 14px; }

  /* ── GRIDS ── */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
  .grid-auto { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }

  /* ── ADD ROW ── */
  .add-row { display: flex; gap: 8px; margin-top: 10px; align-items: flex-start; }
  .add-row input, .add-row select { flex: 1; }

  /* ── SECTION HEADER ── */
  .section-header {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 12px;
    margin-top: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .section-header::before { content: ''; display: inline-block; width: 16px; height: 2px; background: currentColor; border-radius: 2px; flex-shrink: 0; }

  /* ── DASHBOARD IMAGE WIDGET ── */
  .dash-img-widget {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    aspect-ratio: 4/3;
    background: var(--bg3);
    position: relative;
    cursor: pointer;
    transition: all var(--transition);
    box-shadow: var(--shadow-card);
  }
  .dash-img-widget:hover { transform: scale(1.02); box-shadow: 0 8px 30px rgba(0,0,0,0.12); }
  .dash-img-widget img { width: 100%; height: 100%; object-fit: cover; }
  .dash-img-widget-del {
    position: absolute;
    top: 8px; right: 8px;
    background: rgba(0,0,0,0.5);
    border: none;
    border-radius: 50%;
    width: 26px; height: 26px;
    color: white;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity var(--transition);
  }
  .dash-img-widget:hover .dash-img-widget-del { opacity: 1; }
  .dash-img-add {
    border: 2px dashed var(--border);
    border-radius: var(--radius);
    aspect-ratio: 4/3;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--muted);
    font-size: 12px;
    font-weight: 700;
    gap: 8px;
    transition: all var(--transition);
    background: var(--bg2);
  }
  .dash-img-add:hover { border-color: var(--red); color: var(--red); background: var(--red-light); }

  /* ── WEB SPIDER DECORATION ── */
  .web-deco {
    position: absolute;
    pointer-events: none;
    opacity: 0.06;
  }

  /* ── MISC ── */
  .flex { display: flex; }
  .flex-col { flex-direction: column; }
  .flex-wrap { flex-wrap: wrap; }
  .gap-1 { gap: 8px; }
  .gap-2 { gap: 16px; }
  .items-center { align-items: center; }
  .justify-between { justify-content: space-between; }
  .justify-end { justify-content: flex-end; }
  .mb-1 { margin-bottom: 8px; }
  .mb-2 { margin-bottom: 16px; }
  .mb-3 { margin-bottom: 24px; }
  .mt-1 { margin-top: 8px; }
  .mt-2 { margin-top: 16px; }
  .mt-3 { margin-top: 24px; }
  .text-sm { font-size: 12px; }
  .text-xs { font-size: 10px; }
  .text-muted { color: var(--muted); }
  .text-red { color: var(--red); }
  .font-display { font-family: var(--font-display); }
  .font-mono { font-family: var(--font-mono); }
  .w-full { width: 100%; }
  .divider { height: 1px; background: var(--border); margin: 16px 0; }

  @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  .float-anim { animation: float 4s ease-in-out infinite; }

  @media (max-width: 1100px) {
    .right-panel { display: none; }
    .main { margin-right: 0; }
    .toast-container { right: 24px; }
  }
  @media (max-width: 800px) {
    .sidebar { transform: translateX(-100%); }
    .sidebar.open { transform: none; }
    .main { margin-left: 0; }
    .page { padding: 16px; }
    .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
    .hero { padding: 20px; }
  }
`;

// ─── WEB SVG DECORATION ────────────────────────────────────────────────────
const WebSVG = ({ size = 300, color = "white" }) => (
  <svg width={size} height={size} viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
    {[30, 60, 90, 120, 150].map((r, i) => (
      <ellipse key={i} cx="150" cy="150" rx={r} ry={r * 0.55} stroke={color} strokeWidth="1.5" />
    ))}
    {[0, 30, 60, 90, 120, 150].map((angle, i) => {
      const rad = (angle * Math.PI) / 180;
      return (
        <line key={i} x1="150" y1="150"
          x2={150 + Math.cos(rad) * 148} y2={150 + Math.sin(rad) * 82}
          stroke={color} strokeWidth="1.5" />
      );
    })}
  </svg>
);

// ─── SUPABASE CLIENT ─────────────────────────────────────────────────────────
let supabase = null;
try { supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY); } catch (e) {}

// ─── SCHEDULE NOTIFICATION ──────────────────────────────────────────────────
const scheduleNotification = (todo) => {
  if (!todo.dueDate || !("Notification" in window) || Notification.permission !== "granted") return;
  const due = new Date(todo.dueDate).getTime();
  const now = Date.now();
  if (due <= now) return;
  setTimeout(() => {
    new Notification("Anvi's Dashboard 🕸️", { body: `⏰ Due now: ${todo.text}` });
  }, due - now);
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
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSec, setTimerSec] = useState(0);
  const [timerSubject, setTimerSubject] = useState("HMS");
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  const supabaseReady = SUPABASE_URL !== "https://YOUR_PROJECT.supabase.co";

  useEffect(() => { setDarkMode(localStorage.getItem("anvi_dark") === "1"); }, []);

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
    try { await supabase.from("hsc_dashboard").upsert({ id: 1, payload: newData }); } catch (e) {}
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
    if (passcodeInput === PASSCODE) { setUnlocked(true); }
    else { setPasscodeError(true); setPasscodeInput(""); setTimeout(() => setPasscodeError(false), 1000); }
  };

  const toast = (msg) => {
    const id = uid();
    setToasts(t => [...t, { id, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };

  const startTimer = () => {
    setTimerRunning(true);
    startTimeRef.current = Date.now() - timerSec * 1000;
    timerRef.current = setInterval(() => setTimerSec(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000);
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

  const addMainTodo = (text, priority = "med", dueDate = "") => {
    if (!text.trim()) return;
    const newData = JSON.parse(JSON.stringify(data));
    const todo = { id: uid(), text, done: false, priority, dueDate };
    newData.mainTodos = [...(newData.mainTodos || []), todo];
    saveData(newData);
    if (dueDate) scheduleNotification(todo);
  };
  const toggleMainTodo = (id) => {
    const newData = JSON.parse(JSON.stringify(data));
    const t = newData.mainTodos.find(x => x.id === id);
    if (t) t.done = !t.done;
    saveData(newData);
  };
  const deleteMainTodo = (id) => {
    const newData = JSON.parse(JSON.stringify(data));
    newData.mainTodos = newData.mainTodos.filter(x => x.id !== id);
    saveData(newData);
  };

  const addTodo = (subject, text, priority = "med", dueDate = "", field = "todos") => {
    if (!text.trim()) return;
    const newData = JSON.parse(JSON.stringify(data));
    const todo = { id: uid(), text, done: false, priority, dueDate };
    newData.subjects[subject][field] = [...(newData.subjects[subject][field] || []), todo];
    saveData(newData);
  };
  const toggleTodo = (subject, id, field = "todos") => {
    const newData = JSON.parse(JSON.stringify(data));
    const t = newData.subjects[subject][field].find(x => x.id === id);
    if (t) t.done = !t.done;
    saveData(newData);
  };
  const deleteTodo = (subject, id, field = "todos") => {
    const newData = JSON.parse(JSON.stringify(data));
    newData.subjects[subject][field] = newData.subjects[subject][field].filter(x => x.id !== id);
    saveData(newData);
  };

  const addCountdown = (title, date, subject, color) => {
    if (!title.trim() || !date) return;
    const newData = JSON.parse(JSON.stringify(data));
    newData.countdowns = [...(newData.countdowns || []), { id: uid(), title, date, subject, color }];
    saveData(newData);
    toast("⏳ Countdown added!");
  };
  const deleteCountdown = (id) => {
    const newData = JSON.parse(JSON.stringify(data));
    newData.countdowns = newData.countdowns.filter(c => c.id !== id);
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
    const g = newData.goals[horizon].find(x => x.id === id);
    if (g) g.done = !g.done;
    saveData(newData);
  };
  const deleteGoal = (horizon, id) => {
    const newData = JSON.parse(JSON.stringify(data));
    newData.goals[horizon] = newData.goals[horizon].filter(x => x.id !== id);
    saveData(newData);
  };

  const toggleDark = () => {
    setDarkMode(d => { const next = !d; localStorage.setItem("anvi_dark", next ? "1" : "0"); return next; });
  };
  useEffect(() => { document.body.classList.toggle("dark-mode", darkMode); }, [darkMode]);

  const toggleNotif = async () => {
    if (!notifEnabled) {
      if ("Notification" in window) {
        const perm = await Notification.requestPermission();
        if (perm === "granted") { setNotifEnabled(true); toast("🔔 Notifications enabled!"); }
      }
    } else { setNotifEnabled(false); }
  };

  const todaySessions = (data.studySessions || []).filter(s => s.date === today());
  const todayTotal = todaySessions.reduce((a, s) => a + s.duration, 0);
  const thisWeekStart = weekStart();
  const thisWeekSessions = (data.studySessions || []).filter(s => s.date >= thisWeekStart);
  const thisWeekTotal = thisWeekSessions.reduce((a, s) => a + s.duration, 0);
  const subjectTotals = Object.keys(data.subjects).reduce((acc, sub) => {
    const total = thisWeekSessions.filter(s => s.subject === sub).reduce((a, s) => a + s.duration, 0);
    if (total > 0) acc[sub] = total;
    return acc;
  }, {});
  const maxSubjectTotal = Math.max(...Object.values(subjectTotals), 1);
  const urgentCount = Object.values(data.subjects).reduce((a, s) => a + (s.todos || []).filter(t => !t.done && t.priority === "high").length, 0);
  const mainPendingCount = (data.mainTodos || []).filter(t => !t.done).length;

  const allCountdowns = (data.countdowns || []).filter(c => daysUntil(c.date) >= 0).sort((a, b) => daysUntil(a.date) - daysUntil(b.date));
  const pendingTodos = [
    ...(data.mainTodos || []).filter(t => !t.done).map(t => ({ ...t, _source: 'General' })),
    ...Object.entries(data.subjects).flatMap(([sub, s]) =>
      (s.todos || []).filter(t => !t.done).map(t => ({ ...t, _source: sub }))
    ),
  ];

  if (!unlocked) {
    return (
      <>
        <style>{styles}</style>
        <div className="lockscreen">
          <div className="lock-web">
            <svg width="100%" height="100%" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
              {[40,80,120,160,200,240].map((r,i) => (
                <ellipse key={i} cx="700" cy="0" rx={r*2.5} ry={r*1.5} stroke="white" strokeWidth="1.5" fill="none" />
              ))}
              {[0,30,60,90,120,150].map((angle,i) => {
                const rad=(angle*Math.PI)/180;
                return <line key={i} x1="700" y1="0" x2={700+Math.cos(rad)*600} y2={Math.sin(rad)*350} stroke="white" strokeWidth="1.5"/>;
              })}
            </svg>
          </div>
          <div className="lock-card" style={{ border: passcodeError ? "2px solid var(--red)" : undefined, animation: passcodeError ? "shake 0.4s ease" : undefined }}>
            <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }`}</style>
            <div className="lock-title">ANVI'S <span>WEB</span></div>
            <div className="lock-sub">HSC Dashboard 2026</div>
            <div className="passcode-dots">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className={`passcode-dot ${i < passcodeInput.length ? "filled" : ""}`} />
              ))}
            </div>
            <input
              type="password"
              placeholder="Enter passcode…"
              value={passcodeInput}
              onChange={e => setPasscodeInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && tryUnlock()}
              autoFocus
              style={{ textAlign: "center", letterSpacing: "0.2em", background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.15)", color: "white", borderRadius: 10 }}
            />
            <button className="btn btn-primary w-full mt-2" style={{ justifyContent:"center", borderRadius:10 }} onClick={tryUnlock}>
              ENTER THE WEB 🕷️
            </button>
            {passcodeError && <div style={{ color:"var(--red)", fontSize:12, fontWeight:700, marginTop:12 }}>Wrong passcode!</div>}
          </div>
        </div>
      </>
    );
  }

  const navItems = [
    { key: "dashboard", icon: "🕸️", label: "Dashboard" },
    { key: "todos", icon: "✅", label: "All To-Dos" },
    { key: "subjects", icon: "📚", label: "Subjects" },
    { key: "goals", icon: "⭐", label: "Goals" },
    { key: "extracurriculars", icon: "🎯", label: "Extracurriculars" },
    { key: "countdowns", icon: "⏳", label: "Countdowns" },
    { key: "timer", icon: "⏱️", label: "Study Timer" },
    { key: "resources", icon: "🔗", label: "Resources" },
    { key: "settings", icon: "⚙️", label: "Settings" },
  ];

  const showRightPanel = ["dashboard", "todos", "subjects", "goals"].includes(tab);

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        {/* SIDEBAR */}
        <div className={`sidebar ${mobileNavOpen ? "open" : ""}`}>
          <div className="sidebar-logo">
            <div className="logo-text">ANVI'S WEB</div>
            <div className="logo-web">HSC Dashboard 2026</div>
            <div className="logo-badge">🕷️ Year 12</div>
          </div>
          <div className="nav-section">
            <div className="nav-label">Navigate</div>
            {navItems.map(item => (
              <button key={item.key} className={`nav-item ${tab === item.key ? "active" : ""}`} onClick={() => { setTab(item.key); setMobileNavOpen(false); }}>
                <span className="nav-icon">{item.icon}</span> {item.label}
              </button>
            ))}
          </div>
          <div className="sidebar-footer">
            <button className="nav-item" onClick={toggleDark}><span className="nav-icon">{darkMode ? "☀️" : "🌙"}</span> {darkMode ? "Light mode" : "Dark mode"}</button>
            <button className="nav-item" onClick={toggleNotif}><span className="nav-icon">{notifEnabled ? "🔔" : "🔕"}</span> {notifEnabled ? "Notifs on" : "Notifs off"}</button>
            {saving && <div style={{ color:"rgba(255,255,255,0.4)", fontSize:11, padding:"8px 12px", fontWeight:700 }}>Saving…</div>}
          </div>
        </div>

        {/* MAIN */}
        <div className={`main ${!showRightPanel ? "no-right-panel" : ""}`}>
          {/* HERO */}
          <div className="hero">
            <div className="hero-web-lines">
              <div className="hero-web-svg" style={{ position:"absolute", right:-20, top:-20 }}>
                <WebSVG size={320} color="white" />
              </div>
            </div>
            {data.heroImage && <div className="hero-bg" style={{ backgroundImage:`url(${data.heroImage})` }} />}
            <div className="hero-overlay" />
            <div className="hero-content">
              <div className="hero-greeting">
                HEY, <span>{data.settings?.name?.toUpperCase() || "ANVI"}</span> 🕷️
              </div>
              <div className="hero-date">
                {new Date().toLocaleDateString("en-AU", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}
              </div>
              <div className="hero-badges">
                <span className="hero-badge hero-badge-red">🔴 {urgentCount} Urgent</span>
                <span className="hero-badge">📋 {mainPendingCount} General</span>
                <span className="hero-badge">⏳ {allCountdowns.length} Countdowns</span>
                {timerRunning && <span className="hero-badge hero-badge-red">⏱ Timer Running: {fmtTime(timerSec)}</span>}
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ position:"absolute", top:16, right:16, background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", color:"white" }} onClick={() => setMobileNavOpen(!mobileNavOpen)}>☰</button>
          </div>

          {/* PAGES */}
          <div className="page">
            {tab === "dashboard" && (
              <DashboardPage data={data} todayTotal={todayTotal} thisWeekTotal={thisWeekTotal} todaySessions={todaySessions} subjectTotals={subjectTotals} maxSubjectTotal={maxSubjectTotal} setTab={setTab} urgentCount={urgentCount} mainPendingCount={mainPendingCount} saveData={saveData} toast={toast} />
            )}
            {tab === "todos" && (
              <TodosPage data={data} addMainTodo={addMainTodo} toggleMainTodo={toggleMainTodo} deleteMainTodo={deleteMainTodo} addTodo={addTodo} toggleTodo={toggleTodo} deleteTodo={deleteTodo} />
            )}
            {tab === "goals" && <GoalsPage data={data} addGoal={addGoal} toggleGoal={toggleGoal} deleteGoal={deleteGoal} />}
            {tab === "subjects" && (
              <SubjectsPage data={data} subjectView={subjectView} setSubjectView={setSubjectView} addTodo={addTodo} toggleTodo={toggleTodo} deleteTodo={deleteTodo} update={update} saveData={saveData} toast={toast} addCountdown={addCountdown} />
            )}
            {tab === "extracurriculars" && <ExtracurricularsPage data={data} update={update} saveData={saveData} toast={toast} />}
            {tab === "countdowns" && <CountdownsPage data={data} addCountdown={addCountdown} deleteCountdown={deleteCountdown} />}
            {tab === "timer" && (
              <TimerPage data={data} timerRunning={timerRunning} timerSec={timerSec} timerSubject={timerSubject} setTimerSubject={setTimerSubject} startTimer={startTimer} stopTimer={stopTimer} todaySessions={todaySessions} thisWeekSessions={thisWeekSessions} todayTotal={todayTotal} thisWeekTotal={thisWeekTotal} subjectTotals={subjectTotals} maxSubjectTotal={maxSubjectTotal} />
            )}
            {tab === "resources" && <ResourcesPage data={data} saveData={saveData} update={update} toast={toast} />}
            {tab === "settings" && <SettingsPage data={data} update={update} saveData={saveData} />}
          </div>
        </div>

        {/* RIGHT PANEL — Always-visible Todos + Countdowns */}
        {showRightPanel && (
          <RightPanel data={data} pendingTodos={pendingTodos} allCountdowns={allCountdowns} toggleMainTodo={toggleMainTodo} addMainTodo={addMainTodo} />
        )}

        <div className="toast-container">
          {toasts.map(t => <div key={t.id} className="toast">{t.msg}</div>)}
        </div>
      </div>
    </>
  );
}

// ─── RIGHT PANEL ─────────────────────────────────────────────────────────────
function RightPanel({ data, pendingTodos, allCountdowns, toggleMainTodo, addMainTodo }) {
  const [newTodo, setNewTodo] = useState("");

  const handleAdd = () => {
    if (!newTodo.trim()) return;
    addMainTodo(newTodo, "med", "");
    setNewTodo("");
  };

  return (
    <div className="right-panel">
      {/* Todos */}
      <div className="right-panel-section" style={{ flex: 1 }}>
        <div className="right-panel-title">
          <div className="right-panel-title-dot" />
          TO-DOS
        </div>
        <div style={{ display:"flex", gap:6, marginBottom:12 }}>
          <input type="text" placeholder="Quick add…" value={newTodo} onChange={e => setNewTodo(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAdd()} style={{ flex:1, fontSize:12, padding:"6px 10px" }} />
          <button className="btn btn-primary btn-sm" onClick={handleAdd}>+</button>
        </div>
        {pendingTodos.length === 0 ? (
          <div style={{ color:"var(--muted)", fontSize:12, fontWeight:600, textAlign:"center", padding:"20px 0" }}>
            All clear! 🎉<br/>No pending tasks
          </div>
        ) : (
          pendingTodos.slice(0, 20).map(t => (
            <div key={t.id} className="mini-todo">
              <button className={`mini-todo-check ${t.done ? "done" : ""}`} onClick={() => t._source === 'General' && toggleMainTodo(t.id)}>
                {t.done && "✓"}
              </button>
              <div style={{ flex:1, minWidth:0 }}>
                <div className={`mini-todo-text ${t.done ? "done" : ""}`}>{t.text}</div>
                <div style={{ fontSize:9, color:"var(--muted)", fontWeight:700, marginTop:1, textTransform:"uppercase", letterSpacing:"0.08em" }}>{t._source}</div>
              </div>
              <span className={`badge badge-${t.priority || "med"}`}>{t.priority || "med"}</span>
            </div>
          ))
        )}
      </div>

      {/* Countdowns */}
      <div className="right-panel-section">
        <div className="right-panel-title">
          <div className="right-panel-title-dot" style={{ background:"var(--gold)" }} />
          COUNTDOWNS
        </div>
        {allCountdowns.length === 0 ? (
          <div style={{ color:"var(--muted)", fontSize:12, fontWeight:600, textAlign:"center", padding:"16px 0" }}>
            No countdowns yet
          </div>
        ) : (
          allCountdowns.slice(0, 6).map(c => (
            <MiniCountdown key={c.id} c={{ ...c, color: c.color || data.subjects[c.subject]?.color || "var(--red)" }} />
          ))
        )}
      </div>
    </div>
  );
}

function MiniCountdown({ c }) {
  const tl = useLiveCountdown(c.date);
  const pad = n => String(n).padStart(2, "0");

  return (
    <div className="mini-countdown" style={{ "--color": c.color }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div className="mini-countdown-title">{c.title}</div>
          {c.subject && <div style={{ fontSize:9, fontWeight:800, color:c.color, textTransform:"uppercase", letterSpacing:"0.08em" }}>{c.subject}</div>}
        </div>
        <div style={{ textAlign:"right" }}>
          {tl?.past ? (
            <div style={{ fontSize:11, color:"var(--muted)", fontWeight:700 }}>PAST</div>
          ) : (
            <>
              <div className="mini-countdown-days">{tl ? tl.days : "–"}</div>
              <div className="mini-countdown-time">{tl ? `${pad(tl.hours)}:${pad(tl.minutes)}:${pad(tl.seconds)}` : ""}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── LIVE COUNTDOWN WIDGET ────────────────────────────────────────────────────
function LiveCountdownWidget({ c, onDelete, showDelete = false }) {
  const tl = useLiveCountdown(c.date);
  const isUrgent = tl && tl.days <= 7 && !tl.past;
  const sColor = c.color || "#E63946";
  const pad = n => String(n).padStart(2, "0");

  return (
    <div className={`countdown-widget ${isUrgent ? "countdown-urgent" : ""}`} style={{ "--color": sColor }}>
      {showDelete && (
        <button onClick={onDelete} style={{ position:"absolute", top:10, right:10, background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:16 }}>×</button>
      )}
      {tl?.past ? (
        <div style={{ fontFamily:"var(--font-display)", fontSize:18, color:"var(--muted)", letterSpacing:1 }}>PAST DUE</div>
      ) : (
        <>
          <div className="countdown-days">{tl ? tl.days : "–"}</div>
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
            </div>
          )}
        </>
      )}
      <div className="countdown-title">{c.title}</div>
      {c.subject && <div className="countdown-subject" style={{ background:`${sColor}20`, color:sColor }}>{c.subject}</div>}
      <div style={{ fontSize:10, color:"var(--muted)", marginTop:4, fontWeight:600 }}>
        {new Date(c.date).toLocaleDateString("en-AU", { day:"numeric", month:"short", year:"numeric" })}
      </div>
      {isUrgent && tl.days > 0 && <div style={{ fontSize:10, color:sColor, fontWeight:800, marginTop:4 }}>⚡ COMING UP!</div>}
      {tl && !tl.past && tl.days === 0 && <div style={{ fontSize:11, color:"var(--red)", fontWeight:800, marginTop:4 }}>🔴 TODAY!</div>}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardPage({ data, todayTotal, thisWeekTotal, todaySessions, subjectTotals, maxSubjectTotal, setTab, urgentCount, mainPendingCount, saveData, toast }) {
  const [dashTab, setDashTab] = useState("overview");
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [widgetUrl, setWidgetUrl] = useState("");
  const fileInputRef = useRef(null);

  const urgentTodos = Object.entries(data.subjects).flatMap(([sub, s]) => {
    const todos = (s.todos || []).filter(t => !t.done && t.priority === "high").map(t => ({ ...t, subject: sub }));
    const exercises = sub === "Maths" ? (s.exercises || []).filter(t => !t.done && t.priority === "high").map(t => ({ ...t, subject: "Maths 📐" })) : [];
    return [...todos, ...exercises];
  });
  const upcomingTodos = [
    ...(data.mainTodos || []).filter(t => !t.done && t.dueDate),
    ...Object.entries(data.subjects).flatMap(([sub, s]) => {
      const todos = (s.todos || []).filter(t => !t.done && t.dueDate).map(t => ({ ...t, subject: sub }));
      const exercises = sub === "Maths" ? (s.exercises || []).filter(t => !t.done && t.dueDate).map(t => ({ ...t, subject: "Maths 📐" })) : [];
      return [...todos, ...exercises];
    }),
  ].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 6);

  const allCountdowns = (data.countdowns || []).filter(c => daysUntil(c.date) >= 0).sort((a, b) => daysUntil(a.date) - daysUntil(b.date));
  const dashWidgets = data.dashboardWidgets || [];

  const addWidgetUrl = () => {
    if (!widgetUrl.trim()) return;
    const newData = JSON.parse(JSON.stringify(data));
    newData.dashboardWidgets = [...(newData.dashboardWidgets || []), { id: uid(), url: widgetUrl }];
    saveData(newData);
    setWidgetUrl(""); setShowAddWidget(false);
    toast("Image widget added ✓");
  };

  const addWidgetFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const newData = JSON.parse(JSON.stringify(data));
      newData.dashboardWidgets = [...(newData.dashboardWidgets || []), { id: uid(), url: e.target.result }];
      saveData(newData);
      toast("Image widget added ✓");
    };
    reader.readAsDataURL(file);
  };

  const deleteWidget = (id) => {
    const newData = JSON.parse(JSON.stringify(data));
    newData.dashboardWidgets = newData.dashboardWidgets.filter(w => w.id !== id);
    saveData(newData);
  };

  return (
    <>
      <div className="page-title">Dashboard</div>

      {/* STAT CARDS */}
      <div className="grid-4 mb-3">
        {[
          { num: fmtDuration(todayTotal) || "0m", label: "Today's Study", color: "#E63946", bg: "#FDECEA" },
          { num: fmtDuration(thisWeekTotal) || "0m", label: "This Week", color: "#1A4FA0", bg: "#E0EDFF" },
          { num: urgentCount, label: "Urgent Tasks", color: "#E63946", bg: "#FDECEA" },
          { num: mainPendingCount, label: "General To-Dos", color: "#F5A623", bg: "#FFF6E0" },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ borderTop:`3px solid ${s.color}` }}>
            <div className="stat-num" style={{ color: s.color }}>{s.num}</div>
            <div className="stat-label">{s.label}</div>
            <div style={{ position:"absolute", bottom:12, right:14, fontSize:22, opacity:0.1 }}>🕷️</div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div className="tabs">
        {[
          { key:"overview", label:"Overview" },
          { key:"subjects", label:"Subjects" },
          { key:"countdowns", label:"Countdowns" },
          { key:"images", label:"🖼 Image Widgets" },
        ].map(t => (
          <button key={t.key} className={`tab ${dashTab === t.key ? "active" : ""}`} onClick={() => setDashTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {dashTab === "overview" && (
        <>
          <div className="grid-2 mb-3">
            <div className="card card-accent">
              <div className="card-title"><div className="card-title-dot" style={{ background:"var(--red)" }} />URGENT TASKS 🔴</div>
              {urgentTodos.length === 0
                ? <div style={{ color:"var(--muted)", fontSize:13, fontWeight:600 }}>All clear — you're crushing it! 🎉</div>
                : urgentTodos.slice(0, 6).map(t => (
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
            <div className="card" style={{ borderTop:"3px solid var(--blue)" }}>
              <div className="card-title"><div className="card-title-dot" style={{ background:"var(--blue)" }} />COMING UP 📅</div>
              {upcomingTodos.length === 0
                ? <div style={{ color:"var(--muted)", fontSize:13, fontWeight:600 }}>No scheduled tasks — add due dates!</div>
                : upcomingTodos.map(t => (
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
            <div className="card mb-3" style={{ borderTop:"3px solid var(--gold)" }}>
              <div className="card-title"><div className="card-title-dot" style={{ background:"var(--gold)" }} />THIS WEEK BY SUBJECT</div>
              {Object.entries(subjectTotals).sort((a, b) => b[1] - a[1]).map(([sub, sec]) => (
                <div key={sub} className="bar-row">
                  <div className="bar-label">{sub}</div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width:`${(sec/maxSubjectTotal)*100}%`, background:data.subjects[sub]?.color || "var(--red)" }} />
                  </div>
                  <div className="bar-val">{fmtDuration(sec)}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* SUBJECTS OVERVIEW */}
      {dashTab === "subjects" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:14 }}>
          {Object.entries(data.subjects).map(([name, s]) => {
            const pending = (s.todos || []).filter(t => !t.done).length;
            const exercises = name === "Maths" ? (s.exercises || []).filter(t => !t.done).length : 0;
            const high = (s.todos || []).filter(t => !t.done && t.priority === "high").length;
            return (
              <div key={name} className="card" style={{ borderTop:`3px solid ${s.color}`, padding:"16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                  <div style={{ fontFamily:"var(--font-display)", fontSize:18, color:s.color, letterSpacing:"1px" }}>{name}</div>
                  {high > 0 && <span className="badge badge-high">{high} urgent</span>}
                </div>
                <div style={{ fontSize:11, color:"var(--muted)", fontWeight:700, marginBottom:6, letterSpacing:"0.05em" }}>
                  {pending} pending tasks{exercises > 0 ? ` · ${exercises} exercises` : ""}
                </div>
                <div className="bar-track" style={{ height:5, marginBottom:10 }}>
                  <div className="bar-fill" style={{ width:`${Math.min(100, pending*20)}%`, background:s.color }} />
                </div>
                {(s.todos||[]).filter(t=>!t.done).slice(0,2).map(t => (
                  <div key={t.id} style={{ fontSize:12, color:"var(--text-soft)", padding:"3px 0", borderBottom:"1px solid var(--border)", fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>• {t.text}</div>
                ))}
                {name === "Maths" && (s.exercises||[]).filter(t=>!t.done).slice(0,1).map(t => (
                  <div key={t.id} style={{ fontSize:12, color:"var(--blue)", padding:"3px 0", fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>📐 {t.text}</div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* COUNTDOWNS */}
      {dashTab === "countdowns" && (
        <>
          <div className="section-header mb-2">Assessment Countdowns</div>
          {allCountdowns.length === 0 ? (
            <div className="card"><div style={{ color:"var(--muted)", fontWeight:600 }}>No countdowns yet — add them from Subjects or the Countdowns page</div></div>
          ) : (
            <div className="countdown-grid">
              {allCountdowns.map(c => (
                <LiveCountdownWidget key={c.id} c={{ ...c, color: c.color || data.subjects[c.subject]?.color || "var(--red)" }} />
              ))}
            </div>
          )}
        </>
      )}

      {/* IMAGE WIDGETS */}
      {dashTab === "images" && (
        <>
          <div className="section-header mb-2">Dashboard Image Widgets</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:14, marginBottom:16 }}>
            {dashWidgets.map(w => (
              <div key={w.id} className="dash-img-widget">
                <img src={w.url} alt="widget" onError={e => { e.target.style.display="none"; }} />
                <button className="dash-img-widget-del" onClick={() => deleteWidget(w.id)}>×</button>
              </div>
            ))}
            {/* Add button */}
            <div className="dash-img-add" onClick={() => fileInputRef.current?.click()}>
              <span style={{ fontSize:28 }}>+</span>
              <span>Upload Image</span>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e => { if (e.target.files[0]) addWidgetFile(e.target.files[0]); }} />
          <div className="card" style={{ borderTop:"3px solid var(--blue)" }}>
            <div className="card-title">Or add by URL</div>
            <div className="add-row">
              <input type="url" placeholder="https://image.url…" value={widgetUrl} onChange={e => setWidgetUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && addWidgetUrl()} />
              <button className="btn btn-primary btn-sm" onClick={addWidgetUrl}>ADD</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ─── TODOS PAGE ───────────────────────────────────────────────────────────────
function TodosPage({ data, addMainTodo, toggleMainTodo, deleteMainTodo, addTodo, toggleTodo, deleteTodo }) {
  const [input, setInput] = useState("");
  const [priority, setPriority] = useState("med");
  const [dueDate, setDueDate] = useState("");
  const [openSections, setOpenSections] = useState({});
  const [subjectTab, setSubjectTab] = useState(null);

  const toggleSection = (key) => setOpenSections(s => ({ ...s, [key]: !s[key] }));
  const pendingMain = (data.mainTodos || []).filter(t => !t.done);
  const doneMain = (data.mainTodos || []).filter(t => t.done);
  const subjectNames = Object.keys(data.subjects);

  return (
    <>
      <div className="page-title">All To-Dos</div>
      <div className="card mb-3 card-accent">
        <div className="card-title">Add General To-Do</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr auto auto auto", gap:8, alignItems:"flex-start" }}>
          <input type="text" placeholder="What needs doing?" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { addMainTodo(input, priority, dueDate); setInput(""); setDueDate(""); } }} />
          <input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ width:200 }} />
          <select value={priority} onChange={e => setPriority(e.target.value)} style={{ width:90 }}>
            <option value="high">🔴 High</option>
            <option value="med">🟡 Med</option>
            <option value="low">🟢 Low</option>
          </select>
          <button className="btn btn-primary btn-sm" onClick={() => { addMainTodo(input, priority, dueDate); setInput(""); setDueDate(""); }}>ADD +</button>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-title"><div className="card-title-dot" />GENERAL ({pendingMain.length} pending)</div>
        {pendingMain.length === 0 && <div style={{ color:"var(--muted)", fontSize:13, fontWeight:600 }}>No general tasks — all good! 🎉</div>}
        {pendingMain.map(t => (
          <div key={t.id} className="todo-item">
            <button className={`todo-check ${t.done ? "done" : ""}`} onClick={() => toggleMainTodo(t.id)}>{t.done && "✓"}</button>
            <div className="todo-body">
              <div className="todo-text">{t.text}</div>
              {t.dueDate && <div className={`todo-due ${new Date(t.dueDate) < new Date() ? "overdue" : ""}`}>{new Date(t.dueDate) < new Date() ? "⚠ Overdue · " : "📅 "}{fmtDateTime(t.dueDate)}</div>}
            </div>
            <span className={`badge badge-${t.priority}`}>{t.priority}</span>
            <button className="todo-del" onClick={() => deleteMainTodo(t.id)}>×</button>
          </div>
        ))}
        {doneMain.length > 0 && (
          <div className="mt-2">
            <div style={{ fontSize:10, color:"var(--muted)", fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>Completed ({doneMain.length})</div>
            {doneMain.map(t => (
              <div key={t.id} className="todo-item" style={{ opacity:0.5 }}>
                <button className="todo-check done" onClick={() => toggleMainTodo(t.id)}>✓</button>
                <span className="todo-text done">{t.text}</span>
                <button className="todo-del" onClick={() => deleteMainTodo(t.id)}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section-header mb-2">By Subject 📚</div>
      {subjectNames.map(sub => {
        const s = data.subjects[sub];
        const pending = (s.todos || []).filter(t => !t.done);
        const done = (s.todos || []).filter(t => t.done);
        const pendingEx = sub === "Maths" ? (s.exercises || []).filter(t => !t.done).map(t => ({ ...t, _isExercise: true })) : [];
        const doneEx = sub === "Maths" ? (s.exercises || []).filter(t => t.done).map(t => ({ ...t, _isExercise: true })) : [];
        const totalPending = pending.length + pendingEx.length;
        const isOpen = openSections[sub];
        return (
          <div key={sub} className="dropdown-section" style={{ borderLeft:`3px solid ${s.color}` }}>
            <div className="dropdown-header" onClick={() => toggleSection(sub)}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:s.color, flexShrink:0 }} />
                <span style={{ color:s.color, fontWeight:800 }}>{sub}</span>
                <span style={{ color:"var(--muted)", fontSize:11, fontWeight:600 }}>
                  ({totalPending} pending{pendingEx.length > 0 ? `, incl. ${pendingEx.length} exercises` : ""})
                </span>
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
      {todos.map(t => (
        <div key={t.id} className="todo-item">
          <button className={`todo-check ${t.done ? "done" : ""}`} onClick={() => onToggle(t.id, t._isExercise)}>{t.done && "✓"}</button>
          <div className="todo-body">
            <div className={`todo-text ${t.done ? "done" : ""}`}>
              {t._isExercise && <span style={{ fontSize:11, color:"var(--blue)", marginRight:6 }}>📐</span>}
              {t.text}
            </div>
            {t.dueDate && <div className="todo-due">📅 {fmtDateTime(t.dueDate)}</div>}
          </div>
          <span className={`badge badge-${t.priority || "med"}`}>{t._isExercise ? "exercise" : t.priority}</span>
          <button className="todo-del" onClick={() => onDelete(t.id, t._isExercise)}>×</button>
        </div>
      ))}
      {todos.length === 0 && <div style={{ color:"var(--muted)", fontSize:12, fontWeight:600, marginBottom:12 }}>No tasks yet!</div>}
      <div style={{ display:"grid", gridTemplateColumns:"1fr auto auto auto", gap:8, marginTop:12 }}>
        <input type="text" placeholder="Add task…" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAdd()} />
        <input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ width:180 }} />
        <select value={priority} onChange={e => setPriority(e.target.value)} style={{ width:80 }}>
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
    { key:"thisWeek", label:"This Week", icon:"🗓", color:"var(--red)" },
    { key:"thisTerm", label:"This Term", icon:"📆", color:"var(--blue)" },
    { key:"sixMonths", label:"6 Months", icon:"🗺", color:"var(--green)" },
    { key:"thisYear", label:"This Year", icon:"🌟", color:"var(--gold)" },
  ];

  return (
    <>
      <div className="page-title">Goals & Life</div>
      <div className="tabs">
        {horizons.map(h => (
          <button key={h.key} className={`tab ${goalTab === h.key ? "active" : ""}`} onClick={() => setGoalTab(h.key)}>
            {h.icon} {h.label}
          </button>
        ))}
      </div>
      {horizons.filter(h => h.key === goalTab).map(h => (
        <div key={h.key} className="goal-horizon" style={{ borderTop:`3px solid ${h.color}` }}>
          <div className="horizon-label" style={{ color:h.color }}>◉ {h.label.toUpperCase()} GOALS</div>
          {(data.goals?.[h.key] || []).length === 0 && (
            <div style={{ color:"var(--muted)", fontSize:13, fontWeight:600, marginBottom:16 }}>What do you want to achieve? Add your first goal ✨</div>
          )}
          {(data.goals?.[h.key] || []).map(g => (
            <div key={g.id} className="todo-item">
              <button className={`todo-check ${g.done ? "done" : ""}`} onClick={() => toggleGoal(h.key, g.id)}>{g.done && "✓"}</button>
              <span className={`todo-text ${g.done ? "done" : ""}`}>{g.text}</span>
              <button className="todo-del" onClick={() => deleteGoal(h.key, g.id)}>×</button>
            </div>
          ))}
          <div className="add-row mt-2">
            <input type="text" placeholder={`Add a ${h.label.toLowerCase()} goal…`} value={inputs[h.key]} onChange={e => setInputs({ ...inputs, [h.key]:e.target.value })} onKeyDown={e => { if (e.key === "Enter") { addGoal(h.key, inputs[h.key]); setInputs({ ...inputs, [h.key]:"" }); } }} />
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
    newData.subjects[subjectView].keyLinks = [...(newData.subjects[subjectView].keyLinks || []), { id:uid(), title:linkTitle, url:linkUrl }];
    saveData(newData); setLinkTitle(""); setLinkUrl(""); toast("Link saved ✓");
  };
  const deleteLink = (id) => {
    const newData = JSON.parse(JSON.stringify(data));
    newData.subjects[subjectView].keyLinks = newData.subjects[subjectView].keyLinks.filter(l => l.id !== id);
    saveData(newData);
  };
  const handleAddCountdown = () => {
    if (!cdTitle.trim() || !cdDate) return;
    addCountdown(cdTitle, cdDate, subjectView, s.color);
    setCdTitle(""); setCdDate(""); toast("⏳ Countdown added!");
  };

  // Tabs include exercises always for Maths
  const tabs = ["todos", "insights", "notes", "links", "countdowns", ...(subjectView === "Maths" ? ["exercises"] : [])];
  const tabLabels = { todos:"◈ Tasks", insights:"💡 Insights", notes:"📝 Notes", links:"🔗 Links", countdowns:"⏳ Countdowns", exercises:"📐 Exercises" };

  return (
    <>
      <div className="page-title">Subjects</div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:24 }}>
        {subjectNames.map(name => {
          const sub = data.subjects[name];
          const isActive = subjectView === name;
          const pending = (sub.todos || []).filter(t => !t.done).length;
          const exercises = name === "Maths" ? (sub.exercises || []).filter(t => !t.done).length : 0;
          return (
            <button key={name} className="subject-chip" onClick={() => { setSubjectView(name); setInnerTab("todos"); }} style={{
              background: isActive ? sub.color : "var(--bg2)",
              color: isActive ? "white" : "var(--text-soft)",
              border: `2px solid ${isActive ? sub.color : "var(--border)"}`,
              boxShadow: isActive ? `0 4px 16px ${sub.color}40` : "none",
            }}>
              {name}
              <span style={{ fontSize:10, opacity:0.8, background:"rgba(255,255,255,0.2)", padding:"1px 6px", borderRadius:10 }}>
                {pending + exercises}
              </span>
            </button>
          );
        })}
      </div>

      <div className="subject-card">
        <div className="subject-header" style={{ background:`${s.color}12`, borderBottom:`1px solid ${s.color}30` }}>
          <div className="subject-dot" style={{ background:s.color }} />
          <div className="subject-name" style={{ color:s.color }}>{subjectView}</div>
          <div style={{ marginLeft:"auto", fontSize:12, color:"var(--muted)", fontWeight:700 }}>
            {(s.todos||[]).filter(t=>!t.done).length} tasks pending
            {subjectView === "Maths" && ` · ${(s.exercises||[]).filter(t=>!t.done).length} exercises`}
          </div>
        </div>

        <div style={{ borderBottom:"1px solid var(--border)" }}>
          <div className="subject-inner-tabs" style={{ marginBottom:0 }}>
            {tabs.map(t => (
              <button key={t} className={`subject-inner-tab ${innerTab === t ? "active" : ""}`} onClick={() => setInnerTab(t)}
                style={innerTab === t ? { color:s.color } : {}}>
                {tabLabels[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="subject-body">
          {innerTab === "todos" && (
            <>
              {(s.todos || []).map(t => (
                <div key={t.id} className="todo-item">
                  <button className={`todo-check ${t.done ? "done" : ""}`} onClick={() => toggleTodo(subjectView, t.id)}>{t.done && "✓"}</button>
                  <div className="todo-body">
                    <div className={`todo-text ${t.done ? "done" : ""}`}>{t.text}</div>
                    {t.dueDate && <div className="todo-due">📅 {fmtDateTime(t.dueDate)}</div>}
                  </div>
                  <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                  <button className="todo-del" onClick={() => deleteTodo(subjectView, t.id)}>×</button>
                </div>
              ))}
              {/* Show Maths exercises inline too */}
              {subjectView === "Maths" && (s.exercises||[]).length > 0 && (
                <>
                  <div className="divider" />
                  <div className="section-header mb-2" style={{ color:"var(--blue)" }}>Maths Exercises</div>
                  {(s.exercises||[]).map(t => (
                    <div key={t.id} className="todo-item">
                      <button className={`todo-check ${t.done ? "done" : ""}`} onClick={() => toggleTodo("Maths", t.id, "exercises")}>{t.done && "✓"}</button>
                      <div className="todo-body">
                        <div className={`todo-text ${t.done ? "done" : ""}`}>
                          <span style={{ fontSize:11, marginRight:6 }}>📐</span>{t.text}
                        </div>
                      </div>
                      <span className="badge" style={{ background:"var(--blue-light)", color:"var(--blue)" }}>exercise</span>
                      <button className="todo-del" onClick={() => deleteTodo("Maths", t.id, "exercises")}>×</button>
                    </div>
                  ))}
                </>
              )}
              {(s.todos || []).length === 0 && <div style={{ color:"var(--muted)", fontSize:13, fontWeight:600, marginBottom:14 }}>No tasks yet for {subjectView}!</div>}
              <div style={{ display:"grid", gridTemplateColumns:"1fr auto auto auto", gap:8, marginTop:14 }}>
                <input type="text" placeholder={`Add ${subjectView} task…`} value={todoInput} onChange={e => setTodoInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { addTodo(subjectView, todoInput, todoPriority, todoDue); setTodoInput(""); setTodoDue(""); } }} />
                <input type="datetime-local" value={todoDue} onChange={e => setTodoDue(e.target.value)} style={{ width:190 }} />
                <select value={todoPriority} onChange={e => setTodoPriority(e.target.value)} style={{ width:80 }}>
                  <option value="high">High</option>
                  <option value="med">Med</option>
                  <option value="low">Low</option>
                </select>
                <button className="btn btn-primary btn-sm" onClick={() => { addTodo(subjectView, todoInput, todoPriority, todoDue); setTodoInput(""); setTodoDue(""); }}>ADD</button>
              </div>
            </>
          )}

          {innerTab === "insights" && (
            <div className="grid-2">
              <div className="insight-area">
                <div className="insight-label">💪 What I'm Good At</div>
                <textarea value={s.goodAt||""} onChange={e => update(`subjects.${subjectView}.goodAt`, e.target.value)} placeholder="Your strengths…" />
              </div>
              <div className="insight-area">
                <div className="insight-label">📈 What I Need to Improve</div>
                <textarea value={s.improve||""} onChange={e => update(`subjects.${subjectView}.improve`, e.target.value)} placeholder="Areas to work on…" />
              </div>
            </div>
          )}

          {innerTab === "notes" && (
            <div className="insight-area">
              <div className="insight-label">📝 Key Notes</div>
              <textarea value={s.keyNotes||""} onChange={e => update(`subjects.${subjectView}.keyNotes`, e.target.value)} placeholder="Important notes…" style={{ minHeight:200 }} />
            </div>
          )}

          {innerTab === "links" && (
            <>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:8, marginBottom:14 }}>
                <input type="text" placeholder="Link title…" value={linkTitle} onChange={e => setLinkTitle(e.target.value)} />
                <input type="url" placeholder="https://…" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && addLink()} />
                <button className="btn btn-primary btn-sm" onClick={addLink}>SAVE</button>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {(s.keyLinks||[]).map(l => (
                  <div key={l.id} style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <a href={l.url} target="_blank" rel="noreferrer" className="link-tag">🔗 {l.title}</a>
                    <button style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:16 }} onClick={() => deleteLink(l.id)}>×</button>
                  </div>
                ))}
                {(s.keyLinks||[]).length === 0 && <div style={{ color:"var(--muted)", fontSize:13, fontWeight:600 }}>No links yet — add useful resources!</div>}
              </div>
            </>
          )}

          {innerTab === "countdowns" && (
            <>
              <div className="insight-area mb-3" style={{ borderLeft:`3px solid ${s.color}` }}>
                <div className="insight-label">⏳ Add Assessment Countdown</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:10, marginTop:8 }}>
                  <input type="text" placeholder="e.g. Trial Exam" value={cdTitle} onChange={e => setCdTitle(e.target.value)} />
                  <input type="date" value={cdDate} onChange={e => setCdDate(e.target.value)} />
                  <button className="btn btn-primary btn-sm" style={{ background:s.color }} onClick={handleAddCountdown}>ADD ⏳</button>
                </div>
              </div>
              <div className="countdown-grid">
                {(data.countdowns||[]).filter(c => c.subject === subjectView && daysUntil(c.date) >= 0).map(c => (
                  <LiveCountdownWidget key={c.id} c={{ ...c, color:s.color }} />
                ))}
              </div>
              {(data.countdowns||[]).filter(c => c.subject === subjectView && daysUntil(c.date) >= 0).length === 0 && (
                <div style={{ color:"var(--muted)", fontSize:13, fontWeight:600 }}>No countdowns for {subjectView} yet</div>
              )}
            </>
          )}

          {innerTab === "exercises" && subjectView === "Maths" && (
            <>
              <div className="insight-area mb-2">
                <div className="insight-label">📎 Notion Link (Good Problems)</div>
                <input type="url" value={s.notionLink||""} onChange={e => update("subjects.Maths.notionLink", e.target.value)} placeholder="https://notion.so/your-maths-page" />
                {s.notionLink && <a href={s.notionLink} target="_blank" rel="noreferrer" className="link-tag mt-2" style={{ display:"inline-flex", marginTop:8 }}>Open Notion →</a>}
              </div>
              <div className="section-header mb-2">📐 Exercises & Chapters</div>
              {(s.exercises||[]).map(t => (
                <div key={t.id} className="todo-item">
                  <button className={`todo-check ${t.done ? "done" : ""}`} onClick={() => toggleTodo("Maths", t.id, "exercises")}>{t.done && "✓"}</button>
                  <span className={`todo-text ${t.done ? "done" : ""}`}>{t.text}</span>
                  <button className="todo-del" onClick={() => deleteTodo("Maths", t.id, "exercises")}>×</button>
                </div>
              ))}
              <div className="add-row mt-2">
                <input type="text" placeholder="Exercise or chapter name…" value={exerciseInput} onChange={e => setExerciseInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { addTodo("Maths", exerciseInput, "med", "", "exercises"); setExerciseInput(""); } }} />
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
    newData.extracurriculars.todos = [...(newData.extracurriculars.todos||[]), { id:uid(), text:todoInput, done:false, priority:todoPriority, dueDate:todoDue }];
    saveData(newData); setTodoInput(""); setTodoDue(""); toast("Task added ✓");
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
    newData.extracurriculars.genderLens.todos = [...glTodos, { id:uid(), text:glTodoInput, done:false }];
    saveData(newData); setGlTodoInput("");
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
    newData.extracurriculars.genderLens.links = [...glLinks, { id:uid(), title:glLinkTitle, url:glLinkUrl }];
    saveData(newData); setGlLinkTitle(""); setGlLinkUrl(""); toast("Link saved ✓");
  };
  const addProject = () => {
    if (!projectInput.trim()) return;
    const newData = JSON.parse(JSON.stringify(data));
    newData.extracurriculars.otherProjects = [...(newData.extracurriculars.otherProjects||[]), { id:uid(), title:projectInput }];
    saveData(newData); setProjectInput("");
  };

  return (
    <>
      <div className="page-title">Extracurriculars</div>
      <div className="tabs">
        {[{key:"main",label:"✦ Main"},{key:"genderlens",label:"♀ Gender Lens"},{key:"projects",label:"◆ Projects"}].map(t => (
          <button key={t.key} className={`tab ${extTab===t.key?"active":""}`} onClick={() => setExtTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {extTab === "main" && (
        <>
          <div className="card mb-3 card-accent">
            <div className="card-title">Add Task</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr auto auto auto", gap:8 }}>
              <input type="text" placeholder="Task…" value={todoInput} onChange={e => setTodoInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addExtraTodo()} />
              <input type="datetime-local" value={todoDue} onChange={e => setTodoDue(e.target.value)} style={{ width:190 }} />
              <select value={todoPriority} onChange={e => setTodoPriority(e.target.value)} style={{ width:80 }}>
                <option value="high">High</option>
                <option value="med">Med</option>
                <option value="low">Low</option>
              </select>
              <button className="btn btn-primary btn-sm" onClick={addExtraTodo}>ADD</button>
            </div>
          </div>
          <div className="card mb-3">
            <div className="card-title"><div className="card-title-dot" />TASKS</div>
            {todos.filter(t=>!t.done).map(t => (
              <div key={t.id} className="todo-item">
                <button className={`todo-check ${t.done?"done":""}`} onClick={() => toggleExtraTodo(t.id)}>{t.done&&"✓"}</button>
                <div className="todo-body"><div className="todo-text">{t.text}</div>{t.dueDate&&<div className="todo-due">📅 {fmtDateTime(t.dueDate)}</div>}</div>
                <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                <button className="todo-del" onClick={() => deleteExtraTodo(t.id)}>×</button>
              </div>
            ))}
            {todos.filter(t=>!t.done).length === 0 && <div style={{ color:"var(--muted)", fontSize:13, fontWeight:600 }}>No tasks!</div>}
          </div>
          <div className="card">
            <div className="card-title"><div className="card-title-dot" />LinkedIn</div>
            <input type="url" placeholder="Your LinkedIn URL…" value={extras.linkedin||""} onChange={e => update("extracurriculars.linkedin", e.target.value)} />
            {extras.linkedin && <a href={extras.linkedin} target="_blank" rel="noreferrer" className="link-tag mt-2" style={{ display:"inline-flex", marginTop:8 }}>Open LinkedIn →</a>}
          </div>
        </>
      )}

      {extTab === "genderlens" && (
        <>
          <div className="card mb-3">
            <div className="card-title">Gender Lens Tasks</div>
            {glTodos.filter(t=>!t.done).map(t => (
              <div key={t.id} className="todo-item">
                <button className={`todo-check ${t.done?"done":""}`} onClick={() => toggleGlTodo(t.id)}>{t.done&&"✓"}</button>
                <span className="todo-text">{t.text}</span>
              </div>
            ))}
            <div className="add-row mt-2">
              <input type="text" placeholder="Add task…" value={glTodoInput} onChange={e => setGlTodoInput(e.target.value)} onKeyDown={e => e.key==="Enter"&&addGlTodo()} />
              <button className="btn btn-primary btn-sm" onClick={addGlTodo}>ADD</button>
            </div>
          </div>
          <div className="card mb-3">
            <div className="card-title">Notes</div>
            <textarea value={genderLens.notes||""} onChange={e => update("extracurriculars.genderLens.notes", e.target.value)} placeholder="Gender Lens notes…" style={{ minHeight:120 }} />
          </div>
          <div className="card">
            <div className="card-title">Links</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:8, marginBottom:10 }}>
              <input type="text" placeholder="Title…" value={glLinkTitle} onChange={e => setGlLinkTitle(e.target.value)} />
              <input type="url" placeholder="URL…" value={glLinkUrl} onChange={e => setGlLinkUrl(e.target.value)} />
              <button className="btn btn-primary btn-sm" onClick={addGlLink}>SAVE</button>
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {glLinks.map(l => <a key={l.id} href={l.url} target="_blank" rel="noreferrer" className="link-tag">🔗 {l.title}</a>)}
            </div>
          </div>
        </>
      )}

      {extTab === "projects" && (
        <div className="card">
          <div className="card-title">Other Projects</div>
          {(extras.otherProjects||[]).map(p => (
            <div key={p.id} style={{ padding:"10px 0", borderBottom:"1px solid var(--border)", fontSize:14, fontWeight:700 }}>◆ {p.title}</div>
          ))}
          <div className="add-row mt-2">
            <input type="text" placeholder="Project name…" value={projectInput} onChange={e => setProjectInput(e.target.value)} onKeyDown={e => e.key==="Enter"&&addProject()} />
            <button className="btn btn-primary btn-sm" onClick={addProject}>ADD</button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── COUNTDOWNS PAGE ──────────────────────────────────────────────────────────
function CountdownsPage({ data, addCountdown, deleteCountdown }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [subject, setSubject] = useState("");
  const [color, setColor] = useState("#E63946");

  const allCountdowns = (data.countdowns || []).sort((a,b) => daysUntil(a.date) - daysUntil(b.date));

  return (
    <>
      <div className="page-title">Countdowns</div>
      <div className="card mb-3 card-accent">
        <div className="card-title">Add New Countdown</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto auto auto", gap:8, alignItems:"flex-end" }}>
          <input type="text" placeholder="Event name…" value={title} onChange={e => setTitle(e.target.value)} />
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          <select value={subject} onChange={e => setSubject(e.target.value)} style={{ width:120 }}>
            <option value="">No subject</option>
            {Object.keys(data.subjects).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width:40, height:40, padding:2, cursor:"pointer" }} />
          <button className="btn btn-primary btn-sm" onClick={() => { addCountdown(title, date, subject, color); setTitle(""); setDate(""); setSubject(""); }}>ADD ⏳</button>
        </div>
      </div>

      {allCountdowns.length === 0 ? (
        <div className="card"><div style={{ color:"var(--muted)", fontWeight:600 }}>No countdowns yet! Add your first one above.</div></div>
      ) : (
        <div className="countdown-grid">
          {allCountdowns.map(c => (
            <LiveCountdownWidget key={c.id} c={{ ...c, color: c.color || data.subjects[c.subject]?.color || "var(--red)" }} onDelete={() => deleteCountdown(c.id)} showDelete={true} />
          ))}
        </div>
      )}
    </>
  );
}

// ─── TIMER PAGE ───────────────────────────────────────────────────────────────
function TimerPage({ data, timerRunning, timerSec, timerSubject, setTimerSubject, startTimer, stopTimer, todaySessions, thisWeekSessions, todayTotal, thisWeekTotal, subjectTotals, maxSubjectTotal }) {
  const pad = n => String(n).padStart(2, "0");
  const h = Math.floor(timerSec / 3600);
  const m = Math.floor((timerSec % 3600) / 60);
  const s = timerSec % 60;

  return (
    <>
      <div className="page-title">Study Timer</div>
      <div className="grid-2 mb-3">
        <div className="card" style={{ textAlign:"center", borderTop:"3px solid var(--red)" }}>
          <div className="timer-display" style={{ color: timerRunning ? "var(--red)" : "var(--text)" }}>
            {pad(h)}:{pad(m)}:{pad(s)}
          </div>
          <div style={{ marginTop:20, marginBottom:20 }}>
            <select value={timerSubject} onChange={e => setTimerSubject(e.target.value)} style={{ width:"auto", display:"inline-block", marginRight:12 }}>
              {Object.keys(data.subjects).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
            {!timerRunning
              ? <button className="btn btn-primary" onClick={startTimer}>▶ Start</button>
              : <button className="btn btn-ghost" onClick={stopTimer}>⏹ Stop & Save</button>
            }
          </div>
        </div>
        <div className="card">
          <div className="card-title"><div className="card-title-dot" />TODAY</div>
          <div style={{ fontFamily:"var(--font-display)", fontSize:36, color:"var(--red)", letterSpacing:2, marginBottom:8 }}>{fmtDuration(todayTotal)||"0m"}</div>
          <div className="card-title mt-2"><div className="card-title-dot" style={{ background:"var(--blue)" }} />THIS WEEK</div>
          <div style={{ fontFamily:"var(--font-display)", fontSize:28, color:"var(--blue)", letterSpacing:2 }}>{fmtDuration(thisWeekTotal)||"0m"}</div>
        </div>
      </div>
      {Object.keys(subjectTotals).length > 0 && (
        <div className="card mb-3">
          <div className="card-title"><div className="card-title-dot" style={{ background:"var(--gold)" }} />THIS WEEK BY SUBJECT</div>
          {Object.entries(subjectTotals).sort((a,b)=>b[1]-a[1]).map(([sub,sec]) => (
            <div key={sub} className="bar-row">
              <div className="bar-label">{sub}</div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width:`${(sec/maxSubjectTotal)*100}%`, background:data.subjects[sub]?.color||"var(--red)" }} />
              </div>
              <div className="bar-val">{fmtDuration(sec)}</div>
            </div>
          ))}
        </div>
      )}
      {todaySessions.length > 0 && (
        <div className="card">
          <div className="card-title"><div className="card-title-dot" />TODAY'S SESSIONS</div>
          {todaySessions.map(s => (
            <div key={s.id} className="session-log-item">
              <span className="badge badge-med">{s.subject}</span>
              <span style={{ color:"var(--muted)", fontSize:12, fontWeight:600 }}>{new Date(s.ts).toLocaleTimeString("en-AU",{hour:"2-digit",minute:"2-digit"})}</span>
              <span style={{ fontFamily:"var(--font-mono)", fontSize:12, fontWeight:600 }}>{fmtTime(s.duration)}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ─── RESOURCES PAGE ───────────────────────────────────────────────────────────
function ResourcesPage({ data, saveData, update, toast }) {
  const [bookmarkTitle, setBookmarkTitle] = useState("");
  const [bookmarkUrl, setBookmarkUrl] = useState("");
  const [resTab, setResTab] = useState("bookmarks");
  const fileInputRef = useRef(null);

  const addBookmark = () => {
    if (!bookmarkTitle.trim() || !bookmarkUrl.trim()) return;
    const newData = JSON.parse(JSON.stringify(data));
    newData.bookmarks = [...(newData.bookmarks||[]), { id:uid(), title:bookmarkTitle, url:bookmarkUrl }];
    saveData(newData); setBookmarkTitle(""); setBookmarkUrl(""); toast("Bookmark saved ✓");
  };
  const deleteBookmark = (id) => {
    const newData = JSON.parse(JSON.stringify(data));
    newData.bookmarks = newData.bookmarks.filter(b => b.id !== id);
    saveData(newData);
  };

  const addVisionImageUrl = (url) => {
    if (!url.trim()) return;
    const newData = JSON.parse(JSON.stringify(data));
    newData.visionBoard = [...(newData.visionBoard||[]), { id:uid(), url }];
    saveData(newData);
    toast("Image added ✓");
  };
  const addVisionImageFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const newData = JSON.parse(JSON.stringify(data));
      newData.visionBoard = [...(newData.visionBoard||[]), { id:uid(), url:e.target.result }];
      saveData(newData);
      toast("Image added ✓");
    };
    reader.readAsDataURL(file);
  };
  const deleteVision = (id) => {
    const newData = JSON.parse(JSON.stringify(data));
    newData.visionBoard = newData.visionBoard.filter(v => v.id !== id);
    saveData(newData);
  };

  const [visionUrl, setVisionUrl] = useState("");

  return (
    <>
      <div className="page-title">Resources</div>
      <div className="tabs">
        {[{key:"bookmarks",label:"🔖 Bookmarks"},{key:"notes",label:"📝 Quick Notes"},{key:"vision",label:"🌅 Vision Board"}].map(t => (
          <button key={t.key} className={`tab ${resTab===t.key?"active":""}`} onClick={() => setResTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {resTab === "bookmarks" && (
        <>
          <div className="card mb-3 card-accent">
            <div className="card-title">Add Bookmark</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:8 }}>
              <input type="text" placeholder="Title" value={bookmarkTitle} onChange={e => setBookmarkTitle(e.target.value)} />
              <input type="url" placeholder="https://…" value={bookmarkUrl} onChange={e => setBookmarkUrl(e.target.value)} onKeyDown={e => e.key==="Enter"&&addBookmark()} />
              <button className="btn btn-primary btn-sm" onClick={addBookmark}>SAVE</button>
            </div>
          </div>
          <div className="grid-auto">
            {(data.bookmarks||[]).map(b => (
              <div key={b.id} className="bookmark-card" style={{ position:"relative" }}>
                <button onClick={() => deleteBookmark(b.id)} style={{ position:"absolute", top:8, right:8, background:"none", border:"none", cursor:"pointer", color:"var(--muted)", fontSize:18 }}>×</button>
                <div className="bookmark-title">{b.title}</div>
                <a href={b.url} target="_blank" rel="noreferrer" className="bookmark-url">{b.url}</a>
              </div>
            ))}
          </div>
          {(data.bookmarks||[]).length === 0 && <div style={{ color:"var(--muted)", fontWeight:600 }}>No bookmarks yet</div>}
        </>
      )}

      {resTab === "notes" && (
        <div className="card">
          <div className="card-title">Quick Notes</div>
          <textarea value={data.quickNotes||""} onChange={e => update("quickNotes", e.target.value)} placeholder="Jot anything down here…" style={{ minHeight:360 }} />
        </div>
      )}

      {resTab === "vision" && (
        <>
          <div className="card mb-3 card-accent">
            <div className="card-title">Vision Board 🌅</div>
            <div style={{ display:"flex", gap:8, marginBottom:8 }}>
              <button className="btn btn-primary btn-sm" onClick={() => fileInputRef.current?.click()}>📷 Upload Image</button>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e => { if (e.target.files[0]) addVisionImageFile(e.target.files[0]); }} />
            </div>
            <div className="add-row">
              <input type="url" placeholder="Or paste image URL…" value={visionUrl} onChange={e => setVisionUrl(e.target.value)} onKeyDown={e => { if (e.key==="Enter") { addVisionImageUrl(visionUrl); setVisionUrl(""); } }} />
              <button className="btn btn-ghost btn-sm" onClick={() => { addVisionImageUrl(visionUrl); setVisionUrl(""); }}>ADD URL</button>
            </div>
          </div>
          <div className="vision-grid">
            {(data.visionBoard||[]).map(v => (
              <div key={v.id} style={{ position:"relative" }}>
                <img src={v.url} className="vision-img" alt="vision" onError={e => { e.target.style.background="var(--bg3)"; }} />
                <button onClick={() => deleteVision(v.id)} style={{ position:"absolute", top:6, right:6, background:"rgba(0,0,0,0.5)", border:"none", borderRadius:"50%", width:26, height:26, color:"white", cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
              </div>
            ))}
            <div className="vision-add" onClick={() => fileInputRef.current?.click()}>
              <span style={{ fontSize:28 }}>+</span>
              <span>Upload Photo</span>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────
function SettingsPage({ data, update, saveData }) {
  const [showJson, setShowJson] = useState(false);
  const [jsonText, setJsonText] = useState("");

  return (
    <>
      <div className="page-title">Settings</div>
      <div className="grid-2 mb-3">
        <div className="card card-accent">
          <div className="card-title">Profile</div>
          <div className="insight-label mb-1">Your Name</div>
          <input type="text" value={data.settings?.name||""} onChange={e => update("settings.name", e.target.value)} placeholder="Your name" />
        </div>
        <div className="card">
          <div className="card-title">Hero Image</div>
          <div className="insight-label mb-1">Background Image URL</div>
          <input type="url" value={data.heroImage||""} onChange={e => update("heroImage", e.target.value)} placeholder="https://your-image.jpg" />
        </div>
      </div>
      <div className="card mb-3">
        <div className="card-title">Supabase Sync</div>
        <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.7, marginBottom:10, fontFamily:"var(--font-mono)" }}>
          Syncs via Supabase. Table: <code>hsc_dashboard</code> — columns: <code>id (int8)</code>, <code>payload (jsonb)</code>
        </div>
        <a href="https://supabase.com" target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">Open Supabase →</a>
      </div>
      <div className="card">
        <div className="card-title">Export / Import</div>
        <div style={{ display:"flex", gap:8, marginBottom:10 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => { setJsonText(JSON.stringify(data, null, 2)); setShowJson(true); }}>EXPORT JSON</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowJson(!showJson)}>{showJson ? "HIDE" : "IMPORT JSON"}</button>
        </div>
        {showJson && (
          <>
            <textarea value={jsonText} onChange={e => setJsonText(e.target.value)} style={{ minHeight:200, fontFamily:"var(--font-mono)", fontSize:11 }} />
            <button className="btn btn-primary btn-sm mt-1" onClick={() => { try { saveData(JSON.parse(jsonText)); alert("Imported!"); } catch { alert("Invalid JSON"); } }}>IMPORT</button>
          </>
        )}
      </div>
    </>
  );
}
