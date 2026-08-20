import { spawn } from "node:child_process";
import { once } from "node:events";
import { resolve } from "node:path";

const cwd = process.cwd();
const server = spawn(process.execPath, [resolve(cwd, "tests/serve-dist.mjs")], {
  cwd,
  stdio: "inherit",
});

async function waitUntilReady() {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Nest test server exited with code ${server.exitCode}.`);
    try {
      const response = await fetch("http://127.0.0.1:4173/");
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 50));
  }
  throw new Error("Nest test server did not become ready.");
}

async function stopServer() {
  if (server.exitCode !== null) return;
  server.kill();
  await Promise.race([
    once(server, "exit"),
    new Promise((resolveWait) => setTimeout(resolveWait, 2_000)),
  ]);
}

let result = 1;
try {
  await waitUntilReady();
  const playwright = spawn(
    process.execPath,
    [resolve(cwd, "node_modules/@playwright/test/cli.js"), "test", ...process.argv.slice(2)],
    {
      cwd,
      env: { ...process.env, NEST_E2E_EXTERNAL_SERVER: "1" },
      stdio: "inherit",
    },
  );
  const [code] = await once(playwright, "exit");
  result = typeof code === "number" ? code : 1;
} finally {
  await stopServer();
}

process.exitCode = result;
