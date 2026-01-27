import { useBASStore } from '../store/basStore';
import { Card, SectionHeader } from '../components/ui/Card';
import { Slider, SegmentedControl, Toggle, Badge } from '../components/ui/Controls';
import { GaugeChart, ComfortBand } from '../components/ui/Charts';
import { motion } from 'framer-motion';
import {
  Thermometer,
  Fan,
  Wind,
  Snowflake,
  Flame,
  Power,
  Settings,
} from 'lucide-react';
import { HVACMode } from '../types';

export const HVACModule = () => {
  const { zones, updateZone, selectedZoneId, setSelectedZone } = useBASStore();
  const selectedZone = zones.find((z) => z.id === selectedZoneId) || zones[0];

  const modeOptions = [
    { value: 'auto', label: 'Auto', icon: <Settings className="w-4 h-4" /> },
    { value: 'manual', label: 'Manual', icon: <Power className="w-4 h-4" /> },
    { value: 'night-setback', label: 'Night', icon: <Power className="w-4 h-4" /> },
  ];

  const hvacStatusConfig = {
    cooling: { icon: Snowflake, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    heating: { icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/20' },
    idle: { icon: Power, color: 'text-gray-400', bg: 'bg-gray-500/20' },
    ventilating: { icon: Wind, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  };

  const StatusIcon = hvacStatusConfig[selectedZone.hvacStatus].icon;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 mb-4">
        {zones.map((zone) => (
          <motion.button
            key={zone.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedZone(zone.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              selectedZone.id === zone.id
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {zone.name}
            {zone.hasFault && (
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <SectionHeader
            title={selectedZone.name}
            subtitle="HVAC Control & Status"
            action={
              <Badge variant={selectedZone.occupied ? 'success' : 'default'}>
                {selectedZone.occupied ? 'Occupied' : 'Vacant'}
              </Badge>
            }
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div className="flex flex-col items-center">
              <GaugeChart
                value={selectedZone.temp}
                max={35}
                label="°C"
                thresholds={{ warning: selectedZone.targetTemp + 1, critical: selectedZone.targetTemp + 2 }}
              />
              <span className="text-sm text-gray-400 mt-2">Current Temp</span>
            </div>
            <div className="flex flex-col items-center">
              <GaugeChart
                value={selectedZone.humidity}
                max={100}
                label="% RH"
                thresholds={{ warning: 60, critical: 70 }}
              />
              <span className="text-sm text-gray-400 mt-2">Humidity</span>
            </div>
            <div className="flex flex-col items-center">
              <GaugeChart
                value={selectedZone.fanSpeed}
                max={100}
                label="%"
                color="#06b6d4"
              />
              <span className="text-sm text-gray-400 mt-2">Fan Speed</span>
            </div>
            <div className="flex flex-col items-center">
              <GaugeChart
                value={selectedZone.ventilationRate}
                max={100}
                label="%"
                color="#22c55e"
              />
              <span className="text-sm text-gray-400 mt-2">Ventilation</span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Operating Mode</label>
              <SegmentedControl
                options={modeOptions}
                value={selectedZone.mode}
                onChange={(mode) => updateZone(selectedZone.id, { mode: mode as HVACMode })}
              />
            </div>

            <Slider
              label="Target Temperature"
              value={selectedZone.targetTemp}
              min={18}
              max={28}
              step={0.5}
              unit="°C"
              onChange={(temp) => updateZone(selectedZone.id, { targetTemp: temp })}
              disabled={selectedZone.mode === 'auto'}
            />

            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${hvacStatusConfig[selectedZone.hvacStatus].bg}`}>
                  <StatusIcon className={`w-5 h-5 ${hvacStatusConfig[selectedZone.hvacStatus].color}`} />
                </div>
                <div>
                  <p className="text-white font-medium capitalize">{selectedZone.hvacStatus}</p>
                  <p className="text-sm text-gray-400">Current HVAC Status</p>
                </div>
              </div>
              <Toggle
                enabled={selectedZone.hvacStatus !== 'idle'}
                onChange={(enabled) =>
                  updateZone(selectedZone.id, {
                    hvacStatus: enabled ? 'cooling' : 'idle',
                  })
                }
                disabled={selectedZone.mode === 'auto'}
              />
            </div>
          </div>
        </Card>

        <Card>
          <SectionHeader title="Comfort Analysis" />
          <div className="space-y-6">
            <ComfortBand
              value={selectedZone.temp}
              min={15}
              max={30}
              optimalMin={21}
              optimalMax={24}
              label="Temperature"
              unit="°C"
            />
            <ComfortBand
              value={selectedZone.humidity}
              min={20}
              max={80}
              optimalMin={40}
              optimalMax={60}
              label="Humidity"
              unit="%"
            />
            <ComfortBand
              value={selectedZone.co2}
              min={300}
              max={1000}
              optimalMin={400}
              optimalMax={600}
              label="CO₂ Level"
              unit="ppm"
            />
          </div>

          <div className="mt-6 pt-6 border-t border-gray-800">
            <SectionHeader title="Demand Control Ventilation" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">DCV Status</span>
                <Badge variant={selectedZone.co2 > 600 ? 'warning' : 'success'}>
                  {selectedZone.co2 > 600 ? 'Increased Ventilation' : 'Normal'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Occupant Count</span>
                <span className="text-white">{selectedZone.occupantCount} people</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">CFM/Person</span>
                <span className="text-white">
                  {selectedZone.occupantCount > 0
                    ? ((selectedZone.ventilationRate * 10) / selectedZone.occupantCount).toFixed(1)
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <SectionHeader title="All Zones Overview" />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-400 border-b border-gray-800">
                <th className="pb-3 font-medium">Zone</th>
                <th className="pb-3 font-medium">Temp</th>
                <th className="pb-3 font-medium">Target</th>
                <th className="pb-3 font-medium">Humidity</th>
                <th className="pb-3 font-medium">Mode</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Occupancy</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((zone) => (
                <tr
                  key={zone.id}
                  className="border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer"
                  onClick={() => setSelectedZone(zone.id)}
                >
                  <td className="py-3">
                    <span className="text-white font-medium">{zone.name}</span>
                  </td>
                  <td className="py-3">
                    <span
                      className={
                        Math.abs(zone.temp - zone.targetTemp) > 2
                          ? 'text-red-400'
                          : Math.abs(zone.temp - zone.targetTemp) > 1
                          ? 'text-yellow-400'
                          : 'text-green-400'
                      }
                    >
                      {zone.temp.toFixed(1)}°C
                    </span>
                  </td>
                  <td className="py-3 text-gray-300">{zone.targetTemp}°C</td>
                  <td className="py-3 text-gray-300">{zone.humidity.toFixed(0)}%</td>
                  <td className="py-3">
                    <Badge
                      variant={
                        zone.mode === 'auto' ? 'info' : zone.mode === 'manual' ? 'default' : 'warning'
                      }
                    >
                      {zone.mode}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      {zone.hvacStatus === 'cooling' && <Snowflake className="w-4 h-4 text-blue-400" />}
                      {zone.hvacStatus === 'heating' && <Flame className="w-4 h-4 text-orange-400" />}
                      {zone.hvacStatus === 'idle' && <Power className="w-4 h-4 text-gray-400" />}
                      {zone.hvacStatus === 'ventilating' && <Wind className="w-4 h-4 text-cyan-400" />}
                      <span className="capitalize text-gray-300">{zone.hvacStatus}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          zone.occupied ? 'bg-green-500' : 'bg-gray-500'
                        }`}
                      />
                      <span className="text-gray-300">
                        {zone.occupied ? `${zone.occupantCount}` : 'Vacant'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
