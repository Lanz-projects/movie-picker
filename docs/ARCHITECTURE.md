# Movie Picker - System Architecture

Comprehensive architectural specification detailing database schema design, room lifecycle state machines, real-time WebSocket communication flows, weighted consensus calculations, and resilience engineering.

---

## Table of Contents
- [Layered Architecture](#layered-architecture)
- [Database Schema (Entity-Relationship Model)](#database-schema-entity-relationship-model)
- [Room Stage State Machine](#room-stage-state-machine)
- [Real-Time WebSocket Protocol & Sequence](#real-time-websocket-protocol--sequence)
- [Weighted Consensus Algorithm](#weighted-consensus-algorithm)
- [Fault Tolerance & Circuit Breaking Topology](#fault-tolerance--circuit-breaking-topology)
- [Distributed Tracing (MDC)](#distributed-tracing-mdc)

---

## Layered Architecture

Movie Picker employs a strict separation of concerns across presentation, transport, domain, persistence, and external service layers:

```mermaid
flowchart TD
    subgraph Client ["Frontend Client (Next.js 16)"]
        UIComponents["React 19 UI Components<br/>(Lobby, Search, Swiper, Winner)"]
        Context["SessionContext<br/>(State Machine + Local Cache)"]
        STOMPClient["@stomp/stompjs Client<br/>(SockJS Transport)"]
    end

    subgraph TransportLayer ["Transport & Gateway Layer"]
        RateLimit["RateLimitingFilter<br/>(Token Bucket per IP)"]
        CorrelationFilter["CorrelationIdFilter<br/>(MDC Trace Extraction)"]
        RESTControllers["REST Controllers<br/>(Session, Search, AI, Consensus)"]
        WSInterceptor["CorrelationIdChannelInterceptor<br/>(STOMP Frame Tracing)"]
        WSController["WebSocketPresenceController<br/>(STOMP Broker)"]
    end

    subgraph ServiceLayer ["Domain & Application Layer"]
        SessionService["SessionService<br/>(Roster, Moderation, Stage Gates)"]
        SearchService["MovieSearchService<br/>(Catalog Search & Discover)"]
        AIService["AiRecommendationService<br/>(Gemini Prompting & Caching)"]
        VoteService["VoteService<br/>(Tally & Validation)"]
        ConsensusService["ConsensusService<br/>(Weighted Scoring Engine)"]
    end

    subgraph ResilienceLayer ["Resilience & External Clients"]
        Resilience4j["Resilience4j Circuit Breakers & Retries"]
        TMDBClient["TmdbClientImpl (RestClient)"]
        GeminiClient["GeminiClientImpl (RestClient)"]
    end

    subgraph PersistenceLayer ["Data Layer"]
        JPARepositories["Spring Data JPA Repositories"]
        Database[("PostgreSQL 16 Engine")]
    end

    UIComponents --> Context
    Context --> STOMPClient
    Context -->|HTTP REST| RateLimit
    RateLimit --> CorrelationFilter
    CorrelationFilter --> RESTControllers
    STOMPClient <-->|STOMP Frames| WSInterceptor
    WSInterceptor <--> WSController
    RESTControllers --> SessionService & SearchService & AIService & VoteService & ConsensusService
    WSController --> SessionService & VoteService
    SearchService & AIService --> Resilience4j
    Resilience4j --> TMDBClient & GeminiClient
    SessionService & VoteService & ConsensusService --> JPARepositories
    JPARepositories --> Database
```

---

## Database Schema (Entity-Relationship Model)

The database schema is managed via Flyway versioned migrations and normalized for transactional integrity and low-latency queries during high-concurrency voting rounds.

```mermaid
erDiagram
    SESSIONS ||--o{ USERS : "has members"
    SESSIONS ||--o{ MOVIE_SUGGESTIONS : "aggregates deck"
    SESSIONS ||--o{ VOTES : "contains votes"
    USERS ||--o{ VOTES : "casts"
    USERS ||--o{ MOVIE_SUGGESTIONS : "nominates"
    MOVIE_SUGGESTIONS ||--o{ VOTES : "receives"
    MOVIE_SUGGESTIONS ||--o{ MOVIE_SUGGESTION_NOMINATORS : "co-nominated by"
    USERS ||--o{ MOVIE_SUGGESTION_NOMINATORS : "co-nominates"
    SESSIONS ||--o{ SESSION_BANNED_USERS : "bans"
    SESSIONS ||--o{ SESSION_KICK_COUNTS : "tracks kicks"

    SESSIONS {
        bigint id PK
        varchar room_code UK "6-char unique code"
        varchar host_name "Current room host"
        varchar status "LOBBY, SEARCH, SWIPER, WINNER, COMPLETED"
        integer max_users "Player capacity (2-32)"
        integer max_suggestions_per_user "Nomination cap (1-10)"
        timestamp created_at
        bigint version "Optimistic lock version"
    }

    USERS {
        bigint id PK
        bigint session_id FK
        varchar display_name
        varchar session_token UK "Host/User auth token"
        timestamp joined_at
    }

    MOVIE_SUGGESTIONS {
        bigint id PK
        bigint session_id FK
        bigint user_id FK "Primary nominator"
        bigint tmdb_id "TMDB unique identifier"
        varchar title
        text overview
        varchar poster_path
        integer release_year
        timestamp suggested_at
    }

    MOVIE_SUGGESTION_NOMINATORS {
        bigint movie_suggestion_id PK,FK
        bigint user_id PK,FK
    }

    VOTES {
        bigint id PK
        bigint session_id FK
        bigint user_id FK
        bigint movie_suggestion_id FK
        varchar vote_type "YES, NO, LIKE, SUPERLIKE, SKIP, PASS"
        timestamp voted_at
    }

    SESSION_BANNED_USERS {
        bigint session_id PK,FK
        varchar user_identifier PK
    }

    SESSION_KICK_COUNTS {
        bigint session_id PK,FK
        varchar user_identifier PK
        integer kick_count
    }
```

### Key Schema Constraints
- **`uk_user_movie_vote`**: Unique constraint on `(user_id, movie_suggestion_id)` preventing duplicate votes by the same participant on the same movie.
- **Database Indexes**: Dedicated indexes on `(session_id)`, `(session_id, user_id)`, and `(session_id, movie_suggestion_id)` ensure sub-millisecond lookups during real-time score calculation.

---

## Room Stage State Machine

A room transitions sequentially through strict stage boundaries governed by host authorization:

```mermaid
stateDiagram-v2
    [*] --> SETUP : User creates room
    SETUP --> LOBBY : Room code generated, Host joins
    
    state LOBBY {
        [*] --> WaitingForPlayers
        WaitingForPlayers --> MemberJoined : Peer joins via code
        MemberJoined --> MemberLeft : Peer leaves
        MemberJoined --> MemberKicked : Host kicks peer
    }

    LOBBY --> SEARCH : Host clicks "Start Movie Search"
    
    state SEARCH {
        [*] --> Nominating
        Nominating --> DeckBuilding : Search TMDB / Match Vibe / AI Concierge
        DeckBuilding --> DeckSubmitted : User submits nominations
    }

    SEARCH --> SWIPER : Host clicks "Start Voting Phase"
    
    state SWIPER {
        [*] --> VotingRound
        VotingRound --> VoteCast : Swipe / Keyboard Action
        VoteCast --> TallyUpdated : WebSocket broadcast
    }

    SWIPER --> WINNER : All votes cast or Host ends round
    
    state WINNER {
        [*] --> ConsensusCalculation
        ConsensusCalculation --> DisplayPodium : Leaderboard & Streaming Providers
    }

    WINNER --> LOBBY : Host triggers new round
    WINNER --> COMPLETED : All participants depart
    COMPLETED --> [*]
```

---

## Real-Time WebSocket Protocol & Sequence

The real-time synchronization layer uses STOMP over SockJS to broadcast room events without polling:

```mermaid
sequenceDiagram
    autonumber
    actor Host as Host Client
    actor Peer as Peer Client
    participant WS as WebSocket Controller (STOMP)
    participant Core as Session & Vote Service
    participant DB as PostgreSQL Database

    Note over Host,DB: 1. Room Creation & Connection
    Host->>WS: CONNECT /ws (X-Correlation-ID: trace-001)
    WS-->>Host: CONNECTED
    Host->>WS: SUBSCRIBE /topic/session/SFFMU1

    Note over Peer,DB: 2. Peer Joins Room
    Peer->>WS: CONNECT /ws (X-Correlation-ID: trace-002)
    WS-->>Peer: CONNECTED
    Peer->>WS: SUBSCRIBE /topic/session/SFFMU1
    Peer->>Core: POST /api/v1/sessions/join
    Core->>DB: INSERT into users
    Core->>WS: Broadcast MemberJoined to /topic/session/SFFMU1
    WS-->>Host: MemberJoined Event (Roster updated)
    WS-->>Peer: MemberJoined Event (Roster updated)

    Note over Host,DB: 3. Stage Advancement to SWIPER
    Host->>Core: POST /api/v1/sessions/SFFMU1/start-voting
    Core->>DB: UPDATE sessions SET status = 'SWIPER'
    Core->>WS: Broadcast StageChange (SWIPER)
    WS-->>Host: StageChange (Navigate to Swiper)
    WS-->>Peer: StageChange (Navigate to Swiper)

    Note over Host,DB: 4. Real-Time Swipe Voting
    Peer->>Core: POST /api/v1/votes (SUPERLIKE on Movie 550)
    Core->>DB: INSERT into votes
    Core->>WS: Broadcast VoteProgress (userCount, submittedCount)
    WS-->>Host: VoteProgress Update
    WS-->>Peer: VoteProgress Update

    Note over Host,DB: 5. Disconnection & Reconnection Grace Window
    Peer--xWS: Network Disconnection
    WS->>Core: Handle SessionDisconnectEvent
    Note right of Core: Start 5-second grace timer
    Peer->>WS: Reconnect within 3 seconds
    Core->>Core: Cancel grace timer; Preserve session token
```

---

## Weighted Consensus Algorithm

When calculating final rankings and the winning movie, each vote cast by a participant is weighted:

### Vote Weights
| Vote Type | Point Value | Semantic Meaning |
|---|---|---|
| `SUPERLIKE` | **+3** | Absolute favorite selection |
| `YES` | **+2** | Strong approval |
| `LIKE` | **+1** | Moderate approval |
| `SKIP` | **0** | Neutral / Passed |
| `NO` | **0** | Disapproval |
| `PASS` | **0** | Neutral pass |

### Consensus Scoring Formula
For each movie suggestion $M$ in room $S$:

$$\text{Total Score}(M) = \sum_{v \in \text{Votes}(M)} \text{Weight}(v.\text{type})$$

$$\text{Approval Percentage}(M) = \frac{\text{Count}(\text{Positive Votes})}{\text{Total Room Participants}} \times 100$$

### Deterministic Tie-Breaking
If two or more movies achieve identical Total Scores, ties are resolved in the following priority:
1. **Higher Superlike Count** ($\text{Count}(\text{SUPERLIKE})$)
2. **Higher TMDB Vote Average** ($\text{VoteAverage}$)
3. **Higher Total Vote Count on TMDB** ($\text{VoteCount}$)
4. **Earlier Release Date** ($\text{ReleaseDate}$)

---

## Fault Tolerance & Circuit Breaking Topology

All external third-party API dependencies (TMDB API and Google Gemini API) are isolated behind Resilience4j circuit breakers and exponential backoff retry layers:

```mermaid
stateDiagram-v2
    [*] --> CLOSED : Normal Operation

    state CLOSED {
        [*] --> ExecuteCall
        ExecuteCall --> Success : Upstream 200 OK
        ExecuteCall --> FailureCounted : 429 / 5xx / Timeout
    }

    CLOSED --> OPEN : Failure Rate >= 50% (min 5 calls)

    state OPEN {
        [*] --> ShortCircuit
        ShortCircuit --> FallbackInvoked : Serve degraded response
    }

    OPEN --> HALF_OPEN : Wait duration expires (10s)

    state HALF_OPEN {
        [*] --> ProbeCalls : Allow 3 test calls
        ProbeCalls --> ProbeSuccess : Success rate >= threshold
        ProbeCalls --> ProbeFailure : Any failure
    }

    HALF_OPEN --> CLOSED : Probe successful (Circuit reset)
    HALF_OPEN --> OPEN : Probe failed (Wait 10s more)
```

### Configured Instances
- **`geminiApi`**: Sliding window of 10 calls, 50% failure rate threshold, 10-second open duration, 3 retry attempts with base backoff 500ms and 2x exponential multiplier.
- **`tmdbApi`**: Sliding window of 10 calls, 50% failure rate threshold, 10-second open duration, 3 retry attempts with base backoff 500ms and 2x exponential multiplier.

---

## Distributed Tracing (MDC)

To trace requests end-to-end across asynchronous execution boundaries, threads, and WebSocket sessions:

1. **HTTP Ingestion**: `CorrelationIdFilter` intercepts incoming HTTP requests. If the request carries an `X-Correlation-ID` header, that ID is preserved; otherwise, a UUID is generated.
2. **MDC Population**: The trace ID is stored in SLF4J MDC under key `traceId`.
3. **Console Logging**: Configured via Spring Boot console pattern `%X{traceId:-}`, stamping every log entry with `[traceId]`.
4. **Response Injection**: The trace ID is returned in the HTTP response header `X-Correlation-ID`.
5. **WebSocket Propagation**: `CorrelationIdChannelInterceptor` inspects native STOMP frame headers on `CONNECT` and `SEND`, transferring the trace ID into session attributes and MDC for background thread dispatch.
6. **Thread Hygiene**: All filters and interceptors clear MDC in `finally` blocks, preventing trace contamination across reusable thread pools.
