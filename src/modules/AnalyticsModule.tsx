import { useBASStore } from '../store/basStore';
import { Card, SectionHeader, MetricCard } from '../components/ui/Card';
import { EnergyTimeSeriesChart } from '../components/ui/Charts';
import { Button, Badge, ProgressBar } from '../components/ui/Controls';
import { motion } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  Zap,
  Cloud,
  ThermometerSun,
  Lightbulb,
  CheckCircle,
  Clock,
  DollarSign,
} from 'lucide-react';

export const AnalyticsModule = () => {
  const { optimizations, implementOptimization, weatherData, timeSeriesData, energyData } = useBASStore();

  const totalSavings = optimizations.reduce((sum, o) => sum + o.estimatedSavings, 0);
  const implementedSavings = optimizations
    .filter((o) => o.implemented)
    .reduce((sum, o) => sum + o.estimatedSavings, 0);
  const pendingSavings = totalSavings - implementedSavings;

  const priorityConfig = {
    high: { color: 'text-red-400', bg: 'bg-red-500/20', badge: 'danger' as const },
    medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', badge: 'warning' as const },
    low: { color: 'text-blue-400', bg: 'bg-blue-500/20', badge: 'info' as const },
  };

  const categoryIcons = {
    hvac: ThermometerSun,
    lighting: Lightbulb,
    scheduling: Clock,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="AI Suggestions"
          value={optimizations.filter((o) => !o.implemented).length}
          icon={<Brain className="w-5 h-5" />}
          subtitle="Pending review"
        />
        <MetricCard
          title="Potential Savings"
          value={pendingSavings}
          unit="kWh/day"
          icon={<DollarSign className="w-5 h-5" />}
          status="normal"
        />
        <MetricCard
          title="Implemented"
          value={optimizations.filter((o) => o.implemented).length}
          unit={`/ ${optimizations.length}`}
          icon={<CheckCircle className="w-5 h-5" />}
        />
        <MetricCard
          title="Forecast Accuracy"
          value={94.2}
          unit="%"
          icon={<TrendingUp className="w-5 h-5" />}
          status="normal"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <SectionHeader
            title="Load Prediction"
            subtitle="Weather-based energy consumption forecast"
          />
          <EnergyTimeSeriesChart data={timeSeriesData} />
          
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Cloud className="w-4 h-4" />
                <span className="text-sm">Weather Impact</span>
              </div>
              <div className="text-xl font-bold text-white">
                +{((weatherData.temp - 25) * 5).toFixed(0)} kW
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Due to {weatherData.temp}°C outdoor temp
              </p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Zap className="w-4 h-4" />
                <span className="text-sm">Peak Forecast</span>
              </div>
              <div className="text-xl font-bold text-white">
                {Math.max(...weatherData.forecast.map((f) => f.load))} kW
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Expected at 2:00 PM
              </p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Prediction Variance</span>
              </div>
              <div className="text-xl font-bold text-white">±5.8%</div>
              <p className="text-xs text-gray-500 mt-1">Model confidence</p>
            </div>
          </div>
        </Card>

        <Card>
          <SectionHeader title="Weather Forecast" />
          <div className="space-y-3">
            {weatherData.forecast.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm w-12">
                    {item.hour}:00
                  </span>
                  <ThermometerSun className="w-4 h-4 text-yellow-400" />
                  <span className="text-white">{item.temp}°C</span>
                </div>
                <span className="text-cyan-400 text-sm">{item.load} kW</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <SectionHeader
          title="Optimization Suggestions"
          subtitle="AI-powered recommendations for energy savings"
        />
        <div className="space-y-4">
          {optimizations.map((opt) => {
            const config = priorityConfig[opt.priority];
            const Icon = categoryIcons[opt.category];

            return (
              <motion.div
                key={opt.id}
                layout
                className={`p-4 rounded-lg border transition-colors ${
                  opt.implemented
                    ? 'border-green-800/50 bg-green-950/10'
                    : 'border-gray-800 bg-gray-900/50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${config.bg}`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-medium">{opt.title}</h3>
                      <Badge variant={config.badge}>{opt.priority}</Badge>
                      <Badge variant="default">{opt.category}</Badge>
                      {opt.implemented && <Badge variant="success">Implemented</Badge>}
                    </div>
                    <p className="text-gray-400 text-sm">{opt.description}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1 text-green-400">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {opt.estimatedSavings} kWh/day savings
                        </span>
                      </div>
                    </div>
                  </div>
                  {!opt.implemented && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => implementOptimization(opt.id)}
                    >
                      Implement
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <SectionHeader title="Savings Summary" />
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Implemented Savings</span>
                <span className="text-green-400 font-medium">{implementedSavings} kWh/day</span>
              </div>
              <ProgressBar
                value={implementedSavings}
                max={totalSavings}
                showValue={false}
                color="bg-green-500"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Pending Savings</span>
                <span className="text-yellow-400 font-medium">{pendingSavings} kWh/day</span>
              </div>
              <ProgressBar
                value={pendingSavings}
                max={totalSavings}
                showValue={false}
                color="bg-yellow-500"
              />
            </div>
            <div className="pt-4 border-t border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">Total Potential</span>
                <span className="text-cyan-400 font-bold text-lg">{totalSavings} kWh/day</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Estimated annual savings: {(totalSavings * 365).toLocaleString()} kWh
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <SectionHeader title="Model Performance" />
          <div className="space-y-4">
            {[
              { metric: 'Load Prediction', accuracy: 94.2 },
              { metric: 'Occupancy Detection', accuracy: 89.5 },
              { metric: 'Fault Detection', accuracy: 97.1 },
              { metric: 'Energy Baseline', accuracy: 91.8 },
            ].map((item) => (
              <div key={item.metric}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">{item.metric}</span>
                  <span
                    className={`font-medium ${
                      item.accuracy >= 95
                        ? 'text-green-400'
                        : item.accuracy >= 90
                        ? 'text-cyan-400'
                        : 'text-yellow-400'
                    }`}
                  >
                    {item.accuracy}%
                  </span>
                </div>
                <ProgressBar
                  value={item.accuracy}
                  max={100}
                  showValue={false}
                  color={
                    item.accuracy >= 95
                      ? 'bg-green-500'
                      : item.accuracy >= 90
                      ? 'bg-cyan-500'
                      : 'bg-yellow-500'
                  }
                  size="sm"
                />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
