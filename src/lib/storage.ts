import { useCallback, useEffect, useState } from "react";

// Bumped to v2 to clear all prior placeholder data and start with a blank template.
const PREFIX = "dt2026v2:";

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJSON<T>(key: string, value: T) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    // Notify same-tab listeners
    window.dispatchEvent(new CustomEvent("dt:storage", { detail: { key } }));
  } catch {
    /* quota or private mode */
  }
}

export function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => loadJSON(key, initial));

  useEffect(() => {
    saveJSON(key, value);
  }, [key, value]);

  // Sync across tabs / pages
  useEffect(() => {
    const handler = (e: StorageEvent | Event) => {
      const k = (e as StorageEvent).key ?? (e as CustomEvent).detail?.key;
      if (!k) return;
      if (k === PREFIX + key || k === key) {
        setValue(loadJSON(key, initial));
      }
    };
    window.addEventListener("storage", handler);
    window.addEventListener("dt:storage", handler as EventListener);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("dt:storage", handler as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const reset = useCallback(() => setValue(initial), [initial]);
  return [value, setValue, reset] as const;
}

/** Iterate all per-day keys present in localStorage. */
export function listDayKeys(): string[] {
  const out: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PREFIX + "day:")) {
      out.push(k.slice(PREFIX.length + 4));
    }
  }
  return out;
}
