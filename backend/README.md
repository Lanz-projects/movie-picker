# Movie Picker - Backend Service

Production-grade Spring Boot 4 REST and STOMP WebSocket backend for the Movie Picker application.

---

## Overview

The backend service is responsible for session lifecycle management, real-time presence tracking, TMDB catalog integrations, Gemini AI recommendation parsing, weighted consensus calculations, and distributed request tracing.

---

## Technologies

- **Runtime**: Java 17 (Eclipse Temurin)
- **Framework**: Spring Boot 4.1.0
- **Database Access**: Spring Data JPA / Hibernate ORM 7
- **Database**: PostgreSQL 16 (Production) / H2 In-Memory (Test Suite)
- **Migrations**: Flyway
- **Real-Time Communication**: Spring WebSocket / STOMP over SockJS
- **Fault Tolerance**: Resilience4j 2.2.0 (CircuitBreaker, Retry)
- **Observability**: Spring Boot Actuator, SLF4J MDC Tracing
- **Security**: Per-IP Token Bucket Rate Limiting, Session Token Validation
- **Build System**: Maven 3.9 (with Maven Wrapper `./mvnw`)

---

## Package Structure

```text
com.moviepicker.backend
├── actuator/          # Actuator endpoints and health test verifications
├── client/            # External API clients (TmdbClient, GeminiClient)
├── config/            # WebMvc, WebSocket, Cache, and Property configs
├── controller/        # REST and WebSocket STOMP controllers
├── dto/               # Request, Response, and Mapping DTOs
├── exception/         # Global Exception Handler and custom exceptions
├── logging/           # MDC CorrelationIdFilter and WebSocket ChannelInterceptor
├── model/             # JPA Entities (Session, User, MovieSuggestion, Vote)
├── repository/        # Spring Data JPA Repository interfaces
├── security/          # RateLimiterService, TokenBucket, and SessionSecurity
├── service/           # Core business logic and consensus engine
└── util/              # Mapping utilities, RoomCodeGenerator, Date utilities
```

---

## Local Setup & Installation

### 1. Prerequisites
- **JDK 17 or higher** installed and on `PATH`.
- **PostgreSQL 16** running locally or via Docker on port `5432`.
- Valid API keys for **TMDB** and **Google Gemini AI**.

### 2. Environment Configuration
Set the following environment variables in your terminal or IDE run configuration:

```bash
# On Linux/macOS
export DB_URL="jdbc:postgresql://localhost:5432/moviepicker"
export DB_USER="postgres"
export DB_PASSWORD="supersecretpassword123"
export TMDB_API_KEY="your_tmdb_api_key"
export GEMINI_API_KEY="your_gemini_api_key"

# On Windows (PowerShell)
$env:DB_URL="jdbc:postgresql://localhost:5432/moviepicker"
$env:DB_USER="postgres"
$env:DB_PASSWORD="supersecretpassword123"
$env:TMDB_API_KEY="your_tmdb_api_key"
$env:GEMINI_API_KEY="your_gemini_api_key"
```

### 3. Run Database Migrations & Start Server
```bash
# On Linux/macOS
./mvnw spring-boot:run

# On Windows
.\mvnw.cmd spring-boot:run
```

The application will start on `http://localhost:8080`.

---

## Resilience & Fault Tolerance

The backend protects upstream integrations against cascading failures using Resilience4j:

### 1. Gemini AI Integration (`GeminiClientImpl`)
- `@CircuitBreaker(name = "geminiApi", fallbackMethod = "generateRecommendationsFallback")`
- `@Retry(name = "geminiApi")`
- **Fallback Behavior**: When Gemini API is unavailable or rate-limited, the client returns a degraded response informing the user without throwing a 500 error or hanging worker threads.

### 2. TMDB Integration (`MovieSearchServiceImpl`)
- `@CircuitBreaker(name = "tmdbApi", fallbackMethod = "searchMoviesFallback")`
- `@Retry(name = "tmdbApi")`
- **Fallback Behavior**: Returns empty paginated responses (`movies: []`) or `null` details gracefully.

---

## Distributed Tracing & Observability

### Correlation ID Flow
1. **HTTP Requests**: Handled by `CorrelationIdFilter` (`OncePerRequestFilter`).
   - Extracts incoming `X-Correlation-ID` header or generates a random UUID.
   - Puts `traceId` into SLF4J MDC.
   - Sets `X-Correlation-ID` on the HTTP response.
   - Cleans up MDC context in a `finally` block to prevent thread pool contamination.
2. **WebSocket STOMP Frames**: Handled by `CorrelationIdChannelInterceptor`.
   - Extracts trace IDs from native STOMP headers on `CONNECT` and `SEND` frames.
   - Stores the trace ID in the WebSocket session attributes for persistent traceability across the connection lifecycle.

---

## Health & Monitoring

Spring Boot Actuator exposes health indicators at `/actuator/health`:

```bash
curl http://localhost:8080/actuator/health
```

Sample Response:
```json
{
  "status": "UP",
  "components": {
    "circuitBreakers": {
      "status": "UP",
      "details": {
        "geminiApi": { "status": "UP" },
        "tmdbApi": { "status": "UP" }
      }
    },
    "db": {
      "status": "UP",
      "details": {
        "database": "PostgreSQL",
        "validationQuery": "isValid()"
      }
    },
    "diskSpace": { "status": "UP" },
    "ping": { "status": "UP" }
  }
}
```

---

## Testing

The backend includes a comprehensive automated test suite (173 tests) covering controllers, services, repositories, security filters, rate limiting, and circuit breakers.

### Run All Tests
```bash
./mvnw clean test
```

### Run Specific Test Classes
```bash
# Test Actuator Health
./mvnw test -Dtest=ActuatorHealthTest

# Test Resilience4j Fallbacks
./mvnw test -Dtest=GeminiClientTest,MovieSearchServiceTest

# Test MDC Correlation Tracing
./mvnw test -Dtest=CorrelationIdFilterTest,CorrelationIdChannelInterceptorTest
```
