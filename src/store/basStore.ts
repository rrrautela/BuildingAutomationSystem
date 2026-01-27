import { create } from 'zustand';
import { BASState, Zone, Alert, Fault, TimeSeriesPoint, EnergyData, WaterData, WeatherData, Schedule, OptimizationSuggestion } from '../types';

const generateInitialZones = (): Zone[] => [
  { id: 'z1', name: 'Floor 1 - Lobby', floor: 1, temp: 23.2, humidity: 45, targetTemp: 23, mode: 'auto', occupied: true, occupantCount: 12, co2: 420, pm25: 15, voc: 120, lighting: 80, daylightContribution: 45, hvacStatus: 'cooling', fanSpeed: 60, ventilationRate: 85, hasFault: false },
  { id: 'z2', name: 'Floor 2 - Office A', floor: 2, temp: 24.1, humidity: 48, targetTemp: 24, mode: 'auto', occupied: true, occupantCount: 28, co2: 580, pm25: 22, voc: 180, lighting: 90, daylightContribution: 35, hvacStatus: 'cooling', fanSpeed: 70, ventilationRate: 90, hasFault: false },
  { id: 'z3', name: 'Floor 3 - Office B', floor: 3, temp: 22.5, humidity: 42, targetTemp: 22, mode: 'manual', occupied: false, occupantCount: 0, co2: 380, pm25: 8, voc: 80, lighting: 20, daylightContribution: 60, hvacStatus: 'idle', fanSpeed: 20, ventilationRate: 30, hasFault: false },
  { id: 'z4', name: 'Floor 4 - Conference', floor: 4, temp: 25.3, humidity: 50, targetTemp: 23, mode: 'auto', occupied: true, occupantCount: 15, co2: 720, pm25: 28, voc: 220, lighting: 100, daylightContribution: 20, hvacStatus: 'cooling', fanSpeed: 85, ventilationRate: 95, hasFault: true, faultMessage: 'High CO₂ levels detected' },
  { id: 'z5', name: 'Floor 5 - Lab', floor: 5, temp: 21.2, humidity: 40, targetTemp: 21, mode: 'manual', occupied: true, occupantCount: 8, co2: 450, pm25: 12, voc: 150, lighting: 95, daylightContribution: 25, hvacStatus: 'cooling', fanSpeed: 75, ventilationRate: 100, hasFault: false },
];

const generateInitialAlerts = (): Alert[] => [
  { id: 'a1', type: 'critical', title: 'High CO₂ in Conference Room', message: 'CO₂ levels at 720 ppm - exceeds threshold of 700 ppm', time: '2 min ago', timestamp: Date.now() - 120000, dismissed: false, zoneId: 'z4', category: 'ieq' },
  { id: 'a2', type: 'warning', title: 'HVAC Inefficiency Detected', message: 'Floor 4 temperature 2.3°C above setpoint', time: '15 min ago', timestamp: Date.now() - 900000, dismissed: false, zoneId: 'z4', category: 'hvac' },
  { id: 'a3', type: 'info', title: 'Peak Load Period Approaching', message: 'Expected peak demand at 2:00 PM - consider load shedding', time: '1 hour ago', timestamp: Date.now() - 3600000, dismissed: false, category: 'energy' },
];

const generateInitialFaults = (): Fault[] => [
  { id: 'f1', severity: 'high', type: 'Sensor Drift', description: 'Temperature sensor reading inconsistent with ambient conditions', location: 'Floor 4 - Conference', detectedAt: '2 hours ago', estimatedSavings: 120, acknowledged: false, resolved: false },
  { id: 'f2', severity: 'medium', type: 'Stuck Damper', description: 'VAV damper not responding to control signals', location: 'Floor 2 - Office A', detectedAt: '4 hours ago', estimatedSavings: 85, acknowledged: true, resolved: false },
  { id: 'f3', severity: 'low', type: 'Filter Maintenance', description: 'AHU filter differential pressure elevated', location: 'Main AHU', detectedAt: '1 day ago', estimatedSavings: 45, acknowledged: true, resolved: false },
];

