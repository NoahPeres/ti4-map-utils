export interface HexCoord {
  q: number;
  r: number;
}

export interface Layout {
  id: string;
  name: string;
  coords: HexCoord[];
}

export interface Tile {
  id: string;
  name: string;
  image: string;
  type?: string;
  faction?: string;
}

export interface MapState {
  layoutId: string;
  tiles: (string | null)[];
  selectedHexIndex: number | null;
  searchTerm: string;
}
