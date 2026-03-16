import { useBASStore } from '../store/basStore';
import { Card, SectionHeader, MetricCard } from '../components/ui/Card';
import { Slider, Toggle, Badge } from '../components/ui/Controls';
import { motion } from 'framer-motion';
import { Lightbulb, Sun, Leaf, Zap, SunDim } from 'lucide-react';

const LIGHTING_SCALE = [
  { stop: 0, color: '#1e3a5f' },
  { stop: 25, color: '#4a90d9' },
  { stop: 50, color: '#f5f0e8' },
  { stop: 75, color: '#f5a623' },
  { stop: 100, color: '#fff7d6' },
];

const lerp = (start: number, end: number, amount: number) => start + (end - start) * amount;

const hexToRgb = (hex: string) => {
  const cleanHex = hex.replace('#', '');
  return {
    r: parseInt(cleanHex.slice(0, 2), 16),
    g: parseInt(cleanHex.slice(2, 4), 16),
    b: parseInt(cleanHex.slice(4, 6), 16),
  };
};

const getLightingColor = (value: number) => {
  const clamped = Math.max(0, Math.min(100, value));

  for (let i = 0; i < LIGHTING_SCALE.length - 1; i++) {
    const current = LIGHTING_SCALE[i];
    const next = LIGHTING_SCALE[i + 1];

    if (clamped >= current.stop && clamped <= next.stop) {
      const ratio = (clamped - current.stop) / (next.stop - current.stop);
      const start = hexToRgb(current.color);
      const end = hexToRgb(next.color);
      return `rgb(${Math.round(lerp(start.r, end.r, ratio))}, ${Math.round(lerp(start.g, end.g, ratio))}, ${Math.round(lerp(start.b, end.b, ratio))})`;
    }
  }

  return LIGHTING_SCALE[LIGHTING_SCALE.length - 1].color;
};

const lightingGradient = 'linear-gradient(90deg, #1e3a5f 0%, #4a90d9 25%, #f5f0e8 50%, #f5a623 75%, #fff7d6 100%)';

