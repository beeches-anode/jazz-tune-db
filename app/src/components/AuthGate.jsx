import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export function AuthGate({ children }) {
  const { isAuthed, login } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthed) return children;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const ok = await login(password);
    setSubmitting(false);
    if (!ok) setError('Incorrect password');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 w-full max-w-sm">
        <h1 className="text-xl font-bold text-zinc-900 mb-2">Editor</h1>
        <p className="text-sm text-zinc-600 mb-4">Enter the editor password to continue.</p>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full px-3 py-2 border border-zinc-300 rounded mb-3"
          autoFocus
        />
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !password}
          className="w-full px-4 py-2 bg-sky-500 text-white font-medium rounded hover:bg-sky-600 disabled:opacity-50"
        >
          {submitting ? 'Checking…' : 'Unlock'}
        </button>
      </form>
    </div>
  );
}
