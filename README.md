# 🎵 SyncTune — Ultra-Low Latency Live Music Jam

> **SyncTune** is a real-time, zero-stutter synchronized music streaming and party platform. It lets a host and remote listeners listen together across devices (desktop, tablet, mobile) with sub-10ms precision, synchronized down to the exact millisecond using WebSocket clock calibration and adaptive playback rate slewing.

---

## 🌟 Key Features

### ⚡ 1. Zero-Drift Synchronization Engine
* **Cristian's NTP Clock Synchronization**: Continuous round-trip time (RTT) and offset calibration between connected clients and the server clock, accounting for network latency variations.
* **Anchor Epoch Timeline Model**:
  $$\text{Target Position} = \text{Anchor Position} + \frac{(\text{Current Server Time} - \text{Anchor Epoch})}{1000} \times \text{Playback Rate}$$
* **Slewing Without Stuttering (Buffer-Immune Sync)**:
  * Minor drifts ($\pm 50\text{ms}$ to $600\text{ms}$) are invisibly smoothed by modulating playback speed (e.g., $1.25\times$ catch-up or $0.75\times$ slow-down for YouTube; continuous PID micro-adjustments for HTML5 audio).
  * Prevents the notorious **"audio stutter loop"** (play $\rightarrow$ stop $\rightarrow$ re-seek $\rightarrow$ buffer $\rightarrow$ play).
  * Strict seek cooldowns and buffering immunity (YouTube State 3 protection) prevent repeated restarts while players load media chunks.
* **Sync Diagnostics HUD**: Real-time stats drawer displaying ping (RTT), clock offset, drift in milliseconds, and active slewing rate.

---

### 🎶 2. Dual-Source Audio & Video
* **YouTube Player Integration**: Seamlessly plays YouTube videos and tracks via the official YouTube IFrame API with pitch-preserved speed adjustments and synchronized timeline state.
* **High-Fidelity HTML5 Audio**: Direct MP3/WAV/AAC stream support with browser-native Web Audio speed steering (`preservesPitch = true`).
* **Curated Royalty-Free Library**: Pre-loaded lo-fi beats, ambient chill, acoustic, and synthwave tracks ready to jam with zero configuration.
* **Custom URLs & Uploads**: Host can load any direct audio link or YouTube URL directly into the room queue.

---

### 📲 3. Frictionless Room Joining & Mobile Sharing
* **6-Character Room Codes**: Simple alphanumeric codes for easy manual entry.
* **One-Tap QR Code**: Instant QR modal generated with `qrcode`—scan with any phone camera to join the room in seconds.
* **Direct Shareable Links**: Instant URL sharing that automatically directs guests into the active room.
* **Smart Audio Unlock**: Adheres to modern mobile/browser autoplay security policies by prompting listeners with an unobtrusive "Tap to Unlock Audio" banner if the browser prevents spontaneous background audio.

---

### 💬 4. Interactive Live Jam & Social Vibes
* **Floating Screen Reactions**: Tap emojis (❤️, 🔥, 🕺, 🌙, ✨, 🎧) that float smoothly across everyone’s screens simultaneously with random trajectory and physics animations.
* **Live In-Room Chat**: Real-time messaging with user avatars, member badges, and timestamps.
* **Party Members Drawer**: View all active listeners, their roles (Host vs. Listener), and real-time audio sync status.

---

### 💑 5. Couple Jam Mode
* **Private Couple Code**: Generate and link unique couple IDs (e.g., `LOVE-9481`).
* **Special Couple Space**: Displays anniversary countdowns, private love notes, and special romantic visual presets.
* **Synchronized Listening**: Designed for long-distance couples to watch and listen together without a second of delay.

---

### 🌌 6. Immersive Visual & Acoustic Ambience
* **Dynamic Room Lighting & Themes**:
  * Aurora Borealis
  * Cyberpunk Neon
  * Romantic Sunset
  * Warm Candlelight
  * Fairylights
  * Gentle Rainy Night
* **Background Acoustic Overlays**: Layer cozy sounds underneath any track:
  * 🌧️ Gentle Rain
  * 🔥 Cozy Fireplace Crackle
  * 🌊 Ocean Breeze
  * Independent volume slider so you can mix background ambience to perfection.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Motion (Framer Motion) |
| **Real-Time Transport** | Native WebSockets (`ws` library), Express HTTP server (`tsx server.ts`) |
| **State & Fallback** | Firebase Firestore (cloud persistence) & Firebase Authentication |
| **Media Engines** | YouTube IFrame Player API & HTML5 Audio API (`preservesPitch`) |
| **Utilities** | QR Code Generator (`qrcode`), Cristian's NTP Algorithm |

---

## 📂 Project Structure

