// LinkedIn-length post texts, one per project.
// Edit freely before publishing. Each must stay under LinkedIn's ~3000-char limit.

export const POSTS = [
  {
    id: "mcp-skill-harvester",
    title: "Cyber Skill Harvester — an MCP server that curates itself daily",
    text: `🛠️ Cyber Skill Harvester — an MCP server that keeps its own library current

I got tired of manually trawling GitHub, Smithery, Glama and PulseMCP for good AI/security tooling — so I built a Model Context Protocol server that does it autonomously.

Every day it:
1️⃣ searches 5 sources (GitHub API, Smithery, Glama, PulseMCP, curated "awesome" lists)
2️⃣ quality-gates each candidate (stars, recency, license, README depth → weighted 0–100 score)
3️⃣ security-scans the code (reverse shells, download-and-execute, obfuscation, miners, exfil endpoints, hidden-unicode tricks + entropy checks)
4️⃣ archives survivors into a date-partitioned store with a SQLite dedup ledger

It holds a deliberate 70% cybersecurity / 30% programming balance, and exposes 4 agent-callable tools (run_daily_discovery, search_skills, search_mcps, get_collection_summary).

Running real: 3 daily runs so far, hitting quota each time — 45 skills + 9 MCP servers archived, with an auditable JSONL log of every rejection.

Stack: Python 3.11+, FastMCP, httpx/aiohttp, APScheduler, SQLite (WAL). MIT.

#AI #MCP #ModelContextProtocol #CyberSecurity #Python #Automation #DevTools`,
  },
  {
    id: "workflow-ai",
    title: "workflow-ai — visual workflows where every node is an AI YES/NO decision",
    text: `🧭 workflow-ai — draw a decision graph, let an LLM judge every node

New project: a visual workflow builder where *every node is an AI decision step* that answers YES or NO.

You compose the graph on a React Flow canvas and hit Run. Each node's prompt is judged by an LLM; the answer picks the next edge; execution hops until a node has no matching exit.

The hard part wasn't the canvas — it was making it survive serverless. Runs execute as durable Inngest functions with one checkpointed step per node, so LLM calls are retried and long chains don't die on a timeout.

Not a toy:
• live node states (green/red) + animated edges + streaming logs
• save/load, JSON import/export, execution history, retry
• production hygiene: per-IP rate limiting on the credit-spending routes, input caps, maxDuration bounds, security headers
• fail-fast: ask for OpenAI without a key → HTTP 503, no silent fake AI
• storage auto-selects Upstash Redis (prod) or local files (dev)

Honest note: this app was largely built by an AI coding assistant — the human brought the product idea, service choices and credentials. A useful case study in division of labour.

Stack: Next.js 16, React Flow v12, Inngest, OpenAI SDK, Upstash, Tailwind v4.

#AI #NextJS #Inngest #ReactFlow #Serverless #LLM #BuildInPublic`,
  },
  {
    id: "shader-hero",
    title: "Aurora Liquid Flow — a whole hero page in one fragment shader",
    text: `🌌 Aurora Liquid Flow — one fragment shader, zero dependencies

A single-file WebGL2 hero page whose entire background is one procedural fragment shader. No textures, no geometry, no libraries.

How it works:
• value noise → fractional Brownian motion (5 octaves) for the cloud-like signal
• a time-animated flow field warps the UVs → liquid domain warping
• three compounded fBm layers (broad glow, rippling "curtain", fine filaments) under a vertical envelope
• a cosine palette for the aurora identity; the cursor pulls a local swirl into the field

Just as important — it's responsible with the GPU and the user:
• device-pixel-ratio clamped to 2 (no wasted work on 3× phones)
• honours prefers-reduced-motion by rendering one frozen frame
• pauses when the tab is hidden or unfocused
• pure-CSS gradient fallback when WebGL is unavailable
• aspect-correct UVs, so circles stay circles

~488 lines, one file, no build step.

#WebGL #GLSL #Shaders #CreativeCoding #Frontend #Graphics #Accessibility`,
  },
  {
    id: "opencode-skill-hub",
    title: "opencode-skill-hub — an MCP server that outfits your project",
    text: `🧩 opencode-skill-hub — the MCP server that outfits a project with the skills it needs

Every project's manifests already tell you what stack it uses. So I built an MCP server (stdio) that turns that into action, answering three questions in order:

1) What does this project need? → analyze_project_needs scans package.json / Cargo.toml / pyproject.toml / go.mod / requirements.txt + cross-cutting signals (Dockerfiles, tsconfig, Prisma, CI), then ranks the missing capabilities.
2) Does it already exist? → search_skills_and_agents finds real SKILL.md files and MCP configs on GitHub.
3) Put it in place → install_skill_or_agent writes the skill to .opencode/skills/<name>/SKILL.md or registers the MCP in opencode.json.

Built defensively:
• stdout reserved for JSON-RPC; all logs to stderr
• path-traversal guards on the skill name; 2 MiB download cap; rejects HTML error bodies
• never overwrites a malformed opencode.json
• every tool returns a readable error instead of throwing across the transport

Stack: TypeScript, @modelcontextprotocol/sdk, Octokit, axios, fs-extra. MIT.

#MCP #ModelContextProtocol #TypeScript #DevTools #AI #OpenSource #Automation`,
  },
  {
    id: "hermes-agent",
    title: "Hermes Agent (Nous Research) — studying a self-improving agent",
    text: `📚 Study: Hermes Agent — the "closed learning loop" agent, by Nous Research

(Attribution first: this is Nous Research's open-source project, not my own — I installed and studied it. Crediting the authors.)

Most assistants are stateless across sessions. Hermes inverts that: it treats experience as training signal.

The architecture is the interesting part:
• a closed learning loop — agent-curated memory with nudges to persist knowledge
• autonomous skill creation after complex tasks; skills that self-improve during use
• FTS5 session search + LLM summarisation for cross-session recall
• dialectic user modelling (Honcho); compatible with the agentskills.io standard
• model-agnostic (Nous Portal, OpenRouter, OpenAI, custom endpoints)
• seven terminal backends — local, Docker, SSH, Singularity, Modal, Daytona, Vercel Sandbox (serverless persistence: hibernates when idle)
• one gateway → Telegram, Discord, Slack, WhatsApp, Signal, Email, CLI
• natural-language cron, plus isolated subagents for parallel work

The trade-off worth naming: persistent memory and self-authored skills raise real risks — memory pollution, skill drift, and prompt-injection that outlives a session. Autonomy like this leans hard on approval workflows, DM pairing and container isolation.

A strong reference architecture for stateful agents.

#AI #Agents #LLM #NousResearch #OpenSource #Architecture #AgenticAI`,
  },
];
