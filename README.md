# ai-innovative-app-design

Three AI product concepts with runnable prototypes: virtual outfit try-on, a personal health coach, and a need-first shopping guide.

## Business Context

- **Category:** software project
- **Audience:** builders and operators evaluating a focused software experiment.
- **Repository status:** Public repository. Keep examples, docs, and issues free of credentials, private data, and machine-specific paths.
- **Topics:** ai, app-design, concepts, fastapi, nestjs, nextjs, product-design, prototype

## What This Project Is For

- Three AI product concepts with runnable prototypes: virtual outfit try-on, a personal health coach, and a need-first shopping guide.
- Clarify the problem this project solves and who it is for.
- Make setup, review, and iteration easier for future collaborators.

## Where It Fits

This repository captures a focused experiment or tool that can be evaluated, reused, or promoted into a productized workflow when it proves useful.

## Technical Overview

- **Primary language:** TypeScript
- **Detected stack:** TypeScript, Node.js, Python dependencies, Docker, Docker Compose, Next.js, React, Tailwind CSS, Expo
- **Default branch:** `main`
- **Visibility:** `PUBLIC`
- **License:** MIT License

## Repository Map

- `AI情绪运动教练`
- `AI运动健康`
- `AI需求购物导购`
- `LICENSE`
- `README.md`
- `SECURITY.md`

## Quick Start

There is no root `package.json`. Run commands from the relevant subproject:

| Subproject | Directory | Existing checks |
|---|---|---|
| Need-first shopping guide | `AI需求购物导购/backend` | `python3 test_logic.py` (two assertion scenarios); `python3 -m unittest discover -s . -p 'test_api.py' -v` (five offline unit tests; Pydantic 2 required) |
| Shopping web page | `AI需求购物导购/frontend` | `node --test chat.test.cjs` (Node.js 18+; no dependencies) |
| Fitness API | `AI运动健康/backend` | `npm run build`, `npm test -- --runInBand`, `npm run lint -- --no-fix` |
| Fitness Expo app | `AI运动健康/frontend` | `npm test -- --runInBand`, `npm run lint` |
| Outfit web app | `AI情绪运动教练/ai-outfit-assistant/frontend` | `npm run build`, `npm run lint` |

The Node subprojects currently have no committed lockfiles. A reproducible dependency install and the Node build/lint/Jest checks remain unverified until a compatible lockfile is supplied. None of the Node packages defines a `typecheck` script. The shopping page tests use Node's built-in test runner and can run without installing dependencies.

For a local shopping demo, with the Python requirements already installed, run these in separate terminals from the repository root:

```bash
cd AI需求购物导购/backend
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

```bash
cd AI需求购物导购/frontend
python3 -m http.server 8080 --bind 127.0.0.1
```

Open `http://localhost:8080`. The page calls `http://localhost:8000/api/analyze`; port 8080 is included in the API's default local CORS origins. The shopping analyzer uses local keyword rules and a sample product catalogue, not a live AI model or live shopping data. The dependency-free tests do not verify browser layout, CORS, or a running API.

The shopping API trims input and accepts 1–2000 characters. The page keeps oversized drafts for editing, displays a validation message, and cancels requests after 15 seconds, including stalled response bodies. Concurrent replies stay beside their questions. Internal exception details are neither returned by the API handler nor printed by the page.

The backend unit tests replace FastAPI's decorators and exception class and mock the analyzer. They exercise the real Pydantic input model and route function without a server or external services. They do **not** verify ASGI routing, HTTP validation responses, CORS, or response serialization; those require an installed FastAPI environment. The frontend tests use a small DOM and timer fixture; screen-reader announcements, keyboard operation, and desktop/mobile rendering still need browser verification.

See the [fitness guide](AI运动健康/README.md) and [outfit guide](AI情绪运动教练/ai-outfit-assistant/README.md) for their separate runtime requirements. These are concept prototypes; the presence of routes or UI does not establish working authentication, model inference, or production readiness.

## Operating Notes

- Keep real credentials out of the repository. Use local environment files, GitHub repository secrets, or the deployment platform secret manager.
- If a `.env.example` file exists, treat it as documentation only; never commit filled-in `.env` files.
- Before publishing screenshots, demos, or client examples, remove private names, internal paths, account IDs, and API endpoints.
- The `Repository Hygiene` workflow is a lightweight guardrail, not a replacement for product-specific tests.

## Delivery Checklist

- [ ] README describes the user, business outcome, and operating boundary.
- [ ] Setup or preview commands are current and do not rely on private machine state.
- [ ] No real secrets, private user data, or machine-local state are tracked.
- [ ] Screenshots, demos, or sample outputs are safe to share publicly when the repository is public.
- [ ] Product-specific tests or smoke checks are documented before production use.

## Roadmap

- Tighten the fastest path from clone to useful demo.
- Add project-specific screenshots, sample outputs, or a short walkthrough where useful.
- Promote repeated manual steps into scripts, tests, or documented workflows.
- Keep security, privacy, and licensing boundaries explicit as the project evolves.

## Maintainer Notes

Maintained by [Tony Sheng](https://github.com/shengdabai). This README is written as a business-facing handoff: it should help a future collaborator, client, or reviewer understand why the repository exists, how to inspect it, and what must be true before it is reused or shipped.
