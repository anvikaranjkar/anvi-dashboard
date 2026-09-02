"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./display.module.css";

type Todo = { id: string; text: string; done: boolean; priority?: string; dueDate?: string; note?: string; archivedAt?: string };
type Subject = { id: string; name: string; color: string; todos: Todo[]; exercises?: Todo[] };
type Countdown = { id: string; title: string; date: string; color: string };
type ActiveStudyTimer = { subject: string; startedAt: string; note?: string; targetMinutes?: number | null };
type DisplaySettings = { countdownId?: string; showTodos?: boolean; showTimer?: boolean; showCountdown?: boolean };
type DisplayData = { profile?: { name?: string }; overallTodos: Todo[]; subjects: Subject[]; countdowns: Countdown[]; activeStudyTimer?: ActiveStudyTimer; displaySettings?: DisplaySettings };
type SpotifyToken = { access_token: string; refresh_token?: string; expires_at: number };
type SpotifyTrack = { id: string; name: string; duration_ms: number; external_urls?: { spotify?: string }; artists?: { name: string }[]; album?: { name: string; images?: { url: string }[] } };
type SpotifyPlayback = { is_playing: boolean; progress_ms: number; item?: SpotifyTrack };

const STORAGE_KEY = "anvis-dashboard-data";
const SPOTIFY_CLIENT_ID = "8d00c73eed1441b6ac0c8c43ecaadfec";
const SPOTIFY_TOKEN_KEY = "anvis-dashboard-spotify-token";
const SPOTIFY_VERIFIER_KEY = "anvis-dashboard-spotify-verifier";
const SPOTIFY_STATE_KEY = "anvis-dashboard-spotify-state";
const SPOTIFY_RETURN_KEY = "anvis-dashboard-spotify-return";
const SUPABASE_URL = "https://iiwjnqfbhzfzwzvccapc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzIiwicmVmIjoiaWl3am5xZmJoemZ6d3p2Y2NhcGMiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc3ODg2OTY1MSwiZXhwIjoyMDk0NDQ1NjUxfQ.PX4XXr9fxtZHqN-hq5iwvkOV3-oYULXi459Zcis6h9Y";

const emptyData: DisplayData = { overallTodos: [], subjects: [], countdowns: [], displaySettings: {} };

