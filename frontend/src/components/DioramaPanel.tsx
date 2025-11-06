import { motion } from 'motion/react';
import { Layers, Info } from 'lucide-react';
import type { Node, Incident } from '../App';

interface DioramaPanelProps {
  nodes: Node[];
  activeIncident: Incident | undefined;
  onNodeClick: (node: Node) => void;
}

export function DioramaPanel({ nodes, activeIncident, onNodeClick }: DioramaPanelProps) {
  const getLEDColor = (color: string) => {
    switch (color) {
      case 'red': return '#FF4C4C';
      case 'green': return '#00FF7F';
      case 'blue': return '#00BFFF';
      default: return '#404040';
    }
  };

  // Separate nodes by direction
  const northNodes = nodes.filter(n => n.direction === 'north').sort((a, b) => a.position - b.position);
  const southNodes = nodes.filter(n => n.direction === 'south').sort((a, b) => a.position - b.position);

  // Count LEDs by color for the active zones
  const ledStats = nodes.reduce((acc, node) => {
    if (node.ledColor !== 'off') {
      acc[node.ledColor] = (acc[node.ledColor] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 flex flex-col shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm text-gray-700 flex items-center gap-2">
              <Layers className="h-4 w-4" />
              DELINEATOR FEED
            </h3>
            <p className="text-xs text-gray-500 mt-1">Real-time LED status visualization • 500m highway coverage</p>
            {activeIncident && (
              <p className="text-xs text-blue-600 mt-1">
                ⚠ Direction-Aware Mode: Only upstream LEDs in {activeIncident.direction === 'north' ? 'Northbound' : 'Southbound'} activated
              </p>
            )}
          </div>
          
          {/* Scale indicator */}
          <div className="bg-white rounded-lg px-3 py-2 border border-gray-200 shadow-sm">
            <div className="text-[10px] text-gray-500">MODEL SCALE</div>
            <div className="text-sm text-blue-600">1:300</div>
          </div>
        </div>
      </div>

      {/* Diorama View */}
      <div className="flex-1 relative p-8 overflow-hidden bg-gray-50">
        {/* Top-down highway representation */}
        <div className="relative h-full flex items-center justify-center">
          {/* Highway container - 500m = 100cm model width */}
          <div className="relative w-full h-[400px]">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-100 to-gray-200 rounded-lg shadow-inner" />
            
            {/* Highway lanes (6 lanes total: 3 north + 3 south) */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 400" preserveAspectRatio="none">
              {/* Road surface */}
              <rect x="0" y="100" width="1000" height="200" fill="#4b5563" opacity="0.9" />
              
              {/* North lanes (top 3) */}
              <line x1="0" y1="133" x2="1000" y2="133" stroke="#fbbf24" strokeWidth="2" strokeDasharray="30,20" opacity="0.8" />
              <line x1="0" y1="167" x2="1000" y2="167" stroke="#fbbf24" strokeWidth="2" strokeDasharray="30,20" opacity="0.8" />
              
              {/* Center divider */}
              <line x1="0" y1="200" x2="1000" y2="200" stroke="#FFFFFF" strokeWidth="4" opacity="0.9" />
              
              {/* South lanes (bottom 3) */}
              <line x1="0" y1="233" x2="1000" y2="233" stroke="#fbbf24" strokeWidth="2" strokeDasharray="30,20" opacity="0.8" />
              <line x1="0" y1="267" x2="1000" y2="267" stroke="#fbbf24" strokeWidth="2" strokeDasharray="30,20" opacity="0.8" />
              
              {/* Edge lines */}
              <line x1="0" y1="100" x2="1000" y2="100" stroke="#FFFFFF" strokeWidth="2" opacity="0.8" />
              <line x1="0" y1="300" x2="1000" y2="300" stroke="#FFFFFF" strokeWidth="2" opacity="0.8" />
            </svg>

            {/* Distance markers */}
            <div className="absolute top-2 left-0 right-0 flex justify-between px-2">
              {[0, 100, 200, 300, 400, 500].map((distance) => (
                <div key={distance} className="flex flex-col items-center">
                  <div className="w-px h-2 bg-gray-400" />
                  <span className="text-[10px] text-gray-600 mt-1 font-mono">{distance}m</span>
                </div>
              ))}
            </div>

            {/* North direction delineators (top side) */}
            <div className="absolute top-[60px] left-0 right-0 h-[40px] px-2">
              {northNodes.map((node, index) => {
                const xPosition = (node.position / 500) * 100; // Map 0-500m to 0-100%
                const color = getLEDColor(node.ledColor);
                
                return (
                  <div
                    key={node.id}
                    className="absolute"
                    style={{
                      left: `${xPosition}%`,
                      transform: 'translateX(-50%)',
                    }}
                  >
                    {/* LED delineator */}
                    <motion.button
                      onClick={() => onNodeClick(node)}
                      className="relative cursor-pointer group"
                      whileHover={{ scale: 1.3 }}
                    >
                      {/* Glow effect when active */}
                      {node.ledColor !== 'off' && (
                        <motion.div
                          className="absolute inset-0 rounded-full blur-md"
                          style={{
                            backgroundColor: color,
                            width: '24px',
                            height: '24px',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                          }}
                          animate={{
                            opacity: [0.4, 0.8, 0.4],
                            scale: [1, 1.3, 1],
                          }}
                          transition={{
                            duration: 1 / node.blinkHz,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                        />
                      )}
                      
                      {/* LED circle */}
                      <motion.div
                        className="relative w-4 h-4 rounded-full border-2"
                        style={{
                          backgroundColor: node.ledColor !== 'off' ? color : '#202020',
                          borderColor: node.ledColor !== 'off' ? color : '#404040',
                          boxShadow: node.ledColor !== 'off' ? `0 0 8px ${color}` : 'none',
                        }}
                        animate={node.ledColor !== 'off' ? {
                          opacity: [1, 0.3, 1],
                        } : {}}
                        transition={{
                          duration: 1 / (node.blinkHz || 1),
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                      
                      {/* Node ID label */}
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-gray-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        {node.id}
                      </div>
                      
                      {/* Blink rate indicator when active */}
                      {node.ledColor !== 'off' && (
                        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] text-gray-400 whitespace-nowrap font-mono">
                          {node.blinkHz.toFixed(1)}Hz
                        </div>
                      )}
                    </motion.button>
                  </div>
                );
              })}
            </div>

            {/* South direction delineators (bottom side) */}
            <div className="absolute bottom-[60px] left-0 right-0 h-[40px] px-2">
              {southNodes.map((node, index) => {
                const xPosition = (node.position / 500) * 100; // Map 0-500m to 0-100%
                const color = getLEDColor(node.ledColor);
                
                return (
                  <div
                    key={node.id}
                    className="absolute"
                    style={{
                      left: `${xPosition}%`,
                      transform: 'translateX(-50%)',
                    }}
                  >
                    <motion.button
                      onClick={() => onNodeClick(node)}
                      className="relative cursor-pointer group"
                      whileHover={{ scale: 1.3 }}
                    >
                      {node.ledColor !== 'off' && (
                        <motion.div
                          className="absolute inset-0 rounded-full blur-md"
                          style={{
                            backgroundColor: color,
                            width: '24px',
                            height: '24px',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                          }}
                          animate={{
                            opacity: [0.4, 0.8, 0.4],
                            scale: [1, 1.3, 1],
                          }}
                          transition={{
                            duration: 1 / node.blinkHz,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                        />
                      )}
                      
                      <motion.div
                        className="relative w-4 h-4 rounded-full border-2"
                        style={{
                          backgroundColor: node.ledColor !== 'off' ? color : '#202020',
                          borderColor: node.ledColor !== 'off' ? color : '#404040',
                          boxShadow: node.ledColor !== 'off' ? `0 0 8px ${color}` : 'none',
                        }}
                        animate={node.ledColor !== 'off' ? {
                          opacity: [1, 0.3, 1],
                        } : {}}
                        transition={{
                          duration: 1 / (node.blinkHz || 1),
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                      
                      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-[9px] text-gray-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        {node.id}
                      </div>
                      
                      {node.ledColor !== 'off' && (
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 text-[8px] text-gray-400 whitespace-nowrap font-mono">
                          {node.blinkHz.toFixed(1)}Hz
                        </div>
                      )}
                    </motion.button>
                  </div>
                );
              })}
            </div>

            {/* Incident marker and ripple effect */}
            {activeIncident && (
              <div
                className="absolute"
                style={{
                  left: `${(activeIncident.position / 500) * 100}%`,
                  // Position based on direction: north = top section, south = bottom section
                  top: activeIncident.direction === 'north' ? '90px' : 'calc(100% - 90px)',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {/* Upstream warning zone indicator (direction-aware) */}
                <motion.div
                  className="absolute"
                  style={{
                    // North: upstream is to the right, South: upstream is to the left
                    ...(activeIncident.direction === 'north' 
                      ? { right: '-150px' } 
                      : { left: '-150px' }),
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '150px',
                    height: '2px',
                    background: activeIncident.direction === 'north'
                      ? `linear-gradient(to right, ${activeIncident.severity === 1 ? '#FF4C4C' : activeIncident.severity === 2 ? '#FFA500' : '#FFD700'}, transparent)`
                      : `linear-gradient(to left, ${activeIncident.severity === 1 ? '#FF4C4C' : activeIncident.severity === 2 ? '#FFA500' : '#FFD700'}, transparent)`,
                  }}
                  animate={{
                    opacity: [0.3, 0.8, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                >
                  {/* Animated arrow pointing to upstream direction */}
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2"
                    style={activeIncident.direction === 'north' ? { right: 0 } : { left: 0 }}
                    animate={
                      activeIncident.direction === 'north'
                        ? { x: [0, 20, 0] }  // North: point right
                        : { x: [0, -20, 0] } // South: point left
                    }
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 20 20" 
                      fill={activeIncident.severity === 1 ? '#FF4C4C' : activeIncident.severity === 2 ? '#FFA500' : '#FFD700'}
                      style={activeIncident.direction === 'north' ? { transform: 'rotate(180deg)' } : {}}
                    >
                      <path d="M10 15 L3 10 L10 5 L10 15 Z" />
                    </svg>
                  </motion.div>
                </motion.div>

                {/* Ripple wave animation */}
                {[0, 0.3, 0.6].map((delay) => (
                  <motion.div
                    key={delay}
                    className="absolute rounded-full border-2"
                    style={{
                      borderColor: activeIncident.severity === 1 ? '#FF4C4C' : activeIncident.severity === 2 ? '#FFA500' : '#FFD700',
                      left: '50%',
                      top: '50%',
                    }}
                    initial={{ scale: 0, opacity: 0.8, x: '-50%', y: '-50%' }}
                    animate={{
                      scale: [0, 4],
                      opacity: [0.8, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay,
                      ease: 'easeOut',
                    }}
                    style={{
                      width: 60,
                      height: 60,
                    }}
                  />
                ))}
                
                {/* Incident icon */}
                <motion.div
                  className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white"
                  style={{
                    backgroundColor: activeIncident.severity === 1 ? '#FF4C4C' : activeIncident.severity === 2 ? '#FFA500' : '#FFD700',
                    boxShadow: `0 0 20px ${activeIncident.severity === 1 ? '#FF4C4C' : activeIncident.severity === 2 ? '#FFA500' : '#FFD700'}`,
                  }}
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2L2 22h20L12 2z" />
                  </svg>
                </motion.div>
                
                {/* Position and lane label */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white/95 px-2 py-1 rounded border whitespace-nowrap text-xs shadow-sm"
                  style={{
                    borderColor: activeIncident.severity === 1 ? '#ef4444' : activeIncident.severity === 2 ? '#f59e0b' : '#eab308',
                    color: activeIncident.severity === 1 ? '#ef4444' : activeIncident.severity === 2 ? '#f59e0b' : '#eab308',
                  }}
                >
                  Lane {activeIncident.lane} • {activeIncident.position}m
                </div>
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[9px] text-gray-600 whitespace-nowrap">
                  {activeIncident.direction === 'north' ? '↑ Northbound' : '↓ Southbound'}
                </div>
              </div>
            )}

            {/* Direction arrows */}
            <div className="absolute left-4 top-[130px] text-[10px] text-gray-600 flex items-center gap-1">
              <span>→</span>
              <span>NORTH</span>
            </div>
            <div className="absolute left-4 bottom-[130px] text-[10px] text-gray-600 flex items-center gap-1">
              <span>←</span>
              <span>SOUTH</span>
            </div>
          </div>
        </div>

        {/* Info box */}
        <div className="absolute top-4 right-4 bg-white/95 rounded-lg p-3 border border-gray-200 backdrop-blur-sm shadow-sm">
          <div className="flex items-start gap-2 mb-2">
            <Info className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-[10px] text-gray-700">LED Illumination Zones</div>
          </div>
          <div className="space-y-1 text-[10px]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-gray-600">0-200m: Red (3-4 Hz)</span>
              {ledStats.red && <span className="text-red-600 ml-auto">{ledStats.red}</span>}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-gray-600">200-500m: Green (2 Hz)</span>
              {ledStats.green && <span className="text-green-600 ml-auto">{ledStats.green}</span>}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-gray-600">500-700m: Blue (1 Hz)</span>
              {ledStats.blue && <span className="text-blue-600 ml-auto">{ledStats.blue}</span>}
            </div>
            {activeIncident && (
              <>
                <div className="border-t border-gray-200 my-2" />
                <div className="text-[9px] text-orange-600">
                  ⚠ Upstream-only activation
                </div>
                <div className="text-[9px] text-gray-500">
                  Opposite direction: OFF
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 bg-gray-50 flex justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Active LEDs:</span>
          <span className="text-blue-600">
            {nodes.filter(n => n.ledColor !== 'off').length} / 20
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Model Size:</span>
          <span className="text-gray-600">100cm × 20cm</span>
        </div>
      </div>
    </div>
  );
}
