import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
  unit?: string;
  disabled?: boolean;
}

export const Slider = ({ value, min, max, step = 1, onChange, label, unit, disabled }: SliderProps) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">{label}</span>
          <span className="text-sm font-medium text-white">
            {value}{unit}
          </span>
        </div>
      )}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-cyan-500
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110"
          style={{
            background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${percentage}%, #1f2937 ${percentage}%, #1f2937 100%)`,
          }}
        />
      </div>
    </div>
  );
};

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const Toggle = ({ enabled, onChange, label, disabled }: ToggleProps) => (
  <div
    className={
      label
        ? 'flex items-center justify-between w-full'
        : 'inline-flex items-center'
    }
  >
    {label && <span className="text-sm text-gray-400">{label}</span>}
    <button
      type="button"
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
        enabled ? 'bg-cyan-600' : 'bg-gray-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <motion.div
        className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md"
        animate={{ x: enabled ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  </div>
);

interface SegmentedControlProps {
  options: { value: string; label: string; icon?: ReactNode }[];
  value: string;
  onChange: (value: string) => void;
}

export const SegmentedControl = ({ options, value, onChange }: SegmentedControlProps) => (
  <div className="inline-flex p-1 bg-gray-800 rounded-lg">
    {options.map((option) => (
      <button
        key={option.value}
        onClick={() => onChange(option.value)}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
          value === option.value
            ? 'bg-cyan-600 text-white'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        {option.icon}
        {option.label}
      </button>
    ))}
  </div>
);

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  icon?: ReactNode;
  className?: string;
}

export const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled,
  icon,
  className = '',
}: ButtonProps) => {
  const variants = {
    primary: 'bg-cyan-600 hover:bg-cyan-700 text-white',
    secondary: 'bg-gray-800 hover:bg-gray-700 text-gray-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'bg-transparent hover:bg-gray-800 text-gray-400 hover:text-white',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {icon}
      {children}
    </motion.button>
  );
};

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export const Select = ({ options, value, onChange, label }: SelectProps) => (
  <div className="space-y-2">
    {label && <span className="text-sm text-gray-400">{label}</span>}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none appearance-none cursor-pointer"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        backgroundSize: '16px',
      }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

interface ListItemProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  onClick?: () => void;
  status?: 'normal' | 'warning' | 'critical' | 'success';
}

export const ListItem = ({ title, subtitle, icon, action, onClick, status = 'normal' }: ListItemProps) => {
  const statusColors = {
    normal: 'border-gray-800 hover:border-gray-700',
    warning: 'border-yellow-800/50 hover:border-yellow-700/50 bg-yellow-950/10',
    critical: 'border-red-800/50 hover:border-red-700/50 bg-red-950/10',
    success: 'border-green-800/50 hover:border-green-700/50 bg-green-950/10',
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-4 p-4 border rounded-lg transition-colors ${statusColors[status]} ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {icon && <div className="flex-shrink-0">{icon}</div>}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{title}</p>
        {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
      </div>
      {action || (onClick && <ChevronRight className="w-4 h-4 text-gray-500" />)}
    </div>
  );
};

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export const Badge = ({ children, variant = 'default' }: BadgeProps) => {
  const variants = {
    default: 'bg-gray-800 text-gray-300',
    success: 'bg-green-900/50 text-green-400',
    warning: 'bg-yellow-900/50 text-yellow-400',
    danger: 'bg-red-900/50 text-red-400',
    info: 'bg-cyan-900/50 text-cyan-400',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
};

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showValue?: boolean;
  color?: string; // Tailwind class (e.g. "bg-cyan-500") or CSS color (e.g. "#06b6d4")
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressBar = ({
  value,
  max,
  label,
  showValue = true,
  color = 'bg-cyan-500',
  size = 'md',
}: ProgressBarProps) => {
  const safeMax = max > 0 ? max : 0;
  const percentage = safeMax > 0 ? Math.min((value / safeMax) * 100, 100) : 0;
  const heights = { sm: 'h-1', md: 'h-2', lg: 'h-3' };
  const trimmedColor = color.trim();
  const isCssColor =
    trimmedColor.startsWith('#') ||
    trimmedColor.startsWith('rgb(') ||
    trimmedColor.startsWith('hsl(') ||
    trimmedColor.startsWith('var(');

  return (
    <div className="space-y-1">
      {(label || showValue) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="text-gray-400">{label}</span>}
          {showValue && (
            <span className="text-gray-300">
              {value.toFixed(0)} / {max}
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-800 rounded-full ${heights[size]} overflow-hidden`}>
        <motion.div
          className={`h-full rounded-full ${isCssColor ? '' : color}`}
          style={isCssColor ? { backgroundColor: color } : undefined}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};
