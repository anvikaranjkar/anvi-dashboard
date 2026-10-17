import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Anvi’s Dashboard",
    short_name: "Anvi’s Dashboard",
    description: "Anvi’s personal dashboard for study, tasks, goals, meetings and focus.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f7f3",
    theme_color: "#c7b8ee",
    orientation: "any",
    shortcuts: [
      { name: "Focus Display", short_name: "Display", description: "Open the always-on focus display", url: "/display", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
