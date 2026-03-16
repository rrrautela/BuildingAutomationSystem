import { useMemo } from 'react';
import { useBASStore } from '../store/basStore';
import { Card, SectionHeader, MetricCard } from '../components/ui/Card';
import { Toggle, Badge, Button, Select } from '../components/ui/Controls';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Sun,
  Moon,
  AlertTriangle,
  Play,
  Pause,
  Plus,
  Settings,
} from 'lucide-react';

export const SchedulingModule = () => {
  const {
    schedules,
    toggleSchedule,
    isPeakHours,
    zones,
    isHolidayMode,
    toggleHolidayMode,
    afterHoursDuration,
    setAfterHoursDuration,
    requestAfterHoursOverride,
    activateNightSetback,
    overrideMode,
    overrideUntil,
  } = useBASStore();

  const activeSchedules = schedules.filter((s) => s.active).length;
  const currentHour = new Date().getHours();
  const overrideLabel = useMemo(() => {
    if (!overrideMode || !overrideUntil) return null;
    const until = new Date(overrideUntil);
    return `${overrideMode === 'occupied' ? 'Occupied override' : 'Night setback'} until ${until.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }, [overrideMode, overrideUntil]);

  const getCurrentSchedule = () => {
    if (isHolidayMode) return { name: 'Holiday Mode' };
    if (overrideMode === 'occupied') return { name: 'After-Hours Override' };
    if (overrideMode === 'night-setback') return { name: 'Night Setback Override' };

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const currentDay = now.getDay();

    return schedules.find((s) => {
      if (!s.active || !s.days.includes(currentDay)) return false;

      const [startHour, startMinute] = s.startTime.split(':').map(Number);
      const [endHour, endMinute] = s.endTime.split(':').map(Number);
      const start = startHour * 60 + startMinute;
      const end = endHour * 60 + endMinute;

      return start <= end
        ? currentMinutes >= start && currentMinutes <= end
        : currentMinutes >= start || currentMinutes <= end;
    });
  };

  const currentSchedule = getCurrentSchedule();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const timelineItems = isHolidayMode
    ? [
        { time: '00:00', event: 'Holiday Mode', mode: 'holiday', active: true },
        { time: '09:00', event: 'HVAC is off', mode: 'holiday', active: true },
        { time: '18:00', event: 'HVAC is off', mode: 'holiday', active: true },
        { time: '22:00', event: 'HVAC is off', mode: 'holiday', active: true },
      ]
    : [
        { time: '06:00', event: 'Pre-Cool Start', mode: 'auto', active: currentHour >= 6 },
        { time: '09:00', event: 'Business Hours', mode: 'occupied', active: currentHour >= 9 },
        { time: '13:00', event: 'Peak Hours Start', mode: 'peak', active: currentHour >= 13 },
        { time: '16:00', event: 'Peak Hours End', mode: 'normal', active: currentHour >= 16 },
        { time: '18:00', event: 'After Hours', mode: 'reduced', active: currentHour >= 18 },
        { time: '22:00', event: 'Night Setback', mode: 'night', active: currentHour >= 22 },
      ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Active Schedules" value={activeSchedules} unit={`/ ${schedules.length}`} icon={<Calendar className="w-5 h-5" />} />
        <MetricCard title="Current Mode" value={currentSchedule?.name || 'Manual'} icon={<Settings className="w-5 h-5" />} status="normal" />
        <MetricCard
          title="Peak Hours"
          value={isPeakHours ? 'Active' : 'Inactive'}
          icon={isPeakHours ? <AlertTriangle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
          status={isPeakHours ? 'warning' : 'normal'}
          subtitle="1:00 PM - 4:00 PM"
        />
        <MetricCard
          title="After Hours"
          value={currentHour < 9 || currentHour >= 18 ? 'Yes' : 'No'}
          icon={currentHour < 9 || currentHour >= 18 ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        />
      </div>

      {(isHolidayMode || overrideLabel) && (
        <div className="flex flex-wrap gap-3">
          {isHolidayMode && <Badge variant="info">Holiday Mode Active</Badge>}
          {overrideLabel && <Badge variant="warning">{overrideLabel}</Badge>}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <Card className="lg:col-span-2 h-full">
          <SectionHeader
            title="Schedule Management"
            action={
              <Button variant="secondary" icon={<Plus className="w-4 h-4" />}>
                Add Schedule
              </Button>
            }
          />
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <motion.div
                key={schedule.id}
                layout
                className={`p-4 rounded-lg border transition-colors ${
                  schedule.active ? 'border-cyan-800/50 bg-cyan-950/10' : 'border-gray-800 bg-gray-900/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${schedule.active ? 'bg-cyan-500/20' : 'bg-gray-800'}`}>
                      {schedule.mode === 'night-setback' ? (
                        <Moon className={`w-5 h-5 ${schedule.active ? 'text-cyan-400' : 'text-gray-500'}`} />
                      ) : (
                        <Sun className={`w-5 h-5 ${schedule.active ? 'text-cyan-400' : 'text-gray-500'}`} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-medium">{schedule.name}</h3>
                        {currentSchedule?.name === schedule.name && !isHolidayMode && <Badge variant="success">Active Now</Badge>}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {schedule.startTime} - {schedule.endTime}
                        </span>
                        {isHolidayMode || schedule.mode === 'night-setback' ? (
                          <span className="text-gray-400">HVAC is off</span>
                        ) : (
                          <span>Target: 26-30C</span>
                        )}
                        <span className="capitalize">Mode: {isHolidayMode ? 'holiday' : schedule.mode}</span>
                      </div>
                    </div>
                  </div>
                  <Toggle enabled={schedule.active} onChange={() => toggleSchedule(schedule.id)} />
                </div>

                <div className="flex gap-2 mt-4">
                  {weekDays.map((day, index) => (
                    <div
                      key={day}
                      className={`w-10 h-8 flex items-center justify-center rounded text-xs font-medium ${
                        schedule.days.includes(index) ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-500'
                      }`}
                    >
                      {day}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        <Card className="h-full">
          <SectionHeader title="Today's Timeline" />
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-800" />
            <div className="space-y-6">
              {timelineItems.map((item, index) => (
                <div key={index} className="relative pl-10">
                  <div
                    className={`absolute left-2.5 w-3 h-3 rounded-full border-2 ${
                      item.active ? 'bg-cyan-500 border-cyan-500' : 'bg-gray-900 border-gray-600'
                    }`}
                  />
                  <div className={`p-3 rounded-lg ${item.active ? 'bg-gray-800/80' : 'bg-gray-900/50'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${item.active ? 'text-white' : 'text-gray-500'}`}>{item.time}</span>
                      <Badge variant={item.mode === 'peak' ? 'warning' : item.mode === 'holiday' ? 'info' : item.active ? 'info' : 'default'}>
                        {item.mode}
                      </Badge>
                    </div>
                    <p className={`text-sm mt-1 ${item.active ? 'text-gray-300' : 'text-gray-600'}`}>{item.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <SectionHeader title="Override Controls" subtitle="Temporarily override scheduled operation" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-800/50 rounded-lg">
            <h4 className="text-white font-medium mb-3">Quick Override</h4>
            <div className="space-y-3">
              <Button variant="secondary" className="w-full" icon={<Play className="w-4 h-4" />} onClick={requestAfterHoursOverride}>
                Extend Occupied Mode (2hr)
              </Button>
              <Button variant="secondary" className="w-full" icon={<Pause className="w-4 h-4" />} onClick={activateNightSetback}>
                Start Night Setback Now
              </Button>
            </div>
          </div>

          <div className="p-4 bg-gray-800/50 rounded-lg">
            <h4 className="text-white font-medium mb-3">After-Hours Request</h4>
            <p className="text-sm text-gray-400 mb-3">Request HVAC operation outside scheduled hours</p>
            <Select
              label="Duration"
              options={[
                { value: '1', label: '1 Hour' },
                { value: '2', label: '2 Hours' },
                { value: '4', label: '4 Hours' },
              ]}
              value={afterHoursDuration}
              onChange={setAfterHoursDuration}
            />
            <Button className="w-full mt-3" variant="primary" onClick={requestAfterHoursOverride}>
              Submit Request
            </Button>
          </div>

          <div className="p-4 bg-gray-800/50 rounded-lg">
            <h4 className="text-white font-medium mb-3">Holiday Mode</h4>
            <p className="text-sm text-gray-400 mb-3">Set building to unoccupied mode for holidays</p>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">Enable Holiday Mode</span>
              <Toggle enabled={isHolidayMode} onChange={toggleHolidayMode} />
            </div>
            <Button
              className={`w-full ${isHolidayMode ? 'bg-cyan-600 text-white' : ''}`}
              variant={isHolidayMode ? 'primary' : 'secondary'}
              onClick={toggleHolidayMode}
            >
              {isHolidayMode ? 'Disable Holiday Mode' : 'Enable Holiday Mode'}
            </Button>
            <p className="text-xs text-gray-500 mt-3">Reduces HVAC and lighting to minimum levels</p>
          </div>
        </div>
      </Card>

      {(currentHour < 9 || currentHour >= 18) && zones.some((z) => z.occupied) && !isHolidayMode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-yellow-950/30 border border-yellow-800/50 rounded-lg"
        >
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-yellow-400 font-semibold">After-Hours Activity Detected</h3>
              <p className="text-gray-400 text-sm mt-1">
                {zones.filter((z) => z.occupied).length} zone(s) show occupancy during after-hours
                period. Consider reviewing schedules or submitting an after-hours request.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
