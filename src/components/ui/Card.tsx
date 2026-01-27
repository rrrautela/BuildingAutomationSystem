import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: 'cyan' | 'green' | 'red' | 'yellow' | 'none';
}

export const Card = ({ children, className = '', hover = false, glow = 'none' }: CardProps) => {
  const glowClasses = {
    cyan: 'hover:shadow-cyan-500/20 hover:shadow-lg',
    green: 'hover:shadow-green-500/20 hover:shadow-lg',
    red: 'hover:shadow-red-500/20 hover:shadow-lg',
    yellow: 'hover:shadow-yellow-500/20 hover:shadow-lg',
    none: '',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-4 ${
        hover ? 'hover:border-gray-700 transition-all duration-300' : ''
      } ${glowClasses[glow]} ${className}`}
    >
      {children}
    </motion.div>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  status?: 'normal' | 'warning' | 'critical';
  subtitle?: string;
}

export const MetricCard = ({
  title,
  value,
  unit,
  icon,
  trend,
  trendValue,
  status = 'normal',
  subtitle,
}: MetricCardProps) => {
  const statusColors = {
    normal: 'text-green-400',
    warning: 'text-yellow-400',
    critical: 'text-red-400',
  };

  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-gray-400',
  };

  return (
    <Card hover className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">{title}</p>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold ${statusColors[status]}`}>
              {typeof value === 'number' ? value.toFixed(1) : value}
            </span>
            {unit && <span className="text-gray-500 text-sm">{unit}</span>}
          </div>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${trendColors[trend]}`}>
              {trend === 'up' && '↑'}
              {trend === 'down' && '↓'}
              {trend === 'neutral' && '→'}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`p-2 rounded-lg bg-gray-800/50 ${statusColors[status]}`}>
          {icon}
        </div>
      </div>
      {status === 'critical' && (
        <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
      )}
    </Card>
  );
};

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export const SectionHeader = ({ title, subtitle, action }: SectionHeaderProps) => (
  <div className="flex items-center justify-between mb-4">
    <div>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
    </div>
    {action}
  </div>
);