const generateTimeSeriesData = (): TimeSeriesPoint[] => {
  const data: TimeSeriesPoint[] = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hour = time.getHours();
    const isWorkHours = hour >= 9 && hour <= 18;
    const baseLoad = isWorkHours ? 250 : 150;
    const variance = Math.random() * 40 - 20;
    const solarOutput = (hour >= 6 && hour <= 18) ? 20 + Math.random() * 30 * Math.sin((hour - 6) * Math.PI / 12) : 0;
    
    data.push({
      time: `${hour.toString().padStart(2, '0')}:00`,
      hour,
      consumption: Math.max(100, baseLoad + variance),
      solar: Math.max(0, solarOutput),
      prediction: baseLoad + variance + (Math.random() * 20 - 10),
      hvac: (baseLoad + variance) * 0.45,
      lighting: (baseLoad + variance) * 0.25,
      plugLoads: (baseLoad + variance) * 0.2,
    });
  }
  return data;
};

const generateSchedules = (): Schedule[] => [
  { id: 's1', name: 'Weekday Normal', startTime: '09:00', endTime: '18:00', days: [1, 2, 3, 4, 5], mode: 'auto', targetTemp: 23, active: true },
  { id: 's2', name: 'Night Setback', startTime: '22:00', endTime: '06:00', days: [0, 1, 2, 3, 4, 5, 6], mode: 'night-setback', targetTemp: 28, active: true },
  { id: 's3', name: 'Pre-Cool Morning', startTime: '06:00', endTime: '09:00', days: [1, 2, 3, 4, 5], mode: 'auto', targetTemp: 22, active: true },
];

const generateOptimizations = (): OptimizationSuggestion[] => [
  { id: 'o1', title: 'Increase Night Setback Temperature', description: 'Raising night setback from 28°C to 30°C during unoccupied hours', estimatedSavings: 180, category: 'hvac', priority: 'medium', implemented: false },
  { id: 'o2', title: 'Enable Daylight Harvesting', description: 'Reduce artificial lighting in zones with >50% daylight contribution', estimatedSavings: 95, category: 'lighting', priority: 'high', implemented: false },
  { id: 'o3', title: 'Shift HVAC Pre-cool Start', description: 'Start pre-cooling 30 minutes later based on thermal mass analysis', estimatedSavings: 65, category: 'scheduling', priority: 'low', implemented: false },
];

const initialEnergyData: EnergyData = {
  current: 245,
  baseline: 280,
  hvac: 120,
  lighting: 65,
  plugLoads: 45,
  other: 15,
  solar: 38,
  grid: 207,
  peakDemand: 310,
  epi: 87.5,
  selfConsumption: 82,
};

const initialWaterData: WaterData = {
  fresh: 1250,
  recycled: 320,
  leakDetected: false,
  coolingTowerStatus: 'normal',
  stpStatus: 'operational',
  dailyUsage: 4500,
  efficiency: 78,
};

const initialWeatherData: WeatherData = {
  temp: 32,
  humidity: 65,
  condition: 'sunny',
  forecast: [
    { hour: 12, temp: 32, load: 260 },
    { hour: 13, temp: 34, load: 280 },
    { hour: 14, temp: 35, load: 295 },
    { hour: 15, temp: 34, load: 285 },
    { hour: 16, temp: 33, load: 270 },
    { hour: 17, temp: 31, load: 250 },
  ],
};

