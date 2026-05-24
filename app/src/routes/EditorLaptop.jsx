import { Routes, Route } from 'react-router-dom';
import { DatabaseProvider } from './Editor/DatabaseContext';
import { TuneBrowser } from './Editor/TuneBrowser/TuneBrowser';
import { TuneEditor } from './Editor/TuneEditor/TuneEditor';
import { Dashboard } from './Editor/Dashboard/Dashboard';

export function EditorLaptop() {
  return (
    <DatabaseProvider>
      <Routes>
        <Route index element={<TuneBrowser />} />
        <Route path="tune/:tuneId" element={<TuneEditor />} />
        <Route path="dashboard" element={<Dashboard />} />
      </Routes>
    </DatabaseProvider>
  );
}