export default function DisplayApp() {
  const [data, setData] = useState<DisplayData>(emptyData);
  const [now, setNow] = useState(new Date());
  const [loaded, setLoaded] = useState(false);
  const [token, setToken] = useState<SpotifyToken | null>(null);
  const [playback, setPlayback] = useState<SpotifyPlayback | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    try { const cached = normalise(JSON.parse(localStorage.getItem(STORAGE_KEY) || "null")); queueMicrotask(() => setData(cached)); } catch {}
    void loadCloud().then(next => { if (next) setData(next); }).finally(() => setLoaded(true));
    const clock = setInterval(() => setNow(new Date()), 1000);
    const cloud = setInterval(() => void loadCloud().then(next => { if (next) setData(next); }), 10000);
    const onStorage = (event: StorageEvent) => { if (event.key === STORAGE_KEY && event.newValue) { try { setData(normalise(JSON.parse(event.newValue))); } catch {} } };
    window.addEventListener("storage", onStorage);
    return () => { clearInterval(clock); clearInterval(cloud); window.removeEventListener("storage", onStorage); };
  }, []);

  useEffect(() => {
    let stored: SpotifyToken | null = null;
    try { stored = JSON.parse(localStorage.getItem(SPOTIFY_TOKEN_KEY) || "null"); } catch {}
    const params = new URLSearchParams(window.location.search);
    const code = params.get("spotify_code");
    const returnedState = params.get("spotify_state");
    if (code) {
      const verifier = localStorage.getItem(SPOTIFY_VERIFIER_KEY);
      const expectedState = localStorage.getItem(SPOTIFY_STATE_KEY);
      history.replaceState({}, "", "/display");
      if (!verifier || returnedState !== expectedState) return;
      void exchangeSpotifyCode(code, verifier).then(next => { saveSpotifyToken(next); setToken(next); localStorage.removeItem(SPOTIFY_VERIFIER_KEY); localStorage.removeItem(SPOTIFY_STATE_KEY); });
      return;
    }
    queueMicrotask(() => setToken(stored));
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    async function refreshSpotify() {
      try {
        const active = await validSpotifyToken(token!);
        if (active.access_token !== token!.access_token) setToken(active);
        const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", { headers: { Authorization: `Bearer ${active.access_token}` } });
        if (cancelled) return;
        if (response.status === 204) return setPlayback(null);
        if (!response.ok) throw new Error("Playback unavailable");
        const current = await response.json() as SpotifyPlayback;
        setPlayback(current.is_playing && current.item ? current : null);
      } catch { if (!cancelled) setPlayback(null); }
    }
    void refreshSpotify();
    const interval = setInterval(refreshSpotify, 8000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [token?.access_token]);

  const todayKey = localDateKey(now);
  const todos = useMemo(() => [
    ...data.overallTodos.map(todo => ({ todo, source: "Personal", color: "#f2d49b" })),
    ...data.subjects.flatMap(subject => [...subject.todos, ...(subject.exercises || [])].map(todo => ({ todo, source: subject.name, color: subject.color }))),
  ].filter(item => item.todo.dueDate === todayKey && !item.todo.done && !item.todo.archivedAt), [data, todayKey]);
  const selectedCountdown = data.countdowns.find(item => item.id === data.displaySettings?.countdownId);
  const countdownMs = selectedCountdown ? new Date(selectedCountdown.date).getTime() - now.getTime() : 0;
  const countdownPassed = countdownMs <= 0;
  const countdownDistance = Math.abs(countdownMs);
  const activeTimer = data.activeStudyTimer;
  const activeSeconds = activeTimer ? Math.max(0, Math.floor((now.getTime() - new Date(activeTimer.startedAt).getTime()) / 1000)) : 0;
  const track = playback?.item;
  const cover = track?.album?.images?.[0]?.url;
  const showTodos = data.displaySettings?.showTodos !== false;
  const showTimer = data.displaySettings?.showTimer !== false && Boolean(activeTimer);
  const showCountdown = data.displaySettings?.showCountdown !== false && Boolean(selectedCountdown);
  const hasStatus = showTimer || showCountdown;
  const clock = now.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }).replace(" ", "").toUpperCase();
  const [timePart, meridiem = ""] = clock.match(/(\d{1,2}:\d{2}:\d{2})(AM|PM)/)?.slice(1) || [clock, ""];

  async function updateAndSave(next: DisplayData) {
    setData(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    await cloudRequest("save_student_dashboard", { new_payload: next });
  }
  function archiveTodo(id: string) {
    const archive = (items: Todo[]) => items.map(todo => todo.id === id ? { ...todo, done: true, archivedAt: new Date().toISOString() } : todo);
    void updateAndSave({ ...data, overallTodos: archive(data.overallTodos), subjects: data.subjects.map(subject => ({ ...subject, todos: archive(subject.todos), exercises: subject.exercises ? archive(subject.exercises) : undefined })) });
  }
  function chooseCountdown(id: string) { void updateAndSave({ ...data, displaySettings: { ...data.displaySettings, countdownId: id || undefined } }); }
  function setVisible(key: "showTodos" | "showTimer" | "showCountdown", visible: boolean) { void updateAndSave({ ...data, displaySettings: { ...data.displaySettings, [key]: visible } }); }

  return <main className={`${styles.display} ${track ? styles.musicActive : ""}`}>
    {cover && <div className={styles.albumAmbience} style={{ backgroundImage: `url(${cover})` }} />}
    <div className={styles.veil} />
    <header className={styles.topbar}><Link href="/" aria-label="Back to dashboard"><span>✦</span><strong>Anvi’s Display</strong></Link><div className={styles.topActions}>{!token && <button onClick={() => void connectSpotifyForDisplay()}>Connect Spotify</button>}<button aria-expanded={editorOpen} onClick={() => setEditorOpen(value => !value)}>Edit display</button><button onClick={() => document.documentElement.requestFullscreen?.()}>Full screen</button></div></header>
    {editorOpen && <div className={styles.editorBackdrop} onClick={() => setEditorOpen(false)}><section className={styles.displayEditor} role="dialog" aria-modal="true" aria-label="Edit display" onClick={event => event.stopPropagation()}><div className={styles.editorHeading}><div><span>DISPLAY OPTIONS</span><h2>Choose what appears</h2></div><button onClick={() => setEditorOpen(false)} aria-label="Close display options">×</button></div><label className={styles.editorSelect}>Featured countdown<select value={data.displaySettings?.countdownId || ""} onChange={event => chooseCountdown(event.target.value)}><option value="">None</option>{data.countdowns.map(item => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label><div className={styles.visibilityList}><VisibilityToggle label="Today’s to-dos" checked={showTodos} onChange={value => setVisible("showTodos", value)} /><VisibilityToggle label="Active study timer" checked={data.displaySettings?.showTimer !== false} onChange={value => setVisible("showTimer", value)} /><VisibilityToggle label="Countdown" checked={data.displaySettings?.showCountdown !== false} onChange={value => setVisible("showCountdown", value)} /></div><p>Spotify artwork appears automatically whenever music is playing.</p><button className={styles.doneButton} onClick={() => setEditorOpen(false)}>Done</button></section></div>}
    <section className={styles.clockArea}><p>{now.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}</p><div className={styles.flipClock} aria-label={`Current time ${timePart} ${meridiem}`}>{timePart.split("").map((character, index) => character === ":" ? <span className={styles.colon} key={index}>:</span> : <span className={styles.digit} key={index}><i>{character}</i></span>)}<em>{meridiem}</em></div><h1>{getGreeting(now)}, {data.profile?.name || "Anvi"}.</h1></section>
    <section className={`${styles.content} ${track ? styles.withMusic : ""} ${!showTodos ? styles.noTodos : ""} ${!hasStatus ? styles.noStatus : ""}`}>
      {track && <a className={styles.musicPanel} href={track.external_urls?.spotify} target="_blank" rel="noreferrer"><img src={cover} alt={`${track.album?.name || track.name} cover`} /><div><span>PLAYING NOW</span><h2>{track.name}</h2><p>{track.artists?.map(artist => artist.name).join(", ")}</p><small>{track.album?.name}</small><div className={styles.musicProgress}><i style={{ width: `${track.duration_ms ? Math.min(100, (playback?.progress_ms || 0) / track.duration_ms * 100) : 0}%` }} /></div></div></a>}
      {showTodos && <div className={styles.todayPanel}><div className={styles.panelHeading}><div><span>TODAY</span><h2>What matters now</h2></div><b>{todos.length}</b></div><div className={styles.todoList}>{todos.length ? todos.map(item => <button className={styles.todo} onClick={() => archiveTodo(item.todo.id)} key={item.todo.id}><i style={{ "--todo-colour": item.color } as React.CSSProperties} /><span><strong>{item.todo.text}</strong><small>{item.source}{item.todo.note ? ` · ${item.todo.note}` : ""}</small></span><em>✓</em></button>) : <div className={styles.clearDay}><span>✦</span><strong>Your day is clear.</strong><small>Anything due today will appear here.</small></div>}</div></div>}
      {hasStatus && <div className={styles.statusColumn}>
        {showTimer && activeTimer && <article className={styles.timerCard}><span>STUDY SESSION ACTIVE</span><div><i>◷</i><strong>{formatClock(activeSeconds)}</strong></div><h3>{activeTimer.subject}</h3>{activeTimer.note && <p>{activeTimer.note}</p>}{activeTimer.targetMinutes && <small>{Math.max(0, activeTimer.targetMinutes * 60 - activeSeconds) > 0 ? `${formatClock(Math.max(0, activeTimer.targetMinutes * 60 - activeSeconds))} remaining` : "Target complete"}</small>}</article>}
        {showCountdown && selectedCountdown && <article className={styles.countdownCard} style={{ "--count-colour": selectedCountdown.color } as React.CSSProperties}><span>{countdownPassed ? "TIME SINCE" : "COUNTING DOWN TO"}</span><h3>{selectedCountdown.title}</h3><div className={styles.countdownUnits}><div><strong>{Math.floor(countdownDistance / 86400000)}</strong><small>days</small></div><div><strong>{Math.floor((countdownDistance % 86400000) / 3600000)}</strong><small>hours</small></div><div><strong>{Math.floor((countdownDistance % 3600000) / 60000)}</strong><small>minutes</small></div><div><strong>{Math.floor((countdownDistance % 60000) / 1000)}</strong><small>seconds</small></div></div></article>}
      </div>}
    </section>
    {!loaded && <div className={styles.loading}>Preparing your display…</div>}
  </main>;
}

function VisibilityToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className={styles.visibilityToggle}><span>{label}</span><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} /><i /></label>; }