export const useBASStore = create<BASState>((set, get) => ({
  zones: generateInitialZones(),
  alerts: generateInitialAlerts(),
  faults: generateInitialFaults(),
  energyData: initialEnergyData,
  waterData: initialWaterData,
  weatherData: initialWeatherData,
  schedules: generateSchedules(),
  optimizations: generateOptimizations(),
  timeSeriesData: generateTimeSeriesData(),
  selectedZoneId: null,
  viewMode: 'hvac',
  show3D: true,
  activeTab: 'overview',
  isPeakHours: false,
  currentTime: new Date(),

  setSelectedZone: (zoneId) => set({ selectedZoneId: zoneId }),
  
  setViewMode: (mode) => set({ viewMode: mode }),
  
  setShow3D: (show) => set({ show3D: show }),
  
  setActiveTab: (tab) => set({ activeTab: tab }),

  updateZone: (zoneId, updates) => set((state) => ({
    zones: state.zones.map((zone) =>
      zone.id === zoneId ? { ...zone, ...updates } : zone
    ),
  })),

  dismissAlert: (alertId) => set((state) => ({
    alerts: state.alerts.map((alert) =>
      alert.id === alertId ? { ...alert, dismissed: true } : alert
    ),
  })),

  acknowledgeFault: (faultId) => set((state) => ({
    faults: state.faults.map((fault) =>
      fault.id === faultId ? { ...fault, acknowledged: true } : fault
    ),
  })),

  resolveFault: (faultId) => set((state) => ({
    faults: state.faults.map((fault) =>
      fault.id === faultId ? { ...fault, resolved: true } : fault
    ),
  })),

  addAlert: (alert) => set((state) => ({
    alerts: [
      {
        ...alert,
        id: `a${Date.now()}`,
        timestamp: Date.now(),
      },
      ...state.alerts,
    ],
  })),

  toggleSchedule: (scheduleId) => set((state) => ({
    schedules: state.schedules.map((schedule) =>
      schedule.id === scheduleId ? { ...schedule, active: !schedule.active } : schedule
    ),
  })),

  implementOptimization: (optimizationId) => set((state) => ({
    optimizations: state.optimizations.map((opt) =>
      opt.id === optimizationId ? { ...opt, implemented: true } : opt
    ),
  })),

  tick: () => {
    const state = get();
    const currentHour = new Date().getHours();
    const isPeak = currentHour >= 13 && currentHour <= 16;

    set({
      currentTime: new Date(),
      isPeakHours: isPeak,
      zones: state.zones.map((zone) => {
        const tempDrift = (Math.random() - 0.5) * 0.3;
        const humidityDrift = (Math.random() - 0.5) * 2;
        const co2Change = zone.occupied 
          ? (Math.random() - 0.3) * 30 
          : -5;
        
        const newTemp = zone.temp + tempDrift;
        const tempDiff = Math.abs(newTemp - zone.targetTemp);
        let newHVACStatus = zone.hvacStatus;
        
        if (zone.mode === 'auto') {
          if (newTemp > zone.targetTemp + 0.5) newHVACStatus = 'cooling';
          else if (newTemp < zone.targetTemp - 0.5) newHVACStatus = 'heating';
          else if (tempDiff < 0.3) newHVACStatus = 'idle';
        }

        return {
          ...zone,
          temp: Math.max(18, Math.min(30, newTemp)),
          humidity: Math.max(30, Math.min(70, zone.humidity + humidityDrift)),
          co2: Math.max(350, Math.min(900, zone.co2 + co2Change)),
          pm25: Math.max(5, Math.min(50, zone.pm25 + (Math.random() - 0.5) * 5)),
          voc: Math.max(50, Math.min(300, zone.voc + (Math.random() - 0.5) * 20)),
          hvacStatus: newHVACStatus,
          hasFault: zone.co2 > 700 || tempDiff > 2,
          faultMessage: zone.co2 > 700 ? 'High CO₂ levels detected' : tempDiff > 2 ? 'Temperature deviation' : undefined,
        };
      }),
      energyData: {
        ...state.energyData,
        current: Math.max(150, Math.min(350, state.energyData.current + (Math.random() - 0.5) * 15)),
        solar: currentHour >= 6 && currentHour <= 18 
          ? Math.max(0, Math.min(60, state.energyData.solar + (Math.random() - 0.5) * 5))
          : 0,
        hvac: Math.max(80, Math.min(180, state.energyData.hvac + (Math.random() - 0.5) * 10)),
        lighting: Math.max(40, Math.min(100, state.energyData.lighting + (Math.random() - 0.5) * 5)),
      },
      waterData: {
        ...state.waterData,
        fresh: Math.max(1000, Math.min(1500, state.waterData.fresh + (Math.random() - 0.5) * 50)),
        recycled: Math.max(250, Math.min(400, state.waterData.recycled + (Math.random() - 0.5) * 20)),
      },
    });
  },
}));
