import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { SystemStatus } from '../App';

interface TopBarProps {
  systemStatus: SystemStatus;
}

export function TopBar({ systemStatus }: TopBarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const statusColors = {
    normal: '#00FF7F',
    warning: '#FFA500',
    critical: '#FF4C4C',
  };

  const statusLabels = {
    normal: 'OPERATIONAL',
    warning: 'WARNING',
    critical: 'CRITICAL',
  };

  return (
    <div className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shadow-sm">
      {/* Title */}
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" fillOpacity="0.9" />
            <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <h1 className="text-gray-900">Smart Delineator Control Dashboard</h1>
          <p className="text-xs text-gray-500">Real-time Highway Incident Monitoring System</p>
        </div>
      </div>

      {/* Status and Time */}
      <div className="flex items-center gap-6">
        {/* System Status */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-gray-50 border border-gray-200">
          <span className="text-xs text-gray-600">SYSTEM STATUS</span>
          <div className="flex items-center gap-2">
            <motion.div
              className="relative h-3 w-3 rounded-full"
              style={{ backgroundColor: statusColors[systemStatus] }}
              animate={{
                boxShadow: [
                  `0 0 5px ${statusColors[systemStatus]}`,
                  `0 0 15px ${statusColors[systemStatus]}`,
                  `0 0 5px ${statusColors[systemStatus]}`,
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: statusColors[systemStatus] }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.8, 0, 0.8],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>
            <span 
              className="text-xs"
              style={{ color: statusColors[systemStatus] }}
            >
              {statusLabels[systemStatus]}
            </span>
          </div>
        </div>

        {/* Current Time */}
        <div className="flex flex-col items-end">
          <span className="text-xs text-gray-500">SYSTEM TIME</span>
          <span className="text-sm text-blue-600 font-mono">
            {currentTime.toLocaleTimeString('en-US', { hour12: false })}
          </span>
        </div>
      </div>
    </div>
  );
}
