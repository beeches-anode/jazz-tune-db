import { Routes, Route } from 'react-router-dom';
import { ReaderHome } from './routes/ReaderHome';
import { EditorLaptop } from './routes/EditorLaptop';
import { EditorMobile } from './routes/EditorMobile';
import { AuthGate } from './components/AuthGate';
import { useViewport } from './hooks/useViewport';

function EditorRoute() {
  const { isMobile } = useViewport();
  return (
    <AuthGate>
      {isMobile ? <EditorMobile /> : <EditorLaptop />}
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
