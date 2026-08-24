# Movie Picker API Examples & Testing Guide

This directory contains interactive examples and automated scripts to test all REST APIs built in Checkpoint 2.

## How to Start the Backend Server

Open a terminal in the `backend` folder and run:

```powershell
.\mvnw spring-boot:run
```

The Spring Boot application will start on **`http://localhost:8080`**.

---

## 3 Ways to Run & Test the APIs

### Option 1: Automated PowerShell Test Script (Easiest)
While the server is running, open a PowerShell terminal in the `backend` folder and run:

```powershell
.\api-examples\test-api-flow.ps1
```

This script automatically executes the full API flow:
1. `POST /api/sessions` - Creates a new session & extracts the generated room code.
2. `GET /api/sessions/{roomCode}` - Retrieves session state & active user list.
3. `POST /api/sessions/join` - Joins new users ("Alex", "Sarah").
4. `PATCH /api/sessions/{roomCode}/status` - Transitions state from `WAITING` to `VOTING`.
5. Error verification - Validates HTTP 409 Conflict handling on duplicate display names.

---

### Option 2: VS Code / IntelliJ HTTP Client (`session-api.http`)
If you use VS Code (with the *REST Client* extension) or IntelliJ IDEA:
1. Open `backend/api-examples/session-api.http`.
2. Click **Send Request** above any request block (e.g. `POST http://localhost:8080/api/sessions`).

---

### Option 3: Postman Collection (`postman_collection.json`)
1. Open Postman.
2. Click **Import** -> Select `backend/api-examples/postman_collection.json`.
3. Run the requests against `http://localhost:8080`.

---

## REST Endpoints Reference Table

| Method | Endpoint | Description | Request Body Example |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/sessions` | Create a new session | `{"hostName": "Lanz", "maxUsers": 5, "maxSuggestionsPerUser": 3}` |
| **GET** | `/api/sessions/{roomCode}` | Get session by room code | N/A |
| **POST** | `/api/sessions/join` | Join an existing session | `{"roomCode": "ABC123", "displayName": "Alex"}` |
| **PATCH** | `/api/sessions/{roomCode}/status` | Update session status | `{"status": "VOTING"}` |
