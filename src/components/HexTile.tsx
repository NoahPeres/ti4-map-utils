import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';

interface HexTileProps {
  index: number;
  q: number;
  r: number;
  size: number;
  originX: number;
  originY: number;
  tileId: string | null;
  tileImage?: string;
  isSelected: boolean;
  onSelect: () => void;
  systemName?: string;
}

export const HexTile: React.FC<HexTileProps> = ({ index, q, r, size, originX, originY, tileId, tileImage, isSelected, onSelect, systemName }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `hex-${index}`,
    data: { index }
  });

  const [imageFailed, setImageFailed] = useState(false);

  // Flat-topped hex coordinates
  const x = originX + size * (3/2 * q);
  const y = originY + size * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);

  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle_deg = 60 * i;
    const angle_rad = (Math.PI / 180) * angle_deg;
    points.push(`${x + size * Math.cos(angle_rad)},${y + size * Math.sin(angle_rad)}`);
  }

  return (
    <g 
      ref={setNodeRef as any}
      className={`cursor-pointer transition-all duration-200 ${isSelected || isOver ? 'filter drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : ''}`}
      onClick={onSelect}
    >
      <polygon
        points={points.join(' ')}
        className={`fill-slate-900 stroke-slate-700 stroke-2 ${isSelected || isOver ? 'stroke-blue-500' : 'hover:stroke-slate-400'}`}
      />
      {tileId && !imageFailed && (
        <image
          href={tileImage ? `${import.meta.env.BASE_URL}tiles/${tileImage}` : `${import.meta.env.BASE_URL}tiles/ST_${tileId}.webp`}
          x={x - size}
          y={y - size * Math.sqrt(3)/2}
          width={size * 2}
          height={size * Math.sqrt(3)}
          clipPath={`url(#hex-clip-${q}-${r})`}
          preserveAspectRatio="xMidYMid slice"
          onError={() => setImageFailed(true)}
        />
      )}
      <defs>
        <clipPath id={`hex-clip-${q}-${r}`}>
          <polygon points={points.join(' ')} />
        </clipPath>
      </defs>
      {/* Tooltip or Overlay */}
      {(isSelected || isOver) && (
        <g transform={`translate(${x}, ${y})`}>
          <text 
            textAnchor="middle" 
            dy="-1.2em" 
            className="fill-white text-[10px] font-bold pointer-events-none drop-shadow-md"
          >
            {tileId || 'Empty'}
          </text>
          {systemName && (
            <text 
              textAnchor="middle" 
              dy="1.5em" 
              className="fill-slate-300 text-[8px] pointer-events-none drop-shadow-md"
            >
              {systemName}
            </text>
          )}
        </g>
      )}
    </g>
  );
};
