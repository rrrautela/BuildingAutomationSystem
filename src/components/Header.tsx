import { useBASStore } from '../store/basStore';
import { Activity, Layers, Box, Sun, Cloud, CloudRain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Header = () => {
  const { show3D, setShow3D, weatherData, currentTime } = useBASStore();

  const WeatherIcon = {
    sunny: Sun,
    cloudy: Cloud,
    rainy: CloudRain,
    overcast: Cloud,
  }[weatherData.condition];

  return (
    <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <motion.div
            className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Activity className="w-6 h-6 text-white" />
          </motion.div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-white truncate">Building Automation System</h1>
            <p className="hidden sm:block text-sm text-gray-400">Intelligent Energy & Comfort Management</p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6">
          <div className="hidden sm:flex items-center gap-3 px-3 sm:px-4 py-2 bg-gray-800/50 rounded-lg">
            <WeatherIcon className="w-5 h-5 text-yellow-400" />
            <div className="text-sm">
              <span className="text-white font-medium">{weatherData.temp}{'\u00B0C'}</span>
              <span className="text-gray-400 ml-2">{weatherData.humidity}% RH</span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShow3D(!show3D)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
              show3D ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={show3D ? '3d' : '2d'}
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                {show3D ? <Layers className="w-4 h-4" /> : <Box className="w-4 h-4" />}
              </motion.div>
            </AnimatePresence>
            {show3D ? '3D View' : '2D View'}
          </motion.button>

          <div className="text-right pl-3 sm:pl-4 border-l border-gray-800 flex-shrink-0">
            <div className="text-sm font-medium text-white tabular-nums">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-xs text-gray-400">
              {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
