import React, { useState, useEffect } from "react";
import { TopBar } from "./components/TopBar";
import { CCTVFeed } from "./components/CCTVFeed";
import { DioramaPanel } from "./components/DioramaPanel";
import { EventFeed } from "./components/EventFeed";
import { IncidentTable } from "./components/IncidentTable";
import { NodeTable } from "./components/NodeTable";
import { DetailDrawer } from "./components/DetailDrawer";
import { Button } from "./components/ui/button";
import { Plus } from "lucide-react";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";

export type NodeHealth = "ok" | "warn" | "error" | "offline";
export type SeverityLevel = 1 | 2 | 3;
export type SystemStatus = "normal" | "warning" | "critical";
export type LEDColor = "red" | "green" | "blue" | "off";

export interface Node {
  id: string;
  direction: "north" | "south";
  lane: 1 | 2 | 3; // Lane number (1=innermost, 3=outermost)
  position: number; // Real distance in meters (0-500)
  modelPosition: number; // Model distance in cm (0-100)
  health: NodeHealth;
  ledColor: LEDColor;
  blinkHz: number;
  lastHeartbeat: Date;
  battery: number;
}

export interface Incident {
  id: string;
  location: string;
  position: number; // Real distance in meters
  direction: "north" | "south";
  lane: 1 | 2 | 3; // Lane number where accident occurred
  severity: SeverityLevel;
  status: "active" | "cleared";
  startTime: Date;
  clearTime?: Date;
  detectedBy: "cctv" | "sensor" | "manual";
}

export interface Event {
  id: string;
  type:
    | "accident"
    | "cleared"
    | "node_offline"
    | "node_warning"
    | "system"
    | "cctv_detection"
    | "led_change";
  message: string;
  timestamp: Date;
  severity: "info" | "warning" | "error";
}

export default function App() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [systemStatus, setSystemStatus] =
    useState<SystemStatus>("normal");
  const [selectedNode, setSelectedNode] = useState<Node | null>(
    null,
  );
  const [selectedIncident, setSelectedIncident] =
    useState<Incident | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);


  // 백엔드 연동
 useEffect(() => {
  const load = async () => {
    const [nres, ires] = await Promise.all([
      fetch("/api/nodes"),
      fetch("/api/incidents"),
    ]);
    const [njson, ijson] = await Promise.all([nres.json(), ires.json()]);

    setNodes(njson.map((x: any) => ({
      ...x,
      lastHeartbeat: new Date(x.lastHeartbeat),
    })));

    setIncidents(ijson.map((x: any) => ({
      ...x,
      startTime: new Date(x.startTime),
      clearTime: x.clearTime ? new Date(x.clearTime) : undefined,
    })));
  };
  load();
  }, []);

  // 👇 초기 로딩 useEffect는 그대로 두세요.

