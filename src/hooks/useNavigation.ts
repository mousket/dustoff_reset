import { useState, useCallback } from 'react';
import { PanelType, BACK_NAVIGATION } from '@/types/panels';

interface UseNavigationReturn {
  currentPanel: PanelType;
  previousPanel: PanelType | null;
  navigate: (panel: PanelType) => void;
  goBack: (customBack?: PanelType) => void;
  canGoBack: boolean;
}

export function useNavigation(initialPanel: PanelType = 'hud'): UseNavigationReturn {
  const [currentPanel, setCurrentPanel] = useState<PanelType>(initialPanel);
  const [previousPanel, setPreviousPanel] = useState<PanelType | null>(null);

  const navigate = useCallback((panel: PanelType) => {
    setPreviousPanel(currentPanel);
    setCurrentPanel(panel);
    console.log(`[Navigation] ${currentPanel} → ${panel}`);
  }, [currentPanel]);

  const goBack = useCallback((customBack?: PanelType) => {
    const backTo = customBack || BACK_NAVIGATION[currentPanel] || 'hud';
    setPreviousPanel(currentPanel);
    setCurrentPanel(backTo);
    console.log(`[Navigation] Back: ${currentPanel} → ${backTo}`);
  }, [currentPanel]);

  const canGoBack = currentPanel !== 'hud' && currentPanel !== 'activeSession';

  return {
    currentPanel,
    previousPanel,
    navigate,
    goBack,
    canGoBack,
  };
}
