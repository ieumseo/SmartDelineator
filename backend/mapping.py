# mapping.py
import csv, os
from pathlib import Path
from typing import Any, Dict, List

# ---- CSV 경로 안전화 (+ 환경변수로도 지정 가능) ----
BASE_DIR = Path(__file__).resolve().parent
DEFAULT_CSV = BASE_DIR / "topo" / "nodes.csv"
NODES_CSV = Path(os.getenv("NODES_CSV", str(DEFAULT_CSV)))

def _load_nodes_from_csv(path: Path) -> List[Dict[str, Any]]:
    nodes = []
    with path.open(newline="") as f:
        for row in csv.DictReader(f):
            nodes.append({
                "node_id": row["node_id"],
                "direction": row["direction"],     # "outbound" / "inbound"
                "lane": int(row["lane"]),
                "chainage_m": float(row["chainage_m"]),
            })
    return nodes

def _dummy_nodes() -> List[Dict[str, Any]]:
    # 50m 간격, outbound 2차선 0~450m
    return [
        {"node_id": f"O{i:02d}", "direction": "outbound", "lane": 2, "chainage_m": i*50.0}
        for i in range(10)
    ]

# ---- 노드 로드: CSV 있으면 사용, 없으면 더미 ----
if NODES_CSV.exists():
    NODES = _load_nodes_from_csv(NODES_CSV)
else:
    print(f"[mapping] WARN: {NODES_CSV} not found. Using dummy nodes.")
    NODES = _dummy_nodes()

# ---- Pydantic 모델/딕셔너리 모두 허용 ----
def _as_dict(cmd: Any) -> Dict[str, Any]:
    if hasattr(cmd, "model_dump"):   # Pydantic v2
        return cmd.model_dump()
    if hasattr(cmd, "dict"):         # Pydantic v1
        return cmd.dict()
    return cmd                       # assume dict-like

def snap_chainage(cmd: Any) -> float:
    c = _as_dict(cmd)
    return float(c.get("chainage_m", 300.0))

def select_seed_node(chainage: float, cmd: Any) -> Dict[str, Any]:
    c = _as_dict(cmd)
    direction = c["direction"]
    lane = int(c["lane"])
    candidates = [n for n in NODES if n["direction"] == direction and n["lane"] == lane]
    if not candidates:
        return min(NODES, key=lambda n: abs(n["chainage_m"] - chainage))
    return min(candidates, key=lambda n: abs(n["chainage_m"] - chainage))