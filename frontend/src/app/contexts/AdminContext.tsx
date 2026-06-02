import React, { createContext, useContext, useEffect, useState } from 'react';

type AdminModeContextValue = {
  adminMode: boolean;
  setAdminMode: (v: boolean) => void;
};

const AdminModeContext = createContext<AdminModeContextValue | undefined>(undefined);

export function AdminModeProvider({ children }: { children: React.ReactNode }) {
  const [adminMode, setAdminMode] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('adminMode');
      return raw ? JSON.parse(raw) as boolean : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('adminMode', JSON.stringify(adminMode));
    } catch {}
  }, [adminMode]);

  return (
    <AdminModeContext.Provider value={{ adminMode, setAdminMode }}>
      {children}
    </AdminModeContext.Provider>
  );
}

export function useAdminMode() {
  const ctx = useContext(AdminModeContext);
  if (!ctx) throw new Error('useAdminMode must be used within AdminModeProvider');
  return ctx;
}