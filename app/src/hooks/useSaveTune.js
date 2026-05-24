import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

export function useSaveTune() {
  const { token } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const save = useCallback(async (tuneId, updatedFields, expectedSha) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/.netlify/functions/save-tune', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tune_id: tuneId,
          updated_fields: updatedFields,
          expected_sha: expectedSha,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'save failed');
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [token]);

  return { save, saving, error };
}