// ✅ 실시간(SSE) 구독용 useEffect 추가
useEffect(() => {
  let es: EventSource | null = null;
  let retry = 0;

  const connect = () => {
    es = new EventSource("/stream");

    es.onmessage = (e) => {
      retry = 0; // 연결 성공 → 재시도 카운터 리셋
      const msg = JSON.parse(e.data);

      console.log("[SSE]", msg.type, msg.payload);

      switch (msg.type) {
        case "incident_new": {
          const p = msg.payload;
          setIncidents((prev) => [
            {
              ...p,
              startTime: new Date(p.startTime),
              clearTime: p.clearTime ? new Date(p.clearTime) : undefined,
            },
            ...prev,
          ]);
          // 원하면 이벤트 피드도 추가
          setEvents((prev) => [
            { id: `E-${Date.now()}`, type: "cctv_detection", message: `Incident ${p.id}`, severity: "warning", timestamp: new Date() },
            ...prev,
          ].slice(0, 100));
          break;
        }
        case "incident_clear": {
          const { id } = msg.payload;
          setIncidents((prev) =>
            prev.map((i) =>
              i.id === id ? { ...i, status: "cleared", clearTime: new Date() } : i
            )
          );
          setEvents((prev) => [
            { id: `E-${Date.now()}`, type: "cleared", message: `Incident ${id} cleared`, severity: "info", timestamp: new Date() },
            ...prev,
          ].slice(0, 100));
          break;
        }
        case "node_update": {
          const p = msg.payload;
          setNodes((prev) =>
            prev.map((n) =>
              n.id === p.id
                ? { ...n, ...p, lastHeartbeat: new Date(p.lastHeartbeat) }
                : n
            )
          );
          break;
        }
        // heartbeat 등은 무시해도 됨
      }
    };

    es.onerror = () => {
      es?.close();
      retry = Math.min(retry + 1, 6);
      const delay = 500 * Math.pow(2, retry); // 지수 백오프
      setTimeout(connect, delay);
    };
  };

  connect();
  return () => es?.close();
  }, []);

  // Update system status based on incidents and node health
  useEffect(() => {
    const criticalIncidents = incidents.filter(
      (i) => i.status === "active" && i.severity === 1,
    );
    const offlineNodes = nodes.filter(
      (n) => n.health === "offline" || n.health === "error",
    );

    if (
      criticalIncidents.length > 0 ||
      offlineNodes.length > 3
    ) {
      setSystemStatus("critical");
    } else if (
      incidents.some((i) => i.status === "active") ||
      offlineNodes.length > 0
    ) {
      setSystemStatus("warning");
    } else {
      setSystemStatus("normal");
    }
  }, [incidents, nodes]);

  // Turn off LEDs when no active incidents
  useEffect(() => {
    const activeIncidents = incidents.filter(
      (i) => i.status === "active",
    );

    if (activeIncidents.length === 0) {
      // No active incidents - turn off all LEDs
      setNodes((prev) =>
        prev.map((node) => ({
          ...node,
          ledColor: "off" as LEDColor,
          blinkHz: 0,
        })),
      );
    }
  }, [incidents]);

  // Counter to ensure unique event IDs
  const eventIdCounterRef = React.useRef(0);

  const addEvent = (
    eventData: Omit<Event, "id" | "timestamp">,
  ) => {
    eventIdCounterRef.current += 1;
    // Use Math.random() for additional uniqueness in case multiple events fire in same ms
    const uniqueId = `E${Date.now()}-${eventIdCounterRef.current}-${Math.random().toString(36).substr(2, 9)}`;
    const newEvent: Event = {
      ...eventData,
      id: uniqueId,
      timestamp: new Date(),
    };
    setEvents((prev) => [newEvent, ...prev].slice(0, 100));
  };

  const calculateLEDState = (
    node: Node,
    incident: Incident,
  ): { color: LEDColor; blinkHz: number } => {
    // Direction-aware activation: only activate nodes in the same direction
    if (node.direction !== incident.direction) {
      return { color: "off", blinkHz: 0 };
    }

    // Only activate nodes BEHIND (upstream of) the incident
    // Korean road style (right-hand traffic):
    // - North: traffic flows right to left (500m → 0m), so upstream = position > incident.position
    // - South: traffic flows left to right (0m → 500m), so upstream = position < incident.position
    const isUpstream =
      node.direction === "north"
        ? node.position > incident.position // North: upstream nodes have higher position
        : node.position < incident.position; // South: upstream nodes have lower position

    if (!isUpstream) {
      return { color: "off", blinkHz: 0 };
    }

    // Calculate distance from node to incident (how far back the node is)
    const distance = Math.abs(
      incident.position - node.position,
    );

    // LED illumination rules based on distance from incident
    if (distance <= 200) {
      // 0-200m: Red, 3-4 Hz (highest danger)
      return { color: "red", blinkHz: 3 + Math.random() };
    } else if (distance <= 500) {
      // 200-500m: Green, 2 Hz (medium warning)
      return { color: "green", blinkHz: 2 };
    } else if (distance <= 700) {
      // 500-700m: Blue, 1 Hz (low-level pre-warning)
      return { color: "blue", blinkHz: 1 };
    }

    return { color: "off", blinkHz: 0 };
  };

  const triggerManualAlert = async () => {
    const position = 150 + Math.floor(Math.random() * 300);
    const direction = Math.random() > 0.5 ? "outbound" : "inbound"; // 서버 규격
    const lane = 1 + Math.floor(Math.random() * 3);
    const severity = (1 + Math.floor(Math.random()*3)) as 1|2|3;

    await fetch(("/api/commands"), {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        action: "accident",
        direction,            // "outbound" | "inbound"
        lane,                 // 1..3
        chainage_m: position, // 위치(m)
        severity,             // 1..3
        detectedBy: "manual"
      })
    });
  };

