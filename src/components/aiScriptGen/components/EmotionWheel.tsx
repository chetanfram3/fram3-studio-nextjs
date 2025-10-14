// src/components/aiScriptGen/components/EmotionWheel.tsx
'use client';

import { useState, useRef, useCallback, useMemo, JSX } from 'react';
import { Box, useTheme, alpha } from '@mui/material';
import { demographicData } from '../data/demographicData';
import { getCurrentBrand } from '@/config/brandConfig';

interface EmotionWheelProps {
  selectedEmotion: string;
  onSelectEmotion: (emotion: string) => void;
}

interface HoverCoords {
  x: number;
  y: number;
}

const EmotionWheel = ({
  selectedEmotion,
  onSelectEmotion,
}: EmotionWheelProps): JSX.Element => {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const svgRef = useRef<SVGSVGElement>(null);

  // State
  const [hoveredEmotion, setHoveredEmotion] = useState<string | null>(null);
  const [hoverCoords, setHoverCoords] = useState<HoverCoords | null>(null);

  // Memoize emotion segments
  const emotionSegments = useMemo(
    () => demographicData.emotionSegments,
    []
  );

  // Handlers
  const handleEmotionHover = useCallback(
    (emotion: string, event: React.MouseEvent<SVGGElement, MouseEvent>): void => {
      setHoveredEmotion(emotion);
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setHoverCoords({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      }
    },
    []
  );

  const handleEmotionLeave = useCallback((): void => {
    setHoveredEmotion(null);
    setHoverCoords(null);
  }, []);

  const handleEmotionClick = useCallback(
    (emotion: string): void => {
      onSelectEmotion(emotion);
    },
    [onSelectEmotion]
  );

  const isEmotionHighlighted = useCallback(
    (emotion: string): boolean => {
      return hoveredEmotion ? hoveredEmotion === emotion : selectedEmotion === emotion;
    },
    [hoveredEmotion, selectedEmotion]
  );

  return (
    <Box
      sx={{
        mt: 1,
        width: 320,
        height: 320,
        position: 'relative',
        filter: 'drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.15))',
      }}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        style={{ display: 'block' }}
      >
        <defs>
          {emotionSegments.map((segment) => (
            <radialGradient
              key={segment.gradientId}
              id={segment.gradientId}
              cx="50%"
              cy="50%"
              r="50%"
              fx="50%"
              fy="50%"
            >
              <stop offset="0%" stopColor={segment.color1} stopOpacity="0.8" />
              <stop offset="100%" stopColor={segment.color1} stopOpacity="1" />
            </radialGradient>
          ))}
        </defs>

        {emotionSegments.map((segment) => {
          const startAngle = (segment.startAngle * Math.PI) / 180;
          const endAngle = (segment.endAngle * Math.PI) / 180;

          const x1 = 50 + 45 * Math.cos(startAngle);
          const y1 = 50 + 45 * Math.sin(startAngle);
          const x2 = 50 + 45 * Math.cos(endAngle);
          const y2 = 50 + 45 * Math.sin(endAngle);

          const largeArcFlag =
            segment.endAngle - segment.startAngle <= 180 ? '0' : '1';

          const textAngle =
            ((segment.startAngle + segment.endAngle) / 2) * (Math.PI / 180);
          const textRadius = 32;
          const textX = 50 + textRadius * Math.cos(textAngle);
          const textY = 50 + textRadius * Math.sin(textAngle);
          const textRotation = (segment.startAngle + segment.endAngle) / 2;
          const adjustedRotation =
            textRotation > 90 && textRotation < 270
              ? textRotation + 180
              : textRotation;

          const isHighlighted = isEmotionHighlighted(segment.emotion);
          const isSelected = selectedEmotion === segment.emotion;

          return (
            <g
              key={segment.emotion}
              onClick={() => handleEmotionClick(segment.emotion)}
              onMouseEnter={(e) => handleEmotionHover(segment.emotion, e)}
              onMouseMove={(e) => handleEmotionHover(segment.emotion, e)}
              onMouseLeave={handleEmotionLeave}
              style={{ cursor: 'pointer' }}
              data-emotion={segment.emotion}
            >
              <path
                d={`M 50 50 L ${x1} ${y1} A 45 45 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                fill={`url(#${segment.gradientId})`}
                stroke={isSelected ? '#FFFFFF' : '#121212'}
                strokeWidth={isSelected ? '1.5' : '0.5'}
                style={{
                  opacity: isHighlighted ? 1 : 0.75,
                  transition: 'all 0.3s ease',
                  transform: isHighlighted ? 'scale(1.02)' : 'scale(1)',
                  transformOrigin: 'center',
                  filter: isHighlighted ? 'brightness(1.1)' : 'none',
                }}
              />
              <text
                x={textX}
                y={textY}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="3"
                fill="#000"
                fontWeight={isHighlighted ? 'bold' : 'normal'}
                fontFamily={brand.fonts.body}
                transform={`rotate(${adjustedRotation}, ${textX}, ${textY})`}
                style={{
                  pointerEvents: 'none',
                  opacity: isHighlighted ? 1 : 0.9,
                }}
              >
                {segment.label}
              </text>
            </g>
          );
        })}

        {selectedEmotion && (
          <circle cx="50" cy="50" r="10" fill="white" opacity="0.1" />
        )}
      </svg>

      {/* Dynamic floating label */}
      {hoveredEmotion && hoverCoords && (
        <Box
          sx={{
            position: 'absolute',
            left: hoverCoords.x,
            top: hoverCoords.y,
            transform: 'translate(-50%, -120%)',
            px: 1.5,
            py: 0.5,
            bgcolor: alpha(theme.palette.primary.main, 0.9),
            border: `1px solid ${alpha(theme.palette.primary.dark, 0.5)}`,
            color: 'primary.contrastText',
            borderRadius: '16px',
            fontSize: '0.75rem',
            fontWeight: 500,
            fontFamily: brand.fonts.body,
            pointerEvents: 'none',
            transition: 'all 0.1s ease',
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}
        >
          {hoveredEmotion}
        </Box>
      )}
    </Box>
  );
};

EmotionWheel.displayName = 'EmotionWheel';

export default EmotionWheel;