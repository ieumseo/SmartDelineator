# server/main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

from models import AccidentCmd, ClearCmd, Command
from mapping import snap_chainage, select_seed_node
from serial_gateway import send_seed, send_clear

import uuid, datetime, json, asyncio, os, csv, random, pathlib
from typing import Any, Dict, List, Set

# ---------------------------------------------------------
# App & CORS
# ---------------------------------------------------------
app = FastAPI(title="Smart Delineator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# Utils
# ---------------------------------------------------------
def utcnow() -> str:
    return datetime.datetime.utcnow().isoformat() + "Z"

def map_dir_to_front(d: str) -> str:
    """backend 입력(outbound/inbound) → front 표기(north/south)로 변환"""
    d = (d or "").lower()
    if d in ("outbound", "south", "s", "sb"):
        return "south"
    return "north"  # inbound 등 나머지는 north 취급

# ---------------------------------------------------------
# WS Manager (옵션)
# ---------------------------------------------------------
class WSManager:
    def __init__(self) -> None:
        self.active: Set[WebSocket] = set()

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self.active.add(ws)

    def disconnect(self, ws: WebSocket) -> None:
        self.active.discard(ws)

    async def broadcast(self, message: Dict[str, Any]) -> None:
        dead = []
        data = json.dumps(message, ensure_ascii=False)
        for ws in list(self.active):
            try:
                await ws.send_text(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

ws_manager = WSManager()

# ---------------------------------------------------------
# SSE
# ---------------------------------------------------------
SSE_SUBS: Set[asyncio.Queue] = set()

async def sse_publish(event: dict):
    dead = []
    data = json.dumps(event, ensure_ascii=False)
    for q in list(SSE_SUBS):
        try:
            q.put_nowait(data)
        except Exception:
            dead.append(q)
    for q in dead:
        SSE_SUBS.discard(q)

@app.get("/stream")
async def sse_stream():
    q: asyncio.Queue[str] = asyncio.Queue()
    SSE_SUBS.add(q)

    async def gen():
        try:
            snapshot_msg = json.dumps({
                "type": "snapshot",
                "payload": {
                    "server_time": utcnow(),
                    "system": STATE["system"],
                    "incidents": STATE["incidents"],
                },
            }, ensure_ascii=False)
            yield f"data: {snapshot_msg}\n\n"

            while True:
                msg = await q.get()
                yield f"data: {msg}\n\n"
        finally:
            SSE_SUBS.discard(q)

    return StreamingResponse(gen(), media_type="text/event-stream")

async def publish_all(event: dict):
    await ws_manager.broadcast(event)
    await sse_publish(event)

# ---------------------------------------------------------
# In-memory state
# ---------------------------------------------------------
STATE = {
    "system": {
        "status": "ok",
        "time": utcnow(),
        "mode": os.getenv("SD_MODE", "manual"),
        "fps": 30,
    },
    "incidents": [],  # [{id, status, direction(north/south), chainage, ...}]
}

# ---------------------------------------------------------
# Nodes from CSV → /api/nodes
# CSV columns: node_id, direction(outbound/inbound), lane, chainage_m
# ---------------------------------------------------------
NODES: List[Dict[str, Any]] = []

def load_nodes_from_csv() -> None:
    global NODES
    NODES = []
    csv_path = pathlib.Path(__file__).parent / "topo" / "nodes.csv"
    if not csv_path.exists():
        return
    with csv_path.open("r", newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            try:
                node_id = row.get("node_id") or ""
                lane = int(row.get("lane") or "1")
                pos = float(row.get("chainage_m") or "0")
                NODES.append({
                    "id": node_id,
                    "direction": map_dir_to_front(row.get("direction") or ""),
                    "lane": lane,
                    "position": pos,             # meters
                    "modelPosition": pos / 5.0,  # your 1:300 scale rule
                    "health": "ok",
                    "ledColor": "off",
                    "blinkHz": 0,
                    "lastHeartbeat": utcnow(),
                    "battery": 70 + random.random() * 30,
                })
            except Exception:
                pass

load_nodes_from_csv()

# ---------------------------------------------------------
# Health / APIs
# ---------------------------------------------------------
@app.get("/healthz")
def healthz():
    return {"ok": True, "time": utcnow()}

@app.get("/api/system")
def get_system():
    STATE["system"]["time"] = utcnow()
    return JSONResponse(STATE["system"])

@app.get("/api/snapshot")
def snapshot():
    return JSONResponse({
        "server_time": utcnow(),
        "system": STATE["system"],
        "incidents": STATE["incidents"],
    })

@app.get("/api/nodes")
def get_nodes():
    return JSONResponse(NODES)

@app.get("/api/incidents")
def get_incidents():
    return JSONResponse(STATE["incidents"])

# ---------------------------------------------------------
# Commands (accident / clear)
# ---------------------------------------------------------
@app.post("/api/commands")
async def commands(cmd: Command):
    try:
        # pydantic v1/v2 호환
        cmd_dict = cmd.model_dump() if hasattr(cmd, "model_dump") \
                   else cmd.dict() if hasattr(cmd, "dict") else dict(cmd)

        # Accident
        if isinstance(cmd, AccidentCmd):
            inc_id = uuid.uuid4().hex[:8]
            chainage = snap_chainage(cmd)
            seed = select_seed_node(chainage, cmd)
            seed_id = seed.get("node_id") or ""

            send_ok, send_err = True, None
            try:
                send_seed(inc_id, chainage, seed, ttl=700)
            except Exception as e:
                send_ok, send_err = False, repr(e)

            direction_front = map_dir_to_front(cmd_dict.get("direction", ""))

            incident = {
                "id": inc_id,
                "location": f"{chainage}m Mark",
                "position": chainage,
                "direction": direction_front,       # north|south
                "lane": cmd_dict.get("lane", 1),
                "severity": cmd_dict.get("severity", 2),
                "status": "active" if send_ok else "pending",
                "startTime": utcnow(),
                "detectedBy": cmd_dict.get("detectedBy", "manual"),
            }
            STATE["incidents"].insert(0, incident)

            await publish_all({"type": "incident_new", "payload": incident})

            return {
                "ok": True,
                "incident_id": inc_id,
                "seed_node": seed_id,
                "sent": send_ok,
                "detail": send_err,
            }

        # Clear
        if isinstance(cmd, ClearCmd):
            try:
                send_clear(cmd.incident_id)
            except Exception:
                pass

            for inc in STATE["incidents"]:
                if inc["id"] == cmd.incident_id:
                    inc["status"] = "cleared"
                    inc["clearTime"] = utcnow()

            await publish_all({
                "type": "incident_clear",
                "payload": {"id": cmd.incident_id, "server_time": utcnow()},
            })
            return {"ok": True}

        return {"ok": False, "error": "bad_command"}

    except Exception as e:
        return JSONResponse(status_code=500, content={"ok": False, "error": repr(e)})

# ---------------------------------------------------------
# WebSocket (옵션)
# ---------------------------------------------------------
@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws_manager.connect(ws)
    try:
        await ws.send_text(json.dumps({
            "type": "snapshot",
            "payload": {
                "server_time": utcnow(),
                "system": STATE["system"],
                "incidents": STATE["incidents"],
            },
        }, ensure_ascii=False))
        while True:
            try:
                await ws.receive_text()
            except Exception:
                await asyncio.sleep(30)
    except WebSocketDisconnect:
        pass
    finally:
        ws_manager.disconnect(ws)