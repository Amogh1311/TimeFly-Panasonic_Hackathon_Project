# ✈️ TimeFly SeatSync

### Next-Generation In-Flight Passenger Connectivity & Context-Aware Entertainment

**TimeFly SeatSync** is a real-time, interactive dashboard designed to transform the isolated in-flight experience into a synchronized, highly social, and hyper-personalized journey. By combining live flight telemetry, an AI-driven context engine, and low-latency WebSockets, SeatSync pairs passengers for real-time gaming, chat, and shared experiences using dynamic matchmaking algorithms.

---

# 🎯 Vision

Modern in-flight entertainment systems are often static and isolated. TimeFly SeatSync reimagines the cabin as a connected ecosystem where passengers can engage, collaborate, and enjoy personalized experiences throughout their journey.

Whether passengers want to:

- Collaboratively draw in **Co-op Pictionary**
- Compete in **Neon Artillery**
- Chat with compatible travelers
- Receive AI-curated entertainment recommendations based on flight conditions

SeatSync provides a seamless, real-time platform for engagement.

---

# ✨ Key Features

## 🤝 Dynamic Passenger Matchmaking

### Survey-Driven Matching
Passengers complete a 10-point profile survey covering:

- Travel purpose
- Personal vibe
- Interests and hobbies
- Social preferences

### Live Waiting Pool
An asynchronous matchmaking engine pairs compatible passengers using a custom scoring algorithm.

### Secure Handshake System
All connections are opt-in, ensuring privacy, consent, and passenger comfort before establishing communication.

---

## ⚡ Real-Time Multiplayer Engine

### Low-Latency WebSockets
Powered by a Python Socket.IO backend that enables instantaneous bidirectional communication.

### Deterministic State Management
Custom host-allocation logic guarantees synchronized:

- UI states
- Game turns
- Player roles
- Color assignments

regardless of connection order.

### Graceful Degradation & Privacy Controls
Built-in safeguards automatically:

- Handle unexpected disconnects
- Clear chat history
- Reset local game state
- Preserve user privacy

---

## 🧠 AI Context Engine & Flight Telemetry

### Live Environment Awareness
The platform continuously ingests:

- Flight phase information
- Weather conditions
- Passenger demographics

### Hyper-Personalized Recommendations
The AI engine generates contextual recommendations, such as:

- Calming audio during turbulence
- Short-form content during descent
- Entertainment tailored to passenger preferences and flight conditions

---

## 🎮 Synchronized Interactive Applets

### Co-op Pictionary

A collaborative drawing experience featuring:

- Real-time stroke rendering
- Shared canvas synchronization
- Dynamic drawing tools
- Integrated chat-based guess validation

### Neon Artillery

A multiplayer physics-based artillery game featuring:

- Real-time player synchronization
- Dynamic obstacle generation
- Trajectory calculations
- Live projectile collision detection

---

# 🛠️ Technical Architecture

## Tech Stack

### Frontend

- React (Functional Components)
- TypeScript
- React Hooks
- CSS Modules

### Backend

- Python
- FastAPI
- Socket.IO

### State Management

- Custom React Hooks (`useSeatSyncSocket`)
- Deterministic UI synchronization logic

---

# 🔄 System Flow

## 1. Initialization

The frontend dynamically parses the URL and assigns a unique seat identifier.

Example:

```text
?seat=12A
```

## 2. Handshake

The client emits a `register_seat` event to the backend and enters the matchmaking pool.

## 3. Synchronization

After a successful match:

- Chat messages
- Drawing coordinates
- Game events
- Physics vectors

are synchronized through the `useSeatSyncSocket` communication layer.

## 4. UI Resolution

Deterministic logic identifies the **Game Initiator** and permanently assigns player roles:

- Player 1 → Cyan
- Player 2 → Pink

This ensures consistent visual feedback across all connected clients.

---

# 🚀 Local Setup & Installation

## Prerequisites

### Frontend

- Node.js
- npm

### Backend

- Python 3.8+
- pip

---

## 1. Clone the Repository

```bash
git clone https://github.com/yourusername/timefly-seatsync.git
cd timefly-seatsync
```

---

## 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at:

```text
http://localhost:3000
```

---

## 3. Backend Setup

Create and activate a virtual environment:

```bash
cd backend

python -m venv venv

# macOS/Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the server:

```bash
python main.py
```

The backend server will run at:

```text
http://localhost:8000
```

---

## 4. Testing Multiplayer Locally

Open two browser windows and join using different seat IDs:

### Passenger 1

```text
http://localhost:3000/?seat=12A
```

### Passenger 2

```text
http://localhost:3000/?seat=14B
```

The matchmaking engine should detect and connect both passengers for synchronized interaction.

---

# 📂 Key Component Highlights

## `useSeatSyncSocket.ts`

The core communication layer of the application.

Responsibilities:

- Socket.IO abstraction
- Event registration
- Connection lifecycle management
- State transitions:
  - Idle
  - Pending
  - Connected

---

## `App.tsx`

The primary application orchestrator.

Responsibilities:

- Global layout management
- Toast notification queue
- Dashboard rendering
- Socket-state-driven UI transitions

---

## `DrawingBoard.tsx`

High-performance collaborative drawing canvas built on the HTML5 Canvas API.

Features:

- Real-time drawing synchronization
- Dynamic tool selection
- Shared user interactions

---

## `ArtilleryGame.tsx`

Physics-driven multiplayer game engine.

Features:

- Synchronized player coordinates
- Turn-based interactions
- Collision detection
- Network-synchronized game state

---

# 🔮 Future Roadmap

## WebRTC Integration

Transition from centralized Socket.IO communication to peer-to-peer WebRTC for lower latency and improved scalability.

## Cabin Map Visualization

An interactive cabin map displaying:

- Active passengers
- Popular content
- Real-time cabin activity

## Expanded Applet Ecosystem

Future collaborative experiences include:

- Shared music queues
- Synchronized movie watching
- Multiplayer trivia competitions
- Group social experiences

---

# 💡 Core Objective

TimeFly SeatSync aims to transform the aircraft cabin from a collection of isolated passengers into a connected, intelligent, and interactive social ecosystem—bringing real-time engagement, personalized entertainment, and meaningful passenger connections to every flight.