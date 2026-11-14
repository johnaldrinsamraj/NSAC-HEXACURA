import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';

const AstraContext = createContext();

export function AstraProvider({ children }) {
  const [astronauts, setAstronauts] = useState([]);
  const [currentAstronaut, setCurrentAstronaut] = useState(null);
  const [currentRoute, setCurrentRoute] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const loadAstronauts = useCallback(async () => {
    try {
      const data = await api.getAstronauts();
      setAstronauts(data);
      if (data.length > 0 && !currentAstronaut) {
        setCurrentAstronaut(data[0]);
      }
    } catch (err) {
      console.error('Failed to load astronauts:', err);
    }
  }, [currentAstronaut]);

  const selectAstronaut = useCallback((astro) => {
    setCurrentAstronaut(astro);
    setCurrentRoute('live');
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    loadAstronauts();
  }, [loadAstronauts]);

  return (
    <AstraContext.Provider value={{
      astronauts,
      currentAstronaut,
      currentRoute,
      setCurrentRoute,
      sidebarOpen,
      setSidebarOpen,
      sidebarMobileOpen,
      setSidebarMobileOpen,
      loading,
      setLoading,
      toast,
      dismissToast,
      selectAstronaut,
      showToast,
      loadAstronauts,
    }}>
      {children}
    </AstraContext.Provider>
  );
}

export function useAstra() {
  const ctx = useContext(AstraContext);
  if (!ctx) throw new Error('useAstra must be used within AstraProvider');
  return ctx;
}
