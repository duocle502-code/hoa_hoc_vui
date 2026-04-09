import React from 'react';

// Common paths and fills to keep components small
const GlassFill = "rgba(226, 232, 240, 0.4)";
const GlassStroke = "rgba(148, 163, 184, 0.8)";
const LiquidColor = "rgba(56, 189, 248, 0.5)";

interface EquipmentSVGProps {
  id: string;
  width?: number;
  height?: number;
  className?: string;
  fillLevel?: number; // 0 to 1
  liquidColor?: string;
}

export const EquipmentSVG: React.FC<EquipmentSVGProps> = ({ 
  id, width = 60, height = 60, className = '', fillLevel = 0, liquidColor = LiquidColor 
}) => {
  const getSVG = () => {
    switch (id) {
      case 'alcohol-lamp':
        return (
          <svg viewBox="0 0 60 80" className={className} width={width} height={height}>
            {/* Base (Glass Body) */}
            <path d="M15 70 C10 70, 5 65, 5 50 C5 30, 20 20, 25 20 L35 20 C40 20, 55 30, 55 50 C55 65, 50 70, 45 70 Z" fill={GlassFill} stroke={GlassStroke} strokeWidth="2" />
            <path d="M15 70 C10 70, 5 65, 5 50 C5 30, 20 20, 25 20 L35 20 C40 20, 55 30, 55 50 C55 65, 50 70, 45 70 Z" fill="rgba(147, 197, 253, 0.3)" /> {/* Alcohol liquid */}
            {/* Neck and Burner */}
            <rect x="25" y="15" width="10" height="15" fill="#475569" stroke="#334155" strokeWidth="1" />
            <rect x="22" y="10" width="16" height="5" fill="#64748b" stroke="#334155" strokeWidth="1" />
            {/* Wick */}
            <rect x="28" y="5" width="4" height="10" fill="#cbd5e1" stroke="#94a3b8" />
            {/* Flame */}
            <path d="M30 4 C28 4, 25 -2, 30 -10 C35 -2, 32 4, 30 4 Z" fill="rgba(249, 115, 22, 0.8)" />
            <path d="M30 2 C29 2, 27 -1, 30 -6 C33 -1, 31 2, 30 2 Z" fill="rgba(250, 204, 21, 0.9)" />
            <ellipse cx="30" cy="74" rx="25" ry="4" fill="rgba(0,0,0,0.1)" /> {/* Shadow */}
          </svg>
        );

      case 'iron-stand':
        return (
          <svg viewBox="0 0 60 180" className={className} width={width} height={height}>
            <rect x="10" y="170" width="40" height="6" fill="#334155" /> {/* Base base */}
            <path d="M28 170 L32 170 L32 10 L28 10 Z" fill="#475569" /> {/* Rod */}
            {/* Clamp */}
            <rect x="32" y="50" width="20" height="4" fill="#64748b" />
            <path d="M52 45 L58 45 C60 45, 62 48, 62 52 C62 56, 60 59, 58 59 L52 59" fill="none" stroke="#475569" strokeWidth="3" />
            <ellipse cx="30" cy="178" rx="22" ry="2" fill="rgba(0,0,0,0.1)" />
          </svg>
        );

      case 'wire-gauze':
        return (
          <svg viewBox="0 0 80 20" className={className} width={width} height={height}>
            <rect x="5" y="8" width="70" height="4" fill="#94a3b8" />
            <circle cx="40" cy="10" r="10" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" /> {/* Ceramic center */}
            {/* Grid lines */}
            <path d="M5 8 L75 8 M5 10 L75 10 M5 12 L75 12 M20 5 L20 15 M40 5 L40 15 M60 5 L60 15" stroke="#64748b" strokeWidth="0.5" strokeDasharray="1,1" />
          </svg>
        );

      case 'tripod':
        return (
          <svg viewBox="0 0 70 60" className={className} width={width} height={height}>
            <ellipse cx="35" cy="5" rx="30" ry="4" fill="none" stroke="#334155" strokeWidth="3" />
            <path d="M15 7 L5 55 M35 9 L35 55 M55 7 L65 55" stroke="#475569" strokeWidth="2.5" />
            <ellipse cx="35" cy="58" rx="28" ry="2" fill="rgba(0,0,0,0.1)" />
          </svg>
        );

      case 'round-flask':
        return (
          <svg viewBox="0 0 80 100" className={className} width={width} height={height}>
            <path d="M35 5 L35 35 C20 45, 10 60, 10 75 C10 90, 25 98, 40 98 C55 98, 70 90, 70 75 C70 60, 60 45, 45 35 L45 5" fill={GlassFill} stroke={GlassStroke} strokeWidth="2" />
            <rect x="32" y="2" width="16" height="5" fill={GlassFill} stroke={GlassStroke} strokeWidth="2" rx="1" />
            <path d="M40 98 C30 98, 20 95, 15 85 C11 75, 11 65, 15 55" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" /> {/* Highlight */}
            {fillLevel > 0 && (
              <path d={`M10 75 C10 90, 25 98, 40 98 C55 98, 70 90, 70 75 L10 75 Z`} fill={liquidColor} /> // Simplified fill
            )}
          </svg>
        );

      case 'flat-flask':
        return (
          <svg viewBox="0 0 80 100" className={className} width={width} height={height}>
            <path d="M35 5 L35 40 C20 50, 10 65, 10 85 C10 95, 20 98, 40 98 C60 98, 70 95, 70 85 C70 65, 60 50, 45 40 L45 5" fill={GlassFill} stroke={GlassStroke} strokeWidth="2" />
            <rect x="32" y="2" width="16" height="5" fill={GlassFill} stroke={GlassStroke} strokeWidth="2" rx="1" />
            <path d="M20 98 L60 98" stroke={GlassStroke} strokeWidth="2" /> {/* Flat bottom line */}
          </svg>
        );

      case 'erlenmeyer':
        return (
          <svg viewBox="0 0 80 100" className={className} width={width} height={height}>
            <path d="M35 5 L35 25 L10 90 C8 95, 12 98, 20 98 L60 98 C68 98, 72 95, 70 90 L45 25 L45 5" fill={GlassFill} stroke={GlassStroke} strokeWidth="2" strokeLinejoin="round" />
            <rect x="32" y="2" width="16" height="5" fill={GlassFill} stroke={GlassStroke} strokeWidth="2" rx="1" />
            {/* Volume Marks */}
            <path d="M18 70 L23 70 M25 50 L30 50 M32 35 L35 35" stroke={GlassStroke} strokeWidth="1" />
          </svg>
        );

      case 'beaker':
        return (
          <svg viewBox="0 0 70 90" className={className} width={width} height={height}>
            <path d="M15 5 L15 80 C15 85, 20 88, 35 88 C50 88, 55 85, 55 80 L55 5 M15 5 L10 5" fill={GlassFill} stroke={GlassStroke} strokeWidth="2" />
            <ellipse cx="35" cy="5" rx="20" ry="2" fill="none" stroke={GlassStroke} strokeWidth="2" /> {/* Top rim */}
            {/* Spout */}
            <path d="M10 5 C5 5, 10 15, 15 15" stroke={GlassStroke} strokeWidth="2" fill="none" />
            {/* Level marks */}
            <path d="M20 70 L25 70 M20 50 L30 50 M20 30 L25 30" stroke={GlassStroke} strokeWidth="1" />
          </svg>
        );

      case 'test-tube':
        return (
          <svg viewBox="0 0 25 120" className={className} width={width} height={height}>
            <path d="M5 2 L5 110 C5 116, 20 116, 20 110 L20 2" fill={GlassFill} stroke={GlassStroke} strokeWidth="2" />
            <ellipse cx="12.5" cy="2" rx="8" ry="1.5" fill="none" stroke={GlassStroke} strokeWidth="2" />
          </svg>
        );

      case 'test-tube-stopper':
        return (
          <svg viewBox="0 0 25 130" className={className} width={width} height={height}>
            <path d="M5 12 L5 120 C5 126, 20 126, 20 120 L20 12" fill={GlassFill} stroke={GlassStroke} strokeWidth="2" />
            <ellipse cx="12.5" cy="12" rx="8" ry="1.5" fill="none" stroke={GlassStroke} strokeWidth="2" />
            <path d="M6 1 L19 1 L17 14 L8 14 Z" fill="#94a3b8" stroke="#64748b" strokeWidth="1" /> {/* Stopper */}
          </svg>
        );

      case 'delivery-tube-l':
        return (
          <svg viewBox="0 0 80 80" className={className} width={width} height={height}>
            <path d="M10 5 L10 40 C10 45, 15 50, 20 50 L75 50" fill="none" stroke={GlassFill} strokeWidth="6" />
            <path d="M10 5 L10 40 C10 45, 15 50, 20 50 L75 50" fill="none" stroke={GlassStroke} strokeWidth="2" />
            <rect x="7" y="2" width="6" height="15" fill="#f87171" stroke="#dc2626" rx="1" /> {/* Rubber connector */}
          </svg>
        );

      case 'delivery-tube-z':
        return (
          <svg viewBox="0 0 100 60" className={className} width={width} height={height}>
            <path d="M10 10 L40 10 C45 10, 48 12, 50 15 L70 45 C72 48, 75 50, 80 50 L95 50" fill="none" stroke={GlassFill} strokeWidth="6" />
            <path d="M10 10 L40 10 C45 10, 48 12, 50 15 L70 45 C72 48, 75 50, 80 50 L95 50" fill="none" stroke={GlassStroke} strokeWidth="2" />
            <rect x="5" y="7" width="15" height="6" fill="#f87171" stroke="#dc2626" rx="1" /> {/* Rubber connector */}
          </svg>
        );

      case 'condenser':
        return (
          <svg viewBox="0 0 40 140" className={className} width={width} height={height}>
            {/* Outer jacket */}
            <path d="M10 20 L10 120 C10 125, 30 125, 30 120 L30 20 C30 15, 10 15, 10 20 Z" fill="rgba(226, 232, 240, 0.2)" stroke={GlassStroke} strokeWidth="1" />
            {/* Water In/Out */}
            <rect x="5" y="30" width="5" height="10" fill={GlassFill} stroke={GlassStroke} />
            <rect x="30" y="100" width="5" height="10" fill={GlassFill} stroke={GlassStroke} />
            {/* Inner coiled tube */}
            <path d="M20 5 L20 20 C13 25, 27 35, 20 40 C13 45, 27 55, 20 60 C13 65, 27 75, 20 80 C13 85, 27 95, 20 100 C13 105, 27 115, 20 120 L20 135" fill="none" stroke={GlassStroke} strokeWidth="3" />
          </svg>
        );

      case 'funnel':
        return (
          <svg viewBox="0 0 60 80" className={className} width={width} height={height}>
            <path d="M5 5 L55 5 L35 40 L35 75 L25 75 L25 40 Z" fill={GlassFill} stroke={GlassStroke} strokeWidth="2" strokeLinejoin="round" />
            <ellipse cx="30" cy="5" rx="26" ry="3" fill="none" stroke={GlassStroke} strokeWidth="1.5" />
          </svg>
        );

      case 'separatory-funnel':
        return (
          <svg viewBox="0 0 50 120" className={className} width={width} height={height}>
            {/* Neck */}
            <rect x="20" y="5" width="10" height="15" fill={GlassFill} stroke={GlassStroke} strokeWidth="2" />
            <rect x="18" y="3" width="14" height="4" fill="#94a3b8" /> {/* Stopper */}
            {/* Body */}
            <path d="M20 20 C5 25, 5 60, 25 75 C45 60, 45 25, 30 20Z" fill={GlassFill} stroke={GlassStroke} strokeWidth="2" />
            {/* Stem */}
            <rect x="23" y="75" width="4" height="40" fill={GlassFill} stroke={GlassStroke} strokeWidth="2" />
            {/* Stopcock */}
            <rect x="15" y="85" width="20" height="6" fill="#cbd5e1" stroke="#64748b" rx="2" />
          </svg>
        );

      case 'trough':
        return (
          <svg viewBox="0 0 140 80" className={className} width={width} height={height}>
            <path d="M10 20 L20 70 C22 76, 30 78, 70 78 C110 78, 118 76, 120 70 L130 20" fill={GlassFill} stroke={GlassStroke} strokeWidth="2.5" strokeLinejoin="round" />
            <ellipse cx="70" cy="20" rx="60" ry="6" fill="none" stroke={GlassStroke} strokeWidth="2" />
            {/* Water level */}
            <path d="M18 45 L122 45 C118 65, 115 75, 70 75 C25 75, 22 65, 18 45 Z" fill="rgba(56, 189, 248, 0.4)" />
          </svg>
        );

      case 'cotton':
        return (
          <svg viewBox="0 0 30 30" className={className} width={width} height={height}>
            <path d="M15 5 C22 3, 28 8, 26 15 C29 20, 25 28, 18 26 C12 28, 5 25, 6 18 C3 12, 8 5, 15 5 Z" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />
            <path d="M12 10 Q15 15, 18 12 M10 20 Q15 17, 20 22" stroke="#e2e8f0" fill="none" />
          </svg>
        );

      case 'mortar':
        return (
          <svg viewBox="0 0 70 50" className={className} width={width} height={height}>
            {/* Pestle (Chày) */}
            <path d="M45 5 L35 30 C33 35, 38 38, 42 35 L52 10 Z" fill="#cbd5e1" stroke="#64748b" strokeWidth="1.5" />
            {/* Mortar (Cối) */}
            <path d="M10 20 C10 45, 20 48, 35 48 C50 48, 60 45, 60 20 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" strokeLinejoin="round" />
            <ellipse cx="35" cy="20" rx="25" ry="5" fill="none" stroke="#94a3b8" />
            <rect x="25" y="48" width="20" height="2" fill="#94a3b8" /> {/* Base */}
          </svg>
        );

      case 'dropper':
        return (
          <svg viewBox="0 0 20 80" className={className} width={width} height={height}>
            {/* Rubber bulb */}
            <path d="M5 20 C2 10, 5 3, 10 3 C15 3, 18 10, 15 20 L5 20 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
            {/* Glass Tube */}
            <path d="M7 20 L7 65 C7 75, 10 78, 10 78 C10 78, 13 75, 13 65 L13 20 Z" fill={GlassFill} stroke={GlassStroke} strokeWidth="1.5" />
            <circle cx="10" cy="85" r="3" fill="rgba(56, 189, 248, 0.6)" /> {/* Drop */}
          </svg>
        );

      case 'thermometer':
        return (
          <svg viewBox="0 0 15 120" className={className} width={width} height={height}>
            {/* Outer Tube */}
            <path d="M4 105 C2 110, 2 118, 7.5 118 C13 118, 13 110, 11 105 L11 5 C11 2, 4 2, 4 5 L4 105 Z" fill={GlassFill} stroke={GlassStroke} strokeWidth="1.5" />
            {/* Red liquid inside */}
            <path d="M6 50 L6 106 C4 108, 4 114, 7.5 114 C11 114, 11 108, 9 106 L9 50 Z" fill="#ef4444" />
            {/* Markings */}
            <path d="M11 20 L13 20 M11 40 L15 40 M11 60 L13 60 M11 80 L15 80" stroke={GlassStroke} strokeWidth="1" />
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 50 50" className={className} width={width} height={height}>
            <rect x="10" y="10" width="30" height="30" fill="#cbd5e1" stroke="#64748b" />
            <text x="25" y="30" textAnchor="middle" fontSize="10">?</text>
          </svg>
        );
    }
  };

  return getSVG();
};
