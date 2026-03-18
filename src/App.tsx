import { useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import { MapView } from './components/MapView';
import { TilePicker } from './components/TilePicker';
import { useMapStore } from './state/mapStore';
import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';

function App() {
  const { initializeFromUrl, setTile, selectedHexIndex } = useMapStore();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    })
  );

  useEffect(() => {
    initializeFromUrl();
  }, [initializeFromUrl]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedHexIndex !== null) {
          setTile(selectedHexIndex, null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedHexIndex, setTile]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active } = event;
    
    if (over && active.data.current) {
      const hexIndex = over.data.current?.index;
      const tileId = active.data.current?.tileId;
      
      if (hexIndex !== undefined && tileId !== undefined) {
        setTile(hexIndex, tileId);
      }
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-screen bg-slate-950 overflow-hidden">
        <Toolbar />
        <div className="flex-1 flex overflow-hidden">
          <MapView />
          <TilePicker />
        </div>
      </div>
    </DndContext>
  );
}

export default App;
