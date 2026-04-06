// ═══════════════════════════════════════════════════════════════
// SPIKE AI — Service Worker
// Handles caching for offline support + PWA
// Skips: partial responses (206), video streams, YouTube, Vimeo
// ═══════════════════════════════════════════════════════════════

const CACHE_NAME = "spike-ai-v4";

// Only cache static assets + pages
const PRECACHE_URLS = [
  "/",
  "/manifest.json",
];

// Domains to NEVER cache (video streams, analytics, etc.)
const SKIP_DOMAINS = [
  "youtube.com",
  "youtu.be",
  "ytimg.com",
  "googlevideo.com",
  "vimeo.com",
  "vimeocdn.com",
  "supabase.co",
  "googleapis.com",
  "google-analytics.com",
  "googletagmanager.com",
];

// File extensions to cache
const CACHEABLE_EXTENSIONS = [
  ".js", ".css", ".png", ".jpg", ".jpeg", ".svg", ".webp",
  ".woff", ".woff2", ".ttf", ".ico", ".json",
];

// ─── Install ───
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {
        // Silently fail — some URLs might not exist yet
      });
    })
  );
  self.skipWaiting();
});

// ─── Activate — clean old caches ───
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch — smart caching strategy ───
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip video/streaming domains entirely
  if (SKIP_DOMAINS.some((domain) => url.hostname.includes(domain))) return;

  // Skip chrome-extension and other non-http schemes
  if (!url.protocol.startsWith("http")) return;

  // For navigation requests (HTML pages) — network first, cache fallback
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Only cache successful full responses (NOT 206 partial)
          if (response.ok && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // For static assets — cache first, network fallback
  const isCacheable = CACHEABLE_EXTENSIONS.some((ext) => url.pathname.endsWith(ext));

  if (isCacheable) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;

        return fetch(event.request).then((response) => {
          // CRITICAL: Never cache partial (206) responses
          // This prevents the YouTube/video stream cache error
          if (!response.ok || response.status !== 200) return response;

          // Don't cache opaque responses (cross-origin without CORS)
          if (response.type === "opaque") return response;

          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        }).catch(() => {
          // Offline — return nothing for assets
          return new Response("", { status: 408, statusText: "Offline" });
        });
      })
    );
    return;
  }

  // Everything else — network only, no caching
  // (API calls, video chunks, etc.)
});
