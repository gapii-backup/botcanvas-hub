import { useState, useEffect, useCallback } from 'react';

export type BotConfig = {
  // Step 1 - Osnovni izgled
  name: string;
  primaryColor: string;
  darkMode: boolean;
  headerStyle: 'gradient' | 'solid';
  botAvatar: string;
  
  // Step 2 - Chat
  homeTitle: string;
  homeSubtitle: string;
  welcomeMessage: string;
  quickQuestions: string[];
  showEmailField: boolean;
  
  // Step 3 - Bubble & pozicija
  showBubble: boolean;
  bubbleText: string;
  position: 'left' | 'right';
  triggerStyle: 'floating' | 'edge';
  edgeTriggerText: string;
  verticalOffset: number;
};

const defaultConfig: BotConfig = {
  name: 'Moj AI Asistent',
  primaryColor: '#3B82F6',
  darkMode: true,
  headerStyle: 'gradient',
  botAvatar: '',
  
  homeTitle: 'Pozdravljeni!',
  homeSubtitle: 'Kako vam lahko pomagam?',
  welcomeMessage: 'Pozdravljeni! Kako vam lahko pomagam?',
  quickQuestions: ['Kakšne so vaše cene?', 'Kako vas kontaktiram?'],
  showEmailField: true,
  
  showBubble: true,
  bubbleText: '👋 Pozdravljeni!',
  position: 'right',
  triggerStyle: 'floating',
  edgeTriggerText: 'Klikni me',
  verticalOffset: 24,
};

const STORAGE_KEY = 'botmotion-wizard-config';

export function useWizardConfig() {
  const [config, setConfigState] = useState<BotConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...defaultConfig, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Failed to load wizard config:', e);
    }
    return defaultConfig;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save wizard config:', e);
    }
  }, [config]);

  const setConfig = useCallback((updates: Partial<BotConfig>) => {
    setConfigState(prev => ({ ...prev, ...updates }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfigState(defaultConfig);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { config, setConfig, resetConfig, defaultConfig };
}
