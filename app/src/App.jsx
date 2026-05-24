import { Routes, Route } from 'react-router-dom';
import { ReaderHome } from './routes/ReaderHome';

export default function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<ReaderHome />} />
        <Route path="/edit/*" element={<div className="p-8">Editor placeholder — Phase 5 will fill this in.</div>} />
      </Routes>
    </div>
  );
}
