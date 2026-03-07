'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

const STORAGE_KEY = 'anfis_tutorial_mode';

interface TutorialContextValue {
  tutorialMode: boolean;
  toggleTutorialMode: () => void;
}

const TutorialContext = createContext<TutorialContextValue>({
  tutorialMode: false,
  toggleTutorialMode: () => {},
});

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [tutorialMode, setTutorialMode] = useState(false);

  useEffect(() => {
    setTutorialMode(localStorage.getItem(STORAGE_KEY) === 'true');
  }, []);

  const toggleTutorialMode = () => {
    setTutorialMode(prev => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  return (
    <TutorialContext.Provider value={{ tutorialMode, toggleTutorialMode }}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  return useContext(TutorialContext);
}
