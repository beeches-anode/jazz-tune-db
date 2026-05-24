import { createContext, useContext, useState, useEffect } from 'react';
import { useTunes } from '../../hooks/useTunes';

const DatabaseContext = createContext();

export const DatabaseProvider = ({ children }) => {
  // Read path: pull the canonical tune list from GitHub via useTunes().
  // We need archived tunes too (so the editor can un-archive), so use allTunes.
  const { allTunes, sha, loading: fetching, error, refetch } = useTunes();

  const [database, setDatabase] = useState(null);
  const [tunes, setTunes] = useState([]);
  const [undoStack, setUndoStack] = useState([]);

  // Mirror fetched tunes into local editor state so the rest of the API
  // (updateTune, getTune, undo, ...) keeps working in-memory as before.
  useEffect(() => {
    if (allTunes && allTunes.length > 0) {
      setDatabase(allTunes);
      setTunes(allTunes);
    }
  }, [allTunes]);

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

  // In-memory only. Task 26 will add the debounced server save here.
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
    getTune,
    exportDatabase,
    undo,
    canUndo: undoStack.length > 0,
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
