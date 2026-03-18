import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useMapStore } from '../state/mapStore';
import { HexTile } from './HexTile';
import layout6p from '../data/layouts/6p.json';
import tilesData from '../data/tiles.json';
import type { Layout, Tile } from '../types';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

export const MapView: React.FC = () => {
  const { tiles, selectedHexIndex, selectHex, setTile } = useMapStore();
  const [zoom, setZoom] = useState(0.8);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const hexSize = 182;
  const activePointersRef = useRef(new Map<number, { x: number; y: number; type: string }>());
  const gestureRef = useRef<null | {
    startZoom: number;
    startOffset: { x: number; y: number };
    startDistance: number;
    startMid: { x: number; y: number };
  }>(null);

  const currentLayout: Layout = layout6p;

  // Calculate bounding box and center map
  const fitToScreen = useCallback(() => {
    if (!currentLayout || !currentLayout.coords || currentLayout.coords.length === 0) return;
    if (viewport.width <= 0 || viewport.height <= 0) return;

    const containerWidth = viewport.width;
    const containerHeight = viewport.height;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    const originX = containerWidth / 2;
    const originY = containerHeight / 2;

    currentLayout.coords.forEach(coord => {
      const x = originX + hexSize * (3/2 * coord.q);
      const y = originY + hexSize * (Math.sqrt(3)/2 * coord.q + Math.sqrt(3) * coord.r);
      minX = Math.min(minX, x - hexSize);
      maxX = Math.max(maxX, x + hexSize);
      minY = Math.min(minY, y - hexSize);
      maxY = Math.max(maxY, y + hexSize);
    });

    const mapWidth = maxX - minX;
    const mapHeight = maxY - minY;
    const padding = 60;

    const scaleX = (containerWidth - padding * 2) / mapWidth;
    const scaleY = (containerHeight - padding * 2) / mapHeight;
    const newZoom = Math.min(scaleX, scaleY, 1.0);

    // Set zoom first
    setZoom(newZoom);
    
    // Center the map. Since transform-origin is 0 0, 
    // we need to offset by the top-left of the bounding box scaled by zoom,
    // plus the centering padding.
    setOffset({
      x: (containerWidth / 2) - (minX + mapWidth / 2) * newZoom,
      y: (containerHeight / 2) - (minY + mapHeight / 2) * newZoom
    });
  }, [currentLayout, viewport.height, viewport.width]);

  useEffect(() => {
    if (!containerRef.current) return;

    const element = containerRef.current;
    const observer = new ResizeObserver(() => {
      setViewport({ width: element.clientWidth, height: element.clientHeight });
    });
    observer.observe(element);
    setViewport({ width: element.clientWidth, height: element.clientHeight });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        fitToScreen();
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [fitToScreen]);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = 1.1;
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      
      // Zoom relative to mouse position
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const localX = mouseX - rect.left;
      const localY = mouseY - rect.top;
      
      const newZoom = e.deltaY > 0 ? zoom / zoomFactor : zoom * zoomFactor;
      const boundedZoom = Math.max(0.1, Math.min(5, newZoom));
      
      const zoomRatio = boundedZoom / zoom;
      
      setOffset(prev => ({
        x: localX - (localX - prev.x) * zoomRatio,
        y: localY - (localY - prev.y) * zoomRatio
      }));
      setZoom(boundedZoom);
    }
  };

  const getPointerLocal = (e: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: e.clientX, y: e.clientY };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const node = containerRef.current;
    if (!node) return;

    const local = getPointerLocal(e);
    activePointersRef.current.set(e.pointerId, { x: local.x, y: local.y, type: e.pointerType });
    if (e.pointerType === 'touch') {
      node.setPointerCapture(e.pointerId);
      if (activePointersRef.current.size === 1) {
        setIsDragging(true);
        setLastPos({ x: local.x, y: local.y });
      }

      if (activePointersRef.current.size === 2) {
        const pts = Array.from(activePointersRef.current.values());
        const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
        const dx = pts[0].x - pts[1].x;
        const dy = pts[0].y - pts[1].y;
        gestureRef.current = {
          startZoom: zoom,
          startOffset: offset,
          startDistance: Math.sqrt(dx * dx + dy * dy),
          startMid: mid,
        };
        setIsDragging(false);
      }
    } else {
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        setIsDragging(true);
        setLastPos({ x: e.clientX, y: e.clientY });
        e.preventDefault();
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const node = containerRef.current;
    if (!node) return;
    const local = getPointerLocal(e);

    if (e.pointerType === 'touch') {
      const prev = activePointersRef.current.get(e.pointerId);
      if (!prev) return;
      activePointersRef.current.set(e.pointerId, { x: local.x, y: local.y, type: e.pointerType });

      if (activePointersRef.current.size === 1 && isDragging) {
        const dx = local.x - lastPos.x;
        const dy = local.y - lastPos.y;
        setOffset((p) => ({ x: p.x + dx, y: p.y + dy }));
        setLastPos({ x: local.x, y: local.y });
      }

      if (activePointersRef.current.size === 2 && gestureRef.current) {
        const pts = Array.from(activePointersRef.current.values());
        const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
        const dx = pts[0].x - pts[1].x;
        const dy = pts[0].y - pts[1].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const start = gestureRef.current;
        const ratio = start.startDistance > 0 ? dist / start.startDistance : 1;
        const nextZoom = Math.max(0.1, Math.min(5, start.startZoom * ratio));
        const zoomRatio = nextZoom / start.startZoom;

        setZoom(nextZoom);
        setOffset({
          x: mid.x - (start.startMid.x - start.startOffset.x) * zoomRatio,
          y: mid.y - (start.startMid.y - start.startOffset.y) * zoomRatio,
        });
      }
      return;
    }

    if (isDragging) {
      const dx = e.clientX - lastPos.x;
      const dy = e.clientY - lastPos.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastPos({ x: e.clientX, y: e.clientY });
    }
  };

  const endPointer = (e: React.PointerEvent) => {
    activePointersRef.current.delete(e.pointerId);
    if (e.pointerType === 'touch') {
      if (activePointersRef.current.size < 2) {
        gestureRef.current = null;
      }
      if (activePointersRef.current.size === 0) {
        setIsDragging(false);
      }
    } else {
      setIsDragging(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      setIsDragging(true);
      setLastPos({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - lastPos.x;
      const dy = e.clientY - lastPos.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div 
      ref={containerRef}
      className="flex-1 bg-slate-950 overflow-hidden select-none relative"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      style={{ touchAction: 'none' }}
    >
      <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2">
        <button 
          onClick={() => {
            const newZoom = zoom * 1.2;
            setZoom(newZoom);
            // Centered zoom simplified for buttons
            if (containerRef.current) {
              const cx = containerRef.current.clientWidth / 2;
              const cy = containerRef.current.clientHeight / 2;
              setOffset(prev => ({
                x: cx - (cx - prev.x) * 1.2,
                y: cy - (cy - prev.y) * 1.2
              }));
            }
          }}
          className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-lg shadow-lg backdrop-blur-sm transition-colors border border-slate-700"
          title="Zoom In (Ctrl + Wheel)"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button 
          onClick={() => {
            const newZoom = zoom / 1.2;
            setZoom(newZoom);
            if (containerRef.current) {
              const cx = containerRef.current.clientWidth / 2;
              const cy = containerRef.current.clientHeight / 2;
              setOffset(prev => ({
                x: cx - (cx - prev.x) / 1.2,
                y: cy - (cy - prev.y) / 1.2
              }));
            }
          }}
          className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-lg shadow-lg backdrop-blur-sm transition-colors border border-slate-700"
          title="Zoom Out (Ctrl + Wheel)"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button 
          onClick={fitToScreen}
          className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-lg shadow-lg backdrop-blur-sm transition-colors border border-slate-700"
          title="Fit to Screen"
        >
          <Maximize className="w-5 h-5" />
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-10 text-[10px] text-slate-500 italic pointer-events-none">
        Drag to pan • Pinch to zoom • Ctrl + Wheel to zoom • Right click to clear a tile
      </div>

      <div 
        className="absolute inset-0"
        style={{ 
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          cursor: isDragging ? 'grabbing' : 'auto'
        }}
      >
        <svg
          viewBox={`0 0 ${Math.max(1, viewport.width)} ${Math.max(1, viewport.height)}`}
          className="w-full h-full overflow-visible"
          style={{ pointerEvents: 'none' }}
        >
          <g style={{ pointerEvents: 'all' }}>
            {currentLayout.coords.map((coord, index) => {
              const tileId = tiles[index];
              const tileInfo = (tilesData as Tile[]).find((t) => t.id === tileId);
              const originX = viewport.width / 2;
              const originY = viewport.height / 2;
              
              return (
                <HexTile
                  key={`${coord.q}-${coord.r}`}
                  index={index}
                  q={coord.q}
                  r={coord.r}
                  size={hexSize}
                  originX={originX}
                  originY={originY}
                  tileId={tileId || null}
                  tileImage={tileInfo?.image}
                  isSelected={selectedHexIndex === index}
                  onSelect={() => selectHex(index)}
                  onClear={() => setTile(index, null)}
                  systemName={tileInfo?.name}
                />
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
};
