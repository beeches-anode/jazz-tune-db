import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

export function useCreateTune() {
  const { token } = useAuth();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const create = useCallback(async (tune) => {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/.netlify/functions/create-tune', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tune }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'create failed');
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setCreating(false);
    }
  }, [token]);

  return { create, creating, error };
}