/*
  const triggerManualAlert = () => {
    // Pick a random position along the highway (100-400m to ensure coverage)
    const incidentPosition =
      150 + Math.floor(Math.random() * 300);
    const severity = Math.ceil(
      Math.random() * 3,
    ) as SeverityLevel;
    const direction = Math.random() > 0.5 ? "north" : "south";
    const lane = (Math.floor(Math.random() * 3) + 1) as
      | 1
      | 2
      | 3;

    const directionLabel =
      direction === "north" ? "Northbound" : "Southbound";
    const laneLabel = `Lane ${lane}`;

    const newIncident: Incident = {
      id: `I${String(incidents.length + 1).padStart(3, "0")}`,
      location: `${incidentPosition}m Mark`,
      position: incidentPosition,
      direction,
      lane,
      severity,
      status: "active",
      startTime: new Date(),
      detectedBy: "manual",
    };

    setIncidents((prev) => [...prev, newIncident]);

    addEvent({
      type: "cctv_detection",
      message: `Accident detected at ${incidentPosition}m - ${laneLabel} (${directionLabel}) - Severity Level ${severity}`,
      severity: severity === 1 ? "error" : "warning",
    });

    // Count activated nodes for event logging
    let activatedNodes = 0;
    let redCount = 0;
    let greenCount = 0;
    let blueCount = 0;

    // Update all nodes based on direction-aware logic
    setNodes((prev) =>
      prev.map((node) => {
        const ledState = calculateLEDState(node, newIncident);

        if (ledState.color !== "off") {
          activatedNodes++;
          if (ledState.color === "red") redCount++;
          if (ledState.color === "green") greenCount++;
          if (ledState.color === "blue") blueCount++;
        }

        return {
          ...node,
          ledColor: ledState.color,
          blinkHz: ledState.blinkHz,
        };
      }),
    );

    // Add summary event about activation
    setTimeout(() => {
      addEvent({
        type: "led_change",
        message: `Activated ${activatedNodes} LEDs (${directionLabel} only, upstream): ${redCount} red, ${greenCount} green, ${blueCount} blue`,
        severity: "info",
      });

      addEvent({
        type: "system",
        message: `Opposite direction and downstream LEDs remain OFF (direction-aware safety mode)`,
        severity: "info",
      });
    }, 100);

    toast.error(
      `Incident Alert: ${laneLabel} (${directionLabel}) at ${incidentPosition}m - Level ${severity}`,
    );

    // Auto-clear after 30-60 seconds for demo
    setTimeout(
      () => {
        clearIncident(newIncident.id);
      },
      30000 + Math.random() * 30000,
    );
  };
*/

  const clearIncident = async (incidentId: string) => {
    await fetch("/api/commands", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ action: "clear", incident_id: incidentId })
    });
    // 이후 업데이트는 SSE "clear" 이벤트가 해줌 (프론트에서 별도 setState 불필요)
  };
