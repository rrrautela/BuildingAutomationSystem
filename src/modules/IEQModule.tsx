import { useBASStore } from '../store/basStore';
import { Card, SectionHeader, MetricCard } from '../components/ui/Card';
import { ComfortBand, GaugeChart } from '../components/ui/Charts';
import { Badge } from '../components/ui/Controls';
import { motion } from 'framer-motion';
import {
  Wind,
  Thermometer,
  Droplets,
  CloudRain,
  AlertTriangle,
  CheckCircle,
  Activity,
} from 'lucide-react';

export const IEQModule = () => {
  const { zones, selectedZoneId, setSelectedZone } = useBASStore();
  const selectedZone = zones.find((z) => z.id === selectedZoneId) || zones[0];

  const avgCO2 = zones.reduce((sum, z) => sum + z.co2, 0) / zones.length;
  const avgCO = zones.reduce((sum, z) => sum + z.co, 0) / zones.length;
  const avgPM25 = zones.reduce((sum, z) => sum + z.pm25, 0) / zones.length;
  const avgVOC = zones.reduce((sum, z) => sum + z.voc, 0) / zones.length;
  const avgTemp = zones.reduce((sum, z) => sum + z.temp, 0) / zones.length;
  const avgHumidity = zones.reduce((sum, z) => sum + z.humidity, 0) / zones.length;

  const getAirQualityScore = (zone: typeof selectedZone) => {
    let score = 100;
    if (zone.co2 > 600) score -= (zone.co2 - 600) / 10;
    if (zone.co > 9) score -= (zone.co - 9) * 2;
    if (zone.pm25 > 15) score -= (zone.pm25 - 15) * 2;
    if (zone.voc > 150) score -= (zone.voc - 150) / 5;
    return Math.max(0, Math.min(100, score));
  };

  const getAirQualityStatus = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-green-400', bg: 'bg-green-500' };
    if (score >= 60) return { label: 'Good', color: 'text-cyan-400', bg: 'bg-cyan-500' };
    if (score >= 40) return { label: 'Moderate', color: 'text-yellow-400', bg: 'bg-yellow-500' };
    return { label: 'Poor', color: 'text-red-400', bg: 'bg-red-500' };
  };

  const zonesWithAlerts = zones.filter(
    (z) => z.co2 > 700 || z.co > 35 || z.pm25 > 25 || z.voc > 200 || Math.abs(z.temp - z.targetTemp) > 2
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Avg. CO2"
          value={avgCO2}
          unit="ppm"
          icon={<Wind className="w-5 h-5" />}
          status={avgCO2 > 700 ? 'critical' : avgCO2 > 600 ? 'warning' : 'normal'}
        />
        <MetricCard
          title="Avg. CO"
          value={avgCO}
          unit="ppm"
          icon={<AlertTriangle className="w-5 h-5" />}
          status={avgCO > 35 ? 'critical' : avgCO > 9 ? 'warning' : 'normal'}
        />
        <MetricCard
          title="Avg. PM2.5"
          value={avgPM25}
          unit="ug/m3"
          icon={<CloudRain className="w-5 h-5" />}
          status={avgPM25 > 25 ? 'critical' : avgPM25 > 15 ? 'warning' : 'normal'}
        />
        <MetricCard
          title="Avg. VOC"
          value={avgVOC}
          unit="ppb"
          icon={<Activity className="w-5 h-5" />}
          status={avgVOC > 200 ? 'critical' : avgVOC > 150 ? 'warning' : 'normal'}
        />
        <MetricCard
          title="Avg. Temperature"
          value={avgTemp}
          unit="C"
          icon={<Thermometer className="w-5 h-5" />}
          status={avgTemp > 25 || avgTemp < 20 ? 'warning' : 'normal'}
        />
        <MetricCard
          title="Avg. Humidity"
          value={avgHumidity}
          unit="%"
          icon={<Droplets className="w-5 h-5" />}
          status={avgHumidity > 60 || avgHumidity < 40 ? 'warning' : 'normal'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <SectionHeader title="Zone IEQ Details" />
          <div className="flex flex-wrap gap-2 mb-6">
            {zones.map((zone) => {
              const score = getAirQualityScore(zone);
              const status = getAirQualityStatus(score);
              return (
                <motion.button
                  key={zone.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedZone(zone.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    selectedZone.id === zone.id ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${status.bg}`} />
                  {zone.name}
                </motion.button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-6">
            <div className="flex flex-col items-center">
              <GaugeChart value={selectedZone.co2} max={1000} label="ppm" thresholds={{ warning: 600, critical: 700 }} />
              <span className="text-sm text-gray-400 mt-2">CO2</span>
            </div>
            <div className="flex flex-col items-center">
              <GaugeChart value={selectedZone.co} max={50} label="ppm" thresholds={{ warning: 9, critical: 35 }} />
              <span className="text-sm text-gray-400 mt-2">CO</span>
            </div>
            <div className="flex flex-col items-center">
              <GaugeChart value={selectedZone.pm25} max={50} label="ug/m3" thresholds={{ warning: 15, critical: 25 }} />
              <span className="text-sm text-gray-400 mt-2">PM2.5</span>
            </div>
            <div className="flex flex-col items-center">
              <GaugeChart value={selectedZone.voc} max={300} label="ppb" thresholds={{ warning: 150, critical: 200 }} />
              <span className="text-sm text-gray-400 mt-2">VOC</span>
            </div>
            <div className="flex flex-col items-center">
              <GaugeChart value={getAirQualityScore(selectedZone)} max={100} label="AQI" color="#22c55e" />
              <span className="text-sm text-gray-400 mt-2">Air Quality</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <MetricCard
              title="Carbon Monoxide (CO)"
              value={selectedZone.co}
              unit="ppm"
              icon={<AlertTriangle className="w-5 h-5" />}
              status={selectedZone.co > 35 ? 'critical' : selectedZone.co > 9 ? 'warning' : 'normal'}
              subtitle="Safe range: 0-9 ppm"
            />
          </div>

          <div className="space-y-4">
            <ComfortBand value={selectedZone.temp} min={15} max={30} optimalMin={21} optimalMax={24} label="Temperature" unit="C" />
            <ComfortBand value={selectedZone.humidity} min={20} max={80} optimalMin={40} optimalMax={60} label="Humidity" unit="%" />
            <ComfortBand value={selectedZone.co2} min={300} max={1000} optimalMin={400} optimalMax={600} label="CO2" unit="ppm" />
            <ComfortBand value={selectedZone.co} min={0} max={50} optimalMin={0} optimalMax={9} label="Carbon Monoxide (CO)" unit="ppm" />
            <ComfortBand value={selectedZone.pm25} min={0} max={50} optimalMin={0} optimalMax={15} label="PM2.5" unit="ug/m3" />
          </div>
        </Card>

        <Card>
          <SectionHeader title="IEQ Alerts" />
          {zonesWithAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mb-4" />
              <p className="text-white font-medium">All Clear</p>
              <p className="text-sm text-gray-400 mt-1">All zones within acceptable IEQ parameters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {zonesWithAlerts.map((zone) => {
                const issues = [];
                if (zone.co2 > 700) issues.push('High CO2');
                if (zone.co > 35) issues.push('High CO');
                if (zone.pm25 > 25) issues.push('High PM2.5');
                if (zone.voc > 200) issues.push('High VOC');
                if (Math.abs(zone.temp - zone.targetTemp) > 2) issues.push('Temp deviation');

                return (
                  <motion.div
                    key={zone.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-red-950/20 border border-red-800/50 rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-white font-medium">{zone.name}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {issues.map((issue) => (
                            <Badge key={issue} variant="danger">
                              {issue}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-800">
            <SectionHeader title="IEQ Standards" />
            <div className="space-y-3 text-sm">
              {[
                { label: 'CO2', optimal: '< 600 ppm', warning: '600-700 ppm', critical: '> 700 ppm' },
                { label: 'CO', optimal: '0-9 ppm', warning: '10-35 ppm', critical: '> 35 ppm' },
                { label: 'PM2.5', optimal: '< 15 ug/m3', warning: '15-25 ug/m3', critical: '> 25 ug/m3' },
                { label: 'Temperature', optimal: '21-24C', warning: '+/-2C', critical: '+/-3C' },
                { label: 'Humidity', optimal: '40-60%', warning: '+/-10%', critical: '+/-20%' },
              ].map((standard) => (
                <div key={standard.label} className="p-3 bg-gray-800/50 rounded-lg">
                  <div className="font-medium text-white mb-1">{standard.label}</div>
                  <div className="flex gap-4 text-xs">
                    <span className="text-green-400">OK {standard.optimal}</span>
                    <span className="text-yellow-400">Warn {standard.warning}</span>
                    <span className="text-red-400">Alert {standard.critical}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
