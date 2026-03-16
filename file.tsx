import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Thermometer, Droplets, Wind, Sun, Moon, Zap, AlertTriangle, 
  CheckCircle, TrendingUp, TrendingDown, Calendar, Clock, 
  Activity, Leaf, Lightbulb, Users, Bell, X, Settings,
  ChevronRight, AlertCircle, Info, Waves, Battery, Cube, Layers
} from 'lucide-react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const useStore = () => {
  const [zones, setZones] = useState([
    { id: 1, name: 'Floor 1 - Lobby', floor: 1, temp: 23, humidity: 45, targetTemp: 23, mode: 'auto', occupied: true, co2: 420, lighting: 80, hvacStatus: 'cooling' },
    { id: 2, name: 'Floor 2 - Office A', floor: 2, temp: 24, humidity: 48, targetTemp: 24, mode: 'auto', occupied: true, co2: 580, lighting: 90, hvacStatus: 'cooling' },
    { id: 3, name: 'Floor 3 - Office B', floor: 3, temp: 22, humidity: 42, targetTemp: 22, mode: 'manual', occupied: false, co2: 380, lighting: 20, hvacStatus: 'idle' },
    { id: 4, name: 'Floor 4 - Conference', floor: 4, temp: 25, humidity: 50, targetTemp: 23, mode: 'auto', occupied: true, co2: 720, lighting: 100, hvacStatus: 'cooling' },
    { id: 5, name: 'Floor 5 - Lab', floor: 5, temp: 21, humidity: 40, targetTemp: 21, mode: 'manual', occupied: true, co2: 450, lighting: 95, hvacStatus: 'cooling' },
  ]);

  const [alerts, setAlerts] = useState([
    { id: 1, type: 'critical', title: 'High CO₂ in Floor 4', message: 'CO₂ levels at 720 ppm', time: '2 min ago', dismissed: false },
    { id: 2, type: 'warning', title: 'HVAC Inefficiency', message: 'Floor 3 temperature deviation detected', time: '15 min ago', dismissed: false },
    { id: 3, type: 'info', title: 'Peak Load Approaching', message: 'Expected at 2:00 PM', time: '1 hour ago', dismissed: false },
  ]);

  const [energyData, setEnergyData] = useState({
    current: 245,
    baseline: 280,
    hvac: 120,
    lighting: 65,
    plugLoads: 45,
    other: 15,
    solar: 38,
    grid: 207,
  });

  const [waterData, setWaterData] = useState({
    fresh: 1250,
    recycled: 320,
    leak: false,
    coolingTower: 'normal',
    stp: 'operational',
  });

  const [schedule, setSchedule] = useState({
    mode: 'scheduled',
    overrideUntil: null,
  });

  const [selectedZone, setSelectedZone] = useState(null);
  const [viewMode, setViewMode] = useState('hvac'); // hvac, lighting, occupancy, energy

  return {
    zones,
    setZones,
    alerts,
    setAlerts,
    energyData,
    setEnergyData,
    waterData,
    setWaterData,
    schedule,
    setSchedule,
    selectedZone,
    setSelectedZone,
    viewMode,
    setViewMode,
  };
};

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

const generateTimeSeriesData = (hours = 24) => {
  const data = [];
  const now = new Date();
  for (let i = hours - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hour = time.getHours();
    const baseLoad = hour >= 9 && hour <= 18 ? 250 : 150;
    const variance = Math.random() * 40 - 20;
    data.push({
      time: `${hour}:00`,
      consumption: Math.max(100, baseLoad + variance),
      solar: hour >= 6 && hour <= 18 ? 20 + Math.random() * 30 : 0,
      prediction: baseLoad + variance + (Math.random() * 20 - 10),
    });
  }
  return data;
};

const generateScheduleData = () => {
  return [
    { time: '00:00', mode: 'night', load: 120 },
    { time: '06:00', mode: 'pre-cool', load: 180 },
    { time: '09:00', mode: 'occupied', load: 250 },
    { time: '18:00', mode: 'post-hours', load: 200 },
    { time: '22:00', mode: 'night', load: 130 },
  ];
};

// ============================================================================
// 3D BUILDING COMPONENTS
// ============================================================================

