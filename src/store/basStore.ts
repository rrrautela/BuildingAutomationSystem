import { create } from 'zustand';
import {
  BASState,
  Zone,
  Alert,
  Fault,
  TimeSeriesPoint,
  EnergyData,
  WaterData,
  WeatherData,
  Schedule,
  LightingSchedule,
  OptimizationSuggestion,
} from '../types';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const roundToStep = (value: number, step: number) => Math.round(value / step) * step;

const getTimeValue = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const isTimeWithinRange = (currentMinutes: number, startTime: string, endTime: string) => {
  const startMinutes = getTimeValue(startTime);
  const endMinutes = getTimeValue(endTime);

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
};

const getDaylightFactor = (hour: number) => {
  if (hour < 6 || hour > 18) return 0;
  return Math.sin(((hour - 6) / 12) * Math.PI);
};

const getWeatherSolarFactor = (condition: WeatherData['condition']) => {
  switch (condition) {
    case 'sunny':
      return 1;
    case 'cloudy':
      return 0.72;
    case 'overcast':
      return 0.55;
    case 'rainy':
      return 0.35;
    default:
      return 0.8;
  }
};

const calculateLightingTarget = (
  zone: Zone,
  lightingSchedule: LightingSchedule | undefined,
  hour: number,
  isHolidayMode: boolean
) => {
  if (!zone.lightingEnabled) {
    return 0;
  }

  const scheduledLevel = isHolidayMode
    ? 0
    : lightingSchedule?.active
    ? lightingSchedule.level
    : zone.configuredLighting;

  if (!zone.autoDimmingEnabled) {
    return clamp(roundToStep(scheduledLevel, 5), 0, 100);
  }

  const daylightReduction = zone.daylightContribution * getDaylightFactor(hour) * 0.45;
  return clamp(roundToStep(scheduledLevel - daylightReduction, 5), 0, 100);
};

const createSeriesPoint = (
  date: Date,
  hvac: number,
  lighting: number,
  plugLoads: number,
  other: number,
  solar: number
): TimeSeriesPoint => {
  const consumption = hvac + lighting + plugLoads + other;

  return {
    time: `${date.getHours().toString().padStart(2, '0')}:00`,
    hour: date.getHours(),
    consumption: Number(consumption.toFixed(1)),
    solar: Number(solar.toFixed(1)),
    prediction: Number((consumption * 1.04).toFixed(1)),
    hvac: Number(hvac.toFixed(1)),
    lighting: Number(lighting.toFixed(1)),
    plugLoads: Number(plugLoads.toFixed(1)),
  };
};

const generateInitialZones = (): Zone[] => [
  {
    id: 'z0',
    name: 'Experience Center',
    floor: 0,
    temp: 25.2,
    humidity: 48,
    targetTemp: 26,
    mode: 'auto',
    occupied: true,
    occupantCount: 12,
    co2: 460,
    co: 1.6,
    pm25: 12,
    voc: 120,
    lighting: 78,
    configuredLighting: 78,
    lightingEnabled: true,
    autoDimmingEnabled: true,
    daylightContribution: 42,
    hvacEnabled: true,
    hvacStatus: 'cooling',
    fanSpeed: 55,
    ventilationRate: 82,
    hasFault: false,
  },
  {
    id: 'z1',
    name: 'Recreational Office',
    floor: 1,
    temp: 25.6,
    humidity: 49,
    targetTemp: 26,
    mode: 'auto',
    occupied: true,
    occupantCount: 28,
    co2: 540,
    co: 1.8,
    pm25: 15,
    voc: 145,
    lighting: 82,
    configuredLighting: 82,
    lightingEnabled: true,
    autoDimmingEnabled: true,
    daylightContribution: 40,
    hvacEnabled: true,
    hvacStatus: 'cooling',
    fanSpeed: 62,
    ventilationRate: 88,
    hasFault: false,
  },
  {
    id: 'z2',
    name: 'Platinum',
    floor: 2,
    temp: 25.3,
    humidity: 47,
    targetTemp: 26,
    mode: 'auto',
    occupied: true,
    occupantCount: 42,
    co2: 590,
    co: 1.7,
    pm25: 13,
    voc: 135,
    lighting: 80,
    configuredLighting: 80,
    lightingEnabled: true,
    autoDimmingEnabled: true,
    daylightContribution: 44,
    hvacEnabled: true,
    hvacStatus: 'idle',
    fanSpeed: 34,
    ventilationRate: 70,
    hasFault: false,
  },
  {
    id: 'z3',
    name: 'Grotto',
    floor: 3,
    temp: 25.0,
    humidity: 46,
    targetTemp: 26,
    mode: 'manual',
    occupied: true,
    occupantCount: 38,
    co2: 520,
    co: 1.5,
    pm25: 10,
    voc: 110,
    lighting: 72,
    configuredLighting: 72,
    lightingEnabled: true,
    autoDimmingEnabled: false,
    daylightContribution: 52,
    hvacEnabled: true,
    hvacStatus: 'idle',
    fanSpeed: 28,
    ventilationRate: 64,
    hasFault: false,
  },
  {
    id: 'z4',
    name: 'Rental Office',
    floor: 4,
    temp: 25.7,
    humidity: 50,
    targetTemp: 26,
    mode: 'auto',
    occupied: true,
    occupantCount: 34,
    co2: 610,
    co: 1.9,
    pm25: 16,
    voc: 160,
    lighting: 86,
    configuredLighting: 86,
    lightingEnabled: true,
    autoDimmingEnabled: true,
    daylightContribution: 36,
    hvacEnabled: true,
    hvacStatus: 'cooling',
    fanSpeed: 58,
    ventilationRate: 86,
    hasFault: false,
  },
  {
    id: 'z5',
    name: 'Rental Office',
    floor: 5,
    temp: 25.4,
    humidity: 47,
    targetTemp: 26,
    mode: 'manual',
    occupied: true,
    occupantCount: 30,
    co2: 560,
    co: 1.6,
    pm25: 11,
    voc: 125,
    lighting: 76,
    configuredLighting: 76,
    lightingEnabled: true,
    autoDimmingEnabled: false,
    daylightContribution: 46,
    hvacEnabled: true,
    hvacStatus: 'idle',
    fanSpeed: 30,
    ventilationRate: 66,
    hasFault: false,
  },
];

