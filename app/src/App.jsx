import { Routes, Route } from 'react-router-dom';
import { ReaderHome } from './routes/ReaderHome';
import { EditorLaptop } from './routes/EditorLaptop';
import { AuthGate } from './components/AuthGate';
// Phase 8 will add EditorMobile + viewport-aware routing:
// import { EditorMobile } from './routes/EditorMobile';
// import { useViewport } from './hooks/useViewport';

function EditorRoute() {
  // Phase 8 will branch on useViewport() to render EditorMobile on small screens.
  // For now we always render EditorLaptop.
  return (
    <AuthGate>
      <EditorLaptop />
    </AuthGate>
  );
}

export default function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<ReaderHome />} />
        <Route path="/edit/*" element={<EditorRoute />} />
      </Routes>
    </div>
  );
}
