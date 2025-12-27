import { Bot, Send } from 'lucide-react';
import { BotConfig } from '@/hooks/useWizardConfig';

type WidgetPreviewProps = {
  config: BotConfig;
  showChat?: boolean;
  showHome?: boolean;
};

export function WidgetPreview({ config, showChat = true, showHome = false }: WidgetPreviewProps) {
  const textColor = config.darkMode ? 'white' : '#0f0f0f';
  const mutedColor = config.darkMode ? '#888' : '#666';
  const bgColor = config.darkMode ? '#0f0f0f' : '#ffffff';
  const secondaryBg = config.darkMode ? '#1a1a1a' : '#f0f0f0';
  const inputBg = config.darkMode ? '#1a1a1a' : '#f5f5f5';
  const borderColor = config.darkMode ? '#2a2a2a' : '#e5e5e5';

  const headerBackground = config.headerStyle === 'solid' 
    ? config.primaryColor 
    : `linear-gradient(180deg, ${config.primaryColor} 0%, ${bgColor} 100%)`;

  const headerTextColor = config.headerStyle === 'solid' ? 'white' : textColor;

  return (
    <div 
      className="w-[380px] rounded-2xl overflow-hidden shadow-2xl"
      style={{ backgroundColor: bgColor }}
    >
      {/* Header */}
      <div 
        className="p-4 flex items-center gap-3"
        style={{ background: headerBackground }}
      >
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: config.primaryColor }}
        >
          {config.botAvatar ? (
            <img 
              src={config.botAvatar} 
              alt="Bot avatar"
              className="w-full h-full object-cover" 
            />
          ) : (
            <Bot className="w-5 h-5 text-white" />
          )}
        </div>
        <div>
          <p className="font-semibold" style={{ color: headerTextColor }}>
            {config.name || 'AI Asistent'}
          </p>
          <p className="text-xs opacity-70" style={{ color: headerTextColor }}>
            Online
          </p>
        </div>
      </div>

      {/* Home screen */}
      {showHome && (
        <div className="p-6 space-y-4 min-h-[300px]" style={{ backgroundColor: bgColor }}>
          <div className="text-center mb-6">
            <h4 className="text-xl font-semibold" style={{ color: textColor }}>
              {config.homeTitle}
            </h4>
            <p className="text-sm mt-1" style={{ color: mutedColor }}>
              {config.homeSubtitle}
            </p>
          </div>

          {/* Quick questions */}
          <div className="space-y-2">
            {config.quickQuestions.slice(0, 3).map((q, i) => (
              <button
                key={i}
                className="w-full text-left text-sm px-4 py-3 rounded-xl border transition-all hover:scale-[1.02]"
                style={{ 
                  borderColor: borderColor, 
                  color: textColor,
                  backgroundColor: 'transparent'
                }}
              >
                {q}
              </button>
            ))}
          </div>

          {config.showEmailField && (
            <div className="mt-4 pt-4 border-t" style={{ borderColor }}>
              <p className="text-xs text-center" style={{ color: mutedColor }}>
                📧 Email polje prikazano
              </p>
            </div>
          )}
        </div>
      )}

      {/* Chat area */}
      {showChat && (
        <div className="p-4 space-y-4 min-h-[300px]" style={{ backgroundColor: bgColor }}>
          {/* Bot message */}
          <div className="flex gap-2">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: config.primaryColor }}
            >
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: mutedColor }}>{config.name}</p>
              <div 
                className="rounded-2xl rounded-tl-sm px-4 py-2 max-w-[250px]"
                style={{ backgroundColor: secondaryBg }}
              >
                <p className="text-sm" style={{ color: textColor }}>
                  {config.welcomeMessage || 'Pozdravljeni! Kako vam lahko pomagam?'}
                </p>
              </div>
            </div>
          </div>

          {/* User message */}
          <div className="flex justify-end">
            <div 
              className="rounded-2xl rounded-tr-sm px-4 py-2 max-w-[250px]"
              style={{ backgroundColor: config.primaryColor }}
            >
              <p className="text-sm text-white">Zdravo! Zanima me več.</p>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t" style={{ borderColor }}>
        <div 
          className="flex items-center gap-2 rounded-full px-4 py-2"
          style={{ backgroundColor: inputBg }}
        >
          <span className="flex-1 text-sm" style={{ color: mutedColor }}>
            Napišite sporočilo...
          </span>
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
            style={{ backgroundColor: config.primaryColor }}
          >
            <Send className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
