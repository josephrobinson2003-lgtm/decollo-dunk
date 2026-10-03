const CACHE = "chris-dunk-v9";
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
  "./assets/voice/dunk3.mp3"
];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then(async (cache) => {
    await cache.addAll(CORE);
    await Promise.all(OPTIONAL.map((u) => cache.add(u).catch(() => {})));
  }));
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((hit) => hit || fetch(event.request).then((res) => {
      if (res.ok && new URL(event.request.url).origin === self.location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy)).catch(() => {});
      }
      return res;
    }).catch(() => caches.match("./index.html")))
  );
});
