import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Battery, BatteryLow, Wifi } from 'lucide-react';
import { motion } from 'motion/react';
import type { Node } from '../App';

interface NodeTableProps {
  nodes: Node[];
  onNodeClick: (node: Node) => void;
}

export function NodeTable({ nodes, onNodeClick }: NodeTableProps) {
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'ok': return 'bg-green-50 text-green-600 border-green-200';
      case 'warn': return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'error': return 'bg-red-50 text-red-600 border-red-200';
      case 'offline': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getBatteryIcon = (battery: number) => {
    return battery > 20 ? Battery : BatteryLow;
  };

  const getBatteryColor = (battery: number) => {
    if (battery > 50) return '#10b981';
    if (battery > 20) return '#f59e0b';
    return '#ef4444';
  };

  const getLEDColorName = (color: string) => {
    switch (color) {
      case 'red': return 'RED';
      case 'green': return 'GREEN';
      case 'blue': return 'BLUE';
      case 'off': return 'OFF';
      default: return 'OFF';
    }
  };

  const getLEDColorHex = (color: string) => {
    switch (color) {
      case 'red': return '#ef4444';
      case 'green': return '#10b981';
      case 'blue': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const sortedNodes = [...nodes].sort((a, b) => {
    if (a.health === 'error' || a.health === 'offline') return -1;
    if (b.health === 'error' || b.health === 'offline') return 1;
    if (a.health === 'warn') return -1;
    if (b.health === 'warn') return 1;
    return a.id.localeCompare(b.id);
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col shadow-sm h-full">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <h3 className="text-xs text-gray-700">NODE STATUS</h3>
      </div>

      {/* Table - Scrollable area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-50 backdrop-blur-sm z-10">
              <tr className="border-b border-gray-200">
                <th className="text-left p-2 text-gray-600">Node ID</th>
                <th className="text-left p-2 text-gray-600">Lane</th>
                <th className="text-left p-2 text-gray-600">Health</th>
                <th className="text-left p-2 text-gray-600">LED Color</th>
                <th className="text-left p-2 text-gray-600">Battery</th>
              </tr>
            </thead>
            <tbody>
              {sortedNodes.map((node) => {
                const BatteryIcon = getBatteryIcon(node.battery);
                const batteryColor = getBatteryColor(node.battery);
                const timeSinceHeartbeat = Math.floor((Date.now() - node.lastHeartbeat.getTime()) / 1000);

                return (
                  <motion.tr
                    key={node.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => onNodeClick(node)}
                  >
                    <td className="p-2">
                      <span className="text-blue-600 font-mono">{node.id}</span>
                    </td>
                    <td className="p-2">
                      <div className="flex flex-col">
                        <span className="text-gray-700 text-[10px]">L{node.lane}</span>
                        <span className="text-gray-500 text-[9px]">{node.direction === 'north' ? 'NB' : 'SB'}</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge className={`${getHealthColor(node.health)} text-[10px] px-2 py-0.5`}>
                        {node.health === 'ok' && (
                          <span className="flex items-center gap-1">
                            <motion.span
                              className="h-1.5 w-1.5 rounded-full bg-green-500"
                              animate={{ opacity: [1, 0.3, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                            OK
                          </span>
                        )}
                        {node.health !== 'ok' && node.health.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <motion.div 
                          className="h-2 w-2 rounded-full"
                          style={{ 
                            backgroundColor: getLEDColorHex(node.ledColor),
                            boxShadow: node.ledColor !== 'off' ? `0 0 6px ${getLEDColorHex(node.ledColor)}` : 'none',
                          }}
                          animate={node.ledColor !== 'off' ? {
                            opacity: [1, 0.3, 1],
                          } : {}}
                          transition={{
                            duration: node.blinkHz > 0 ? 1 / node.blinkHz : 1,
                            repeat: Infinity,
                          }}
                        />
                        <span 
                          className="text-[10px] font-mono"
                          style={{ color: getLEDColorHex(node.ledColor) }}
                        >
                          {getLEDColorName(node.ledColor)}
                        </span>
                        {node.blinkHz > 0 && (
                          <span className="text-gray-500 font-mono text-[9px]">
                            {node.blinkHz.toFixed(1)}Hz
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <BatteryIcon 
                          className="h-3 w-3"
                          style={{ color: batteryColor }}
                        />
                        <span 
                          className="font-mono text-[10px]"
                          style={{ color: batteryColor }}
                        >
                          {Math.round(node.battery)}%
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </ScrollArea>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 bg-gray-50 flex justify-between text-xs flex-shrink-0">
        <span className="text-gray-600">
          Online: <span className="text-green-600">{nodes.filter(n => n.health === 'ok').length}</span>
        </span>
        <span className="text-gray-600">
          Warning: <span className="text-yellow-600">{nodes.filter(n => n.health === 'warn').length}</span>
        </span>
        <span className="text-gray-600">
          Offline: <span className="text-gray-600">{nodes.filter(n => n.health === 'offline' || n.health === 'error').length}</span>
        </span>
      </div>
    </div>
  );
}
