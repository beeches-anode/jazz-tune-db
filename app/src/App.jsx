import { Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<div className="p-8">Reader placeholder — Phase 3 will fill this in.</div>} />
        <Route path="/edit/*" element={<div className="p-8">Editor placeholder — Phase 5 will fill this in.</div>} />
      </Routes>
    </div>
  );
}