```text
├── server.ts                    # Express + WebSocket server (mounted at /ws), clock sync handler
├── src/
│   ├── App.tsx                  # Main application orchestrator & view controller
│   ├── main.tsx                 # React DOM mount point
│   ├── index.css                # Tailwind CSS v4 setup & custom animations
│   ├── firebase.ts              # Firebase initialization & Firestore listeners
│   ├── curatedTracks.ts         # Preset royalty-free jam tracks
│   │
│   ├── components/
│   │   ├── SyncPlayer.tsx       # Core zero-drift player (YouTube + HTML5 audio + slewing engine)
│   │   ├── SyncDiagnosticsOverlay.tsx # Live HUD showing RTT, clock offset, drift (ms)
│   │   ├── PartyHeader.tsx      # Top bar with room code, copy link, and controls
│   │   ├── JoinScreen.tsx       # Room creation and joining interface
│   │   ├── QRCodeModal.tsx      # SVG QR code for mobile camera scanning
│   │   ├── ReactionsOverlay.tsx # Floating animated emoji reactions
│   │   ├── MembersAndChatModal.tsx # In-room live chat and participant list
│   │   ├── AmbienceOverlay.tsx  # Dynamic lighting backgrounds & ambient audio synthesizer
│   │   ├── CoupleModal.tsx      # Couple Jam linking and private room controls
│   │   ├── CuratedMusicSelector.tsx # Track picker modal with search & custom URL input
│   │   └── AuthModal.tsx        # Firebase user authentication modal
│   │
│   ├── hooks/
│   │   └── useSyncSocket.ts     # Real-time WebSocket hook with NTP clock offset estimation
│   │
│   ├── types/
│   │   └── index.ts             # TypeScript definitions for Rooms, Tracks, Users, and Chat
│   │
│   └── utils/
│       └── ...                  # Helper functions and audio utilities
├── package.json
└── vite.config.ts
```

---

## ⚙️ How the Zero-Lag Sync Engine Works

```
        Host Device                               WebSocket Server                              Listener Device
             │                                           │                                             │
             │─── 1. Play/Pause/Seek ───────────────────►│                                             │
             │    (positionSec, clientLocalTime)         │                                             │
             │                                           │─── 2. Broadcast playback_sync ─────────────►│
             │                                           │    (anchorPos, serverTime, rate)            │
             │                                           │                                             │
             │◄── 3. Ping / Pong (NTP Calculation) ──────►│◄── 3. Ping / Pong (NTP Calculation) ───────►│
             │    offset = ((T1 - T0) + (T2 - T3)) / 2   │    offset = ((T1 - T0) + (T2 - T3)) / 2     │
             │                                           │                                             │
             │                                           │    4. Calculate Target Timeline Position    │
             │                                           │       Target = Anchor + Elapsed * Rate      │
             │                                           │                                             │
             │                                           │    5. Slew or Seek:                         │
             │                                           │       • |drift| < 50ms   : Perfect sync     │
             │                                           │       • 50ms - 600ms     : Modulate speed   │
             │                                           │                            (0.75x or 1.25x) │
             │                                           │       • > 600ms          : Hard Seek        │
```

1. **Clock Calibration**: Every connected client continuously exchanges lightweight timestamp packets with the server to calculate the one-way transit delay and compute the local clock offset relative to the server clock.
2. **Anchor Transmission**: When the host plays or seeks, the server establishes a canonical anchor: `anchorPos` (media time in seconds) and `serverTime` (epoch timestamp in milliseconds).
3. **Smooth Rate Modulation (Slewing)**: If a listener is slightly behind or ahead ($\pm 50\text{ms}$ to $600\text{ms}$), their player smoothly speeds up to $1.25\times$ or slows down to $0.75\times$ until the drift drops under $40\text{ms}$. This guarantees **audio continuity** without jarring pauses or repetitive buffering circles.

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### Installation

1. Clone or download the repository:
   ```bash
   git clone <repo-url>
   cd synctune
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env` (or configure your Firebase credentials if using custom cloud authentication and database storage):
   ```bash
   cp .env.example .env
   ```

4. Start the development server (runs full-stack Express + Vite + WebSocket on port 3000):
   ```bash
   npm run dev
   ```

5. Open your browser:
   Visit `http://localhost:3000` to create a room. Open another browser window, incognito tab, or mobile device on the same local network to join and test real-time synchronization.

---

## 🧪 Available Scripts

* `npm run dev` — Launches the unified Express server + Vite development server on port 3000.
* `npm run build` — Compiles the client code into production assets in `dist/`.
* `npm run start` — Runs the compiled production server.
* `npm run lint` — Validates all TypeScript types (`tsc --noEmit`).

---

## 📱 Mobile & Autoplay Tips

Modern mobile browsers (Safari on iOS, Chrome on Android) prevent web pages from playing audio before the user interacts with the page.
* When joining a room on mobile, SyncTune automatically shows a pulsating **"Tap to Unlock Audio"** pill.
* Tapping this once unlocks the browser's audio pipeline and binds the synchronized stream smoothly without restarting or desyncing the track.

---

## 📄 License
MIT License. Feel free to use and modify for private music parties, virtual listening sessions, or educational projects!
