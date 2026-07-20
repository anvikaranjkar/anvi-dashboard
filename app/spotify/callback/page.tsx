"use client";

import { useEffect } from "react";

export default function SpotifyCallback() {
  useEffect(() => {
    const incoming = new URLSearchParams(window.location.search);
    const outgoing = new URLSearchParams();
    if (incoming.get("code")) outgoing.set("spotify_code", incoming.get("code")!);
    if (incoming.get("state")) outgoing.set("spotify_state", incoming.get("state")!);
    if (incoming.get("error")) outgoing.set("spotify_error", incoming.get("error")!);
    window.location.replace(`/?${outgoing}`);
  }, []);
  return <main className="spotify-callback"><span>♫</span><h1>Connecting Spotify…</h1><p>Taking you back to Anvi’s Dashboard.</p></main>;
}
