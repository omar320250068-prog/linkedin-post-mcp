#!/usr/bin/env node
/**
 * publish-all.mjs — one command to publish every prepared post to LinkedIn.
 *
 * Usage:
 *   1. Put a member access token in .env next to this file:
 *        LINKEDIN_ACCESS_TOKEN=AQV...
 *      (or `set LINKEDIN_ACCESS_TOKEN=...` in the shell)
 *   2. Preview first (no network writes):
 *        node publish-all.mjs --dry-run
 *   3. Publish for real:
 *        node publish-all.mjs --yes
 *
 * Flags:
 *   --dry-run        validate + print, never POST
 *   --yes            required to actually publish (safety gate)
 *   --only=<id>      publish a single post by id
 *   --visibility=PUBLIC|CONNECTIONS   (default PUBLIC)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { POSTS } from "./posts.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---- tiny .env loader -----------------------------------------------------
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const i = t.indexOf("=");
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (k && process.env[k] === undefined) process.env[k] = v;
  }
}

// ---- args -----------------------------------------------------------------
const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const YES = args.includes("--yes");
const only = (args.find((a) => a.startsWith("--only=")) || "").split("=")[1];
const visibility =
  (args.find((a) => a.startsWith("--visibility=")) || "PUBLIC").split("=")[1] || "PUBLIC";

const token = (process.env.LINKEDIN_ACCESS_TOKEN || "").trim();
const LI_VERSION = (process.env.LINKEDIN_VERSION || "202506").trim();

const selected = only ? POSTS.filter((p) => p.id === only) : POSTS;
if (selected.length === 0) {
  console.error(`No posts selected (only="${only}").`);
  process.exit(2);
}

for (const p of selected) {
  if (p.text.length > 3000) {
    console.error(`⚠  "${p.id}" is ${p.text.length} chars (>3000 LinkedIn limit). Trim before publishing.`);
  }
}

if (DRY) {
  console.log(`DRY RUN — ${selected.length} post(s), visibility=${visibility}, token ${token ? "present" : "MISSING"}.`);
  for (const p of selected) {
    console.log(`\n──────── ${p.id} (${p.text.length} chars) ────────\n${p.text}`);
  }
  process.exit(0);
}

if (!token) {
  console.error("LINKEDIN_ACCESS_TOKEN is not set. Add it to .env or the environment. Aborting.");
  process.exit(2);
}
if (!YES) {
  console.error("Refusing to publish without --yes. Run with --dry-run first to review. Aborting.");
  process.exit(2);
}

async function li(path, { method = "GET", body } = {}) {
  const headers = {
    Authorization: `Bearer ${token}`,
    "X-Restli-Protocol-Version": "2.0.0",
    "Linkedin-Version": LI_VERSION,
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(`https://api.linkedin.com${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { res, text };
}

// 1) resolve author
const me = await li("/v2/userinfo");
if (!me.res.ok) {
  console.error(`Auth failed (HTTP ${me.res.status}): ${me.text}\nAborting — no posts published.`);
  process.exit(1);
}
const meJson = JSON.parse(me.text);
const author = `urn:li:person:${meJson.sub}`;
console.log(`Authenticated as ${meJson.name || meJson.sub} (${author}). Publishing ${selected.length} post(s)…`);

let ok = 0;
for (const p of selected) {
  const payload = {
    author,
    commentary: p.text,
    visibility,
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };
  const r = await li("/rest/posts", { method: "POST", body: payload });
  const id = r.res.headers.get("x-restli-id");
  if (r.res.ok) {
    ok++;
    console.log(`✅ ${p.id} → HTTP ${r.res.status} id=${id || "(header)"}`);
  } else {
    console.error(`❌ ${p.id} → HTTP ${r.res.status}: ${r.text}`);
  }
  await new Promise((res) => setTimeout(res, 1500)); // be gentle with the API
}
console.log(`\nDone: ${ok}/${selected.length} published.`);
process.exit(ok === selected.length ? 0 : 1);
