import React, { useMemo } from 'react';
import { useMapStore } from '../state/mapStore';
import tilesData from '../data/tiles.json';
import type { Tile } from '../types';
import { useDraggable } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';

const DraggableTile: React.FC<{ tile: Tile; onClick: () => void; isSelectable: boolean }> = ({ tile, onClick, isSelectable }) => {
  const { listeners, setNodeRef, transform } = useDraggable({
    id: `picker-${tile.id}`,
    data: { tileId: tile.id }
  });

  const [imageFailed, setImageFailed] = React.useState(false);

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center space-x-4 p-2 rounded cursor-pointer transition-colors ${
        isSelectable ? 'hover:bg-slate-800' : 'opacity-50'
      }`}
      onClick={onClick}
    >
      <button
        type="button"
        className="text-slate-500 hover:text-slate-300 transition-colors"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="w-16 h-16 flex-shrink-0 bg-slate-800 rounded overflow-hidden">
        {imageFailed ? (
          <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">Missing</div>
        ) : (
          <img
            src={`${import.meta.env.BASE_URL}tiles/${tile.image}`}
            alt={tile.name}
            className="w-full h-full object-contain pointer-events-none"
            draggable={false}
            onError={() => setImageFailed(true)}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white font-bold text-base truncate">#{tile.id}</div>
        <div className="text-slate-300 text-base truncate">{tile.name}</div>
      </div>
    </div>
  );
};

export const TilePicker: React.FC = () => {
  const { searchTerm, setSearchTerm, setTile, selectedHexIndex } = useMapStore();

  const filteredTiles = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return tilesData.filter(tile => 
      tile.id.toLowerCase().includes(term) || 
      tile.name.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const handleTileClick = (tileId: string) => {
    if (selectedHexIndex !== null) {
      setTile(selectedHexIndex, tileId);
    }
  };

  return (
    <div className="w-[300px] h-full bg-slate-900 border-l border-slate-700 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-white text-lg font-bold mb-4">Tiles</h2>
        <input
          type="text"
          placeholder="Search by ID or name..."
          className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredTiles.map((tile: Tile) => (
          <DraggableTile
            key={tile.id}
            tile={tile}
            onClick={() => handleTileClick(tile.id)}
            isSelectable={selectedHexIndex !== null}
          />
        ))}
        {filteredTiles.length === 0 && (
          <div className="text-slate-500 text-center py-8 italic">
            No tiles found matching "{searchTerm}"
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-slate-700 text-xs text-slate-500 text-center">
        {selectedHexIndex !== null 
          ? `Selected hex: #${selectedHexIndex}` 
          : 'Select a hex on the map to place a tile'}
      </div>
    </div>
  );
};
