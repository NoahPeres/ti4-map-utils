import React, { useState } from 'react';
import { useMapStore } from '../state/mapStore';
import { Share2, Import, Trash2, Map } from 'lucide-react';

export const Toolbar: React.FC = () => {
  const { importMapString, setLayout, tiles, layoutId } = useMapStore();
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStr, setImportStr] = useState('');

  const handleImport = () => {
    importMapString(importStr);
    setShowImportModal(false);
    setImportStr('');
  };

  const handleClear = () => {
    if (confirm('Clear entire map?')) {
      importMapString(Array(tiles.length).fill('0').join(','));
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="h-16 bg-slate-900 border-b border-slate-700 flex items-center px-6 justify-between shrink-0">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <Map className="w-5 h-5 text-blue-500" />
          <span className="text-white font-bold text-lg">TI4 Map Draft</span>
        </div>
        
        <div className="flex items-center space-x-2 bg-slate-800 rounded px-2 py-1">
          <span className="text-slate-400 text-sm">Layout:</span>
          <select 
            className="bg-transparent text-white text-sm focus:outline-none"
            value={layoutId}
            onChange={(e) => setLayout(e.target.value, tiles.length)}
          >
            <option value="6p">6 Player Standard</option>
          </select>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <button 
          onClick={() => setShowImportModal(true)}
          className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-sm transition-colors"
        >
          <Import className="w-4 h-4" />
          <span>Import Map</span>
        </button>
        
        <button 
          onClick={handleCopyLink}
          className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span>Share Link</span>
        </button>

        <button 
          onClick={handleClear}
          className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
          title="Clear Map"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-white text-xl font-bold mb-4">Import Map String</h3>
            <p className="text-slate-400 text-sm mb-4">
              Paste a comma or space separated string of tile IDs.
            </p>
            <textarea
              className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white h-32 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 112,39,44,25..."
              value={importStr}
              onChange={(e) => setImportStr(e.target.value)}
            />
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleImport}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold transition-colors"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
