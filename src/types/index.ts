export type HVACMode = 'auto' | 'manual' | 'night-setback';
export type HVACStatus = 'cooling' | 'heating' | 'idle' | 'ventilating';
export type AlertType = 'critical' | 'warning' | 'info';
export type ViewMode = 'hvac' | 'lighting' | 'occupancy' | 'energy';
export type ScheduleMode = 'scheduled' | 'override' | 'holiday';

export interface Zone {
  id: string;
  name: string;
  floor: number;
  temp: number;
  humidity: number;
  targetTemp: number;
  mode: HVACMode;
  occupied: boolean;
  occupantCount: number;
  co2: number;
  pm25: number;
  voc: number;
  lighting: number;
  daylightContribution: number;
  hvacStatus: HVACStatus;
  fanSpeed: number;
  ventilationRate: number;
  hasFault: boolean;
  faultMessage?: string;
}

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  time: string;
  timestamp: number;
  dismissed: boolean;
  zoneId?: string;
  category: 'hvac' | 'ieq' | 'energy' | 'water' | 'system' | 'fault';
}

export interface EnergyData {
  current: number;
  baseline: number;
  hvac: number;
  lighting: number;
  plugLoads: number;
  other: number;
  solar: number;
  grid: number;
  peakDemand: number;
  epi: number;
  selfConsumption: number;
}

export interface WaterData {
  fresh: number;
  recycled: number;
  leakDetected: boolean;
  leakLocation?: string;
  coolingTowerStatus: 'normal' | 'warning' | 'maintenance';
  stpStatus: 'operational' | 'maintenance' | 'offline';
  dailyUsage: number;
  efficiency: number;
}

export interface WeatherData {
  temp: number;
  humidity: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'overcast';
  forecast: { hour: number; temp: number; load: number }[];
}

export interface Schedule {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  days: number[];
  mode: HVACMode;
  targetTemp: number;
  active: boolean;
}

export interface TimeSeriesPoint {
  time: string;
  hour: number;
  consumption: number;
  solar: number;
  prediction: number;
  hvac: number;
  lighting: number;
  plugLoads: number;
}

export interface Fault {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  description: string;
  location: string;
  detectedAt: string;
  estimatedSavings?: number;
  acknowledged: boolean;
  resolved: boolean;
}

export interface OptimizationSuggestion {
  id: string;
  title: string;
  description: string;
  estimatedSavings: number;
  category: 'hvac' | 'lighting' | 'scheduling';
  priority: 'low' | 'medium' | 'high';
  implemented: boolean;
}

export interface BASState {
  zones: Zone[];
  alerts: Alert[];
  faults: Fault[];
  energyData: EnergyData;
  waterData: WaterData;
  weatherData: WeatherData;
  schedules: Schedule[];
  optimizations: OptimizationSuggestion[];
  timeSeriesData: TimeSeriesPoint[];
  selectedZoneId: string | null;
  viewMode: ViewMode;
  show3D: boolean;
  activeTab: string;
  isPeakHours: boolean;
  currentTime: Date;
  
  // Actions
  setSelectedZone: (zoneId: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setShow3D: (show: boolean) => void;
  setActiveTab: (tab: string) => void;
  updateZone: (zoneId: string, updates: Partial<Zone>) => void;
  dismissAlert: (alertId: string) => void;
  acknowledgeFault: (faultId: string) => void;
  resolveFault: (faultId: string) => void;
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp'>) => void;
  toggleSchedule: (scheduleId: string) => void;
  implementOptimization: (optimizationId: string) => void;
  tick: () => void;
}
