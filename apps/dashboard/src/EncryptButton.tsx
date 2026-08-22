/**
 * EncryptButton — Toggle button with matrix cipher text animation
 * 
 * When toggled, the label text scrambles through random characters
 * (like encryption/decryption) before settling on the new label.
 * Includes a pulsing border glow and animated state indicator.
 */
import { useState, useEffect, useRef, useCallback } from 'react';

interface EncryptButtonProps {
  /** Whether the button is in the "active/on" state */
  active: boolean;
  /** Label when inactive */
  inactiveLabel?: string;
  /** Label when active */
  activeLabel?: string;
  /** Color when active */
  activeColor?: string;
  /** Color when inactive */
  inactiveColor?: string;
  /** Called on toggle */
  onToggle: () => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Optional icon */
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*<>{}[]|/\\';

export default function EncryptButton({
  active,
  inactiveLabel = 'START',
  activeLabel = 'STOP',
  activeColor = '#C50022',
  inactiveColor = '#5cb85c',
  onToggle,
  disabled = false,
  icon,
  style,
}: EncryptButtonProps) {
  const [displayText, setDisplayText] = useState(active ? activeLabel : inactiveLabel);
  const [isAnimating, setIsAnimating] = useState(false);
  const animFrameRef = useRef<number>(0);
  const targetLabel = active ? activeLabel : inactiveLabel;
  const color = active ? activeColor : inactiveColor;

  // Cipher animation on state change
  useEffect(() => {
    if (displayText === targetLabel && !isAnimating) return;
    
    setIsAnimating(true);
    const target = targetLabel;
    const maxLen = Math.max(displayText.length, target.length);
    let frame = 0;
    const totalFrames = 12; // number of scramble frames before settling
    let settled = false;

    const animate = () => {
      frame++;
      
      if (frame >= totalFrames) {
        // Settle on final text
        setDisplayText(target);
        setIsAnimating(false);
        return;
      }

      // Build scrambled text - each character either random or settling to target
      let result = '';
      for (let i = 0; i < target.length; i++) {
        const settleThreshold = (i / target.length) * totalFrames;
        if (frame > settleThreshold) {
          result += target[i];
        } else {
          result += CHARS[Math.floor(Math.random() * CHARS.length)];
        }
      }
      
      setDisplayText(result);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    // Reset display to scrambled version of current text first
    setDisplayText(prev => {
      let scrambled = '';
      for (let i = 0; i < target.length; i++) {
        scrambled += CHARS[Math.floor(Math.random() * CHARS.length)];
      }
      return scrambled;
    });

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [targetLabel]);

  const glowPulse = active ? `0 0 12px ${color}40, 0 0 24px ${color}20` : 'none';

  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      style={{
        position: 'relative',
        width: '100%',
        padding: '12px 20px',
        borderRadius: 10,
        border: `1.5px solid ${color}${active ? '80' : '40'}`,
        background: active ? `${color}15` : 'rgba(0,0,0,0.3)',
        color,
        fontSize: 14,
        fontWeight: 700,
        fontFamily: "'Space Grotesk', monospace",
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: glowPulse,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        overflow: 'hidden',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.boxShadow = `0 0 16px ${color}50, 0 0 32px ${color}25`;
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = glowPulse;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Background scan line */}
      {isAnimating && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(90deg, transparent 0%, ${color}10 50%, transparent 100%)`,
          animation: 'shimmer 0.3s linear',
          pointerEvents: 'none',
        }} />
      )}
      
      {/* Status dot */}
      <div style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        background: color,
        boxShadow: active ? `0 0 8px ${color}` : 'none',
        animation: active ? 'pulse 2s ease-in-out infinite' : 'none',
        flexShrink: 0,
      }} />
      
      {/* Cipher text */}
      <span style={{
        fontFamily: isAnimating ? "'Courier New', monospace" : "'Space Grotesk', sans-serif",
        transition: 'font-family 0.1s',
        textShadow: active ? `0 0 8px ${color}60` : 'none',
      }}>
        {displayText}
      </span>

      {icon && <span style={{ flexShrink: 0 }}>{icon}</span>}
    </button>
  );
}
