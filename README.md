# FlyRank AI Chat

A production-ready AI chat assistant built with Next.js (App Router) and streaming responses from OpenAI.

## What It Does

FlyRank AI Chat provides a real-time conversational interface where users can ask questions and receive AI-generated streaming responses. The application features a dark-themed chat UI with message history, input validation, and production-grade safeguards against API abuse.

## Screenshots

> Add screenshots here:
>
> ![Chat UI](screenshots/chat.png)
> ![Streaming Response](screenshots/streaming.png)

## Run Instructions

### Prerequisites

- Node.js 18+
- npm or pnpm

### Setup

```bash
git clone https://github.com/joetomjames123/flyrank-project-111.git
cd flyrank-project-111
npm install
cp .env.example .env.local
# Edit .env.local and add your OPENAI_API_KEY
npm run dev
```

The app runs at `http://localhost:3000`.

### Production Build

```bash
npm run build
npm run start
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes | OpenAI API key for chat completions |
| `MAX_INPUT_LENGTH` | No | Maximum input message length (default: `500`) |
| `RATE_LIMIT_WINDOW_MS` | No | Rate-limit window in milliseconds (default: `60000`) |
| `RATE_LIMIT_MAX_REQUESTS` | No | Max requests per window per IP (default: `20`) |

## Architecture

```
flyrank-project-111/
├── app/
│   ├── layout.tsx        # Root layout (dark theme)
│   ├── page.tsx          # Home page with Chat component
│   ├── globals.css       # Tailwind base styles
│   ├── api/
│   │   └── chat/
│   │       └── route.ts  # Streaming AI API with rate limiting & input caps
│   └── components/
│       └── Chat.tsx      # Client-side chat UI with streaming
├── middleware.ts          # Edge middleware for IP-based rate limiting
├── vercel.json           # Vercel deployment config
├── next.config.js        # Next.js configuration
├── tailwind.config.ts    # Tailwind CSS config
├── .env.example          # Environment variable template
└── package.json          # Dependencies and scripts
```

### Key Architecture Decisions

1. **Streaming responses** — The AI API uses the OpenAI streaming endpoint (`text/event-stream` pattern) to deliver tokens incrementally, reducing perceived latency.
2. **Edge middleware + API rate limiting** — Dual-layer protection: edge-level rate limiting in `middleware.ts` blocks excessive requests early, and the API route enforces per-IP caps and input length checks.
3. **`maxDuration` on streaming handlers** — The streaming API is configured with a maximum execution duration to prevent long-running connections from consuming resources.
4. **Standalone output** — `next.config.js` uses `output: 'standalone'` for optimized Vercel deployment with smaller container sizes.
5. **Abort support** — The client can abort in-flight streaming requests via a Stop button, freeing up server connections.

## AI Usage Disclosure

This project was built with significant assistance from AI tools (specifically, code generation, architecture guidance, and boilerplate generation using AI-assisted coding tools). Key AI-assisted areas include:

- **Project scaffolding**: Next.js app structure and configuration was generated with AI assistance.
- **Streaming chat implementation**: The `Chat.tsx` component and `route.ts` API handler were built with AI guidance on stream reading, chunk parsing, and incremental DOM updates.
- **Rate limiting logic**: The dual-layer rate limiting (middleware + API) was designed with AI help for idiomatic Next.js patterns.
- **Tailwind styling**: UI components were styled using AI-generated Tailwind class combinations.

Every AI-assisted section was reviewed, tested, and modified by the developer to ensure correctness and production readiness.

## Deployment

This project is configured for deployment on Vercel:

1. Import the repository on [Vercel](https://vercel.com/new).
2. Add the `OPENAI_API_KEY` environment variable in the Vercel dashboard under **Settings > Environment Variables**.
3. Deploy. The `vercel.json` file configures the framework as Next.js and the region as `iad1`.

### Custom Domain

After deployment, add a custom domain in the Vercel dashboard under **Settings > Domains**. The `vercel.json` does not require domain-specific configuration.

## License

MIT