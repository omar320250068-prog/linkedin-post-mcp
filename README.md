# linkedin-post-mcp

Minimal, auditable MCP server + one-command publisher for posting to **LinkedIn**
via the **official REST API** (`POST https://api.linkedin.com/rest/posts`).

No passwords, no browser automation, no third-party service. The only secret is a
member access token that **you** generate and keep local.

## What's here

| File | Purpose |
|---|---|
| `index.mjs` | MCP (stdio) server. Tools: `check_auth`, `get_profile`, `create_post`. |
| `check-auth.mjs` | Standalone token sanity check (`node check-auth.mjs`). |
| `posts.mjs` | Example post texts (one per project) — edit freely before publishing. |
| `publish-all.mjs` | One command to publish them all (`--dry-run` / `--yes`). |

## Why YOU must supply the token

Posting acts as *your* identity. LinkedIn's official API only issues posting rights
through OAuth to a **LinkedIn Developer App that you own**. There is no way — none —
for me to obtain that on your behalf without your login, and automating your login
would breach LinkedIn's User Agreement and risk your account. So this is the single
step you do once; everything else is done.

## One-time setup (about 5 minutes)

1. Go to https://www.linkedin.com/developers/apps → **Create app** (associate it with
   any LinkedIn Page you admin — you can create a throwaway one).
2. **Products** tab → request **"Share on LinkedIn"** (gives `w_member_social`) and
   **"Sign in with LinkedIn using OpenID Connect"** (gives `openid profile`).
   These are usually granted instantly.
3. **Auth** tab → note **Client ID** and **Client Secret**. Add a redirect URL such as
   `http://localhost:8080/callback`.
4. Generate a member access token with scopes `openid profile w_member_social`.
   Easiest: the **"OAuth 2.0 tools" → Token generator** in the app, or run the 3-legged
   OAuth flow. Token lifetime is ~60 days.
5. Put it in `.env` next to this README:
   ```
   LINKEDIN_ACCESS_TOKEN=AQV...your.token.here
   ```

## Use it

```powershell
# 1. confirm the token works (read-only)
node check-auth.mjs

# 2. review exactly what will be posted (no network writes)
node publish-all.mjs --dry-run

# 3. publish all five
node publish-all.mjs --yes

# options
node publish-all.mjs --yes --only=shader-hero
node publish-all.mjs --yes --visibility=CONNECTIONS
```

## Use as an MCP server

Register `index.mjs` as a stdio MCP server in your agent's config (e.g. `opencode.jsonc`),
passing the token through the env var. Once set, ask the agent to call `check_auth`,
then `create_post` with any text.

```jsonc
{
  "mcp": {
    "linkedin": {
      "type": "local",
      "command": ["node", "C:\\path\\to\\linkedin-mcp\\index.mjs"],
      "environment": { "LINKEDIN_ACCESS_TOKEN": "..." }
    }
  }
}
```

## API facts used

- Endpoint: `POST /rest/posts`; identity from `GET /v2/userinfo` (`sub` → `urn:li:person:<sub>`).
- Required headers: `Authorization: Bearer`, `Linkedin-Version: YYYYMM`, `X-Restli-Protocol-Version: 2.0.0`.
- Created post id comes back in the `x-restli-id` response header.
- The Posts API supersedes the older `ugcPosts` endpoint.

## License

[MIT](LICENSE) © 2026 Omar Hindawy
