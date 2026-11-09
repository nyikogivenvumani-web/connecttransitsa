'use client';
import { useCallback, useEffect, useState } from 'react';
import { isNetworkError } from '../lib/api/admin';

/** Loads data once and again on reload() or when the browser comes back online. Tracks error and offline separately. */
export function useLoad<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await fetcher();
        if (!alive) return;
        setData(d);
        setError(null);
        setOffline(false);
      } catch (e) {
        if (!alive) return;
        if (isNetworkError(e)) setOffline(true);
        else setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  useEffect(() => {
    const off = () => setOffline(true);
    window.addEventListener('online', reload);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', reload); window.removeEventListener('offline', off); };
  }, [reload]);

  return { data, error, offline, reload };
}