const generateInitialAlerts = (): Alert[] => [];

const generateInitialFaults = (): Fault[] => [];

const generateTimeSeriesData = (): TimeSeriesPoint[] => {
  const data: TimeSeriesPoint[] = [];
  const now = new Date();

  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hour = time.getHours();
    const solar = 0;

    // "Presentation friendly" profile:
    // - ramp-up after 7-8 AM
    // - gradual dip after 3 PM as office starts to vacate
    // - low/steady overnight (e.g. 3 AM)
    // Office empty overnight: low load from ~8 PM to ~8 AM.
    // Ramp-up starts at 8 AM; vacating starts at 4 PM.
    let occFactor = 0.18;
    if (hour >= 0 && hour < 2) occFactor = 0.2; // 12 AM - 2 AM: low
    else if (hour >= 2 && hour < 8) occFactor = 0.15; // 2 AM - 8 AM: lowest
    else if (hour >= 8 && hour < 9) occFactor = 0.35 + (hour - 8) * 0.25; // 8 AM - 9 AM: ramp
    else if (hour >= 9 && hour < 16) occFactor = 1.0; // 9 AM - 4 PM: peak occupancy
    else if (hour >= 16 && hour < 20) occFactor = 1.0 - ((hour - 16) / 4) * 0.7; // 4 PM - 8 PM: ramp down to 0.3
    else if (hour >= 20) occFactor = 0.2; // 8 PM onwards: low

    const swing = Math.sin((hour / 24) * Math.PI * 2);
    const hvac = 50 + occFactor * 60 + swing * 4;
    const lighting = 10 + occFactor * 40;
    const plugLoads = 20 + occFactor * 25 + Math.cos((hour / 24) * Math.PI * 2) * 1.5;
    const other = 15;

    data.push(createSeriesPoint(time, hvac, lighting, plugLoads, other, solar));
  }

  return data;
};

const generateSchedules = (): Schedule[] => [
  { id: 's1', name: 'Weekday Normal', startTime: '09:00', endTime: '18:00', days: [1, 2, 3, 4, 5], mode: 'auto', targetTemp: 26, active: true },
  // Presentation default: keep the building comfortable overnight (avoid red cards at 3 AM).
  { id: 's2', name: 'Night Setback', startTime: '22:00', endTime: '06:00', days: [1, 2, 3, 4, 5], mode: 'night-setback', targetTemp: 0, active: false },
  { id: 's3', name: 'Weekend', startTime: '00:00', endTime: '23:59', days: [0, 6], mode: 'night-setback', targetTemp: 0, active: false },
];

