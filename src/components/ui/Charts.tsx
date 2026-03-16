import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = {
  cyan: '#06b6d4',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
  purple: '#a855f7',
  orange: '#f97316',
  gray: '#6b7280',
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
      <p className="text-gray-400 text-sm mb-2">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {entry.value.toFixed(1)}
        </p>
      ))}
    </div>
  );
};

interface EnergyTimeSeriesChartProps {
  data: { time: string; consumption: number; solar: number; prediction: number }[];
}

export const EnergyTimeSeriesChart = ({ data }: EnergyTimeSeriesChartProps) => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.3} />
          <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0} />
        </linearGradient>
        <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={COLORS.yellow} stopOpacity={0.3} />
          <stop offset="95%" stopColor={COLORS.yellow} stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
      <XAxis dataKey="time" stroke="#6b7280" tick={{ fontSize: 11 }} />
      <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
      <Tooltip content={<CustomTooltip />} />
      <Legend wrapperStyle={{ fontSize: 12 }} />
      <Area
        type="monotone"
        dataKey="consumption"
        name="Consumption"
        stroke={COLORS.cyan}
        fill="url(#colorConsumption)"
        strokeWidth={2}
      />
      <Area
        type="monotone"
        dataKey="solar"
        name="Solar"
        stroke={COLORS.yellow}
        fill="url(#colorSolar)"
        strokeWidth={2}
      />
      <Line
        type="monotone"
        dataKey="prediction"
        name="Prediction"
        stroke={COLORS.purple}
        strokeDasharray="5 5"
        strokeWidth={2}
        dot={false}
      />
    </AreaChart>
  </ResponsiveContainer>
);

interface EnergyBreakdownChartProps {
  data: { name: string; value: number; color: string }[];
}

export const EnergyBreakdownChart = ({ data }: EnergyBreakdownChartProps) => (
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        innerRadius={50}
        outerRadius={80}
        paddingAngle={2}
        dataKey="value"
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Pie>
      <Tooltip content={<CustomTooltip />} />
    </PieChart>
  </ResponsiveContainer>
);

interface LoadProfileChartProps {
  data: { time: string; hvac: number; lighting: number; plugLoads: number }[];
}

export const LoadProfileChart = ({ data }: LoadProfileChartProps) => (
  <ResponsiveContainer width="100%" height={250}>
    <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
      <XAxis dataKey="time" stroke="#6b7280" tick={{ fontSize: 11 }} />
      <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
      <Tooltip content={<CustomTooltip />} />
      <Legend wrapperStyle={{ fontSize: 12 }} />
      <Bar dataKey="hvac" name="HVAC" stackId="a" fill={COLORS.cyan} />
      <Bar dataKey="lighting" name="Lighting" stackId="a" fill={COLORS.yellow} />
      <Bar dataKey="plugLoads" name="Plug Loads" stackId="a" fill={COLORS.purple} />
    </BarChart>
  </ResponsiveContainer>
);

interface GaugeChartProps {
  value: number;
  max: number;
  label: string;
  color?: string;
  thresholds?: { warning: number; critical: number };
}

export const GaugeChart = ({ value, max, label, color = COLORS.cyan, thresholds }: GaugeChartProps) => {
  const percentage = (value / max) * 100;
  let displayColor = color;
  
  if (thresholds) {
    if (value >= thresholds.critical) displayColor = COLORS.red;
    else if (value >= thresholds.warning) displayColor = COLORS.yellow;
    else displayColor = COLORS.green;
  }
  
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference * 0.75;

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full transform -rotate-135" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#374151"
          strokeWidth="8"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={displayColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-white">{value.toFixed(0)}</span>
        <span className="text-xs text-gray-400">{label}</span>
      </div>
    </div>
  );
};

interface ComfortBandProps {
  value: number;
  min: number;
  max: number;
  optimalMin: number;
  optimalMax: number;
  label: string;
  unit: string;
}

export const ComfortBand = ({ value, min, max, optimalMin, optimalMax, label, unit }: ComfortBandProps) => {
  const range = max - min;
  const valuePos = ((value - min) / range) * 100;
  const optimalStartPos = ((optimalMin - min) / range) * 100;
  const optimalWidth = ((optimalMax - optimalMin) / range) * 100;
  
  const isOptimal = value >= optimalMin && value <= optimalMax;
  const isWarning = !isOptimal && (value >= optimalMin - (optimalMin - min) * 0.3 || value <= optimalMax + (max - optimalMax) * 0.3);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">{label}</span>
        <span className={`text-sm font-medium ${isOptimal ? 'text-green-400' : isWarning ? 'text-yellow-400' : 'text-red-400'}`}>
          {value.toFixed(1)} {unit}
        </span>
      </div>
      <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="absolute h-full bg-green-500/30 rounded-full"
          style={{ left: `${optimalStartPos}%`, width: `${optimalWidth}%` }}
        />
        <div
          className={`absolute w-3 h-3 rounded-full transform -translate-x-1/2 transition-all duration-300 ${
            isOptimal ? 'bg-green-500' : isWarning ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ left: `${Math.max(5, Math.min(95, valuePos))}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};
