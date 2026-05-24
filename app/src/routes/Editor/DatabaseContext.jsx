import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useTunes } from '../../hooks/useTunes';
import { useSaveTune } from '../../hooks/useSaveTune';

const DatabaseContext = createContext();

// Debounce window for server saves: 2s after the last edit on a given tune.
const SAVE_DEBOUNCE_MS = 2000;

export const DatabaseProvider = ({ children }) => {
  // Read path: pull the canonical tune list from GitHub via useTunes().
  // We need archived tunes too (so the editor can un-archive), so use allTunes.
  const { allTunes, sha, loading: fetching, error, refetch } = useTunes();

  const [database, setDatabase] = useState(null);
  const [tunes, setTunes] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [saveError, setSaveError] = useState(null);

  const { save, saving } = useSaveTune();

  // Map<tune_id, { fields, timer }> — pending field changes awaiting flush.
  const pendingSaves = useRef(new Map());

  // Keep a ref to the latest sha so flushSave (kept stable) can read it
  // without re-creating timers on every fetch refresh.
  const shaRef = useRef(sha);
  useEffect(() => {
    shaRef.current = sha;
  }, [sha]);

  // Mirror fetched tunes into local editor state so the rest of the API
  // (updateTune, getTune, undo, ...) keeps working in-memory as before.
  useEffect(() => {
    if (allTunes && allTunes.length > 0) {
      setDatabase(allTunes);
      setTunes(allTunes);
    }
  }, [allTunes]);

  // Flush pending field changes for a tune to the server. On failure,
  // re-queue the failed fields so a subsequent edit picks them up.
  // Returns { ok, result } on success, { ok: false, error } on failure,
  // or { ok: true, skipped: true } if nothing was queued.
  const flushSave = useCallback(async (tuneId) => {
    const pending = pendingSaves.current.get(tuneId);
    if (!pending) return { ok: true, skipped: true };
    pendingSaves.current.delete(tuneId);
    try {
      const result = await save(tuneId, pending.fields, shaRef.current);
      setSaveError(null);
      return { ok: true, result };
    } catch (err) {
      // Re-queue: merge our failed fields under any newer pending fields
      // (newer wins on conflict) so the next edit retries them together.
      const newer = pendingSaves.current.get(tuneId);
      pendingSaves.current.set(tuneId, {
        fields: { ...pending.fields, ...(newer?.fields || {}) },
        timer: newer?.timer || null,
      });
      setSaveError(err);
      return { ok: false, error: err };
    }
  }, [save]);

  // Flush a pending save immediately (cancels its debounce timer).
  // Used by the laptop editor's explicit Save button.
  const saveTuneNow = useCallback(async (tuneId) => {
    const pending = pendingSaves.current.get(tuneId);
    if (pending?.timer) clearTimeout(pending.timer);
    return await flushSave(tuneId);
  }, [flushSave]);

  // Clear any outstanding timers on unmount so they don't fire after the
  // provider is gone.
  useEffect(() => {
    const pending = pendingSaves.current;
    return () => {
      for (const entry of pending.values()) {
        if (entry.timer) clearTimeout(entry.timer);
      }
    };
  }, []);

  // File-based "import JSON" flow. Informational-only until restored or
  // removed in a later phase — updates local state but does NOT persist
  // to localStorage or the server.
  const loadDatabase = (data) => {
    try {
      // Handle both formats: array directly or object with metadata/tunes structure
      const tunesArray = Array.isArray(data) ? data : (data.tunes || []);

      if (!Array.isArray(tunesArray) || tunesArray.length === 0) {
        throw new Error('Invalid data format: expected an array of tunes or an object with a "tunes" property');
      }

      setDatabase(tunesArray);
      setTunes(tunesArray);
      return { success: true, count: tunesArray.length };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateTune = (tuneId, updates) => {
    // Save current state to undo stack (cap at 10 entries)
    setUndoStack(prev => [...prev.slice(-9), tunes]);

    const updatedTunes = tunes.map(tune =>
      tune.id === tuneId
        ? { ...tune, ...updates, last_updated: new Date().toISOString() }
        : tune
    );

    setTunes(updatedTunes);
    setDatabase(updatedTunes);

    // Strip immutable + server-stamped fields before queueing for save.
    // `id` is immutable (server returns 400 if present), and the server
    // stamps `last_updated` itself.
    const { id: _id, last_updated: _lu, ...saveFields } = updates;

    // Queue a debounced server save. Merge into any existing pending entry
    // (newer fields win) and reset the timer so we save 2s after the LAST edit.
    const existing = pendingSaves.current.get(tuneId);
    if (existing?.timer) clearTimeout(existing.timer);
    const mergedFields = { ...(existing?.fields || {}), ...saveFields };
    const timer = setTimeout(() => flushSave(tuneId), SAVE_DEBOUNCE_MS);
    pendingSaves.current.set(tuneId, { fields: mergedFields, timer });
  };

  const getTune = (tuneId) => {
    return tunes.find(tune => tune.id === tuneId);
  };

  const exportDatabase = () => {
    const dataStr = JSON.stringify(tunes, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `jazz-db-backup-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const undo = () => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      setTunes(previousState);
      setDatabase(previousState);
      setUndoStack(prev => prev.slice(0, -1));
    }
  };

  const value = {
    database,
    tunes,
    loading: fetching,
    sha,
    error,
    refetch,
    loadDatabase,
    updateTune,
    saveTuneNow,
    getTune,
    exportDatabase,
    undo,
    canUndo: undoStack.length > 0,
    saving,
    saveError,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within DatabaseProvider');
  }
  return context;
};
