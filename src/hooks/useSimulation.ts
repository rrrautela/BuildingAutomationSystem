import { useEffect, useRef } from 'react';
import { useBASStore } from '../store/basStore';

export const useSimulation = (intervalMs: number = 3000) => {
  const tick = useBASStore((state) => state.tick);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      tick();
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [tick, intervalMs]);
};

export const useRealTimeClock = () => {
  const currentTime = useBASStore((state) => state.currentTime);
  
  useEffect(() => {
    const interval = setInterval(() => {
      useBASStore.setState({ currentTime: new Date() });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return currentTime;
};
