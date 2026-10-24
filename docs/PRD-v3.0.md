# Luminary v3.0 — Product Requirements Document

## Summary

Luminary v3 rebuilds the Electron monorepo as a **Tauri v2 + PWA** single app.

## Phase status

| Phase | Status |
|-------|--------|
| 0 Foundation (scaffold, Biome, Vitest, Turso WASM) | ✅ |
| 1 Core views (Songs, Bible + FTS) | ✅ |
| 2 Projection (Dashboard, output window) | ✅ |
| 3 AI STT (Whisper WASM worker) | ✅ core |
| 4 Polish (PWA, background Bible import, CI) | ✅ in progress |

## Key fixes (2026-06-15)

- Turso WASM upgraded to **0.6.1** with async `prepare()` helpers
- OPFS fallback to `:memory:` when cross-origin isolation unavailable
- Bible JSON served from `legacy/v2/main/assets/bible` via Vite plugin
- Background full-Bible import after fast minimal seed
- Whisper STT via `@xenova/transformers` in dedicated worker

## Commands

```bash
pnpm install
pnpm dev          # PWA :5173
pnpm tauri:dev    # Desktop shell
pnpm test         # Vitest
pnpm test:e2e     # Playwright
pnpm build        # Production PWA
pnpm dev:web      # Marketing :5174
```
