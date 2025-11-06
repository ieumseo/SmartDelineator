# serial_gateway.py
import os

SERIAL_PORT = os.getenv("SERIAL_PORT")
SERIAL_BAUD = int(os.getenv("SERIAL_BAUD", "115200"))
MOCK = SERIAL_PORT is None  # 포트 없으면 모킹

if MOCK:
    print("[serial] MOCK mode: no SERIAL_PORT set")
else:
    try:
        import serial  # pyserial
        ser = serial.Serial(SERIAL_PORT, SERIAL_BAUD, timeout=0.5)
        print(f"[serial] OPEN {SERIAL_PORT} @ {SERIAL_BAUD}")
    except Exception as e:
        print(f"[serial] FAIL to open serial: {e!r}")
        MOCK = True
        ser = None

def send_seed(incident_id, chainage, seed, ttl=700):
    frame = f"!SEED,inc={incident_id},dir={seed['direction'][0].upper()},lane={seed['lane']},seed={int(chainage)},ttl={int(ttl)}\n"
    if MOCK:
        print("[MOCK SERIAL] ->", frame.strip())
        return
    if ser is None:
        raise RuntimeError("serial not initialized")
    ser.write(frame.encode("utf-8"))

def send_clear(incident_id):
    frame = f"!CLEAR,inc={incident_id}\n"
    if MOCK:
        print("[MOCK SERIAL] ->", frame.strip())
        return
    if ser is None:
        raise RuntimeError("serial not initialized")
    ser.write(frame.encode("utf-8"))