// Chris Dunk service worker
const VERSION = "v12";
const CACHE = "chris-dunk-" + VERSION;
// App shell: always fetched fresh from the network when online.
const CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];
// Optional game art/audio: cached if present, skipped if missing so install never fails.
const OPTIONAL = [
  "./assets/outfit_elec.png",
  "./assets/outfit_hawaii.png",
  "./assets/outfit_tux.png",
  "./assets/outfit_jersey.png",
  "./assets/outfit_cowboy.png",
  "./assets/outfit_swim.png",
  "./assets/outfit_pizza.png",
  "./assets/outfit_spaghetti.png",
  "./assets/outfit_cannoli.png",
  "./assets/dunk1.mp3",
  "./assets/dunk2.mp3",
  "./assets/dunk3.mp3",
  "./assets/dunk4.mp3",
  "./assets/dunk5.mp3",
  "./assets/voice/taunt1.mp3",
  "./assets/voice/taunt2.mp3",
  "./assets/voice/taunt3.mp3",
  "./assets/voice/taunt4.mp3",
  "./assets/voice/taunt5.mp3",
  "./assets/voice/taunt6.mp3",
  "./assets/voice/miss1.mp3",
  "./assets/voice/miss2.mp3",
  "./assets/voice/miss3.mp3",
  "./assets/voice/dunk1.mp3",
  "./assets/voice/dunk2.mp3",
  "./assets/voice/dunk3.mp3",
  "./assets/voice/taunt7.mp3",
  "./assets/voice/taunt8.mp3",
  "./assets/voice/taunt9.mp3",
  "./assets/voice/taunt10.mp3",
  "./assets/voice/taunt11.mp3",
  "./assets/voice/taunt12.mp3",
  "./assets/voice/taunt13.mp3",
  "./assets/voice/miss4.mp3",
  "./assets/voice/miss5.mp3",
  "./assets/voice/miss6.mp3",
  "./assets/voice/dunk4.mp3",
  "./assets/voice/dunk5.mp3",
  "./assets/voice/dunk6.mp3"
];
// cache: "reload" bypasses the browser HTTP cache (GitHub Pages sends max-age=600),
// so a new version never gets pre-cached with the previous build's files.
const fresh = (u) => new Request(u, { cache: "reload" });

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(async (cache) => {
    await cache.addAll(CORE.map(fresh));
    await Promise.all(OPTIONAL.map((u) => cache.add(fresh(u)).catch(() => {})));
  }));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    const old = keys.filter((k) => k !== CACHE);
    await Promise.all(old.map((k) => caches.delete(k)));
    await self.clients.claim();
    // Pages from v10 and earlier have no update handler of their own, so reload them once here.
    const legacy = old.some((k) => k.startsWith("dunk-decollo") || (/^chris-dunk-v(\d+)$/.test(k) && Number(RegExp.$1) <= 10));
    if (legacy) {
      const wins = await self.clients.matchAll({ type: "window" });
      wins.forEach((w) => { try { w.navigate(w.url); } catch (e) {} });
    }
  })());
});

function isShell(req, url) {
  if (req.mode === "navigate") return true;
  const p = url.pathname;
  return p.endsWith("/") || p.endsWith("/index.html") || p.endsWith(".webmanifest") || p.endsWith("/sw.js");
}

async function networkFirst(req, url) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(url.href, { cache: "no-store", credentials: "same-origin" });
    if (res && res.ok) cache.put(url.origin + url.pathname, res.clone()).catch(() => {});
    return res;
  } catch (e) {
    return (await cache.match(url.origin + url.pathname)) ||
      (req.mode === "navigate" ? (await cache.match("./index.html")) || (await cache.match("./")) : undefined) ||
      Response.error();
  }
}

async function staleWhileRevalidate(event, req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  const net = fetch(req).then((res) => {
    if (res && res.status === 200) cache.put(req, res.clone()).catch(() => {});
    return res;
  });
  if (hit) {
    event.waitUntil(net.catch(() => {}));
    return hit;
  }
  return net;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.headers.has("range")) return; // let the browser handle partial audio requests
  event.respondWith(isShell(req, url) ? networkFirst(req, url) : staleWhileRevalidate(event, req));
});