const generateLightingSchedules = (): LightingSchedule[] => [
  { id: 'ls1', name: 'Natural Daylight', startTime: '09:00', endTime: '18:00', level: 45, active: true },
  { id: 'ls2', name: 'After Hours', startTime: '18:00', endTime: '22:00', level: 25, active: true },
  { id: 'ls3', name: 'Night Lighting', startTime: '22:00', endTime: '06:00', level: 0, active: true },
];

const generateOptimizations = (): OptimizationSuggestion[] => [
  { id: 'o1', title: 'Increase Night Setback Temperature', description: 'Raising night setback from 28 C to 30 C during unoccupied hours', estimatedSavings: 180, category: 'hvac', priority: 'medium', implemented: false },
  { id: 'o2', title: 'Enable Daylight Harvesting', description: 'Reduce artificial lighting in zones with >50% daylight contribution', estimatedSavings: 58, category: 'lighting', priority: 'high', implemented: false },
  { id: 'o3', title: 'Shift HVAC Pre-cool Start', description: 'Start pre-cooling 30 minutes later based on thermal mass analysis', estimatedSavings: 65, category: 'scheduling', priority: 'low', implemented: false },
];

const initialEnergyData: EnergyData = {
  // Exact values requested for the dashboard defaults.
  current: 240,
  baseline: 400,
  hvac: 110,
  lighting: 60,
  plugLoads: 55,
  other: 15,
  solar: 0,
  grid: 240,
  peakDemand: 323,
  epi: 54,
  selfConsumption: 0,
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
  lightingSchedules: generateLightingSchedules(),
  optimizations: generateOptimizations(),
  timeSeriesData: generateTimeSeriesData(),
  selectedZoneId: null,
  viewMode: 'hvac',
  show3D: true,
  activeTab: 'overview',
  isPeakHours: false,
  isHolidayMode: false,
  afterHoursDuration: '1',
  overrideMode: null,
  overrideUntil: null,
  currentTime: new Date(),

  setSelectedZone: (zoneId) => set({ selectedZoneId: zoneId }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setShow3D: (show) => set({ show3D: show }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleHolidayMode: () =>
    set((state) => ({
      isHolidayMode: !state.isHolidayMode,
      overrideMode: null,
      overrideUntil: null,
    })),

  toggleZoneHVAC: (zoneId) =>
    set((state) => ({
      zones: state.zones.map((zone) => {
        if (zone.id !== zoneId) return zone;
        const hvacEnabled = !zone.hvacEnabled;
        return {
          ...zone,
          hvacEnabled,
          hvacStatus: hvacEnabled ? (zone.co2 > 850 ? 'ventilating' : 'idle') : 'off',
          fanSpeed: hvacEnabled ? Math.max(zone.fanSpeed, 24) : 0,
          ventilationRate: hvacEnabled ? Math.max(zone.ventilationRate, 45) : 10,
        };
      }),
    })),

  toggleZoneLighting: (zoneId) =>
    set((state) => ({
      zones: state.zones.map((zone) =>
        zone.id === zoneId
          ? {
              ...zone,
              lightingEnabled: !zone.lightingEnabled,
              lighting: !zone.lightingEnabled ? zone.configuredLighting : 0,
            }
          : zone
      ),
    })),

  toggleZoneAutoDimming: (zoneId) =>
    set((state) => ({
      zones: state.zones.map((zone) =>
        zone.id === zoneId ? { ...zone, autoDimmingEnabled: !zone.autoDimmingEnabled } : zone
      ),
    })),

  updateZone: (zoneId, updates) =>
    set((state) => ({
      zones: state.zones.map((zone) => {
        if (zone.id !== zoneId) return zone;

        const configuredLighting =
          typeof updates.configuredLighting === 'number'
            ? updates.configuredLighting
            : typeof updates.lighting === 'number' && zone.lightingEnabled
            ? updates.lighting
            : zone.configuredLighting;

        return {
          ...zone,
          ...updates,
          configuredLighting,
          lighting:
            typeof updates.lighting === 'number'
              ? updates.lighting
              : zone.lightingEnabled
              ? configuredLighting
              : 0,
        };
      }),
    })),

  dismissAlert: (alertId) =>
    set((state) => ({
      alerts: state.alerts.map((alert) => (alert.id === alertId ? { ...alert, dismissed: true } : alert)),
    })),

  acknowledgeFault: (faultId) =>
    set((state) => ({
      faults: state.faults.map((fault) => (fault.id === faultId ? { ...fault, acknowledged: true } : fault)),
    })),

  resolveFault: (faultId) =>
    set((state) => ({
      faults: state.faults.map((fault) => (fault.id === faultId ? { ...fault, resolved: true } : fault)),
    })),

  addAlert: (alert) =>
    set((state) => ({
      alerts: [
        {
          ...alert,
          id: `a${Date.now()}`,
          timestamp: Date.now(),
        },
        ...state.alerts,
      ],
    })),

  addSchedule: () =>
    set((state) => {
      const id = `s${Date.now()}`;
      const nextIndex = state.schedules.length + 1;
      const schedule: Schedule = {
        id,
        name: `Custom Schedule ${nextIndex}`,
        startTime: '09:00',
        endTime: '18:00',
        days: [1, 2, 3, 4, 5],
        mode: 'auto',
        targetTemp: 26,
        active: true,
      };

      return { schedules: [schedule, ...state.schedules] };
    }),

  toggleSchedule: (scheduleId) =>
    set((state) => ({
      schedules: state.schedules.map((schedule) =>
        schedule.id === scheduleId ? { ...schedule, active: !schedule.active } : schedule
      ),
    })),

  toggleLightingSchedule: (scheduleId) =>
    set((state) => ({
      lightingSchedules: state.lightingSchedules.map((schedule) =>
        schedule.id === scheduleId ? { ...schedule, active: !schedule.active } : schedule
      ),
    })),

  setAfterHoursDuration: (duration) => set({ afterHoursDuration: duration }),

  requestAfterHoursOverride: () =>
    set((state) => ({
      overrideMode: 'occupied',
      overrideUntil: Date.now() + Number(state.afterHoursDuration) * 60 * 60 * 1000,
      isHolidayMode: false,
    })),

  activateNightSetback: () =>
    set({
      overrideMode: 'night-setback',
      overrideUntil: Date.now() + 2 * 60 * 60 * 1000,
      isHolidayMode: false,
    }),

  implementOptimization: (optimizationId) =>
    set((state) => ({
      optimizations: state.optimizations.map((opt) =>
        opt.id === optimizationId ? { ...opt, implemented: true } : opt
      ),
    })),

  tick: () => {
    const state = get();
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const currentDay = now.getDay();
    const isPeak = currentHour >= 13 && currentHour <= 16;
    const overrideExpired = state.overrideUntil !== null && state.overrideUntil <= now.getTime();
    const overrideMode = overrideExpired ? null : state.overrideMode;
    const overrideUntil = overrideExpired ? null : state.overrideUntil;
    const activeSchedule =
      !state.isHolidayMode && !overrideMode
        ? state.schedules.find(
            (schedule) =>
              schedule.active &&
              schedule.days.includes(currentDay) &&
              isTimeWithinRange(currentMinutes, schedule.startTime, schedule.endTime)
          )
        : undefined;
    const activeLightingSchedule =
      !state.isHolidayMode
        ? state.lightingSchedules.find((schedule) => schedule.active && isTimeWithinRange(currentMinutes, schedule.startTime, schedule.endTime))
        : undefined;

    const updatedZones = state.zones.map((zone) => {
      const hvacAllowedBySchedule =
        state.isHolidayMode || overrideMode === 'night-setback'
          ? false
          : overrideMode === 'occupied'
          ? true
          : activeSchedule?.mode !== 'night-setback';
      const effectiveHVACEnabled = zone.hvacEnabled && hvacAllowedBySchedule;
      const tempTarget = zone.targetTemp;
      const weatherInfluence = zone.floor < 0 ? state.weatherData.temp - 6 : state.weatherData.temp;
      const tempGapToTarget = tempTarget - zone.temp;
      const occupancyGain = zone.occupied ? zone.occupantCount * 0.55 : -10;
      const ventilationPull = effectiveHVACEnabled ? zone.ventilationRate * 0.42 : zone.ventilationRate * 0.08;
      const baseCO2 = zone.co2 + occupancyGain - ventilationPull + (zone.floor < 0 ? 2 : 0);

      let hvacStatus = zone.hvacStatus;
      let nextTemp = zone.temp;

      if (!effectiveHVACEnabled) {
        hvacStatus = 'off';
        nextTemp = zone.temp + (weatherInfluence - zone.temp) * 0.045;
      } else if (zone.co2 > 900 && Math.abs(tempGapToTarget) < 0.6) {
        hvacStatus = 'ventilating';
        nextTemp = zone.temp + (tempTarget - zone.temp) * 0.05;
      } else if (tempGapToTarget < -0.35) {
        hvacStatus = 'cooling';
        nextTemp = zone.temp + tempGapToTarget * 0.2;
      } else if (tempGapToTarget > 0.35) {
        hvacStatus = 'heating';
        nextTemp = zone.temp + tempGapToTarget * 0.18;
      } else {
        hvacStatus = 'idle';
        nextTemp = zone.temp + (tempTarget - zone.temp) * 0.06;
      }

      const absoluteTempDifference = Math.abs(zone.temp - tempTarget);
      const co2Excess = Math.max(0, zone.co2 - 450);
      const isManual = zone.mode === 'manual';
      const targetFanSpeed =
        !effectiveHVACEnabled
          ? 0
          : isManual
          ? zone.fanSpeed
          : hvacStatus === 'cooling' || hvacStatus === 'heating'
          ? absoluteTempDifference > 3
            ? 78
            : absoluteTempDifference > 1
            ? 55
            : 35
          : hvacStatus === 'ventilating'
          ? zone.co2 > 1000
            ? 68
            : 48
          : 30;
      const targetVentilation =
        !effectiveHVACEnabled
          ? 8
          : isManual
          ? zone.ventilationRate
          : hvacStatus === 'ventilating'
          ? clamp(60 + co2Excess * 0.06, 60, 100)
          : clamp(35 + co2Excess * 0.035, 35, 82);
      const targetLighting = calculateLightingTarget(zone, activeLightingSchedule, currentHour, state.isHolidayMode);
      const humidityTarget = clamp(48 + (state.weatherData.humidity - 55) * 0.08, 40, 58);
      const nextHumidity = zone.humidity + (humidityTarget - zone.humidity) * (effectiveHVACEnabled ? 0.12 : 0.05);
      const nextLighting = zone.lighting + (targetLighting - zone.lighting) * 0.35;
      // Presentation-safe IEQ: keep values in the "ideal" band so the UI doesn't go red.
      const nextCO2 = clamp(baseCO2, 380, 590); // keep below warning threshold (600)
      const nextCO = clamp(zone.co + (zone.occupied ? 0.12 : -0.08) - targetVentilation * 0.003, 0, 8.8); // keep below 9
      const nextPM25 = clamp(zone.pm25 + (zone.occupied ? 0.35 : -0.22) - targetVentilation * 0.01, 5, 14.8); // keep below 15
      const nextVOC = clamp(zone.voc + (zone.occupied ? 2.8 : -2.4) - targetVentilation * 0.12, 60, 149); // keep below 150
      const tempDiff = Math.abs(nextTemp - tempTarget);
      const hasFault = nextCO2 > 1000 || nextCO > 35 || tempDiff > 2.5;

      return {
        ...zone,
        temp: Number(clamp(nextTemp, 18, 33).toFixed(1)),
        humidity: Number(clamp(nextHumidity, 30, 70).toFixed(0)),
        co2: Number(nextCO2.toFixed(0)),
        co: Number(nextCO.toFixed(1)),
        pm25: Number(nextPM25.toFixed(0)),
        voc: Number(nextVOC.toFixed(0)),
        lighting: Number(clamp(nextLighting, 0, 100).toFixed(0)),
        hvacStatus,
        fanSpeed: Number(clamp(zone.fanSpeed + (targetFanSpeed - zone.fanSpeed) * 0.4, 0, 100).toFixed(0)),
        ventilationRate: Number(clamp(zone.ventilationRate + (targetVentilation - zone.ventilationRate) * 0.35, 0, 100).toFixed(0)),
        hasFault,
        faultMessage:
          nextCO2 > 1000
            ? 'High CO2 levels detected'
            : nextCO > 35
            ? 'Elevated carbon monoxide'
            : tempDiff > 2.5
            ? 'Temperature deviation'
            : undefined,
      };
    });
    const solarBase = currentHour >= 6 && currentHour <= 18 ? 10 + 50 * getDaylightFactor(currentHour) : 0;
    const solar = clamp(solarBase * getWeatherSolarFactor(state.weatherData.condition), 0, 60);

    set({
      currentTime: now,
      isPeakHours: isPeak,
      overrideMode,
      overrideUntil,
      zones: updatedZones,
      // Keep the dashboard KPIs stable (as requested) instead of drifting with the simulation tick.
      energyData: state.energyData,
      timeSeriesData: state.timeSeriesData,
      waterData: {
        ...state.waterData,
        fresh: Number(clamp(state.waterData.fresh + (updatedZones.filter((zone) => zone.occupied).length - 3) * 4, 1000, 1500).toFixed(0)),
        recycled: Number(clamp(state.waterData.recycled + solar * 0.08 - 1.5, 250, 400).toFixed(0)),
      },
    });
  },
}));
