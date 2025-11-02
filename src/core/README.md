# Core: framework-agnostic logic

This folder contains framework-agnostic quiz logic (pure utilities and small React hooks).

Principles:

- Keep pure functions in `src/core/*` so they can be used by Next.js App Router or other adapters.
- Avoid DOM or Next-specific APIs inside `core` to keep portability.

Included modules:

- `quiz.ts` — scoring and public view helpers.
- `utils/shuffle.ts` — deterministic shuffle utility with optional seed.
- `hooks/useTimer.ts` — small React hook for timers (cleanup on unmount).
- `hooks/useQuizState.ts` — state management helper (selection map, navigation, results).

Tests live next to the core modules.
