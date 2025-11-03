// Jest setup file: silence or filter noisy console output during tests

// A small typed wrapper around console methods so we don't use `any`.
type ConsoleFn = (...data: unknown[]) => void;
const originalWarn = console.warn.bind(console) as unknown as ConsoleFn;
const originalError = console.error.bind(console) as unknown as ConsoleFn;

const IGNORED_WARN_PREFIXES = ['[RATE_LIMIT]', '[SECURITY]', '[ANTI_CHEAT]'];

function shouldIgnore(message?: unknown): boolean {
  if (!message) return false;
  const text = typeof message === 'string' ? message : String(message);
  return IGNORED_WARN_PREFIXES.some((p) => text.includes(p));
}

console.warn = (...args: unknown[]) => {
  try {
    if (args.length && shouldIgnore(args[0])) return;
  } catch {
    // fall through to original warn
  }
  originalWarn(...args);
};

console.error = (...args: unknown[]) => {
  try {
    if (args.length && shouldIgnore(args[0])) return;
  } catch {
    // fall through to original error
  }
  originalError(...args);
};

// Filter Node process warnings (like the `--localstorage-file` warning shown in tests)
process.on('warning', (warning: unknown) => {
  try {
    // coerce to an object with optional fields, then to string safely
    const w = warning as { name?: string; message?: string } | undefined;
    const msg = w?.message ?? String(warning);
    if (String(msg).includes('--localstorage-file')) return;
  } catch {
    // ignore
  }
  // For other warnings, re-emit to the console so they aren't silently dropped
  const w = warning as { name?: string; message?: string } | undefined;
  const msg = w?.message ?? String(warning);

  originalWarn('[process warning]', w?.name, msg);
});

// Optionally, you can restore the originals in afterAll if you prefer; leave as-is for test lifetime.
