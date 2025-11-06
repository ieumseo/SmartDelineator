import { motion, AnimatePresence } from 'motion/react';
import { Video, AlertTriangle, MapPin, Clock } from 'lucide-react';
import { Badge } from './ui/badge';
import type { Incident } from '../App';

interface CCTVFeedProps {
  activeIncident: Incident | undefined;
  onIncidentClick: (incident: Incident) => void;
}

export function CCTVFeed({ activeIncident, onIncidentClick }: CCTVFeedProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 flex flex-col shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <div>
          <h3 className="text-sm text-gray-700 flex items-center gap-2">
            <Video className="h-4 w-4" />
            CCTV LIVE FEED
          </h3>
          <p className="text-xs text-gray-500 mt-1">Highway Camera #01 - Real-time Monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.div
            className="h-2 w-2 rounded-full bg-red-500"
            animate={{
              opacity: [1, 0.3, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
          <span className="text-xs text-red-500">LIVE</span>
        </div>
      </div>

      {/* Video Feed Area */}
      <div className="flex-1 relative bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {/* Simulated CCTV Feed - Highway Background */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Highway lanes simulation */}
          <svg className="w-full h-full opacity-30" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
            {/* Road surface */}
            <rect x="0" y="200" width="800" height="200" fill="#4b5563" />
            
            {/* Lane markings - 6 lanes total */}
            <line x1="0" y1="233" x2="800" y2="233" stroke="#fbbf24" strokeWidth="2" strokeDasharray="30,20" opacity="0.8" />
            <line x1="0" y1="267" x2="800" y2="267" stroke="#fbbf24" strokeWidth="2" strokeDasharray="30,20" opacity="0.8" />
            <line x1="0" y1="300" x2="800" y2="300" stroke="#FFFFFF" strokeWidth="4" opacity="0.9" />
            <line x1="0" y1="333" x2="800" y2="333" stroke="#fbbf24" strokeWidth="2" strokeDasharray="30,20" opacity="0.8" />
            <line x1="0" y1="367" x2="800" y2="367" stroke="#fbbf24" strokeWidth="2" strokeDasharray="30,20" opacity="0.8" />
            
            {/* Edge lines */}
            <line x1="0" y1="200" x2="800" y2="200" stroke="#FFFFFF" strokeWidth="3" opacity="0.9" />
            <line x1="0" y1="400" x2="800" y2="400" stroke="#FFFFFF" strokeWidth="3" opacity="0.9" />

            {/* Animated car silhouettes - Korean road style (right-hand traffic) */}
            {/* North lanes - moving right to left */}
            <motion.rect
              x="800"
              y="215"
              width="60"
              height="30"
              fill="#1f2937"
              rx="5"
              animate={{ x: [800, -60] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />
            {/* South lanes - moving left to right */}
            <motion.rect
              x="-60"
              y="350"
              width="60"
              height="30"
              fill="#1f2937"
              rx="5"
              animate={{ x: [-60, 800] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            />
          </svg>

          {/* Subtle scanline effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent"
            animate={{
              y: [-600, 600],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>

        {/* CCTV Overlay Info */}
        <div className="absolute top-4 left-4 space-y-2 z-10">
          <div className="bg-gray-900/90 rounded px-2 py-1 text-xs font-mono text-green-500 shadow-sm">
            CAM-01 | Highway KM 12.5
          </div>
          <div className="bg-gray-900/90 rounded px-2 py-1 text-xs font-mono text-gray-300 shadow-sm">
            {new Date().toLocaleTimeString('en-US', { hour12: false })}
          </div>
        </div>

        {/* Detection Bounding Box - Only when incident active */}
        <AnimatePresence>
          {activeIncident && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0"
            >
              {/* Bounding box - positioned based on lane and direction */}
              <motion.div
                className="absolute"
                style={{
                  // Lane-specific positioning (within road boundaries)
                  // Lane 1 (innermost): 30%, Lane 2 (middle): 40%, Lane 3 (outermost): 50%
                  left: activeIncident.lane === 1 ? '30%' : activeIncident.lane === 2 ? '40%' : '50%',
                  // Direction-specific positioning: north = top lanes (33%), south = bottom lanes (58%)
                  top: activeIncident.direction === 'north' ? '33%' : '58%',
                  width: '10%', // Single lane width (reduced)
                  height: '8%', // Reduced height to fit within road
                }}
              >
                {/* Box border */}
                <motion.div
                  className="absolute inset-0 border-4 rounded-lg"
                  style={{
                    borderColor: activeIncident.severity === 1 ? '#FF4C4C' : activeIncident.severity === 2 ? '#FFA500' : '#FFD700',
                  }}
                  animate={{
                    borderColor: [
                      activeIncident.severity === 1 ? '#FF4C4C' : activeIncident.severity === 2 ? '#FFA500' : '#FFD700',
                      activeIncident.severity === 1 ? '#FF8C8C' : activeIncident.severity === 2 ? '#FFD580' : '#FFE680',
                      activeIncident.severity === 1 ? '#FF4C4C' : activeIncident.severity === 2 ? '#FFA500' : '#FFD700',
                    ],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                  }}
                />

                {/* Corner markers */}
                {[
                  { top: -2, left: -2 },
                  { top: -2, right: -2 },
                  { bottom: -2, left: -2 },
                  { bottom: -2, right: -2 },
                ].map((pos, i) => (
                  <div
                    key={i}
                    className="absolute h-4 w-4 border-2"
                    style={{
                      ...pos,
                      borderColor: activeIncident.severity === 1 ? '#FF4C4C' : activeIncident.severity === 2 ? '#FFA500' : '#FFD700',
                    }}
                  />
                ))}

                {/* Alert label */}
                <div
                  className="absolute -top-8 left-0 px-3 py-1 rounded text-xs flex items-center gap-2"
                  style={{
                    backgroundColor: `${activeIncident.severity === 1 ? '#FF4C4C' : activeIncident.severity === 2 ? '#FFA500' : '#FFD700'}20`,
                    border: `1px solid ${activeIncident.severity === 1 ? '#FF4C4C' : activeIncident.severity === 2 ? '#FFA500' : '#FFD700'}`,
                    color: activeIncident.severity === 1 ? '#FF4C4C' : activeIncident.severity === 2 ? '#FFA500' : '#FFD700',
                  }}
                >
                  <AlertTriangle className="h-3 w-3" />
                  <span>Lane {activeIncident.lane} ({activeIncident.direction === 'north' ? 'Northbound' : 'Southbound'})</span>
                  <Badge className="ml-1 text-[10px] px-1 py-0">
                    Level {activeIncident.severity}
                  </Badge>
                </div>

                {/* Detection confidence */}
                <div className="absolute -bottom-6 left-0 text-xs text-gray-600">
                  Confidence: <span className="text-green-600">95.2%</span>
                </div>
              </motion.div>

              {/* Incident details overlay */}
              <motion.button
                onClick={() => onIncidentClick(activeIncident)}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-lg p-4 border-2 border-red-200 hover:border-red-400 transition-colors cursor-pointer shadow-lg"
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <div className="text-left">
                    <div className="text-sm text-gray-900 mb-1">Active Incident: {activeIncident.id}</div>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {activeIncident.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {Math.floor((Date.now() - activeIncident.startTime.getTime()) / 1000)}s ago
                      </span>
                    </div>
                  </div>
                </div>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status when no incident */}
        {!activeIncident && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 border border-gray-200 shadow-lg">
              <div className="text-center">
                <Video className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-700">Monitoring Active</p>
                <p className="text-xs text-gray-500 mt-1">No incidents detected</p>
              </div>
            </div>
          </div>
        )}

        {/* Subtle grid overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="w-full h-full opacity-[0.03]"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #3b82f6 2px, #3b82f6 3px)',
            }}
          />
        </div>
      </div>

      {/* Footer stats */}
      <div className="p-2 border-t border-gray-200 bg-gray-50 flex justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Detection Mode:</span>
          <span className="text-green-600">AI-Powered</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">FPS:</span>
          <span className="text-blue-600">30</span>
        </div>
      </div>
    </div>
  );
}
