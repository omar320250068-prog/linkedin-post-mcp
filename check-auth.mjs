#!/usr/bin/env node
/**
 * Standalone auth check — run this BEFORE publishing to confirm the token works.
 *   set LINKEDIN_ACCESS_TOKEN=...   (or put it in .env next to this file)
 *   node check-auth.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Tiny .env loader (no dependency); real env always wins.
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const i = t.indexOf("=");
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (k && process.env[k] === undefined) process.env[k] = v;
  }
}

const token = (process.env.LINKEDIN_ACCESS_TOKEN || "").trim();
if (!token) {
  console.error("LINKEDIN_ACCESS_TOKEN is not set (env or .env). Nothing to check.");
  process.exit(2);
}

const res = await fetch("https://api.linkedin.com/v2/userinfo", {
  headers: {
    Authorization: `Bearer ${token}`,
    "X-Restli-Protocol-Version": "2.0.0",
    "Linkedin-Version": process.env.LINKEDIN_VERSION || "202506",
  },
});
const body = await res.text();
console.log(`HTTP ${res.status}`);
console.log(body);
process.exit(res.ok ? 0 : 1);
