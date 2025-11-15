import { createContext, useContext, useState, useEffect } from 'react';

const DatabaseContext = createContext();

export const DatabaseProvider = ({ children }) => {
  const [database, setDatabase] = useState(null);
  const [tunes, setTunes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [undoStack, setUndoStack] = useState([]);

  // Load database from localStorage on mount
  useEffect(() => {
    const savedDb = localStorage.getItem('jazz-database');
    if (savedDb) {
      try {
        const parsed = JSON.parse(savedDb);
        setDatabase(parsed);
        setTunes(parsed);
      } catch (error) {
        console.error('Error loading saved database:', error);
      }
    }
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    if (database) {
      localStorage.setItem('jazz-database', JSON.stringify(database));
    }
  }, [database]);

  const loadDatabase = (data) => {
    setLoading(true);
    try {
      setDatabase(data);
      setTunes(data);
      localStorage.setItem('jazz-database', JSON.stringify(data));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const updateTune = (tuneId, updates) => {
    // Save current state to undo stack
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
    loading,
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
