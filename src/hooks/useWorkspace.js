import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export function useWorkspace() {
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkspaces = useCallback(async () => {
    try {
      const res = await api.get('/api/workspaces', { _silent: true });
      const list = res.data || [];
      setWorkspaces(list);

      const stored = localStorage.getItem('activeWorkspaceId');
      const storedId = stored ? parseInt(stored, 10) : null;
      const stillValid = storedId && list.some(w => w.id === storedId);

      if (stillValid) {
        setActiveWorkspaceId(storedId);
      } else {
        const personal = list.find(w => w.isPersonal);
        const fallback = personal?.id ?? list[0]?.id ?? null;
        setActiveWorkspaceId(fallback);
        if (fallback) localStorage.setItem('activeWorkspaceId', String(fallback));
      }
    } catch {
      // ignore — dashboard will handle auth errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const setActiveWorkspace = useCallback((id) => {
    setActiveWorkspaceId(id);
    localStorage.setItem('activeWorkspaceId', String(id));
  }, []);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) ?? null;
  const isPersonal = activeWorkspace?.isPersonal ?? true;

  return {
    workspaces,
    activeWorkspace,
    activeWorkspaceId,
    setActiveWorkspace,
    isPersonal,
    loading,
    refetchWorkspaces: fetchWorkspaces,
  };
}
