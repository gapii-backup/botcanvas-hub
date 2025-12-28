import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface UnsavedChangesContextType {
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
  pendingNavigation: string | null;
  setPendingNavigation: (path: string | null) => void;
  onSave: (() => Promise<void>) | null;
  setOnSave: (fn: (() => Promise<void>) | null) => void;
  onDiscard: (() => void) | null;
  setOnDiscard: (fn: (() => void) | null) => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType | undefined>(undefined);

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [onSave, setOnSave] = useState<(() => Promise<void>) | null>(null);
  const [onDiscard, setOnDiscard] = useState<(() => void) | null>(null);

  return (
    <UnsavedChangesContext.Provider
      value={{
        hasUnsavedChanges,
        setHasUnsavedChanges,
        pendingNavigation,
        setPendingNavigation,
        onSave,
        setOnSave: useCallback((fn) => setOnSave(() => fn), []),
        onDiscard,
        setOnDiscard: useCallback((fn) => setOnDiscard(() => fn), []),
      }}
    >
      {children}
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChanges() {
  const context = useContext(UnsavedChangesContext);
  if (context === undefined) {
    throw new Error('useUnsavedChanges must be used within a UnsavedChangesProvider');
  }
  return context;
}
