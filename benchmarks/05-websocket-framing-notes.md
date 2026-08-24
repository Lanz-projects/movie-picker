# WebSocket vs. Polling Architectural Decision & Interview Framing

## 1. Architectural Context & Decision
The Movie Picker platform requires multi-user state synchronization across active rooms during multiple stages (`LOBBY`, `SEARCH` nomination rack, `SWIPER` voting progress, and `WINNER` podium).

We chose an **event-driven STOMP/SockJS WebSocket architecture** over HTTP periodic polling based on the following architectural criteria:

| Criteria | HTTP Polling ($O(N)$ Pull) | STOMP WebSocket (Push) |
|---|---|---|
| **Network Traffic** | $N$ clients $\times$ 30 requests/min = 150 req/min for a 5-person room | 1 persistent TCP connection per client; zero idle HTTP overhead |
| **State Sync Latency** | Bounded by polling interval (e.g. 1.5s delay) | Immediate server frame push (<15ms local/LAN) |
| **Server Resource Usage** | High connection churn, TLS handshakes, HTTP header parsing | Long-lived persistent socket, minimal memory overhead |
| **Reconnection Handling** | Stateless re-querying | Handled with custom 5-second disconnect grace window in `WebSocketEventListener` |

---

## 2. Official Resume Bullet & Interview Script (Recommended Path)

### Option A: Pure Architectural Decision (Use This on Your Resume)
* **Official Resume Bullet**:
  > *"Architected an event-driven STOMP/SockJS WebSocket engine with topic-based pub/sub (`/topic/session/{code}`) and a 5-second disconnect grace window, eliminating periodic polling overhead and enabling bidirectional room synchronization."*
* **Interview Response**:
  > *"We chose an event-driven STOMP WebSocket architecture over periodic HTTP polling from day one. Rather than having multiple clients query the server every 1–2 seconds, the server holds persistent connections and broadcasts frames only upon game state transitions, eliminating redundant HTTP headers and database read queries."*

---

## 3. Alternative Path (Hypothetical Only)

### Option B: Standalone Validation Benchmark
> **Warning**: Do NOT use this on your resume unless you explicitly build and run a dedicated polling test harness.

* **Example Bullet**:
  > *"Built a standalone benchmarking harness comparing HTTP polling against event-driven STOMP WebSockets, measuring real message delivery latencies across simulated multi-user room sessions."*
