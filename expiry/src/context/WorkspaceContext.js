import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const WorkspaceContext = createContext();
export const useWorkspace = () => useContext(WorkspaceContext);

export const WorkspaceProvider = ({ children }) => {
  const [currentWorkspace, setCurrentWorkspace] = useState('user');
  const [pendingIntent, setPendingIntent] = useState(null);
  const intentVersionRef = useRef(0);

  // intent: string (ekran adı) ya da { screen, params } objesi olabilir
  const switchWorkspace = useCallback((target, intent = null) => {
    setCurrentWorkspace(target);
    if (intent) {
      intentVersionRef.current += 1;
      const normalized = typeof intent === 'string' ? { screen: intent } : intent;
      setPendingIntent({ ...normalized, version: intentVersionRef.current });
    } else {
      setPendingIntent(null);
    }
  }, []);
  const switchWorkspaceSilently = useCallback((target) => {
  setCurrentWorkspace(target); // pendingIntent'e dokunmaz
}, []);

  const consumeIntent = useCallback(() => {
    setPendingIntent(null);
  }, []);

  const resetToDefault = useCallback(() => {
    setCurrentWorkspace('user');
    setPendingIntent(null);
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{ currentWorkspace, pendingIntent, switchWorkspace, switchWorkspaceSilently, consumeIntent, resetToDefault }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};