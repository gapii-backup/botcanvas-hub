import { Send, ArrowUp, ChevronRight, MessageCircle, MessageSquare, X, Bot, Sparkles, Headphones, Zap, Brain, Heart, LucideIcon } from 'lucide-react';
import { BotConfig } from '@/hooks/useWizardConfig';

type WidgetPreviewProps = {
  config: BotConfig;
  showChat?: boolean;
  showHome?: boolean;
};

// Color utilities
function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(Math.min((num >> 16) + amt, 255), 0);
  const G = Math.max(Math.min((num >> 8 & 0x00FF) + amt, 255), 0);
  const B = Math.max(Math.min((num & 0x0000FF) + amt, 255), 0);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function hexToRgba(hex: string, alpha: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const R = (num >> 16) & 255;
  const G = (num >> 8) & 255;
  const B = num & 255;
  return `rgba(${R}, ${G}, ${B}, ${alpha})`;
}

// Icon component that renders based on icon name
const IconComponents: Record<string, LucideIcon> = {
  Bot: Bot,
  MessageSquare: MessageSquare,
  MessageCircle: MessageCircle,
  Sparkles: Sparkles,
  Headphones: Headphones,
  Zap: Zap,
  Brain: Brain,
  Heart: Heart,
};

function BotIconOrAvatar({ 
  config, 
  size = 32, 
}: { 
  config: BotConfig; 
  size?: number;
}) {
  if (config.botAvatar) {
    return (
      <img 
        src={config.botAvatar} 
        alt="Bot avatar"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    );
  }
  
  const IconComponent = IconComponents[config.botIcon] || Bot;
  return <IconComponent size={size} color={config.iconColor || 'white'} />;
}

