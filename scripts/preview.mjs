import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, isAbsolute, relative, resolve, sep } from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";
import { initializeDatabase } from "../database/initialize.mjs";
import { adaptDatabase } from "../server/database.mjs";
import { handleRoomRequest } from "../server/room-handler.mjs";
import { handleProfileRequest } from "../server/profile-transfer.mjs";

const client = createClient({ url: "file::memory:" });
await initializeDatabase(client);
const database = adaptDatabase(client);
const publicDir = fileURLToPath(new URL("../public/", import.meta.url));
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".webp": "image/webp",
  ".glb": "model/gltf-binary"
};

async function staticResponse(url) {
  const path = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const file = resolve(publicDir, "." + path);
  const location = relative(publicDir, file);
  if (isAbsolute(location) || location === ".." || location.startsWith(".." + sep) || !types[extname(file)]) {
    return new Response("Not found", { status: 404 });
  }
  try {
    return new Response(await readFile(file), { headers: { "Content-Type": types[extname(file)] } });
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") return new Response("Not found", { status: 404 });
    throw error;
  }
}

const host = "127.0.0.1";
const port = Number(process.env.PORT || 4178);
createServer(async (incoming, outgoing) => {
  try {
    const url = new URL(incoming.url, "http://" + incoming.headers.host);
    let response;
    if (url.pathname.startsWith("/api/")) {
      const options = { method: incoming.method, headers: incoming.headers };
      if (incoming.method !== "GET" && incoming.method !== "HEAD") {
        options.body = Readable.toWeb(incoming);
        options.duplex = "half";
      }
      const handle=url.pathname==="/api/profile"?handleProfileRequest:handleRoomRequest;
      response = await handle(new Request(url, options), () => database);
    } else {
      response = await staticResponse(url);
    }
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    if (response.body && incoming.method !== "HEAD") Readable.fromWeb(response.body).pipe(outgoing);
    else outgoing.end();
  } catch {
    outgoing.writeHead(500).end();
  }
}).listen(port, host, () => console.log("유람 · http://" + host + ":" + port));
