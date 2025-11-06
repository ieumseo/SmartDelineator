# models.py
from typing import Optional, Literal, Union
from pydantic import BaseModel, Field

# 사고 생성 커맨드
class AccidentCmd(BaseModel):
    action: Literal["accident"]
    direction: Literal["outbound", "inbound"]
    lane: int = Field(ge=1)
    # 초기 테스트에선 chainage_m로 바로 넣고, 나중에 cctv_id/gps로 매핑
    chainage_m: Optional[float] = None
    cctv_id: Optional[str] = None
    severity: Optional[int] = 1
    accident_time: Optional[str] = None  # ISO 문자열 등

# 사고 해제 커맨드
class ClearCmd(BaseModel):
    action: Literal["clear"]
    incident_id: str

# 두 명령을 합친 유니언(엔드포인트에서 자동 파싱)
Command = Union[AccidentCmd, ClearCmd]