export function WidgetPreview({ config, showChat = true, showHome = false }: WidgetPreviewProps) {
  const bgColor = config.darkMode ? '#0f0f0f' : '#ffffff';
  const bgSecondary = config.darkMode ? '#1a1a1a' : '#f5f5f5';
  const textColor = config.darkMode ? '#ffffff' : '#0f0f0f';
  const textMuted = config.darkMode ? '#888888' : '#666666';
  const borderColor = config.darkMode ? '#2a2a2a' : '#e5e5e5';

  // Header background based on style
  const headerBackground = config.headerStyle === 'solid' 
    ? config.primaryColor 
    : `linear-gradient(180deg, ${adjustColor(config.primaryColor, -30)} 0%, ${adjustColor(config.primaryColor, -30)} 50%, ${bgColor} 100%)`;

  const headerTextColor = config.headerStyle === 'solid' ? '#ffffff' : textColor;

  return (
    <div 
      className="rounded-2xl overflow-hidden w-full max-w-[380px] h-[580px] sm:h-[640px]"
      style={{ 
        backgroundColor: bgColor,
        boxShadow: '0 10px 60px rgba(0, 0, 0, 0.15), 0 4px 20px rgba(0, 0, 0, 0.1)',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Home View */}
      {showHome && (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100%',
          background: config.headerStyle === 'solid' ? config.primaryColor : 'transparent'
        }}>
          {/* Home Header */}
          <div 
            style={{ 
              background: headerBackground,
              padding: '16px 20px 32px',
              textAlign: 'center',
              flexShrink: 0,
              position: 'relative'
            }}
          >
            {/* Header Actions */}
            <div style={{ 
              position: 'absolute', 
              top: '16px', 
              right: '16px', 
              display: 'flex', 
              gap: '8px' 
            }}>
              <div 
                style={{ 
                  width: '36px', 
                  height: '36px', 
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'transparent',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
            </div>

            {/* Bot Icon */}
            <div 
              style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '16px',
                background: config.botAvatar ? config.primaryColor : (config.iconBgColor || config.primaryColor),
                margin: '16px auto 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 8px 24px ${hexToRgba(config.botAvatar ? config.primaryColor : (config.iconBgColor || config.primaryColor), 0.4)}`,
                overflow: 'hidden'
              }}
            >
              <BotIconOrAvatar config={config} size={32} />
            </div>

            {/* Title */}
            <h2 style={{ 
              color: headerTextColor,
              fontSize: '28px',
              fontWeight: 700,
              margin: 0,
              lineHeight: 1.25,
              letterSpacing: '-0.5px',
              textShadow: config.headerStyle === 'solid' ? '0 2px 4px rgba(0, 0, 0, 0.15)' : 'none'
            }}>
              <span style={{ display: 'block', fontSize: '32px', marginBottom: '4px' }}>
                {config.homeTitle || 'Pozdravljeni!'}
              </span>
              <span style={{ display: 'block', fontWeight: 600, opacity: 0.95 }}>
                {config.homeSubtitle || 'Kako vam lahko pomagam?'}
              </span>
            </h2>
          </div>

          {/* Quick Questions Section */}
          <div style={{ 
            padding: '0 20px 16px',
            background: config.headerStyle === 'solid' ? config.primaryColor : 'transparent',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            {/* Quick Label */}
            <div style={{ 
              fontSize: '11px',
              fontWeight: 600,
              color: textMuted,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              marginBottom: '12px',
              textAlign: 'center',
              background: bgColor,
              padding: '8px 16px',
              borderRadius: '20px'
            }}>
              Pogosta vprašanja
            </div>

            {/* Quick Question Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              {config.quickQuestions.slice(0, 4).map((q, i) => (
                <button
                  key={i}
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '14px 16px',
                    background: bgSecondary,
                    border: `1px solid ${borderColor}`,
                    borderRadius: '12px',
                    color: textColor,
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ 
                      width: '6px', 
                      height: '6px', 
                      borderRadius: '50%', 
                      background: config.primaryColor 
                    }} />
                    <span>{q}</span>
                  </div>
                  <ChevronRight size={16} color={textMuted} />
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Section */}
          <div style={{ 
            marginTop: 'auto',
            flexShrink: 0,
            background: config.headerStyle === 'solid' ? config.primaryColor : bgColor
          }}>
            {/* Email Field */}
            {config.showEmailField && (
              <div style={{ 
                padding: '0 20px 8px',
                background: config.headerStyle === 'solid' ? config.primaryColor : 'transparent'
              }}>
                <input
                  type="email"
                  placeholder="Email (opcijsko)"
                  readOnly
                  style={{ 
                    width: '100%',
                    padding: '14px 16px',
                    background: bgSecondary,
                    border: `1px solid ${borderColor}`,
                    borderRadius: '12px',
                    color: textColor,
                    fontSize: '14px'
                  }}
                />
              </div>
            )}

            {/* Message Input */}
            <div style={{ 
              padding: '8px 20px 8px',
              background: config.headerStyle === 'solid' ? config.primaryColor : bgColor
            }}>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                background: bgColor,
                border: `2px solid ${config.primaryColor}`,
                borderRadius: '24px',
                padding: '6px 6px 6px 20px',
                boxShadow: `0 4px 20px ${hexToRgba(config.primaryColor, 0.25)}`
              }}>
                <span style={{ 
                  flex: 1, 
                  fontSize: '15px', 
                  color: config.darkMode ? '#666666' : '#555555',
                  padding: '10px 0'
                }}>
                  Napišite vprašanje...
                </span>
                <div 
                  style={{ 
                    width: '44px', 
                    height: '44px', 
                    borderRadius: '50%',
                    background: config.primaryColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: `0 2px 8px ${hexToRgba(config.primaryColor, 0.4)}`
                  }}
                >
                  <ArrowUp size={20} color="white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat View */}
      {showChat && !showHome && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Chat Header */}
          <div 
            style={{ 
              background: `linear-gradient(135deg, ${config.primaryColor}, ${adjustColor(config.primaryColor, -20)})`,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexShrink: 0
            }}
          >
            {/* Back Button */}
            <div 
              style={{ 
                width: '36px', 
                height: '36px', 
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </div>

            {/* Header Avatar */}
            <div 
              style={{ 
                width: '36px', 
                height: '36px', 
                minWidth: '36px',
                borderRadius: '10px',
                background: config.botAvatar ? config.primaryColor : (config.iconBgColor || config.primaryColor),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                boxShadow: `0 2px 8px ${hexToRgba(config.botAvatar ? config.primaryColor : (config.iconBgColor || config.primaryColor), 0.3)}`
              }}
            >
              <BotIconOrAvatar config={config} size={20} />
            </div>

            {/* Header Info */}
            <div style={{ flex: 1, textAlign: 'left' }}>
              <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 600, margin: 0 }}>
                {config.name || 'AI Asistent'}
              </h3>
              <span style={{ 
                color: 'rgba(255, 255, 255, 0.9)', 
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: '#22c55e',
                  boxShadow: '0 0 6px rgba(34, 197, 94, 0.6)'
                }} />
                Online
              </span>
            </div>

            {/* Close Button */}
            <div 
              style={{ 
                width: '36px', 
                height: '36px', 
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} color="white" />
            </div>
          </div>

          {/* Chat Content */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '20px',
            background: bgColor
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Bot Message */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                {/* Small Avatar */}
                <div 
                  style={{ 
                    width: '28px', 
                    height: '28px', 
                    minWidth: '28px',
                    borderRadius: '50%',
                    background: config.botAvatar ? config.primaryColor : (config.iconBgColor || config.primaryColor),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '22px',
                    boxShadow: `0 2px 6px ${hexToRgba(config.botAvatar ? config.primaryColor : (config.iconBgColor || config.primaryColor), 0.3)}`,
                    overflow: 'hidden'
                  }}
                >
                  <BotIconOrAvatar config={config} size={16} />
                </div>
                <div style={{ maxWidth: '80%' }}>
                  <div 
                    style={{ 
                      padding: '12px 16px',
                      borderRadius: '18px',
                      borderBottomLeftRadius: '6px',
                      fontSize: '14px',
                      lineHeight: 1.5,
                      background: bgSecondary,
                      color: textColor
                    }}
                  >
                    Zdravo! Kako vam lahko pomagam?
                  </div>
                  <div style={{ fontSize: '11px', color: textMuted, marginTop: '4px' }}>
                    14:32
                  </div>
                </div>
              </div>

              {/* User Message */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ maxWidth: '80%', textAlign: 'right' }}>
                  <div 
                    style={{ 
                      padding: '12px 16px',
                      borderRadius: '18px',
                      borderBottomRightRadius: '6px',
                      fontSize: '14px',
                      lineHeight: 1.5,
                      background: config.primaryColor,
                      color: 'white'
                    }}
                  >
                    Kaj ponujate?
                  </div>
                  <div style={{ fontSize: '11px', color: textMuted, marginTop: '4px' }}>
                    14:32
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Input */}
          <div style={{ 
            padding: '16px 20px',
            borderTop: `1px solid ${borderColor}`,
            display: 'flex',
            gap: '10px',
            background: bgColor,
            flexShrink: 0,
            alignItems: 'center'
          }}>
            <div style={{ 
              flex: 1,
              padding: '12px 18px',
              background: bgSecondary,
              border: `1px solid ${borderColor}`,
              borderRadius: '24px',
              color: textMuted,
              fontSize: '14px'
            }}>
              Napišite vprašanje...
            </div>
            <div 
              style={{ 
                width: '44px', 
                height: '44px', 
                borderRadius: '50%',
                background: config.primaryColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Send size={20} color="white" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Trigger button preview
export function TriggerPreview({ config }: { config: BotConfig }) {
  const isRight = config.position === 'right';
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: isRight ? 'flex-end' : 'flex-start', 
      gap: '12px' 
    }}>
      {/* Welcome Bubble */}
      {config.showBubble && (
        <div 
          style={{ 
            background: config.primaryColor,
            borderRadius: '20px',
            padding: '14px 20px',
            boxShadow: `0 4px 20px ${hexToRgba(config.primaryColor, 0.4)}`,
            maxWidth: '300px',
            position: 'relative'
          }}
        >
          <p style={{ 
            color: 'white', 
            fontSize: '15px', 
            fontWeight: 500, 
            margin: 0,
            whiteSpace: 'normal',
            overflowWrap: 'break-word'
          }}>
            {config.bubbleText || '👋 Pozdravljeni!'}
          </p>
          {/* Close button */}
          <div 
            style={{ 
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              width: '20px',
              height: '20px',
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
            }}
          >
            <X size={12} color="#666" />
          </div>
        </div>
      )}

      {/* Trigger Button */}
      {config.triggerStyle === 'floating' && (
        <div 
          style={{ 
            width: '60px', 
            height: '60px', 
            borderRadius: '50%',
            background: config.primaryColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 4px 20px ${hexToRgba(config.primaryColor, 0.4)}`,
            position: 'relative',
            cursor: 'pointer'
          }}
        >
          {(() => {
            const TriggerIcon = IconComponents[config.triggerIcon] || MessageCircle;
            return <TriggerIcon size={28} color="white" />;
          })()}
          {/* Notification dot */}
          <div 
            style={{ 
              position: 'absolute',
              top: '2px',
              right: '2px',
              width: '14px',
              height: '14px',
              background: 'white',
              borderRadius: '50%',
              border: `2px solid ${config.primaryColor}`
            }}
          />
        </div>
      )}

      {/* Edge Trigger */}
      {config.triggerStyle === 'edge' && (
        <div 
          style={{ 
            background: config.primaryColor,
            padding: '12px 10px',
            borderRadius: config.position === 'right' ? '8px 0 0 8px' : '0 8px 8px 0',
            boxShadow: `0 4px 20px ${hexToRgba(config.primaryColor, 0.3)}`,
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <span style={{ 
            color: 'white', 
            fontSize: '13px', 
            fontWeight: 600, 
            letterSpacing: '0.5px' 
          }}>
            {config.edgeTriggerText || 'Klikni me'}
          </span>
          {/* Green dot */}
          <div 
            style={{ 
              position: 'absolute',
              top: '8px',
              [config.position === 'right' ? 'left' : 'right']: '-5px',
              width: '12px',
              height: '12px',
              background: '#22c55e',
              borderRadius: '50%',
              border: '2px solid white'
            }}
          />
        </div>
      )}
    </div>
  );
}
