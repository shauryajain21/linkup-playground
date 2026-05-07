const PORT = parseInt(process.env.PORT || "3000");
const KEY = process.env.LINKUP_API_KEY;

if (!KEY) console.warn("[warn] LINKUP_API_KEY not set — /api proxies will return 500");

const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

function allow(ip: string) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_LIMIT) return false;
  arr.push(now);
  hits.set(ip, arr);
  return true;
}

async function proxy(endpoint: "search" | "fetch", body: string) {
  if (!KEY) return new Response(JSON.stringify({ error: "Server missing LINKUP_API_KEY" }), { status: 500, headers: { "Content-Type": "application/json" } });
  const r = await fetch(`https://api.linkup.so/v1/${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body,
  });
  const data = await r.text();
  return new Response(data, { status: r.status, headers: { "Content-Type": r.headers.get("content-type") || "application/json" } });
}

Bun.serve({
  port: PORT,
  async fetch(req, server) {
    const url = new URL(req.url);
    const ip = server.requestIP(req)?.address || req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";

    if (url.pathname === "/api/search" || url.pathname === "/api/fetch") {
      if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
      if (!allow(ip)) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { "Content-Type": "application/json" } });
      const endpoint = url.pathname === "/api/search" ? "search" : "fetch";
      try {
        return await proxy(endpoint, await req.text());
      } catch (e) {
        return new Response(JSON.stringify({ error: String(e) }), { status: 502, headers: { "Content-Type": "application/json" } });
      }
    }

    let path = url.pathname === "/" ? "/index.html" : url.pathname;
    const file = Bun.file(`./public${path}`);
    if (await file.exists()) return new Response(file);
    return new Response(Bun.file("./public/index.html"));
  },
});

console.log(`Linkup playground proxy listening on :${PORT}`);