const FloorZone = ({ zone, isSelected, viewMode, onSelect }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      // Pulse animation for occupied zones
      if (zone.occupied && viewMode === 'occupancy') {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.02;
        meshRef.current.scale.set(scale, 1, scale);
      } else {
        meshRef.current.scale.set(1, 1, 1);
      }
    }
  });

  const getZoneColor = () => {
    if (viewMode === 'hvac') {
      const tempDiff = zone.temp - zone.targetTemp;
      if (tempDiff > 1) return new THREE.Color('#ef4444'); // hot - red
      if (tempDiff < -1) return new THREE.Color('#3b82f6'); // cold - blue
      return new THREE.Color('#10b981'); // normal - green
    }
    if (viewMode === 'lighting') {
      const intensity = zone.lighting / 100;
      return new THREE.Color().setHSL(0.15, 0.8, 0.3 + intensity * 0.4);
    }
    if (viewMode === 'occupancy') {
      return zone.occupied ? new THREE.Color('#22c55e') : new THREE.Color('#4b5563');
    }
    if (viewMode === 'energy') {
      return new THREE.Color('#06b6d4');
    }
    return new THREE.Color('#6b7280');
  };

  const getEmissiveIntensity = () => {
    if (viewMode === 'lighting') {
      return (zone.lighting / 100) * 0.5;
    }
    if (zone.occupied && viewMode === 'occupancy') {
      return 0.3;
    }
    return isSelected ? 0.4 : 0;
  };

  const floorHeight = 3;
  const yPosition = (zone.floor - 1) * floorHeight;

  return (
    <group position={[0, yPosition, 0]}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(zone);
        }}
      >
        <boxGeometry args={[8, 2.5, 8]} />
        <meshStandardMaterial
          color={getZoneColor()}
          emissive={getZoneColor()}
          emissiveIntensity={getEmissiveIntensity()}
          transparent
          opacity={isSelected ? 1 : hovered ? 0.9 : 0.7}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>

      {/* Floor outline */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(8, 2.5, 8)]} />
        <lineBasicMaterial
          color={isSelected ? '#06b6d4' : hovered ? '#ffffff' : '#374151'}
          linewidth={isSelected ? 3 : 1}
        />
      </lineSegments>

      {/* Hover/Selected tooltip */}
      {(hovered || isSelected) && (
        <Html position={[0, 1.5, 0]} center distanceFactor={10}>
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl whitespace-nowrap pointer-events-none">
            <div className="text-white font-semibold text-sm mb-1">{zone.name}</div>
            <div className="text-xs text-gray-400 space-y-0.5">
              {viewMode === 'hvac' && (
                <>
                  <div>Temp: {zone.temp.toFixed(1)}°C → {zone.targetTemp}°C</div>
                  <div>Status: {zone.hvacStatus}</div>
                </>
              )}
              {viewMode === 'lighting' && (
                <div>Lighting: {zone.lighting}%</div>
              )}
              {viewMode === 'occupancy' && (
                <>
                  <div>{zone.occupied ? 'Occupied' : 'Vacant'}</div>
                  <div>CO₂: {zone.co2} ppm</div>
                </>
              )}
              {viewMode === 'energy' && (
                <div>Active Systems: {zone.occupied ? 'Full' : 'Minimal'}</div>
              )}
            </div>
          </div>
        </Html>
      )}

      {/* Fault indicator */}
      {zone.co2 > 700 && (
        <mesh position={[4.5, 1.5, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshBasicMaterial color="#ef4444" />
          <pointLight color="#ef4444" intensity={2} distance={5} />
        </mesh>
      )}
    </group>
  );
};

