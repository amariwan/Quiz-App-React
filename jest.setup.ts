// Jest setup file: silence or filter noisy console output during tests

const originalWarn = console.warn.bind(console);
const originalError = console.error.bind(console);

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (originalWarn as any)(...args);
};

console.error = (...args: unknown[]) => {
  try {
    if (args.length && shouldIgnore(args[0])) return;
  } catch {
    // fall through to original error
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (originalError as any)(...args);
};

// Filter Node process warnings (like the `--localstorage-file` warning shown in tests)
process.on('warning', (warning: unknown) => {
  try {
    // coerce to string safely
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msg = (warning as any)?.message ?? String(warning);
    if (String(msg).includes('--localstorage-file')) return;
  } catch {
    // ignore
  }
  // For other warnings, re-emit to the console so they aren't silently dropped
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  originalWarn(
    '[process warning]',
    (warning as any)?.name,
    (warning as any)?.message ?? String(warning),
  );
});

// Optionally, you can restore the originals in afterAll if you prefer; leave as-is for test lifetime.
