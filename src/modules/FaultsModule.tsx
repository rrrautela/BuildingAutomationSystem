import { useBASStore } from '../store/basStore';
import { Card, SectionHeader, MetricCard } from '../components/ui/Card';
import { Button, Badge } from '../components/ui/Controls';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Wrench,
  Eye,
  XCircle,
} from 'lucide-react';

export const FaultsModule = () => {
  const { faults, acknowledgeFault, resolveFault } = useBASStore();

  const activeFaults = faults.filter((f) => !f.resolved);
  const unacknowledged = faults.filter((f) => !f.acknowledged && !f.resolved);
  const totalPotentialSavings = activeFaults.reduce((sum, f) => sum + (f.estimatedSavings || 0), 0);

  const severityConfig = {
    critical: {
      icon: XCircle,
      bg: 'bg-red-950/30',
      border: 'border-red-800/50',
      iconColor: 'text-red-400',
      badge: 'danger' as const,
    },
    high: {
      icon: AlertTriangle,
      bg: 'bg-orange-950/30',
      border: 'border-orange-800/50',
      iconColor: 'text-orange-400',
      badge: 'warning' as const,
    },
    medium: {
      icon: AlertCircle,
      bg: 'bg-yellow-950/30',
      border: 'border-yellow-800/50',
      iconColor: 'text-yellow-400',
      badge: 'warning' as const,
    },
    low: {
      icon: AlertCircle,
      bg: 'bg-blue-950/30',
      border: 'border-blue-800/50',
      iconColor: 'text-blue-400',
      badge: 'info' as const,
    },
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Faults"
          value={activeFaults.length}
          icon={<AlertTriangle className="w-5 h-5" />}
          status={activeFaults.length > 0 ? 'warning' : 'normal'}
        />
        <MetricCard
          title="Unacknowledged"
          value={unacknowledged.length}
          icon={<Eye className="w-5 h-5" />}
          status={unacknowledged.length > 0 ? 'critical' : 'normal'}
        />
        <MetricCard
          title="Potential Savings"
          value={totalPotentialSavings}
          unit="kWh/day"
          icon={<DollarSign className="w-5 h-5" />}
          subtitle="If faults resolved"
        />
        <MetricCard
          title="Resolved Today"
          value={faults.filter((f) => f.resolved).length}
          icon={<CheckCircle className="w-5 h-5" />}
          status="normal"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <SectionHeader
            title="Fault List"
            subtitle="Active faults requiring attention"
          />
          <div className="space-y-4">
            <AnimatePresence>
              {activeFaults.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
                  <h3 className="text-white font-semibold text-lg">No Active Faults</h3>
                  <p className="text-gray-400 text-sm mt-2">
                    All systems operating within normal parameters
                  </p>
                </motion.div>
              ) : (
                activeFaults.map((fault) => {
                  const config = severityConfig[fault.severity];
                  const Icon = config.icon;

                  return (
                    <motion.div
                      key={fault.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className={`p-4 rounded-lg border ${config.bg} ${config.border}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg bg-gray-900/50`}>
                          <Icon className={`w-5 h-5 ${config.iconColor}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white font-medium">{fault.type}</h3>
                            <Badge variant={config.badge}>{fault.severity}</Badge>
                            {!fault.acknowledged && (
                              <Badge variant="danger">New</Badge>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm">{fault.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Wrench className="w-3 h-3" />
                              {fault.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {fault.detectedAt}
                            </span>
                            {fault.estimatedSavings && (
                              <span className="flex items-center gap-1 text-green-400">
                                <DollarSign className="w-3 h-3" />
                                {fault.estimatedSavings} kWh/day savings
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!fault.acknowledged && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => acknowledgeFault(fault.id)}
                            >
                              Acknowledge
                            </Button>
                          )}
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => resolveFault(fault.id)}
                          >
                            Resolve
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </Card>

        <Card>
          <SectionHeader title="Fault Statistics" />
          <div className="space-y-4">
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <h4 className="text-sm text-gray-400 mb-3">By Severity</h4>
              <div className="space-y-2">
                {['critical', 'high', 'medium', 'low'].map((severity) => {
                  const count = faults.filter(
                    (f) => f.severity === severity && !f.resolved
                  ).length;
                  const config = severityConfig[severity as keyof typeof severityConfig];
                  return (
                    <div key={severity} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${config.iconColor.replace('text-', 'bg-')}`} />
                        <span className="text-gray-300 capitalize text-sm">{severity}</span>
                      </div>
                      <span className="text-white font-medium">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-gray-800/50 rounded-lg">
              <h4 className="text-sm text-gray-400 mb-3">By Type</h4>
              <div className="space-y-2">
                {[
                  { type: 'Sensor Drift', count: 1 },
                  { type: 'Stuck Damper', count: 1 },
                  { type: 'Filter Maintenance', count: 1 },
                  { type: 'Temperature Deviation', count: 0 },
                ].map((item) => (
                  <div key={item.type} className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">{item.type}</span>
                    <span className="text-white font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-gray-800/50 rounded-lg">
              <h4 className="text-sm text-gray-400 mb-3">Resolution Times</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Avg. Time to Acknowledge</span>
                  <span className="text-white">15 min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Avg. Time to Resolve</span>
                  <span className="text-white">4.2 hrs</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Oldest Active Fault</span>
                  <span className="text-white">1 day</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <SectionHeader
          title="Fault History"
          subtitle="Recently resolved faults"
        />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-400 border-b border-gray-800">
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Location</th>
                <th className="pb-3 font-medium">Severity</th>
                <th className="pb-3 font-medium">Detected</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {faults.map((fault) => {
                const config = severityConfig[fault.severity];
                return (
                  <tr key={fault.id} className="border-b border-gray-800/50">
                    <td className="py-3 text-white">{fault.type}</td>
                    <td className="py-3 text-gray-400">{fault.location}</td>
                    <td className="py-3">
                      <Badge variant={config.badge}>{fault.severity}</Badge>
                    </td>
                    <td className="py-3 text-gray-400">{fault.detectedAt}</td>
                    <td className="py-3">
                      {fault.resolved ? (
                        <Badge variant="success">Resolved</Badge>
                      ) : fault.acknowledged ? (
                        <Badge variant="info">Acknowledged</Badge>
                      ) : (
                        <Badge variant="danger">New</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
