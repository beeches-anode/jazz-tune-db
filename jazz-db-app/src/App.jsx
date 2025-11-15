import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DatabaseProvider } from './context/DatabaseContext';
import { TuneBrowser } from './components/TuneBrowser/TuneBrowser';
import { TuneEditor } from './components/TuneEditor/TuneEditor';
import { Dashboard } from './components/Dashboard/Dashboard';

function App() {
  return (
    <DatabaseProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<TuneBrowser />} />
          <Route path="/tune/:tuneId" element={<TuneEditor />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </DatabaseProvider>
  );
}

export default App;
