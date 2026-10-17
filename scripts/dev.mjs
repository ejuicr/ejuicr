#!/usr/bin/env node
// Starts `next dev`, first making sure the development database tunnel is up
// (see docs/deployment.md#local-development-database). The workstation's
// `mothership` SSH configuration owns the host, key and host-key pinning, so
// none of that lives in this repository.

import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import net from "node:net";

const SSH_HOST_ALIAS = "mothership";
const DATABASE_PORT = 27017;
const TUNNEL_READY_TIMEOUT_MS = 15_000;

/** Local tunnel port from a loopback MONGODB_URI in .env.local; else null. */
function localTunnelPort() {
  let uri;
  try {
    const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    const match = /^MONGODB_URI=(.*)$/m.exec(env);
    if (!match) return null;
    uri = new URL(match[1].trim().replace(/^["']|["']$/g, ""));
  } catch {
    return null;
  }
  if (uri.hostname !== "127.0.0.1" && uri.hostname !== "localhost") return null;
  const port = Number(uri.port);
  return Number.isInteger(port) && port > 0 ? port : 27018;
}

function isListening(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: "127.0.0.1", port });
    socket.setTimeout(1000, () => socket.destroy());
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    socket.once("timeout", () => resolve(false));
  });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function startTunnel(port) {
  const ssh = spawn(
    "ssh",
    [
      "-NT",
      "-o", "BatchMode=yes",
      "-o", "StrictHostKeyChecking=yes",
      "-o", "ExitOnForwardFailure=yes",
      "-o", "ConnectTimeout=10",
      "-o", "ServerAliveInterval=30",
      "-o", "ServerAliveCountMax=3",
      "-L", `127.0.0.1:${port}:127.0.0.1:${DATABASE_PORT}`,
      SSH_HOST_ALIAS,
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );

  let stderr = "";
  ssh.stderr.setEncoding("utf8");
  ssh.stderr.on("data", (chunk) => {
    stderr += chunk;
  });

  let exited = false;
  ssh.once("exit", () => {
    exited = true;
  });

  const deadline = Date.now() + TUNNEL_READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await isListening(port)) return ssh;
    if (exited) break;
    await sleep(250);
  }

  ssh.kill("SIGTERM");
  console.error("Missing valid SSH key for Mothership dev database connection.");
  if (stderr.trim()) console.error(stderr.trim());
  process.exit(1);
}

const port = localTunnelPort();
const tunnel =
  port && !(await isListening(port)) ? await startTunnel(port) : null;
if (tunnel) console.log(`Opened development database tunnel on 127.0.0.1:${port}`);

const dev = spawn("next", ["dev", ...process.argv.slice(2)], {
  stdio: "inherit",
});

// A terminal Ctrl-C reaches the whole process group, but an externally
// delivered signal may target only this wrapper; forward it to the children
// either way so neither a dev server nor a tunnel is left behind.
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    tunnel?.kill(signal);
    dev.kill(signal);
    process.exitCode = signal === "SIGINT" ? 130 : 143;
  });
}

dev.once("exit", (code, signal) => {
  tunnel?.kill("SIGTERM");
  if (process.exitCode === undefined) {
    process.exitCode = code ?? (signal ? 1 : 0);
  }
});
