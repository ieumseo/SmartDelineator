import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { motion } from 'motion/react';
import type { Incident } from '../App';

interface IncidentTableProps {
  incidents: Incident[];
  onIncidentClick: (incident: Incident) => void;
}

export function IncidentTable({ incidents, onIncidentClick }: IncidentTableProps) {
  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 1: return 'bg-red-50 text-red-600 border-red-200';
      case 2: return 'bg-orange-50 text-orange-600 border-orange-200';
      case 3: return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-red-50 text-red-600 border-red-200'
      : 'bg-green-50 text-green-600 border-green-200';
  };

  const sortedIncidents = [...incidents].sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

  const getDetectionBadge = (detectedBy: string) => {
    switch (detectedBy) {
      case 'cctv': return { label: 'CCTV', color: '#3b82f6' };
      case 'sensor': return { label: 'SENSOR', color: '#10b981' };
      case 'manual': return { label: 'MANUAL', color: '#f59e0b' };
      default: return { label: 'UNKNOWN', color: '#808080' };
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col shadow-sm h-full">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <h3 className="text-xs text-gray-700">INCIDENT LOG</h3>
      </div>

      {/* Table - Scrollable area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-50 backdrop-blur-sm z-10">
              <tr className="border-b border-gray-200">
                <th className="text-left p-2 text-gray-600">ID</th>
                <th className="text-left p-2 text-gray-600">Lane</th>
                <th className="text-left p-2 text-gray-600">Location</th>
                <th className="text-left p-2 text-gray-600">Severity</th>
                <th className="text-left p-2 text-gray-600">Status</th>
                <th className="text-left p-2 text-gray-600">Time</th>
              </tr>
            </thead>
            <tbody>
              {sortedIncidents.map((incident) => {
                const duration = incident.clearTime 
                  ? Math.floor((incident.clearTime.getTime() - incident.startTime.getTime()) / 1000)
                  : Math.floor((Date.now() - incident.startTime.getTime()) / 1000);
                
                const minutes = Math.floor(duration / 60);
                const seconds = duration % 60;
                
                const detectionInfo = getDetectionBadge(incident.detectedBy);

                return (
                  <motion.tr
                    key={incident.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => onIncidentClick(incident)}
                  >
                    <td className="p-2">
                      <span className="text-blue-600 font-mono">{incident.id}</span>
                    </td>
                    <td className="p-2">
                      <div className="flex flex-col">
                        <span className="text-gray-700 text-[10px]">Lane {incident.lane}</span>
                        <span className="text-gray-500 text-[9px]">{incident.direction === 'north' ? 'NB' : 'SB'}</span>
                      </div>
                    </td>
                    <td className="p-2 text-gray-700">{incident.location}</td>
                    <td className="p-2">
                      <Badge className={`${getSeverityColor(incident.severity)} text-[10px] px-2 py-0.5`}>
                        Level {incident.severity}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <Badge className={`${getStatusColor(incident.status)} text-[10px] px-2 py-0.5`}>
                        {incident.status === 'active' ? (
                          <span className="flex items-center gap-1">
                            <motion.span
                              className="h-1.5 w-1.5 rounded-full bg-red-500"
                              animate={{ opacity: [1, 0.3, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            />
                            ACTIVE
                          </span>
                        ) : (
                          'CLEARED'
                        )}
                      </Badge>
                    </td>
                    <td className="p-2 text-gray-600 font-mono text-[10px]">
                      {incident.startTime.toLocaleTimeString('en-US', { hour12: false })}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>

          {sortedIncidents.length === 0 && (
            <div className="flex items-center justify-center h-32 text-gray-500 text-xs">
              No incidents recorded
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 bg-gray-50 flex justify-between text-xs flex-shrink-0">
        <span className="text-gray-600">
          Active: <span className="text-red-600">{incidents.filter(i => i.status === 'active').length}</span>
        </span>
        <span className="text-gray-600">
          Total: <span className="text-gray-700">{incidents.length}</span>
        </span>
      </div>
    </div>
  );
}
