import { useBASStore } from '../store/basStore';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const AlertsPanel = () => {
  const { alerts, dismissAlert } = useBASStore();
  const activeAlerts = alerts.filter((a) => !a.dismissed);

  if (activeAlerts.length === 0) return null;

  const alertConfig = {
    critical: {
      icon: AlertTriangle,
      bg: 'bg-red-950/30',
      border: 'border-red-800/50',
      iconColor: 'text-red-400',
    },
    warning: {
      icon: AlertCircle,
      bg: 'bg-yellow-950/30',
      border: 'border-yellow-800/50',
      iconColor: 'text-yellow-400',
    },
    info: {
      icon: Info,
      bg: 'bg-blue-950/30',
      border: 'border-blue-800/50',
      iconColor: 'text-blue-400',
    },
  };

  return (
    <div className="mb-6 space-y-3">
      <AnimatePresence>
        {activeAlerts.slice(0, 3).map((alert) => {
          const config = alertConfig[alert.type];
          const Icon = config.icon;

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 100, height: 0 }}
              transition={{ duration: 0.3 }}
              className={`p-4 rounded-lg border flex items-start gap-3 ${config.bg} ${config.border}`}
            >
              <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.iconColor}`} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white">{alert.title}</div>
                <div className="text-sm text-gray-400 mt-1">{alert.message}</div>
                <div className="text-xs text-gray-500 mt-2">{alert.time}</div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => dismissAlert(alert.id)}
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </motion.div>
          );
        })}
      </AnimatePresence>
      {activeAlerts.length > 3 && (
        <p className="text-sm text-gray-500 text-center">
          +{activeAlerts.length - 3} more alerts
        </p>
      )}
    </div>
  );
};
