import { useCallback, useEffect, useRef, useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface DraftEntry<T> { state: T; savedAt: number; }

export interface FormDraftResult<T> {
  /** True when a draft exists and is awaiting restore/discard decision. */
  hasDraft: boolean;
  /** When the draft was last auto-saved. */
  draftSavedAt: Date | null;
  /** Returns the saved draft state and hides the banner. */
  restoreDraft: () => T | null;
  /** Deletes the draft (call on successful submit). */
  clearDraft: () => void;
  /** Hides the banner and deletes the draft (user chose not to restore). */
  dismissDraft: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function formatDraftAge(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (mins < 1) return 'agora mesmo';
  if (mins === 1) return 'há 1 minuto';
  if (mins < 60) return `há ${mins} minutos`;
  const h = Math.floor(mins / 60);
  if (h === 1) return 'há 1 hora';
  if (h < 24) return `há ${h} horas`;
  const d = Math.floor(h / 24);
  return `há ${d} dia${d > 1 ? 's' : ''}`;
}

// ── Banner component ──────────────────────────────────────────────────────────
export function DraftBanner({
  savedAt,
  onRestore,
  onDiscard,
}: {
  savedAt: Date;
  onRestore: () => void;
  onDiscard: () => void;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      padding: '10px 14px',
      background: 'oklch(0.96 0.015 250)',
      border: '1px solid oklch(0.86 0.04 250)',
      borderRadius: 'var(--radius, 10px)',
      marginBottom: 16,
      fontSize: 13,
    }}>
      <span style={{ flex: 1, minWidth: 180, color: 'var(--text-2, #374151)' }}>
        Rascunho encontrado · salvo {formatDraftAge(savedAt)}. Deseja continuar de onde parou?
      </span>
      <button type="button" className="btn btn-primary btn-sm" onClick={onRestore}>
        Restaurar rascunho
      </button>
      <button type="button" className="btn btn-secondary btn-sm" onClick={onDiscard}>
        Descartar
      </button>
    </div>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
/**
 * Persists form state to localStorage and surfaces a restore banner on next visit.
 *
 * @param storageKey  Unique key for this form (e.g. 'form-draft:novo-documento').
 * @param currentState  Current form state — serialised on change, debounced 800 ms.
 * @param options
 *   - `isEmpty`    Return true when state has no meaningful user data (skips save).
 *   - `enabled`    Set false to pause auto-save (e.g. while the entity is loading).
 *   - `debounceMs` Save delay in ms (default 800).
 */
export function useFormDraft<T>(
  storageKey: string,
  currentState: T,
  options?: {
    isEmpty?: (s: T) => boolean;
    enabled?: boolean;
    debounceMs?: number;
  },
): FormDraftResult<T> {
  const { isEmpty, enabled = true, debounceMs = 800 } = options ?? {};

  const [hasDraft, setHasDraft] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);

  // Keep isEmpty in a ref so the effect dependency array stays stable.
  const isEmptyRef = useRef(isEmpty);
  isEmptyRef.current = isEmpty;

  // Check for an existing draft on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const entry: DraftEntry<T> = JSON.parse(raw);
      if (entry?.savedAt) {
        setHasDraft(true);
        setDraftSavedAt(new Date(entry.savedAt));
      }
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  // Debounced auto-save. Using JSON.stringify as dependency avoids running on
  // every render while still detecting real content changes.
  const stateSerial = JSON.stringify(currentState);
  useEffect(() => {
    if (!enabled) return;
    const state = JSON.parse(stateSerial) as T;
    if (isEmptyRef.current?.(state)) return;

    const timer = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ state, savedAt: Date.now() }));
        setDraftSavedAt(new Date());
      } catch { /* quota exceeded / private mode */ }
    }, debounceMs);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateSerial, storageKey, enabled, debounceMs]);

  const restoreDraft = useCallback((): T | null => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const entry: DraftEntry<T> = JSON.parse(raw);
      setHasDraft(false);
      return entry.state ?? null;
    } catch { return null; }
  }, [storageKey]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
    setHasDraft(false);
    setDraftSavedAt(null);
  }, [storageKey]);

  const dismissDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
    setHasDraft(false);
    setDraftSavedAt(null);
  }, [storageKey]);

  return { hasDraft, draftSavedAt, restoreDraft, clearDraft, dismissDraft };
}
