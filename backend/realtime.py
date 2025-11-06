# server/realtime.py
import asyncio, json, time
from typing import List
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

router = APIRouter()
subscribers: List[asyncio.Queue] = []

async def publish(msg: dict):
    # 모든 클라이언트 큐에 전파
    for q in list(subscribers):
        await q.put(msg)

@router.get("/stream")
async def stream(request: Request):
    q: asyncio.Queue = asyncio.Queue()
    subscribers.append(q)

    async def event_gen():
      try:
        # 주기적 하트비트로 프록시 타임아웃 방지
        async def heartbeat():
            while True:
                await asyncio.sleep(15)
                await q.put({"type":"heartbeat","ts": time.time()})
        hb = asyncio.create_task(heartbeat())

        while True:
            msg = await q.get()
            yield f"data: {json.dumps(msg, ensure_ascii=False)}\n\n"
      finally:
        if q in subscribers:
            subscribers.remove(q)

    return StreamingResponse(event_gen(), media_type="text/event-stream")