const SolarPanels = ({ solarOutput }) => {
  const panelsRef = useRef();
  
  useFrame((state) => {
    if (panelsRef.current) {
      const intensity = solarOutput / 50;
      panelsRef.current.children.forEach((panel, i) => {
        panel.material.emissiveIntensity = intensity * (0.3 + Math.sin(state.clock.elapsedTime + i) * 0.1);
      });
    }
  });

  const panelPositions = [
    [-3, 0, -3], [-1, 0, -3], [1, 0, -3], [3, 0, -3],
    [-3, 0, -1], [-1, 0, -1], [1, 0, -1], [3, 0, -1],
    [-3, 0, 1], [-1, 0, 1], [1, 0, 1], [3, 0, 1],
  ];

  return (
    <group ref={panelsRef} position={[0, 15.5, 0]}>
      {panelPositions.map((pos, i) => (
        <mesh key={i} position={pos} rotation={[-Math.PI / 6, 0, 0]}>
          <boxGeometry args={[1.5, 0.05, 1.5]} />
          <meshStandardMaterial
            color="#1e3a8a"
            emissive="#3b82f6"
            emissiveIntensity={0}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
};

const Building3D = ({ zones, selectedZone, viewMode, onZoneSelect, solarOutput }) => {
  return (
    <>
      {/* Building base/ground */}
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[20, 0.5, 20]} />
        <meshStandardMaterial color="#1f2937" roughness={0.8} />
      </mesh>

      {/* Core structure */}
      <mesh position={[0, 7.5, 0]} castShadow>
        <boxGeometry args={[9, 15.5, 9]} />
        <meshStandardMaterial
          color="#374151"
          transparent
          opacity={0.15}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Zone floors */}
      {zones.map((zone) => (
        <FloorZone
          key={zone.id}
          zone={zone}
          isSelected={selectedZone?.id === zone.id}
          viewMode={viewMode}
          onSelect={onZoneSelect}
        />
      ))}

      {/* Solar panels */}
      <SolarPanels solarOutput={solarOutput} />

      {/* Ground grid */}
      <gridHelper args={[30, 30, '#374151', '#1f2937']} position={[0, -0.24, 0]} />
    </>
  );
};

const Scene = ({ zones, selectedZone, viewMode, onZoneSelect, solarOutput }) => {
  return (
    <>
      <PerspectiveCamera makeDefault position={[20, 15, 20]} fov={50} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={15}
        maxDistance={50}
        maxPolarAngle={Math.PI / 2.1}
      />
      
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <hemisphereLight intensity={0.3} groundColor="#1f2937" />
      
      <Building3D
        zones={zones}
        selectedZone={selectedZone}
        viewMode={viewMode}
        onZoneSelect={onZoneSelect}
        solarOutput={solarOutput}
      />
      
      <Environment preset="night" />
    </>
  );
};

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

const BASDigitalTwin = () => {
  const store = useStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [show3D, setShow3D] = useState(true);
  const [timeSeriesData] = useState(generateTimeSeriesData());
  const [scheduleData] = useState(generateScheduleData());

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      store.setZones(prev => prev.map(zone => ({
        ...zone,
        temp: zone.temp + (Math.random() - 0.5) * 0.3,
        humidity: Math.max(30, Math.min(60, zone.humidity + (Math.random() - 0.5) * 2)),
        co2: zone.occupied ? Math.max(400, Math.min(800, zone.co2 + (Math.random() - 0.5) * 30)) : Math.max(350, zone.co2 - 5),
      })));

      store.setEnergyData(prev => ({
        ...prev,
        current: Math.max(150, Math.min(300, prev.current + (Math.random() - 0.5) * 15)),
        solar: Math.max(0, Math.min(50, prev.solar + (Math.random() - 0.5) * 5)),
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const dismissAlert = (id) => {
    store.setAlerts(prev => prev.map(alert => alert.id === id ? { ...alert, dismissed: true } : alert));
  };

  const updateZoneTemp = (id, temp) => {
    store.setZones(prev => prev.map(zone => zone.id === id ? { ...zone, targetTemp: temp } : zone));
  };

  const updateZoneMode = (id, mode) => {
    store.setZones(prev => prev.map(zone => zone.id === id ? { ...zone, mode } : zone));
  };

  const updateZoneLighting = (id, level) => {
    store.setZones(prev => prev.map(zone => zone.id === id ? { ...zone, lighting: level } : zone));
  };

  const epiValue = ((store.energyData.current / store.energyData.baseline) * 100).toFixed(1);
  const epiTrend = store.energyData.current < store.energyData.baseline ? 'down' : 'up';

  const activeAlerts = store.alerts.filter(a => !a.dismissed);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Building Automation System</h1>
              <p className="text-sm text-gray-400">Intelligent Energy Management</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShow3D(!show3D)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                show3D
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {show3D ? <Layers className="w-4 h-4" /> : <Cube className="w-4 h-4" />}
              {show3D ? '3D View' : '2D View'}
            </button>
            <div className="relative">
              <Bell className="w-5 h-5 text-gray-400" />
              {activeAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">
                  {activeAlerts.length}
                </span>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">{new Date().toLocaleTimeString()}</div>
              <div className="text-xs text-gray-400">{new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </header>

      {/* 3D Building View */}
      <AnimatePresence>
        {show3D && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-gray-800"
          >
            <div className="relative bg-gray-950" style={{ height: '60vh' }}>
              <Canvas shadows>
                <Suspense fallback={null}>
                  <Scene
                    zones={store.zones}
                    selectedZone={store.selectedZone}
                    viewMode={store.viewMode}
                    onZoneSelect={store.setSelectedZone}
                    solarOutput={store.energyData.solar}
                  />
                </Suspense>
              </Canvas>

              {/* View mode selector */}
              <div className="absolute top-4 left-4 flex gap-2">
                {['hvac', 'lighting', 'occupancy', 'energy'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => store.setViewMode(mode)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      store.viewMode === mode
                        ? 'bg-cyan-600 text-white'
                        : 'bg-gray-900/80 text-gray-300 hover:bg-gray-800/80 backdrop-blur-sm'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>

              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-gray-900/90 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
                <div className="text-sm font-semibold mb-2">Legend</div>
                <div className="space-y-2 text-xs">
                  {store.viewMode === 'hvac' && (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500 rounded" />
                        <span>Too Hot</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded" />
                        <span>Normal</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded" />
                        <span>Too Cold</span>
                      </div>
                    </>
                  )}
                  {store.viewMode === 'lighting' && (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-yellow-400 rounded" style={{ boxShadow: '0 0 10px #fbbf24' }} />
                        <span>Bright</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-yellow-600 rounded" />
                        <span>Dim</span>
                      </div>
                    </>
                  )}
                  {store.viewMode === 'occupancy' && (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded" />
                        <span>Occupied</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-600 rounded" />
                        <span>Vacant</span>
                      </div>
                    </>
                  )}
                  {store.viewMode === 'energy' && (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-cyan-500 rounded" />
                      <span>Active Zone</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Selected zone info */}
              {store.selectedZone && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="absolute top-4 right-4 bg-gray-900/90 backdrop-blur-sm border border-gray-800 rounded-lg p-4 w-72"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{store.selectedZone.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {store.selectedZone.occupied ? (
                          <span className="flex items-center gap-1 text-xs text-green-400">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            Occupied
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <div className="w-2 h-2 bg-gray-500 rounded-full" />
                            Vacant
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => store.setSelectedZone(null)}
                      className="text-gray-400 hover:text-gray-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-gray-400 text-xs mb-1">Temperature</div>
                      <div className="font-semibold">{store.selectedZone.temp.toFixed(1)}°C</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs mb-1">Target</div>
                      <div className="font-semibold">{store.selectedZone.targetTemp}°C</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs mb-1">Humidity</div>
                      <div className="font-semibold">{store.selectedZone.humidity.toFixed(0)}%</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs mb-1">CO₂</div>
                      <div className="font-semibold">{store.selectedZone.co2} ppm</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs mb-1">Lighting</div>
                      <div className="font-semibold">{store.selectedZone.lighting}%</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs mb-1">HVAC</div>
                      <div className="font-semibold capitalize">{store.selectedZone.hvacStatus}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('hvac');
                      setShow3D(false);
                    }}
                    className="w-full mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    View Details
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Tabs */}
      <nav className="border-b border-gray-800 bg-gray-900/30">
        <div className="px-6 flex gap-6 overflow-x-auto">
          {['overview', 'hvac', 'lighting', 'energy', 'ieq', 'water'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </nav>

      <main className="p-6">
        {/* Alerts Panel */}
        {activeAlerts.length > 0 && (
          <div className="mb-6">
            <AnimatePresence>
              {activeAlerts.map(alert => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  className={`mb-3 p-4 rounded-lg border flex items-start gap-3 ${
                    alert.type === 'critical'
                      ? 'bg-red-950/20 border-red-800/30'
                      : alert.type === 'warning'
                      ? 'bg-yellow-950/20 border-yellow-800/30'
                      : 'bg-blue-950/20 border-blue-800/30'
                  }`}
                >
                  {alert.type === 'critical' ? (
                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  ) : alert.type === 'warning' ? (
                    <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{alert.title}</div>
                    <div className="text-sm text-gray-400 mt-1">{alert.message}</div>
                    <div className="text-xs text-gray-500 mt-1">{alert.time}</div>
                  </div>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="text