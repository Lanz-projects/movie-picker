# Movie Picker - Frontend Client

Modern, responsive Next.js 16 web client for the Movie Picker real-time collaborative movie discovery platform.

---

## Overview

The frontend application provides a synchronized, multi-stage room experience: Lobby management, TMDB catalog search with the Vibe Matcher, conversational AI Concierge ("I'm Lost"), keyboard/gesture-driven Tinder-style movie deck swiping, and instant consensus podium leaderboards.

---

## Technologies

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Library**: React 19
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS & CSS Modules
- **Real-Time Client**: `@stomp/stompjs` + `sockjs-client`
- **Icons**: Lucide React
- **Animations & Effects**: Canvas Confetti, CSS Transitions
- **Testing**: Vitest, `@testing-library/react`, Happy-DOM

---

## Project Structure

```text
frontend/
├── __tests__/         # Comprehensive Vitest test suite (237 tests)
├── app/               # Next.js App Router root layout and page
├── components/        # Focused UI components
│   ├── AiConciergeTab.tsx         # Multi-turn Gemini AI chat interface
│   ├── MovieCard.tsx              # Rich movie poster and metadata card
│   ├── MovieDetailsModal.tsx      # Cast, directors, and streaming provider modal
│   ├── QRCodeModal.tsx            # Room invitation QR code
│   ├── RoomUsersDropdown.tsx      # Real-time member roster with host controls
│   ├── SearchFilterToolbar.tsx    # Vibe Matcher multi-filter discovery toolbar
│   ├── SelectionRack.tsx          # Interactive deck nomination drawer
│   ├── SwipeCard.tsx              # Gesture & keyboard-driven swipe voting card
│   └── WinnerCard.tsx             # Consensus podium and ranking display
├── context/           # SessionContext (Unified room and WebSocket state)
├── hooks/             # Custom React hooks (useMovieSearch, useKeyboardSwipe)
├── lib/               # API clients, audio utilities, storage helpers
└── types/             # TypeScript domain models and interfaces
```

---

## Local Setup & Development

### 1. Prerequisites
- **Node.js 20.x or higher** installed.
- **npm** (included with Node.js).
- Running backend instance (on `http://localhost:8080` by default).

### 2. Environment Configuration
Create a `.env.local` file in the `frontend/` directory if you need custom API URLs:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=http://localhost:8080/ws
```

*(If omitted, the frontend defaults to `http://localhost:8080` and `http://localhost:8080/ws`).*

### 3. Install Dependencies
```bash
npm install
```

### 4. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Application State Management

Application state is centralized in `SessionContext.tsx`:

- **Stage Lifecycle**: Manages progression across `SETUP` ➔ `LOBBY` ➔ `SEARCH` ➔ `SWIPER` ➔ `WINNER`.
- **Session Persistence**: Caches active room code, user identity, and session token in `sessionStorage` to allow graceful page refreshes without losing room participation.
- **Host Permissions**: Derives host privileges based on session tokens, enabling room configuration, stage advancement, and user moderation controls.

---

## Real-Time WebSocket Architecture

The STOMP client connects to the backend over SockJS:

- **Subscription**: Listens on `/topic/session/{roomCode}` for real-time room events (stage changes, user arrivals, vote increments, nominations readiness).
- **Heartbeat & Presence**: Emits periodic presence pings to `/app/session/{roomCode}/presence`.
- **Graceful Reconnection**: Automatically detects disconnections and attempts reconnection within the backend's 5-second grace window to maintain session integrity.

---

## Production Build & Standalone Mode

The frontend is configured with `output: 'standalone'` in `next.config.ts`.

When running `npm run build`, Next.js creates a minimal `.next/standalone` folder containing only the required production files and node_modules dependencies, reducing the Docker container image size to ~73MB.

### Build Production Bundle
```bash
npm run build
```

### Start Standalone Server Locally
```bash
node .next/standalone/server.js
```

---

## Testing

The frontend includes a complete Vitest unit and component testing suite (237 tests).

### Run Test Suite
```bash
npm test
```

### Run TypeScript Typecheck
```bash
npx tsc --noEmit
```
