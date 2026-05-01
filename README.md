# Edugen

Edugen is an AI-powered study platform that helps students who are stuck on difficult concepts turn **real** online resources and uploaded class materials into personalized micro-lessons: structured lessons, slide decks, narration scripts, practice questions, and citations.

## Tech stack

- **Next.js 14** (App Router) + **TypeScript** + **React**
- **Tailwind CSS** + **Radix UI**-style primitives (`tailwindcss-animate`, `class-variance-authority`)
- **OpenAI API** for lesson JSON generation, short-answer grading, slide regeneration, and “explain again”
- **Tavily API** for web search (only search backend in this project)
- **pdf-parse** for PDF text extraction on the server
- **Optional MySQL** (`mysql2`) for lesson persistence via `/api/lessons` — still **mirrors to `localStorage`** in the browser

## Features (implemented)

| Feature | Notes |
|--------|--------|
| Real web search | Uses your API key; **no mock sources** |
| Source ranking | `.edu`, known education domains, topic overlap heuristics |
| Lesson generation | JSON schema: overview, blueprint, slides, narration, practice |
| Slide viewer | Navigate, edit, regenerate slide (OpenAI), copy |
| Narration | Edit scripts + **Speech Synthesis** preview in browser |
| Practice | MC instant grade; short answer via OpenAI when key present |
| Export | Copy / download full `.md` and slides `.md` |
| Library | **`localStorage`** cache + **optional MySQL** list/sync per browser device id |

## Required API keys

Create `.env.local` in the project root (never commit secrets). Copy from `.env.example`.

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | **Required** for generating lessons, grading short answers, regenerating slides, explain-again |
| `TAVILY_API_KEY` | **Required** for online search (unless the user turns search off and uses notes only) |
| `OPENAI_MODEL` | Optional override (default `gpt-4o-mini`) |
| `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` | Optional: server-side lesson storage (see **MySQL** below) |
| `MYSQL_PORT` | Optional (default `3306`) |
| `MYSQL_LESSONS_TABLE` | Optional table name (default `edugen_lessons`) |

`TAVILY_API_KEY` must be set **unless** the user turns off “Search trusted online resources” and relies on pasted/uploaded notes only.

## MySQL (optional lesson database)

When `MYSQL_HOST`, `MYSQL_USER`, and `MYSQL_DATABASE` are set (password may be empty for some local installs), the app:

- **POST `/api/lessons`** — upsert a lesson (after create or Save)
- **GET `/api/lessons`** — list lessons for this browser (`X-Edugen-Device-Id` header, generated in `localStorage` as `edugen-device-id`)
- **GET/DELETE `/api/lessons/[id]`** — load or delete one lesson for that device

Lessons remain in **`localStorage`** as a cache; MySQL is the durable store when configured.

### Create table (InnoDB, composite primary key)

```sql
CREATE TABLE IF NOT EXISTS edugen_lessons (
  device_id VARCHAR(128) NOT NULL,
  id VARCHAR(128) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  payload JSON NOT NULL,
  PRIMARY KEY (device_id, id),
  KEY idx_device_updated (device_id, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

The composite primary key **`(device_id, id)`** prevents one browser’s upsert from overwriting another device’s row if a lesson `id` were ever reused.

**Note:** Until you add real authentication, `device_id` is an anonymous per-browser id — not a substitute for user accounts.

## How to run locally

```bash
npm install
cp .env.example .env.local
# Edit .env.local — add OPENAI_API_KEY and TAVILY_API_KEY (and MYSQL_* if you use MySQL)

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How to use the app

1. **`/`** — Landing  
2. **`/create`** — Enter topic, preferences, optionally upload notes → **Fetch Resources** (real API) → select sources → **Generate Micro-Lesson**  
3. **`/lesson/[id]`** — Workspace: overview, blueprint, slides, narration, practice, sources; Save, Export  
4. **`/library`** — Saved lessons (merged from MySQL when configured, otherwise local only)  

### Minimal demo setup

- `OPENAI_API_KEY` — lesson generation and practice feedback  
- `TAVILY_API_KEY` — resource search  

## Known limitations

- Without MySQL, lessons live only in **`localStorage`** (per browser). Clearing site data removes them.
- Anonymous `device_id` is not multi-device or multi-user security; add auth + `user_id` for production.
- PDF extraction fails on scanned/image-only PDFs.
- No PowerPoint export (Markdown export only).
- Short-answer grading requires `OPENAI_API_KEY`.

## Future improvements

- User accounts and cloud-first persistence  
- Streaming generation UX  
- Optional ElevenLabs / OpenAI TTS audio files  
- Stricter citation verification pipeline  

## Scripts

- `npm run dev` — development server  
- `npm run build` — production build  
- `npm run start` — production server  
- `npm run lint` — ESLint  
