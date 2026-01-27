import { useBASStore } from '../store/basStore';
import { Card, SectionHeader, MetricCard } from '../components/ui/Card';
import { Slider, Toggle, ProgressBar, Badge } from '../components/ui/Controls';
import { motion } from 'framer-motion';
import { Lightbulb, Sun, Leaf, Zap, SunDim } from 'lucide-react';

export const LightingModule = () => {
  const { zones, updateZone, selectedZoneId, setSelectedZone, energyData } = useBASStore();
  const selectedZone = zones.find((z) => z.id === selectedZoneId) || zones[0];

  const totalLightingPower = energyData.lighting;
  const avgDaylight = zones.reduce((sum, z) => sum + z.daylightContribution, 0) / zones.length;
  const potentialSavings = zones
    .filter((z) => z.daylightContribution > 50 && z.lighting > 50)
    .reduce((sum, z) => sum + (z.lighting - z.daylightContribution) * 0.5, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Lighting Load"
          value={totalLightingPower}
          unit="kW"
          icon={<Zap className="w-5 h-5" />}
          status="normal"
        />
        <MetricCard
          title="Avg. Daylight Contribution"
          value={avgDaylight}
          unit="%"
          icon={<Sun className="w-5 h-5" />}
          status={avgDaylight > 40 ? 'normal' : 'warning'}
        />
        <MetricCard
          title="Zones with Daylight"
          value={zones.filter((z) => z.daylightContribution > 30).length}
          unit={`/ ${zones.length}`}
          icon={<SunDim className="w-5 h-5" />}
        />
        <MetricCard
          title="Potential Savings"
          value={potentialSavings}
          unit="kW"
          icon={<Leaf className="w-5 h-5" />}
          subtitle="From daylight harvesting"
          status="normal"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <SectionHeader title="Zone Lighting Control" />
          <div className="flex flex-wrap gap-2 mb-6">
            {zones.map((zone) => (
              <motion.button
                key={zone.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedZone(zone.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedZone.id === zone.id
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
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
                  className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300"
                  style={{
                    backgroundColor: `rgba(234, 179, 8, ${selectedZone.lighting / 100 * 0.3})`,
                    boxShadow: `0 0 ${selectedZone.lighting / 2}px rgba(234, 179, 8, ${selectedZone.lighting / 100})`,
                  }}
                >
                  <Lightbulb
                    className="w-8 h-8 transition-colors duration-300"
                    style={{
                      color: `rgb(${155 + selectedZone.lighting}, ${155 + selectedZone.lighting * 0.5}, ${50 + selectedZone.lighting * 0.5})`,
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedZone.name}</h3>
                  <p className="text-sm text-gray-400">
                    {selectedZone.occupied ? 'Occupied' : 'Vacant'} • {selectedZone.occupantCount} people
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">{selectedZone.lighting}%</div>
                <div className="text-sm text-gray-400">Light Level</div>
              </div>
            </div>

            <Slider
              label="Lighting Level"
              value={selectedZone.lighting}
              min={0}
              max={100}
              step={5}
              unit="%"
              onChange={(level) => updateZone(selectedZone.id, { lighting: level })}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Sun className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-gray-400">Daylight Contribution</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {selectedZone.daylightContribution}%
                </div>
                <ProgressBar
                  value={selectedZone.daylightContribution}
                  max={100}
                  showValue={false}
                  color="bg-yellow-500"
                  size="sm"
                />
              </div>
              <div className="p-4 bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-gray-400">Artificial Light</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {Math.max(0, selectedZone.lighting - selectedZone.daylightContribution)}%
                </div>
                <ProgressBar
                  value={Math.max(0, selectedZone.lighting - selectedZone.daylightContribution)}
                  max={100}
                  showValue={false}
                  color="bg-cyan-500"
                  size="sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
              <div>
                <p className="text-white font-medium">Auto Dimming</p>
                <p className="text-sm text-gray-400">
                  Automatically adjust based on daylight
                </p>
              </div>
              <Toggle
                enabled={selectedZone.daylightContribution > 30}
                onChange={() => {}}
              />
            </div>

            {selectedZone.daylightContribution > 50 && selectedZone.lighting > 70 && (
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
                      High daylight contribution detected. Consider reducing artificial lighting
                      to save approximately{' '}
                      {((selectedZone.lighting - selectedZone.daylightContribution) * 0.1).toFixed(1)} kW.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </Card>

        <Card>
          <SectionHeader title="All Zones" />
          <div className="space-y-3">
            {zones.map((zone) => (
              <motion.div
                key={zone.id}
                whileHover={{ scale: 1.01 }}
                onClick={() => setSelectedZone(zone.id)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedZone.id === zone.id
                    ? 'border-yellow-600 bg-yellow-950/20'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-white">{zone.name}</span>
                  <Badge variant={zone.occupied ? 'success' : 'default'}>
                    {zone.lighting}%
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-3 h-3 text-cyan-400" />
                    <ProgressBar
                      value={zone.lighting}
                      max={100}
                      showValue={false}
                      color="bg-cyan-500"
                      size="sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Sun className="w-3 h-3 text-yellow-400" />
                    <ProgressBar
                      value={zone.daylightContribution}
                      max={100}
                      showValue={false}
                      color="bg-yellow-500"
                      size="sm"
                    />
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
        <SectionHeader
          title="Lighting Schedules"
          subtitle="Automated lighting control schedules"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Business Hours', time: '09:00 - 18:00', level: '100%', active: true },
            { name: 'After Hours', time: '18:00 - 22:00', level: '30%', active: true },
            { name: 'Night Mode', time: '22:00 - 06:00', level: '10%', active: true },
          ].map((schedule) => (
            <div
              key={schedule.name}
              className="p-4 bg-gray-800/50 rounded-lg flex items-center justify-between"
            >
              <div>
                <p className="text-white font-medium">{schedule.name}</p>
                <p className="text-sm text-gray-400">{schedule.time}</p>
                <p className="text-xs text-cyan-400 mt-1">Level: {schedule.level}</p>
              </div>
              <Toggle enabled={schedule.active} onChange={() => {}} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
