// Jest setup file: silence or filter noisy console output during tests

// Provide a minimal `sessionStorage` polyfill for the Node test environment.
// Some Node-based Jest environments do not expose the browser API, so we shim
// the storage object on `globalThis`.
const globalScope = globalThis as typeof globalThis & { sessionStorage?: Storage };
if (typeof globalScope.sessionStorage === 'undefined') {
  const storage: Record<string, string> = Object.create(null);

  const sessionMock: Storage = {
    get length() {
      return Object.keys(storage).length;
    },
    clear: () => {
      for (const key of Object.keys(storage)) {
        delete storage[key];
      }
    },
    getItem: (key: string) =>
      Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null,
    key: (index: number) => Object.keys(storage)[index] ?? null,
    removeItem: (key: string) => {
      delete storage[key];
    },
    setItem: (key: string, value: string) => {
      storage[key] = String(value);
    },
  };

  Object.defineProperty(globalScope, 'sessionStorage', {
    value: sessionMock,
    configurable: true,
    enumerable: false,
    writable: true,
  });
}

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
