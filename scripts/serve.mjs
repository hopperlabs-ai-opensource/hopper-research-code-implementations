import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
const root = new URL("../dist/", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("manifest.json", root), "utf8"));
const files = new Set(manifest.files.map((f) => `/${f.file}`));
const port = Number(process.env.PORT ?? 4173);
if (!Number.isInteger(port) || port < 0 || port > 65535) throw Error("PORT must be an integer from 0 to 65535.");
const server = createServer(async (request, response) => {
  if (!["GET", "HEAD"].includes(request.method)) {
    response.writeHead(405, { Allow: "GET, HEAD" }); response.end(); return;
  }
  const path = request.url.split("?")[0] === "/" ? "/index.html" : request.url.split("?")[0];
  if (!files.has(path)) { response.writeHead(404); response.end("Not found"); return; }
  try {
    const content = await readFile(new URL(path.slice(1), root));
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    response.end(request.method === "HEAD" ? undefined : content);
  } catch { response.writeHead(500); response.end("Rebuild the demos with npm run build."); }
});
server.on("error", (error) => {
  console.error(error.code === "EADDRINUSE" ? `Port ${port} is busy. Try PORT=4174 npm start.` : error.message);
  process.exitCode = 1;
});
server.listen(port, "127.0.0.1", () => {
  console.log(`Open http://127.0.0.1:${server.address().port}\nEverything runs locally. Press Ctrl+C to stop.`);
});
