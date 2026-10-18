#!/usr/bin/env node
/**
 * linkedin-post-mcp
 * ------------------
 * A minimal, auditable MCP (stdio transport) server that publishes text posts
 * to LinkedIn using the OFFICIAL LinkedIn REST API.
 *
 *   POST https://api.linkedin.com/rest/posts
 *
 * Authentication is a member access token with the `w_member_social` scope
 * (and `openid profile` for identity). The token MUST be supplied by the
 * account owner via the LINKEDIN_ACCESS_TOKEN environment variable. This
 * server never stores, logs, or transmits the token anywhere except to
 * api.linkedin.com.
 *
 * CRITICAL: stdout is the JSON-RPC channel. All diagnostics go to stderr.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const SERVER_NAME = "linkedin-post-mcp";
const SERVER_VERSION = "0.1.0";

const TOKEN = (process.env.LINKEDIN_ACCESS_TOKEN || "").trim();
const LI_VERSION = (process.env.LINKEDIN_VERSION || "202506").trim();
let AUTHOR_URN = (process.env.LINKEDIN_AUTHOR_URN || "").trim();

const API_BASE = "https://api.linkedin.com";

function log(...args) {
  console.error(`[${SERVER_NAME}]`, ...args);
}

function requireToken() {
  if (!TOKEN) {
    throw new Error(
      "LINKEDIN_ACCESS_TOKEN is not set. Create a LinkedIn Developer App, " +
        "add the 'Share on LinkedIn' (+ 'Sign in with LinkedIn using OpenID Connect') " +
        "products, authorize, and put the member access token in the MCP env."
    );
  }
}

async function liFetch(path, { method = "GET", body } = {}) {
  requireToken();
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "X-Restli-Protocol-Version": "2.0.0",
    "Linkedin-Version": LI_VERSION,
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { ok: res.ok, status: res.status, headers: res.headers, json, text };
}

async function resolveAuthorUrn() {
  if (AUTHOR_URN) return AUTHOR_URN;
  const r = await liFetch("/v2/userinfo");
  if (!r.ok || !r.json?.sub) {
    throw new Error(
      `Could not resolve member identity (HTTP ${r.status}). ` +
        `Token may be missing 'openid'/'profile' scope. Response: ${r.text}`
    );
  }
  AUTHOR_URN = `urn:li:person:${r.json.sub}`;
  return AUTHOR_URN;
}

async function createTextPost({ text, visibility = "PUBLIC" }) {
  if (typeof text !== "string" || text.trim().length === 0) {
    throw new Error("`text` must be a non-empty string.");
  }
  const author = await resolveAuthorUrn();
  const payload = {
    author,
    commentary: text,
    visibility,
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };
  const r = await liFetch("/rest/posts", { method: "POST", body: payload });
  if (!r.ok) {
    throw new Error(`Post failed (HTTP ${r.status}): ${r.text}`);
  }
  const postId = r.headers.get("x-restli-id") || r.headers.get("x-linkedin-id") || null;
  return { postId, status: r.status };
}

const TOOLS = [
  {
    name: "check_auth",
    description:
      "Verify the configured LinkedIn access token: confirms scopes/identity by calling the OIDC userinfo endpoint. Read-only.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_profile",
    description: "Return the authenticated member's basic profile (name, sub, email if granted). Read-only.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "create_post",
    description:
      "Publish a text post to LinkedIn on behalf of the authenticated member. This is a PUBLIC, irreversible action.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "The post commentary (max ~3000 chars)." },
        visibility: {
          type: "string",
          enum: ["PUBLIC", "CONNECTIONS"],
          description: "Audience. Default PUBLIC.",
        },
      },
      required: ["text"],
      additionalProperties: false,
    },
  },
];

const server = new Server(
  { name: SERVER_NAME, version: SERVER_VERSION },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  try {
    if (name === "check_auth") {
      const r = await liFetch("/v2/userinfo");
      return {
        content: [
          {
            type: "text",
            text: r.ok
              ? `OK — token valid (HTTP ${r.status}). Identity: ${JSON.stringify(r.json)}`
              : `FAILED — HTTP ${r.status}: ${r.text}`,
          },
        ],
      };
    }
    if (name === "get_profile") {
      const r = await liFetch("/v2/userinfo");
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.text}`);
      return { content: [{ type: "text", text: JSON.stringify(r.json, null, 2) }] };
    }
    if (name === "create_post") {
      const { postId, status } = await createTextPost({
        text: args.text,
        visibility: args.visibility,
      });
      return {
        content: [
          { type: "text", text: `Post created (HTTP ${status}). id=${postId ?? "(see response header)"}` },
        ],
      };
    }
    throw new Error(`Unknown tool: ${name}`);
  } catch (err) {
    return {
      isError: true,
      content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log(`ready (version ${SERVER_VERSION}); token ${TOKEN ? "present" : "MISSING"}.`);
}

main().catch((err) => {
  log("fatal:", err);
  process.exit(1);
});