function normalise(value: Partial<DisplayData> | null): DisplayData { return { ...emptyData, ...(value || {}), overallTodos: value?.overallTodos || [], subjects: value?.subjects || [], countdowns: value?.countdowns || [], displaySettings: value?.displaySettings || {} }; }
async function cloudRequest(fn: string, body: object) { return fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: "POST", headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify(body) }); }
async function loadCloud() { try { const response = await cloudRequest("load_student_dashboard", {}); if (!response.ok) return null; const payload = await response.json(); const next = normalise(payload); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); return next; } catch { return null; } }
function localDateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function formatClock(seconds: number) { const hours = Math.floor(seconds / 3600); const minutes = Math.floor((seconds % 3600) / 60); const remainder = seconds % 60; return [hours, minutes, remainder].map(value => String(value).padStart(2, "0")).join(":"); }
function getGreeting(date: Date) { const hour = date.getHours(); return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"; }

async function connectSpotifyForDisplay() {
  const verifier = randomString(64); const state = randomString(24);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  localStorage.setItem(SPOTIFY_VERIFIER_KEY, verifier); localStorage.setItem(SPOTIFY_STATE_KEY, state); localStorage.setItem(SPOTIFY_RETURN_KEY, "/display");
  const redirectUri = `${window.location.origin}/spotify/callback`;
  const params = new URLSearchParams({ client_id: SPOTIFY_CLIENT_ID, response_type: "code", redirect_uri: redirectUri, scope: "user-read-currently-playing user-read-playback-state", code_challenge_method: "S256", code_challenge: challenge, state });
  window.location.assign(`https://accounts.spotify.com/authorize?${params}`);
}
function randomString(length: number) { const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"; const values = crypto.getRandomValues(new Uint8Array(length)); return Array.from(values, value => chars[value % chars.length]).join(""); }
async function exchangeSpotifyCode(code: string, verifier: string) { const response = await fetch("https://accounts.spotify.com/api/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: SPOTIFY_CLIENT_ID, grant_type: "authorization_code", code, redirect_uri: `${window.location.origin}/spotify/callback`, code_verifier: verifier }) }); if (!response.ok) throw new Error("Spotify authorization failed"); const body = await response.json(); return { access_token: body.access_token, refresh_token: body.refresh_token, expires_at: Date.now() + body.expires_in * 1000 - 60000 } as SpotifyToken; }
async function validSpotifyToken(token: SpotifyToken) { if (token.expires_at > Date.now()) return token; if (!token.refresh_token) throw new Error("Spotify refresh token missing"); const response = await fetch("https://accounts.spotify.com/api/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: SPOTIFY_CLIENT_ID, grant_type: "refresh_token", refresh_token: token.refresh_token }) }); if (!response.ok) throw new Error("Spotify refresh failed"); const body = await response.json(); const next = { access_token: body.access_token, refresh_token: body.refresh_token || token.refresh_token, expires_at: Date.now() + body.expires_in * 1000 - 60000 }; saveSpotifyToken(next); return next; }
function saveSpotifyToken(token: SpotifyToken) { localStorage.setItem(SPOTIFY_TOKEN_KEY, JSON.stringify(token)); }
