# Smart Delineator Control Dashboard

Real-time highway incident detection and warning system integrating AI-based accident detection, a FastAPI backend, and a React (Vite) dashboard with Arduino-based smart delineators.

---

## Overview

This system monitors traffic accidents through AI and automatically triggers visual alerts via smart delineators on the road.  
Detected incidents are displayed on a real-time dashboard and propagated to the hardware through serial communication.

---

## System Architecture

AI Detection → FastAPI Backend → React Dashboard → Smart Delineators (Arduino)

---

## Features

- Real-time dashboard updates via Server-Sent Events (SSE)
- Manual and AI-triggered incident simulation
- LED control (color and blink frequency) based on accident severity and distance
- Snapshot, system health, and incident APIs
- Ready for Arduino/ESP32 hardware integration

---

## How to Run

### Backend
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

### Frontend
cd frontend
npm install
npm run dev

Then open http://localhost:3000 in your browser.


## Future Work
	•	Integrate AI detection module (YOLOv8 / ByteTrack)
	•	Add node feedback to update LED state on dashboard
	•	Expand multi-camera and chainage calibration
