# Engine3 — Web frontend (UI)

The web frontend of **Virality Intel**, an AI video virality simulator, built with
**Next.js 15 (App Router), React 19, TypeScript and Tailwind CSS**.
Full project: https://github.com/sayedyahiya18-web/virality_intel-mini_project-

## What's here

| Folder / file | Purpose |
|---|---|
| `app/page.tsx` | Scroll-story landing page |
| `app/layout.tsx`, `app/globals.css` | Root layout, fonts (Instrument Serif, Geist), dark theme colour tokens |
| `app/(app)/*` | App pages: dashboard, test a video, results, simulations, personas, experiments, reports, agents, settings |
| `components/ui/*` | Base UI kit: buttons, cards, inputs, tabs, dialogs, selects, tooltips |
| `components/layout/*` | App shell, sidebar, page header |
| `components/common/*` | Shared bits: metric cards, status dots, empty / loading states |
| `features/landing/*` | Landing page story, scroll animations, network canvas |
| `features/simulation-create/*` | "Test a video" form, upload, in-browser video measurement |
| `features/results/*` | Simple results page (verdict, Instagram push, trend card) |
| `features/*` (other) | Dashboard widgets, network graph, persona explorer, reports |
| `store/*` | Client state (Zustand) |
| `tailwind.config.ts`, `postcss.config.mjs`, `next.config.mjs`, `tsconfig.json`, `package.json` | Build and styling configuration |

## Dependencies on the main project
This is the UI layer only. It imports code that lives in the main project:
- `@/lib/utils`, `@/types` — shared helpers and data types
- `@/lib/simulation/*`, `@/lib/platform/*`, `@/lib/agents/*` — the prediction engine and agent platform
- `@/services/persistence` — saving and loading tests
- the Next.js API routes (`app/api/*`) the pages call

To run it, use the full project linked above:
```bash
npm install
npm run dev
```
