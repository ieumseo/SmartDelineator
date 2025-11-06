import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import type { Event } from '../App';

interface EventFeedProps {
  events: Event[];
}

export function EventFeed({ events }: EventFeedProps) {
  const getEventIcon = (type: Event['type']) => {
    switch (type) {
      case 'accident': return AlertCircle;
      case 'cleared': return CheckCircle;
      case 'node_offline': return AlertTriangle;
      case 'node_warning': return AlertTriangle;
      case 'system': return Info;
      default: return Info;
    }
  };

  const getSeverityColor = (severity: Event['severity']) => {
    switch (severity) {
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#3b82f6';
    }
  };

  return (
    <div className="w-80 bg-white rounded-2xl border border-gray-200 flex flex-col shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <h3 className="text-sm text-gray-700">REAL-TIME EVENT FEED</h3>
        <p className="text-xs text-gray-500 mt-1">Live system activity log</p>
      </div>

      {/* Events list */}
      <ScrollArea className="flex-1 p-2">
        <div className="pr-2">
          <AnimatePresence initial={false}>
            {events.map((event, index) => {
              const Icon = getEventIcon(event.type);
              const color = getSeverityColor(event.severity);
              
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: 20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, x: -20, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-2"
                >
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-gray-300 transition-colors overflow-hidden">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div 
                        className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: `${color}15`,
                          border: `1px solid ${color}40`,
                        }}
                      >
                        <Icon className="h-4 w-4" style={{ color }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 leading-relaxed break-words whitespace-pre-wrap" style={{ overflowWrap: 'anywhere' }}>
                          {event.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-[10px] text-gray-500">
                            {event.timestamp.toLocaleTimeString('en-US', { 
                              hour12: false,
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                          {index === 0 && (
                            <motion.span
                              className="text-[10px] text-blue-600 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.2 }}
                            >
                              NEW
                            </motion.span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {events.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
              <Info className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-xs text-center">No events recorded</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer stats */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 flex justify-between text-xs flex-shrink-0">
        <span className="text-gray-600">Total Events</span>
        <span className="text-blue-600">{events.length}</span>
      </div>
    </div>
  );
}
