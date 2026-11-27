# LevelUpAuto

pnpm + TypeScript monorepo with two products:

- **LevelUpAuto**: auto repair shop website and Expo mobile companion app.
- **Alset**: multi-sided Tesla owner platform.

| Artifact | Path | What it is |
|---|---|---|
| `artifacts/api-server` | `/api` | Shared Express 5 API (PostgreSQL + Drizzle ORM) |
| `artifacts/levelupauto-web` | `/` | LevelUpAuto website (React + Vite) |
| `artifacts/levelupauto-mobile` | `/mobile/` | LevelUpAuto mobile app (Expo) |
| `artifacts/alset-web` | `/alset/` | Alset web platform (React + Vite) |
| `lib/*` | — | Shared `api-spec` (OpenAPI), generated `api-client-react` / `api-zod` (Orval), `db` |

## Quick start

Requires Node 24 and pnpm (npm and yarn are blocked by `preinstall`).

```bash
pnpm install
pnpm typecheck   # libs + all artifacts
pnpm build       # typecheck, then build every artifact
```

## Environment

See [`.env.example`](.env.example). Do not commit real secrets.

- `CORS_ORIGINS`: comma-separated browser origins for the API. Required in production. When `NODE_ENV=development` and this is unset, loopback origins are allowed.
- `SEED_DEMO_PASSWORD`: required by the Alset seed script. The script exits without writing if it is missing.
- `CONTACT_RATE_LIMIT_MAX` / `CONTACT_RATE_LIMIT_WINDOW_MS`: optional limits for `POST /api/contact` (default 5 requests per 15 minutes per IP).

## More docs

- [`replit.md`](replit.md): full architecture, API routes, and product notes.
- [`PUBLISHING.md`](PUBLISHING.md): publishing and mobile build notes. The **EAS Mobile Build** workflow needs an `EXPO_TOKEN` secret; it is currently not set, so that job fails on purpose until the owner decides.
- [`SECURITY.md`](SECURITY.md): security policy.
