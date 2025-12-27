import { useState, useEffect, useCallback } from 'react';

export type BotConfig = {
  // Step 1 - Osnovni izgled
  name: string;
  primaryColor: string;
  darkMode: boolean;
  headerStyle: 'gradient' | 'solid';
  botAvatar: string;
  botIcon: string; // SVG path for icon when no avatar
  iconBgColor: string; // Background color for icon
  iconColor: string; // Icon color
  
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
  triggerIcon: string; // Icon for floating trigger
};

// Available bot icons - Lucide paths (24x24 viewBox)
export const BOT_ICONS = [
  { 
    name: 'Bot', 
    paths: ['M12 8V4H8', 'rect x="4" y="8" width="16" height="12" rx="2"', 'M9 16h0', 'M15 16h0']
  },
  { 
    name: 'MessageCircle', 
    paths: ['M7.9 20A9 9 0 1 0 4 16.1L2 22Z']
  },
  { 
    name: 'Sparkles', 
    paths: ['M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z', 'M20 3v4', 'M22 5h-4', 'M4 17v2', 'M5 18H3']
  },
  { 
    name: 'Headphones', 
    paths: ['M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3']
  },
  { 
    name: 'Zap', 
    paths: ['M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z']
  },
  { 
    name: 'Brain', 
    paths: ['M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z', 'M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z', 'M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4', 'M17.599 6.5a3 3 0 0 0 .399-1.375', 'M6.003 5.125A3 3 0 0 0 6.401 6.5', 'M3.477 10.896a4 4 0 0 1 .585-.396', 'M19.938 10.5a4 4 0 0 1 .585.396', 'M6 18a4 4 0 0 1-1.967-.516', 'M19.967 17.484A4 4 0 0 1 18 18']
  },
  { 
    name: 'Heart', 
    paths: ['M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z']
  },
  { 
    name: 'MessagesSquare', 
    paths: ['M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2z', 'M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1']
  },
];

// Trigger icons for floating button
export const TRIGGER_ICONS = [
  { name: 'MessageCircle', label: 'Sporočilo' },
  { name: 'MessagesSquare', label: 'Klepet' },
  { name: 'Bot', label: 'Robot' },
  { name: 'Sparkles', label: 'Iskrice' },
  { name: 'Headphones', label: 'Podpora' },
  { name: 'Zap', label: 'Blisk' },
];

const defaultConfig: BotConfig = {
  name: 'Moj AI Asistent',
  primaryColor: '#3B82F6',
  darkMode: true,
  headerStyle: 'gradient',
  botAvatar: '',
  botIcon: 'Robot', // Default icon name
  iconBgColor: '#3B82F6',
  iconColor: '#FFFFFF',
  
  homeTitle: 'Pozdravljeni!',
  homeSubtitle: 'Kako vam lahko pomagam?',
  welcomeMessage: 'Pozdravljeni! Kako vam lahko pomagam?',
  quickQuestions: ['Kaj ponujate?'],
  showEmailField: true,
  
  showBubble: true,
  bubbleText: '👋 Pozdravljeni!',
  position: 'right',
  triggerStyle: 'floating',
  edgeTriggerText: 'Klikni me',
  verticalOffset: 24,
  triggerIcon: 'MessageCircle',
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
