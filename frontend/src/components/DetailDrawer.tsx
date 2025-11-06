import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Battery, Wifi, Clock, MapPin, AlertTriangle, Activity, X } from 'lucide-react';
import { motion } from 'motion/react';
import type { Node, Incident } from '../App';

interface DetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: Node | null;
  incident: Incident | null;
  onClearIncident?: () => void;
}

export function DetailDrawer({ open, onOpenChange, node, incident, onClearIncident }: DetailDrawerProps) {
  if (!node && !incident) return null;

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'ok': return '#00FF7F';
      case 'warn': return '#FFD580';
      case 'error': return '#FF4C4C';
      case 'offline': return '#808080';
      default: return '#808080';
    }
  };

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 1: return '#FF4C4C';
      case 2: return '#FFA500';
      case 3: return '#FFD700';
      default: return '#808080';
    }
  };

  const getLEDColorHex = (color: string) => {
    switch (color) {
      case 'red': return '#FF4C4C';
      case 'green': return '#00FF7F';
      case 'blue': return '#00BFFF';
      default: return '#404040';
    }
  };

  // Generate mock signal history data
  const signalHistory = Array.from({ length: 20 }, (_, i) => ({
    time: i,
    value: 70 + Math.random() * 30,
  }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] bg-[#0E0E0E] border-l border-[#00BFFF]/20 text-white overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-[#00BFFF] flex items-center gap-2">
            {incident ? (
              <>
                <AlertTriangle className="h-5 w-5" />
                Incident Details
              </>
            ) : (
              <>
                <Activity className="h-5 w-5" />
                Node Details
              </>
            )}
          </SheetTitle>
          <SheetDescription className="text-gray-400">
            {incident ? `Incident ${incident.id}` : `Delineator Node ${node?.id}`}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Incident Information */}
          {incident && (
            <div className="space-y-4">
              <div className="bg-black/40 rounded-lg p-4 border border-gray-700">
                <h3 className="text-sm text-gray-400 mb-3">INCIDENT INFORMATION</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Incident ID</div>
                    <div className="text-sm text-[#00BFFF] font-mono">{incident.id}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Severity Level</div>
                    <Badge 
                      className="text-xs px-2 py-1"
                      style={{
                        backgroundColor: `${getSeverityColor(incident.severity)}20`,
                        color: getSeverityColor(incident.severity),
                        border: `1px solid ${getSeverityColor(incident.severity)}40`,
                      }}
                    >
                      Level {incident.severity}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Lane & Direction</div>
                    <div className="text-sm text-gray-300">
                      Lane {incident.lane} ({incident.direction === 'north' ? 'Northbound' : 'Southbound'})
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Location</div>
                    <div className="text-sm text-gray-300 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {incident.location}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Status</div>
                    <Badge 
                      className="text-xs px-2 py-1"
                      style={{
                        backgroundColor: incident.status === 'active' ? '#FF4C4C20' : '#00FF7F20',
                        color: incident.status === 'active' ? '#FF4C4C' : '#00FF7F',
                        border: incident.status === 'active' ? '1px solid #FF4C4C40' : '1px solid #00FF7F40',
                      }}
                    >
                      {incident.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Start Time</div>
                    <div className="text-xs text-gray-300 font-mono">
                      {incident.startTime.toLocaleString()}
                    </div>
                  </div>
                  {incident.clearTime && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Clear Time</div>
                      <div className="text-xs text-gray-300 font-mono">
                        {incident.clearTime.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>

                {onClearIncident && incident.status === 'active' && (
                  <Button
                    onClick={onClearIncident}
                    className="w-full mt-4 bg-[#00FF7F]/20 hover:bg-[#00FF7F]/30 text-[#00FF7F] border border-[#00FF7F]/40"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Incident
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Node Information */}
          {node && (
            <div className="space-y-4">
              <div className="bg-black/40 rounded-lg p-4 border border-gray-700">
                <h3 className="text-sm text-gray-400 mb-3">NODE INFORMATION</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Node ID</div>
                    <div className="text-sm text-[#00BFFF] font-mono">{node.id}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Health Status</div>
                    <Badge 
                      className="text-xs px-2 py-1"
                      style={{
                        backgroundColor: `${getHealthColor(node.health)}20`,
                        color: getHealthColor(node.health),
                        border: `1px solid ${getHealthColor(node.health)}40`,
                      }}
                    >
                      {node.health.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Battery Level</div>
                    <div className="flex items-center gap-2">
                      <Battery 
                        className="h-4 w-4"
                        style={{ color: node.battery > 20 ? '#00FF7F' : '#FF4C4C' }}
                      />
                      <span className="text-sm" style={{ color: node.battery > 20 ? '#00FF7F' : '#FF4C4C' }}>
                        {Math.round(node.battery)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Last Heartbeat</div>
                    <div className="flex items-center gap-1 text-xs text-gray-300">
                      <Clock className="h-3 w-3" />
                      {Math.floor((Date.now() - node.lastHeartbeat.getTime()) / 1000)}s ago
                    </div>
                  </div>
                </div>
              </div>

              {/* Signal Status */}
              <div className="bg-black/40 rounded-lg p-4 border border-gray-700">
                <h3 className="text-sm text-gray-400 mb-3">LED STATUS</h3>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Lane & Direction</div>
                    <div className="text-sm text-gray-300">
                      Lane {node.lane} ({node.direction === 'north' ? 'NB' : 'SB'})
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Position</div>
                    <div className="text-sm text-gray-300">{node.position}m</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">LED Color</div>
                    <div className="flex items-center gap-2">
                      <motion.div
                        className="h-4 w-4 rounded-full border-2"
                        style={{ 
                          backgroundColor: node.ledColor !== 'off' ? getLEDColorHex(node.ledColor) : '#202020',
                          borderColor: node.ledColor !== 'off' ? getLEDColorHex(node.ledColor) : '#404040',
                        }}
                        animate={node.ledColor !== 'off' ? {
                          opacity: [1, 0.3, 1],
                        } : {}}
                        transition={{
                          duration: node.blinkHz > 0 ? 1 / node.blinkHz : 1,
                          repeat: Infinity,
                        }}
                      />
                      <span className="text-sm" style={{ color: getLEDColorHex(node.ledColor) }}>
                        {node.ledColor.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Blink Rate</div>
                    <div className="text-sm text-gray-300 flex items-center gap-1">
                      <Wifi className="h-3 w-3" />
                      {node.blinkHz > 0 ? `${node.blinkHz.toFixed(1)} Hz` : 'OFF'}
                    </div>
                  </div>
                </div>

                {node.ledColor !== 'off' && (
                  <div className="p-3 rounded-lg bg-[#FF4C4C]/10 border border-[#FF4C4C]/30">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-[#FF4C4C]" />
                      <span className="text-xs text-[#FF4C4C]">
                        ACTIVE WARNING MODE
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Signal Pattern History */}
              <div className="bg-black/40 rounded-lg p-4 border border-gray-700">
                <h3 className="text-sm text-gray-400 mb-3">SIGNAL STRENGTH HISTORY</h3>
                
                <div className="h-32 flex items-end gap-1">
                  {signalHistory.map((point, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 rounded-t"
                      style={{
                        height: `${point.value}%`,
                        backgroundColor: getLEDColorHex(node.ledColor),
                        opacity: 0.3 + (point.value / 100) * 0.7,
                      }}
                      initial={{ height: 0 }}
                      animate={{ height: `${point.value}%` }}
                      transition={{ delay: i * 0.05 }}
                    />
                  ))}
                </div>
                
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>-20s</span>
                  <span>Now</span>
                </div>
              </div>

              {/* Location Preview */}
              <div className="bg-black/40 rounded-lg p-4 border border-gray-700">
                <h3 className="text-sm text-gray-400 mb-3">LOCATION PREVIEW</h3>
                
                <div className="aspect-video bg-black/60 rounded-lg flex items-center justify-center border border-gray-800 relative overflow-hidden">
                  {/* Mini map representation */}
                  <div className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: 'linear-gradient(#00BFFF 1px, transparent 1px), linear-gradient(90deg, #00BFFF 1px, transparent 1px)',
                      backgroundSize: '20px 20px',
                    }}
                  />
                  <motion.div
                    className="h-8 w-8 rounded-full border-2"
                    style={{
                      backgroundColor: getLEDColorHex(node.ledColor),
                      borderColor: getLEDColorHex(node.ledColor),
                      boxShadow: node.ledColor !== 'off' ? `0 0 20px ${getLEDColorHex(node.ledColor)}` : 'none',
                    }}
                    animate={node.ledColor !== 'off' ? {
                      scale: [1, 1.2, 1],
                    } : {}}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  />
                  
                  <div className="absolute bottom-2 left-2 text-xs text-gray-500 font-mono">
                    {node.id} • Lane {node.lane} {node.direction === 'north' ? 'NB' : 'SB'} • {node.position}m
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
