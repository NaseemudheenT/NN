"use client";

/**
 * Small typed stores for the handful of things the browser knows and the
 * server does not: the visitor's clock, their motion preference, what this
 * device can render, and the few choices they have made.
 *
 * They are read with useSyncExternalStore rather than fetched into state
 * inside an effect, so the first client render already has the right answer
 * and nothing re-renders twice to catch up.
 */

type Listener = () => void;

export interface Store<T> {
  subscribe: (l: Listener) => () => void;
  get: () => T;
  set: (v: T) => void;
  server: () => T;
}

function createStore<T>(options: {
  read: () => T;
  write?: (v: T) => void;
  server: T;
}): Store<T> {
  let cache: { value: T } | null = null;
  const listeners = new Set<Listener>();

  return {
    subscribe(l) {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    get() {
      if (!cache) cache = { value: options.read() };
      return cache.value;
    },
    set(value) {
      cache = { value };
      options.write?.(value);
      for (const l of listeners) l();
    },
    server: () => options.server,
  };
}

function readLocal(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* private mode — the choice simply does not persist */
  }
}

/** A preference kept in localStorage, readable synchronously. */
export function localPref<T>(
  key: string,
  parse: (raw: string | null) => T,
  serialize: (v: T) => string | null,
  server: T,
): Store<T> {
  return createStore<T>({
    read: () => parse(readLocal(key)),
    write: (v) => writeLocal(key, serialize(v)),
    server,
  });
}

/** A value that lives only for this browser session. */
export function sessionFlag(key: string, server: boolean): Store<boolean> {
  return createStore<boolean>({
    read: () => {
      try {
        return window.sessionStorage.getItem(key) === "1";
      } catch {
        return false;
      }
    },
    write: (v) => {
      try {
        if (v) window.sessionStorage.setItem(key, "1");
        else window.sessionStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    },
    server,
  });
}

/** A value derived once from the device, then settable at runtime. */
export function deviceStore<T>(read: () => T, server: T): Store<T> {
  return createStore<T>({ read, server });
}

/* ------------------------------------------------------------------ */
/* Media queries and the clock — subscriptions, not one-off reads       */
/* ------------------------------------------------------------------ */

export function subscribeMediaQuery(query: string) {
  return (l: Listener) => {
    const mq = window.matchMedia(query);
    mq.addEventListener("change", l);
    return () => mq.removeEventListener("change", l);
  };
}

export function matchesMediaQuery(query: string) {
  try {
    return window.matchMedia(query).matches;
  } catch {
    return false;
  }
}

/** Ticks once a minute, which is often enough to notice an hour turning. */
export function subscribeClock(l: Listener) {
  const id = window.setInterval(l, 60_000);
  return () => window.clearInterval(id);
}
