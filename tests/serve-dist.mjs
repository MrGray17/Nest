import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

const root = resolve(process.cwd(), "dist");
const host = "127.0.0.1";
const port = 4173;
const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webmanifest", "application/manifest+json"],
]);

function safePath(pathname) {
  const requested = resolve(root, `.${decodeURIComponent(pathname)}`);
  return requested === root || requested.startsWith(`${root}${sep}`) ? requested : null;
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${host}:${port}`);
    let file = safePath(url.pathname === "/" ? "/index.html" : url.pathname);
    if (!file) {
      response.writeHead(400).end("Bad request");
      return;
    }
    try {
      if (!(await stat(file)).isFile()) file = resolve(root, "index.html");
    } catch {
      file = resolve(root, "index.html");
    }
    const body = await readFile(file);
    response.writeHead(200, {
      "content-type": contentTypes.get(extname(file)) ?? "application/octet-stream",
      "cache-control": file.endsWith("sw.js") ? "no-cache" : "public, max-age=0",
    });
    response.end(body);
  } catch {
    response.writeHead(500).end("Server error");
  }
});

server.listen(port, host);

const shutdown = () => server.close(() => process.exit(0));
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
