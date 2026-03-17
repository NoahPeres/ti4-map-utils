import { create } from 'zustand';
import { updateUrlHash, parseUrlHash, parseMapString } from '../utils/mapStringParser';
import tilesData from '../data/tiles.json';

interface MapStore {
  layoutId: string;
  tiles: (string | null)[];
  selectedHexIndex: number | null;
  searchTerm: string;
  setLayout: (layoutId: string, numCoords: number) => void;
  setTile: (index: number, tileId: string | null) => void;
  selectHex: (index: number | null) => void;
  setSearchTerm: (term: string) => void;
  importMapString: (mapString: string) => void;
  initializeFromUrl: () => void;
  cycleTile: (direction: number) => void;
  getFilteredTiles: () => string[];
}

export const useMapStore = create<MapStore>((set, get) => ({
  layoutId: '6p',
  tiles: Array(37).fill(null), // Default for 6p
  selectedHexIndex: null,
  searchTerm: '',

  getFilteredTiles: () => {
    const term = get().searchTerm.toLowerCase();
    return tilesData
      .filter(tile => 
        tile.id.toLowerCase().includes(term) || 
        tile.name.toLowerCase().includes(term)
      )
      .map(t => t.id);
  },

  setLayout: (layoutId, numCoords) => {
    set({ layoutId, tiles: Array(numCoords).fill(null), selectedHexIndex: null });
    updateUrlHash(layoutId, get().tiles);
  },

  setTile: (index, tileId) => {
    const newTiles = [...get().tiles];
    newTiles[index] = tileId;
    set({ tiles: newTiles });
    updateUrlHash(get().layoutId, newTiles);
  },

  selectHex: (index) => set({ selectedHexIndex: index }),

  setSearchTerm: (term) => set({ searchTerm: term }),

  importMapString: (mapString) => {
    const tileIds = parseMapString(mapString);
    const newTiles = [...get().tiles];
    tileIds.forEach((id, i) => {
      if (i < newTiles.length) {
        newTiles[i] = id === '0' ? null : id;
      }
    });
    set({ tiles: newTiles });
    updateUrlHash(get().layoutId, newTiles);
  },

  initializeFromUrl: () => {
    const { layoutId, tiles } = parseUrlHash();
    if (layoutId) {
      set({ layoutId });
    }
    if (tiles) {
      const newTiles = tiles.map(id => (id === '0' ? null : id));
      set({ tiles: newTiles });
    }
  },

  cycleTile: (direction) => {
    const filteredTileIds = get().getFilteredTiles();
    const { selectedHexIndex, tiles, layoutId } = get();
    if (selectedHexIndex === null || filteredTileIds.length === 0) return;

    const currentTileId = tiles[selectedHexIndex];
    const currentIndex = filteredTileIds.indexOf(currentTileId || '');
    
    let nextIndex;
    if (currentIndex === -1) {
      nextIndex = 0;
    } else {
      nextIndex = (currentIndex + direction + filteredTileIds.length) % filteredTileIds.length;
    }

    const nextTileId = filteredTileIds[nextIndex];
    const newTiles = [...tiles];
    newTiles[selectedHexIndex] = nextTileId;
    
    set({ tiles: newTiles });
    updateUrlHash(layoutId, newTiles);
  }
}));