export const LightingModule = () => {
  const {
    zones,
    updateZone,
    selectedZoneId,
    setSelectedZone,
    lightingSchedules,
    toggleLightingSchedule,
    toggleZoneLighting,
    toggleZoneAutoDimming,
  } = useBASStore();
  const selectedZone = zones.find((z) => z.id === selectedZoneId) || zones[0];
  const selectedZoneLightingColor = getLightingColor(selectedZone.lighting);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <MetricCard
          title="Natural Daylight Percentage"
          value={45}
          unit="%"
          icon={<Sun className="w-5 h-5" />}
          status="normal"
        />
        <MetricCard
          title="Lighting Efficiency"
          value={4}
          unit={'W/m\u00B2'}
          icon={<Zap className="w-5 h-5" />}
          status="normal"
        />
        <MetricCard
          title="Avg. Daylight Contribution"
          value={40}
          unit="%"
          icon={<SunDim className="w-5 h-5" />}
          status="normal"
        />
        <MetricCard
          title="Zones with Daylight"
          value={5}
          unit="/ 5"
          icon={<Sun className="w-5 h-5" />}
        />
        <MetricCard
          title="Potential Savings"
          value={58}
          unit="%"
          icon={<Leaf className="w-5 h-5" />}
          subtitle="From daylight harvesting"
          status="normal"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <Card className="lg:col-span-2 h-full">
          <SectionHeader title="Zone Lighting Control" />
          <div className="flex flex-wrap gap-2 mb-6">
            {zones.map((zone) => (
              <motion.button
                key={zone.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedZone(zone.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedZone.id === zone.id ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {zone.name}
              </motion.button>
            ))}
          </div>

          <div className="p-6 bg-gray-800/50 rounded-lg space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 border border-white/10"
                  style={{
                    backgroundColor: selectedZoneLightingColor,
                    boxShadow: `0 0 ${selectedZone.lighting / 2}px ${selectedZoneLightingColor}`,
                  }}
                >
                  <Lightbulb className="w-8 h-8 transition-colors duration-300 text-gray-950" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedZone.name}</h3>
                  <p className="text-sm text-gray-400">
                    {selectedZone.occupied ? 'Occupied' : 'Vacant'} | {selectedZone.occupantCount} people
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">{selectedZone.lighting}%</div>
                <div className="text-sm text-gray-400">Light Level</div>
              </div>
            </div>

            <div className="space-y-3">
              <Slider
                label="Lighting Level"
                value={selectedZone.configuredLighting}
                min={0}
                max={100}
                step={5}
                unit="%"
                onChange={(level) =>
                  updateZone(selectedZone.id, {
                    configuredLighting: level,
                    lighting: selectedZone.lightingEnabled ? level : 0,
                  })
                }
              />
              <div className="h-2 rounded-full" style={{ background: lightingGradient }} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Sun className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-gray-400">Daylight Contribution</span>
                </div>
                <div className="text-2xl font-bold text-white">{selectedZone.daylightContribution}%</div>
                <div className="mt-3 h-2 rounded-full" style={{ background: lightingGradient }} />
              </div>
              <div className="p-4 bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-gray-400">Artificial Light</span>
                </div>
                <div className="text-2xl font-bold text-white">{Math.max(0, selectedZone.lighting - selectedZone.daylightContribution)}%</div>
                <div className="mt-3 h-2 rounded-full" style={{ background: lightingGradient }} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">Lighting Power</p>
                  <p className="text-sm text-gray-400">Switch this zone lighting on or off</p>
                </div>
                <Toggle enabled={selectedZone.lightingEnabled} onChange={() => toggleZoneLighting(selectedZone.id)} />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">Auto Dimming</p>
                  <p className="text-sm text-gray-400">Automatically adjust based on daylight</p>
                </div>
                <Toggle enabled={selectedZone.autoDimmingEnabled} onChange={() => toggleZoneAutoDimming(selectedZone.id)} />
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-yellow-950/30 border border-yellow-800/50 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <Leaf className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-yellow-400 font-medium">Energy Saving Opportunity</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Natural daylight is set to 45%, with average daylight contribution at 40%. Current daylight strategies can unlock up to 58% savings.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </Card>

        <Card className="h-full">
          <SectionHeader title="All Zones" />
          <div className="space-y-3">
            {zones.map((zone) => (
              <motion.div
                key={zone.id}
                whileHover={{ scale: 1.01 }}
                onClick={() => setSelectedZone(zone.id)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedZone.id === zone.id ? 'border-yellow-600 bg-yellow-950/20' : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-white">{zone.name}</span>
                  <Badge variant={zone.occupied ? 'success' : 'default'}>{zone.lighting}%</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-3 h-3 text-cyan-400" />
                    <div className="w-full bg-gray-800 rounded-full h-1 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${zone.lighting}%`, background: lightingGradient }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sun className="w-3 h-3 text-yellow-400" />
                    <div className="w-full bg-gray-800 rounded-full h-1 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: '45%', background: lightingGradient }} />
                    </div>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Artificial: {Math.max(0, zone.lighting - zone.daylightContribution)}%</span>
                  <span>Daylight: {zone.daylightContribution}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <SectionHeader title="Lighting Schedules" subtitle="Automated lighting control schedules" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {lightingSchedules.map((schedule) => (
            <div key={schedule.id} className="p-4 bg-gray-800/50 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{schedule.name}</p>
                <p className="text-sm text-gray-400">
                  {schedule.startTime} - {schedule.endTime}
                </p>
                <p className="text-xs mt-1" style={{ color: '#4a90d9' }}>Level: {schedule.level}%</p>
              </div>
              <Toggle enabled={schedule.active} onChange={() => toggleLightingSchedule(schedule.id)} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

