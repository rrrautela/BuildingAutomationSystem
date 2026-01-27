import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Scene } from './Scene';
import { useBASStore } from '../store/basStore';

export const BuildingView = () => {
  const { zones, selectedZoneId, setSelectedZone, viewMode, setViewMode, setShow3D, setActiveTab } = useBASStore();
  const selectedZone = zones.find((z) => z.id === selectedZoneId);

  const viewModes = ['hvac', 'lighting', 'occupancy', 'energy'] as const;

  const legendItems = {
    hvac: [
      { color: '#ef4444', label: 'Too Hot (>1.5°C above)' },
      { color: '#eab308', label: 'Slight Deviation' },
      { color: '#22c55e', label: 'Normal' },
      { color: '#3b82f6', label: 'Too Cold (<1.5°C below)' },
    ],
    lighting: [
      { color: '#fcd34d', label: 'Bright (>70%)', glow: true },
      { color: '#ca8a04', label: 'Medium (40-70%)' },
      { color: '#713f12', label: 'Dim (<40%)' },
    ],
    occupancy: [
      { color: '#22c55e', label: 'Occupied' },
      { color: '#4b5563', label: 'Vacant' },
    ],
    energy: [
      { color: '#06b6d4', label: 'Active Zone' },
      { color: '#374151', label: 'Minimal Load' },
    ],
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="border-b border-gray-800"
    >
      <div className="relative" style={{ height: '55vh' }}>
        <Scene />

        <div className="absolute top-4 left-4 flex gap-2 z-10">
          {viewModes.map((mode) => (
            <motion.button
              key={mode}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === mode
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/25'
                  : 'bg-gray-900/90 text-gray-300 hover:bg-gray-800/90 backdrop-blur-sm'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </motion.button>
          ))}
        </div>

        <div className="absolute bottom-4 left-4 bg-gray-900/95 backdrop-blur-sm border border-gray-800 rounded-lg p-4 z-10">
          <div className="text-sm font-semibold text-white mb-3">Legend - {viewMode.toUpperCase()}</div>
          <div className="space-y-2">
            {legendItems[viewMode].map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{
                    backgroundColor: item.color,
                    boxShadow: 'glow' in item && item.glow ? `0 0 10px ${item.color}` : 'none',
                  }}
                />
                <span className="text-xs text-gray-400">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {selectedZone && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute top-4 right-4 bg-gray-900/95 backdrop-blur-sm border border-gray-800 rounded-xl p-5 w-80 z-10 shadow-2xl"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-white text-lg">{selectedZone.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedZone.occupied ? (
                      <span className="flex items-center gap-1.5 text-xs text-green-400">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        Occupied ({selectedZone.occupantCount})
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-gray-500">
                        <div className="w-2 h-2 bg-gray-500 rounded-full" />
                        Vacant
                      </span>
                    )}
                    {selectedZone.hasFault && (
                      <span className="flex items-center gap-1.5 text-xs text-red-400">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        Fault
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedZone(null)}
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-gray-800/60 rounded-lg">
                  <div className="text-gray-400 text-xs mb-1">Temperature</div>
                  <div className={`font-semibold ${
                    Math.abs(selectedZone.temp - selectedZone.targetTemp) > 1.5
                      ? 'text-red-400'
                      : Math.abs(selectedZone.temp - selectedZone.targetTemp) > 0.5
                      ? 'text-yellow-400'
                      : 'text-green-400'
                  }`}>
                    {selectedZone.temp.toFixed(1)}°C
                  </div>
                </div>
                <div className="p-3 bg-gray-800/60 rounded-lg">
                  <div className="text-gray-400 text-xs mb-1">Target</div>
                  <div className="font-semibold text-white">{selectedZone.targetTemp}°C</div>
                </div>
                <div className="p-3 bg-gray-800/60 rounded-lg">
                  <div className="text-gray-400 text-xs mb-1">Humidity</div>
                  <div className="font-semibold text-white">{selectedZone.humidity.toFixed(0)}%</div>
                </div>
                <div className="p-3 bg-gray-800/60 rounded-lg">
                  <div className="text-gray-400 text-xs mb-1">CO₂</div>
                  <div className={`font-semibold ${selectedZone.co2 > 700 ? 'text-red-400' : 'text-white'}`}>
                    {selectedZone.co2} ppm
                  </div>
                </div>
                <div className="p-3 bg-gray-800/60 rounded-lg">
                  <div className="text-gray-400 text-xs mb-1">Lighting</div>
                  <div className="font-semibold text-yellow-400">{selectedZone.lighting}%</div>
                </div>
                <div className="p-3 bg-gray-800/60 rounded-lg">
                  <div className="text-gray-400 text-xs mb-1">HVAC</div>
                  <div className="font-semibold text-cyan-400 capitalize">{selectedZone.hvacStatus}</div>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveTab('hvac');
                  setShow3D(false);
                }}
                className="w-full mt-4 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-sm font-medium transition-colors text-white"
              >
                View Details & Controls
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute bottom-4 right-4 text-xs text-gray-500 bg-gray-900/80 px-3 py-1.5 rounded backdrop-blur-sm z-10">
          Click a floor to select • Scroll to zoom • Drag to rotate
        </div>
      </div>
    </motion.div>
  );
};
