export function parseMapString(mapString: string): string[] {
  // Replace spaces with commas and split
  return mapString
    .trim()
    .replace(/\s+/g, ',')
    .split(',')
    .map(s => s.trim())
    .filter(id => id.length > 0)
    .map(id => {
      if (id === '18') return '112';
      if (id === '96') return '96A';
      return id;
    });
}

export function stringifyMap(tiles: (string | null)[]): string {
  return tiles.map(t => t || '0').join(',');
}

export function parseUrlHash(): { layoutId: string | null; tiles: string[] | null } {
  const hash = window.location.hash.substring(1);
  if (!hash) return { layoutId: null, tiles: null };

  const params = new URLSearchParams(hash);
  const layoutId = params.get('layout');
  const mapStr = params.get('map');

  return {
    layoutId,
    tiles: mapStr ? parseMapString(mapStr) : null
  };
}

export function updateUrlHash(layoutId: string, tiles: (string | null)[]) {
  const mapStr = stringifyMap(tiles);
  const newHash = `#layout=${layoutId}&map=${mapStr}`;
  window.history.replaceState(null, '', newHash);
}