/*
  const clearIncident = (incidentId: string) => {
    const incident = incidents.find((i) => i.id === incidentId);

    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === incidentId
          ? {
              ...inc,
              status: "cleared" as const,
              clearTime: new Date(),
            }
          : inc,
      ),
    );

    if (incident) {
      // Check if there are other active incidents
      const otherActiveIncidents = incidents.filter(
        (i) => i.id !== incidentId && i.status === "active",
      );

      if (otherActiveIncidents.length === 0) {
        // No other active incidents, turn off all LEDs
        setNodes((prev) =>
          prev.map((node) => ({
            ...node,
            ledColor: "off" as LEDColor,
            blinkHz: 0,
          })),
        );
      } else {
        // Recalculate LED states based on remaining active incidents
        setNodes((prev) =>
          prev.map((node) => {
            // Find the closest active incident to this node
            let closestLedState = {
              color: "off" as LEDColor,
              blinkHz: 0,
            };

            for (const activeInc of otherActiveIncidents) {
              const ledState = calculateLEDState(
                node,
                activeInc,
              );
              // Take the highest priority (closest/red) LED state
              if (ledState.color !== "off") {
                if (
                  closestLedState.color === "off" ||
                  ledState.color === "red"
                ) {
                  closestLedState = ledState;
                }
              }
            }

            return {
              ...node,
              ledColor: closestLedState.color,
              blinkHz: closestLedState.blinkHz,
            };
          }),
        );
      }

      const directionLabel =
        incident.direction === "north"
          ? "Northbound"
          : "Southbound";
      const laneLabel = `Lane ${incident.lane}`;

      addEvent({
        type: "cleared",
        message: `Incident cleared at ${incident.location} (${laneLabel}, ${directionLabel}) - LEDs updated`,
        severity: "info",
      });

      toast.success(
        `Incident cleared: ${laneLabel} (${directionLabel}) at ${incident.location}`,
      );
    }
  };
*/

  const handleNodeClick = (node: Node) => {
    setSelectedNode(node);
    setSelectedIncident(null);
    setDrawerOpen(true);
  };

  const handleIncidentClick = (incident: Incident) => {
    setSelectedIncident(incident);
    setSelectedNode(null);
    setDrawerOpen(true);
  };

  const activeIncident = incidents.find(
    (i) => i.status === "active",
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 overflow-hidden">
      {/* Background subtle grid overlay */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      <TopBar systemStatus={systemStatus} />

      <div className="flex h-[calc(100vh-64px)]">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main content area */}
          <div className="flex-1 flex gap-4 p-4 overflow-hidden">
            {/* Left and Center: Split View (CCTV + Diorama) */}
            <div className="flex-1 flex flex-col gap-4 min-h-0">
              {/* Top: Split panels */}
              <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
                {/* CCTV Feed Panel */}
                <CCTVFeed
                  activeIncident={activeIncident}
                  onIncidentClick={handleIncidentClick}
                />

                {/* Diorama Simulation Panel */}
                <DioramaPanel
                  nodes={nodes}
                  activeIncident={activeIncident}
                  onNodeClick={handleNodeClick}
                />
              </div>

              {/* Bottom: Data tables */}
              <div className="grid grid-cols-2 gap-4 h-[240px] flex-shrink-0">
                <IncidentTable
                  incidents={incidents}
                  onIncidentClick={handleIncidentClick}
                />
                <NodeTable
                  nodes={nodes}
                  onNodeClick={handleNodeClick}
                />
              </div>
            </div>

            {/* Right: Event Feed */}
            <EventFeed events={events} />
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <Button
        onClick={triggerManualAlert}
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/50 transition-all hover:scale-110"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Detail Drawer */}
      <DetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        node={selectedNode}
        incident={selectedIncident}
        onClearIncident={
          selectedIncident?.status === "active"
            ? () => clearIncident(selectedIncident.id)
            : undefined
        }
      />

      <Toaster />
    </div>
  );
}