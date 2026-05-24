import { useState, useCallback } from 'react';

const TOKEN_KEY = 'jazz-tune-db-token';

function loadToken() {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const { token, exp } = JSON.parse(raw);
    if (exp < Date.now()) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [token, setToken] = useState(() => loadToken());

  const login = useCallback(async (password) => {
    const res = await fetch('/.netlify/functions/auth-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (data.ok) {
      localStorage.setItem(TOKEN_KEY, JSON.stringify({ token: data.token, exp: data.exp }));
      setToken(data.token);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  return { token, isAuthed: !!token, login, logout };
}
