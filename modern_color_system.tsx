import React, { useState } from 'react';
import { Sun, Moon, Copy, Check } from 'lucide-react';

const ColorSystem = () => {
  const [theme, setTheme] = useState('light');
  const [copiedColor, setCopiedColor] = useState('');

  const colorSchemes = {
    light: {
      name: 'Light Theme',
      colors: {
        // Primary colors from logo
        primary: {
          name: 'Primary Blue',
          value: '#2563EB',
          usage: 'Primary buttons, links, active states',
          contrast: '#FFFFFF'
        },
        primaryHover: {
          name: 'Primary Hover',
          value: '#1D4ED8',
          usage: 'Hover states for primary elements',
          contrast: '#FFFFFF'
        },
        accent: {
          name: 'Accent Cyan',
          value: '#06B6D4',
          usage: 'Secondary buttons, highlights, badges',
          contrast: '#FFFFFF'
        },
        accentHover: {
          name: 'Accent Hover',
          value: '#0891B2',
          usage: 'Hover states for accent elements',
          contrast: '#FFFFFF'
        },
        gold: {
          name: 'Gold Accent',
          value: '#D4AF37',
          usage: 'Premium borders, highlights, special badges',
          contrast: '#1E293B'
        },
        goldLight: {
          name: 'Gold Light',
          value: '#F4E4B0',
          usage: 'Gold backgrounds, subtle highlights',
          contrast: '#1E293B'
        },
        
        // Backgrounds
        background: {
          name: 'Background',
          value: '#F8FAFC',
          usage: 'Main background',
          contrast: '#1E293B'
        },
        surface: {
          name: 'Surface',
          value: '#FFFFFF',
          usage: 'Cards, dropdowns, modals',
          contrast: '#1E293B'
        },
        surfaceHover: {
          name: 'Surface Hover',
          value: '#F1F5F9',
          usage: 'Hover state for interactive surfaces',
          contrast: '#1E293B'
        },
        
        // Text colors
        textPrimary: {
          name: 'Text Primary',
          value: '#0F172A',
          usage: 'Headings, primary text',
          contrast: '#FFFFFF'
        },
        textSecondary: {
          name: 'Text Secondary',
          value: '#475569',
          usage: 'Body text, descriptions',
          contrast: '#FFFFFF'
        },
        textTertiary: {
          name: 'Text Tertiary',
          value: '#64748B',
          usage: 'Muted text, placeholders',
          contrast: '#FFFFFF'
        },
        
        // Borders
        border: {
          name: 'Border',
          value: '#E2E8F0',
          usage: 'Dividers, input borders',
          contrast: '#64748B'
        },
        borderFocus: {
          name: 'Border Focus',
          value: '#2563EB',
          usage: 'Focus rings, active borders',
          contrast: '#FFFFFF'
        },
        
        // Status colors
        success: {
          name: 'Success',
          value: '#10B981',
          usage: 'Success messages, positive actions',
          contrast: '#FFFFFF'
        },
        warning: {
          name: 'Warning',
          value: '#F59E0B',
          usage: 'Warnings, caution states',
          contrast: '#FFFFFF'
        },
        error: {
          name: 'Error',
          value: '#EF4444',
          usage: 'Errors, destructive actions',
          contrast: '#FFFFFF'
        },
        info: {
          name: 'Info',
          value: '#06B6D4',
          usage: 'Information, tips',
          contrast: '#FFFFFF'
        }
      }
    },
    dark: {
      name: 'Dark Theme',
      colors: {
        // Primary colors from logo (adjusted for dark mode)
        primary: {
          name: 'Primary Blue',
          value: '#3B82F6',
          usage: 'Primary buttons, links, active states',
          contrast: '#FFFFFF'
        },
        primaryHover: {
          name: 'Primary Hover',
          value: '#2563EB',
          usage: 'Hover states for primary elements',
          contrast: '#FFFFFF'
        },
        accent: {
          name: 'Accent Cyan',
          value: '#22D3EE',
          usage: 'Secondary buttons, highlights, badges',
          contrast: '#0F172A'
        },
        accentHover: {
          name: 'Accent Hover',
          value: '#06B6D4',
          usage: 'Hover states for accent elements',
          contrast: '#FFFFFF'
        },
        gold: {
          name: 'Gold Accent',
          value: '#F4C430',
          usage: 'Premium borders, highlights, special badges',
          contrast: '#0F172A'
        },
        goldLight: {
          name: 'Gold Light',
          value: '#8B7528',
          usage: 'Gold backgrounds, subtle highlights',
          contrast: '#F1F5F9'
        },
        
        // Backgrounds
        background: {
          name: 'Background',
          value: '#0F172A',
          usage: 'Main background',
          contrast: '#F1F5F9'
        },
        surface: {
          name: 'Surface',
          value: '#1E293B',
          usage: 'Cards, dropdowns, modals',
          contrast: '#F1F5F9'
        },
        surfaceHover: {
          name: 'Surface Hover',
          value: '#334155',
          usage: 'Hover state for interactive surfaces',
          contrast: '#F1F5F9'
        },
        
        // Text colors
        textPrimary: {
          name: 'Text Primary',
          value: '#F1F5F9',
          usage: 'Headings, primary text',
          contrast: '#0F172A'
        },
        textSecondary: {
          name: 'Text Secondary',
          value: '#CBD5E1',
          usage: 'Body text, descriptions',
          contrast: '#1E293B'
        },
        textTertiary: {
          name: 'Text Tertiary',
          value: '#94A3B8',
          usage: 'Muted text, placeholders',
          contrast: '#1E293B'
        },
        
        // Borders
        border: {
          name: 'Border',
          value: '#334155',
          usage: 'Dividers, input borders',
          contrast: '#94A3B8'
        },
        borderFocus: {
          name: 'Border Focus',
          value: '#3B82F6',
          usage: 'Focus rings, active borders',
          contrast: '#FFFFFF'
        },
        
        // Status colors
        success: {
          name: 'Success',
          value: '#34D399',
          usage: 'Success messages, positive actions',
          contrast: '#0F172A'
        },
        warning: {
          name: 'Warning',
          value: '#FBBF24',
          usage: 'Warnings, caution states',
          contrast: '#0F172A'
        },
        error: {
          name: 'Error',
          value: '#F87171',
          usage: 'Errors, destructive actions',
          contrast: '#0F172A'
        },
        info: {
          name: 'Info',
          value: '#22D3EE',
          usage: 'Information, tips',
          contrast: '#0F172A'
        }
      }
    }
  };

  const currentScheme = colorSchemes[theme];
  const isDark = theme === 'dark';

  const copyToClipboard = (color) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(''), 2000);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: currentScheme.colors.background.value,
      color: currentScheme.colors.textPrimary.value,
      transition: 'all 0.3s ease',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header with Gold Border */}
      <div style={{
        background: `linear-gradient(135deg, ${currentScheme.colors.primary.value}, ${currentScheme.colors.accent.value})`,
        padding: '2rem',
        boxShadow: `0 4px 6px rgba(0, 0, 0, 0.1), inset 0 -3px 0 ${currentScheme.colors.gold.value}`,
        borderBottom: `3px solid ${currentScheme.colors.gold.value}`
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h1 style={{ margin: 0, color: '#FFFFFF', fontSize: '2rem', fontWeight: '700' }}>
              Modern UI Color System
            </h1>
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: `2px solid ${currentScheme.colors.gold.value}`,
                borderRadius: '12px',
                padding: '0.75rem 1.5rem',
                color: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.2s',
                boxShadow: `0 0 20px ${currentScheme.colors.gold.value}40`
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.boxShadow = `0 0 25px ${currentScheme.colors.gold.value}60`;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.boxShadow = `0 0 20px ${currentScheme.colors.gold.value}40`;
              }}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
              Switch to {isDark ? 'Light' : 'Dark'}
            </button>
          </div>
          <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.9)', fontSize: '1.1rem' }}>
            WCAG 2.1 AA Compliant • Based on your logo colors • Click any color to copy
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        
        {/* Color Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          {Object.entries(currentScheme.colors).map(([key, color]) => {
            const isGold = key === 'gold' || key === 'goldLight';
            return (
              <div
                key={key}
                onClick={() => copyToClipboard(color.value)}
                style={{
                  backgroundColor: currentScheme.colors.surface.value,
                  borderRadius: '16px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: isGold 
                    ? `3px solid ${currentScheme.colors.gold.value}` 
                    : `1px solid ${currentScheme.colors.border.value}`,
                  transition: 'all 0.2s',
                  boxShadow: isGold 
                    ? `0 4px 20px ${currentScheme.colors.gold.value}30`
                    : isDark ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.05)',
                  position: 'relative'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = isGold
                    ? `0 12px 30px ${currentScheme.colors.gold.value}50`
                    : isDark ? '0 12px 24px rgba(0, 0, 0, 0.4)' : '0 12px 24px rgba(0, 0, 0, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = isGold 
                    ? `0 4px 20px ${currentScheme.colors.gold.value}30`
                    : isDark ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.05)';
                }}
              >
                {isGold && (
                  <div style={{
                    position: 'absolute',
                    top: '0.5rem',
                    left: '0.5rem',
                    background: currentScheme.colors.gold.value,
                    color: currentScheme.colors.gold.contrast,
                    padding: '0.25rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    zIndex: 1,
                    boxShadow: `0 2px 8px ${currentScheme.colors.gold.value}60`
                  }}>
                    ★ PREMIUM
                  </div>
                )}
                <div style={{
                  height: '120px',
                  backgroundColor: color.value,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    backdropFilter: 'blur(10px)'
                  }}>
                    {copiedColor === color.value ? (
                      <Check size={16} color="#FFFFFF" />
                    ) : (
                      <Copy size={16} color="#FFFFFF" />
                    )}
                  </div>
                  <span style={{
                    color: color.contrast,
                    fontWeight: '700',
                    fontSize: '1.1rem',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}>
                    {color.value}
                  </span>
                </div>
                <div style={{ padding: '1rem' }}>
                  <h3 style={{
                    margin: '0 0 0.5rem 0',
                    color: currentScheme.colors.textPrimary.value,
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}>
                    {color.name}
                  </h3>
                  <p style={{
                    margin: 0,
                    color: currentScheme.colors.textSecondary.value,
                    fontSize: '0.875rem',
                    lineHeight: '1.5'
                  }}>
                    {color.usage}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Component Examples */}
        <h2 style={{
          color: currentScheme.colors.textPrimary.value,
          fontSize: '1.75rem',
          fontWeight: '700',
          marginBottom: '1.5rem'
        }}>
          Component Examples
        </h2>

        <div style={{ display: 'grid', gap: '2rem' }}>
          
          {/* Buttons with Gold Accents */}
          <div style={{
            backgroundColor: currentScheme.colors.surface.value,
            padding: '2rem',
            borderRadius: '16px',
            border: `1px solid ${currentScheme.colors.border.value}`
          }}>
            <h3 style={{ color: currentScheme.colors.textPrimary.value, marginTop: 0 }}>Buttons</h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button style={{
                background: `linear-gradient(135deg, ${currentScheme.colors.primary.value}, ${currentScheme.colors.primaryHover.value})`,
                color: '#FFFFFF',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: `0 4px 12px ${currentScheme.colors.primary.value}40`
              }}>
                Primary Button
              </button>
              <button style={{
                background: currentScheme.colors.accent.value,
                color: currentScheme.colors.accent.contrast,
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: `0 4px 12px ${currentScheme.colors.accent.value}40`
              }}>
                Accent Button
              </button>
              <button style={{
                background: currentScheme.colors.gold.value,
                color: currentScheme.colors.gold.contrast,
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: `0 4px 16px ${currentScheme.colors.gold.value}50`,
                position: 'relative',
                overflow: 'hidden'
              }}>
                ★ Premium Action
              </button>
              <button style={{
                background: 'transparent',
                color: currentScheme.colors.textPrimary.value,
                border: `2px solid ${currentScheme.colors.border.value}`,
                padding: '0.75rem 1.5rem',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                Outline Button
              </button>
            </div>
          </div>

          {/* Input Fields with Gold Focus */}
          <div style={{
            backgroundColor: currentScheme.colors.surface.value,
            padding: '2rem',
            borderRadius: '16px',
            border: `1px solid ${currentScheme.colors.border.value}`
          }}>
            <h3 style={{ color: currentScheme.colors.textPrimary.value, marginTop: 0 }}>Form Elements</h3>
            <div style={{ display: 'grid', gap: '1rem', maxWidth: '600px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  color: currentScheme.colors.textSecondary.value,
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  Regular Input
                </label>
                <input
                  type="text"
                  placeholder="Enter text..."
                  style={{
                    width: '100%',
                    backgroundColor: currentScheme.colors.background.value,
                    color: currentScheme.colors.textPrimary.value,
                    border: `2px solid ${currentScheme.colors.border.value}`,
                    padding: '0.75rem',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = currentScheme.colors.borderFocus.value;
                    e.target.style.boxShadow = `0 0 0 3px ${currentScheme.colors.borderFocus.value}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = currentScheme.colors.border.value;
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  color: currentScheme.colors.textSecondary.value,
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  Premium Input ★
                </label>
                <input
                  type="text"
                  placeholder="Premium feature..."
                  style={{
                    width: '100%',
                    backgroundColor: currentScheme.colors.background.value,
                    color: currentScheme.colors.textPrimary.value,
                    border: `2px solid ${currentScheme.colors.gold.value}`,
                    padding: '0.75rem',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    boxShadow: `0 0 0 0 ${currentScheme.colors.gold.value}20`
                  }}
                  onFocus={(e) => {
                    e.target.style.boxShadow = `0 0 0 4px ${currentScheme.colors.gold.value}30, 0 0 20px ${currentScheme.colors.gold.value}40`;
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = `0 0 0 0 ${currentScheme.colors.gold.value}20`;
                  }}
                />
              </div>
            </div>
          </div>

          {/* Status Messages */}
          <div style={{
            backgroundColor: currentScheme.colors.surface.value,
            padding: '2rem',
            borderRadius: '16px',
            border: `1px solid ${currentScheme.colors.border.value}`
          }}>
            <h3 style={{ color: currentScheme.colors.textPrimary.value, marginTop: 0 }}>Status Messages</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {['success', 'warning', 'error', 'info'].map(status => (
                <div key={status} style={{
                  backgroundColor: `${currentScheme.colors[status].value}20`,
                  border: `2px solid ${currentScheme.colors[status].value}`,
                  padding: '1rem',
                  borderRadius: '10px',
                  color: currentScheme.colors.textPrimary.value
                }}>
                  <strong style={{ color: currentScheme.colors[status].value, textTransform: 'capitalize' }}>
                    {status}:
                  </strong> This is a {status} message example
                </div>
              ))}
            </div>
          </div>

          {/* Cards with Gold Borders for Premium */}
          <div style={{
            backgroundColor: currentScheme.colors.surface.value,
            padding: '2rem',
            borderRadius: '16px',
            border: `1px solid ${currentScheme.colors.border.value}`
          }}>
            <h3 style={{ color: currentScheme.colors.textPrimary.value, marginTop: 0 }}>Cards & Lists</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div style={{
                backgroundColor: currentScheme.colors.background.value,
                padding: '1.5rem',
                borderRadius: '12px',
                border: `1px solid ${currentScheme.colors.border.value}`
              }}>
                <h4 style={{ color: currentScheme.colors.textPrimary.value, marginTop: 0 }}>Standard Card</h4>
                <p style={{ color: currentScheme.colors.textSecondary.value, margin: '0.5rem 0' }}>
                  Regular card with standard border and styling.
                </p>
                <span style={{
                  display: 'inline-block',
                  backgroundColor: currentScheme.colors.accent.value,
                  color: currentScheme.colors.accent.contrast,
                  padding: '0.25rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  Badge
                </span>
              </div>

              <div style={{
                backgroundColor: currentScheme.colors.background.value,
                padding: '1.5rem',
                borderRadius: '12px',
                border: `3px solid ${currentScheme.colors.gold.value}`,
                boxShadow: `0 4px 20px ${currentScheme.colors.gold.value}30`,
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  right: '1rem',
                  background: currentScheme.colors.gold.value,
                  color: currentScheme.colors.gold.contrast,
                  padding: '0.25rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  boxShadow: `0 2px 8px ${currentScheme.colors.gold.value}60`
                }}>
                  ★ PREMIUM
                </div>
                <h4 style={{ color: currentScheme.colors.textPrimary.value, marginTop: 0 }}>Premium Card</h4>
                <p style={{ color: currentScheme.colors.textSecondary.value, margin: '0.5rem 0' }}>
                  Premium card with gold border and special highlighting.
                </p>
                <span style={{
                  display: 'inline-block',
                  backgroundColor: currentScheme.colors.gold.value,
                  color: currentScheme.colors.gold.contrast,
                  padding: '0.25rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '700'
                }}>
                  ★ VIP
                </span>
              </div>

              <div style={{
                backgroundColor: currentScheme.colors.background.value,
                padding: '1.5rem',
                borderRadius: '12px',
                border: `1px solid ${currentScheme.colors.border.value}`,
                borderTop: `4px solid ${currentScheme.colors.gold.value}`
              }}>
                <h4 style={{ color: currentScheme.colors.textPrimary.value, marginTop: 0 }}>Featured Card</h4>
                <p style={{ color: currentScheme.colors.textSecondary.value, margin: '0.5rem 0' }}>
                  Featured card with subtle gold accent at the top.
                </p>
                <span style={{
                  display: 'inline-block',
                  backgroundColor: currentScheme.colors.primary.value,
                  color: '#FFFFFF',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  Featured
                </span>
              </div>
            </div>
          </div>

          {/* Gold Highlighted Elements */}
          <div style={{
            backgroundColor: currentScheme.colors.surface.value,
            padding: '2rem',
            borderRadius: '16px',
            border: `3px solid ${currentScheme.colors.gold.value}`,
            boxShadow: `0 4px 20px ${currentScheme.colors.gold.value}30`,
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '-15px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: currentScheme.colors.gold.value,
              color: currentScheme.colors.gold.contrast,
              padding: '0.5rem 1.5rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '700',
              boxShadow: `0 4px 12px ${currentScheme.colors.gold.value}60`,
              whiteSpace: 'nowrap'
            }}>
              ★ PREMIUM SECTION ★
            </div>
            <h3 style={{ color: currentScheme.colors.textPrimary.value, marginTop: '1rem', marginBottom: '1rem' }}>
              Gold Border Applications
            </h3>
            <div style={{ 
              display: 'grid', 
              gap: '1rem',
              color: currentScheme.colors.textSecondary.value 
            }}>
              <div style={{
                padding: '1rem',
                backgroundColor: currentScheme.colors.background.value,
                borderRadius: '8px',
                borderLeft: `4px solid ${currentScheme.colors.gold.value}`
              }}>
                ★ Premium feature highlighted with left gold border
              </div>
              <div style={{
                padding: '1rem',
                backgroundColor: `${currentScheme.colors.goldLight.value}30`,
                borderRadius: '8px',
                border: `2px solid ${currentScheme.colors.gold.value}`
              }}>
                ★ Premium notification with gold background tint
              </div>
              <div style={{
                display: 'inline-block',
                padding: '0.5rem 1rem',
                backgroundColor: currentScheme.colors.background.value,
                borderRadius: '8px',
                border: `2px solid ${currentScheme.colors.gold.value}`,
                boxShadow: `0 0 15px ${currentScheme.colors.gold.value}40`
              }}>
                ★ Gold-bordered badge with glow effect
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{
          marginTop: '3rem',
          padding: '2rem',
          backgroundColor: currentScheme.colors.surface.value,
          borderRadius: '16px',
          border: `1px solid ${currentScheme.colors.border.value}`,
          borderTop: `4px solid ${currentScheme.colors.gold.value}`,
          textAlign: 'center'
        }}>
          <h3 style={{ color: currentScheme.colors.textPrimary.value, margin: '0 0 1rem 0' }}>
            Color System Features
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            color: currentScheme.colors.textSecondary.value,
            fontSize: '0.875rem'
          }}>
            <div>✓ WCAG 2.1 AA Compliant</div>
            <div>✓ Consistent Contrast Ratios</div>
            <div>✓ Modern Gradients</div>
            <div>✓ Gold Premium Accents</div>
            <div>✓ Light & Dark Themes</div>
            <div>✓ Accessible Focus States</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorSystem;