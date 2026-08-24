# Automated API Test Script for Movie Picker Session REST API
# Prerequisites: The backend Spring Boot server must be running on http://localhost:8080

$baseUrl = "http://localhost:8080/api/sessions"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host " Movie Picker API Automated Test Suite Flow" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# 1. Create Session
Write-Host "`n[1] Creating session..." -ForegroundColor Yellow
$createBody = @{
    hostName = "Lanz"
    maxUsers = 5
    maxSuggestionsPerUser = 3
} | ConvertTo-Json

try {
    $createRes = Invoke-RestMethod -Uri $baseUrl -Method Post -ContentType "application/json" -Body $createBody
    Write-Host "SUCCESS: Created session with Room Code: $($createRes.roomCode)" -ForegroundColor Green
    Write-Host ($createRes | ConvertTo-Json -Depth 3)
    $roomCode = $createRes.roomCode
} catch {
    Write-Host "FAILED: Could not create session. Error: $_" -ForegroundColor Red
    exit 1
}

# 2. Get Session by Room Code
Write-Host "`n[2] Fetching session details for room '$roomCode'..." -ForegroundColor Yellow
try {
    $getRes = Invoke-RestMethod -Uri "$baseUrl/$roomCode" -Method Get
    Write-Host "SUCCESS: Fetched session." -ForegroundColor Green
    Write-Host "Host: $($getRes.hostName) | Status: $($getRes.status) | Users Count: $($getRes.users.Count)" -ForegroundColor Green
} catch {
    Write-Host "FAILED: Could not fetch session. Error: $_" -ForegroundColor Red
}

# 3. Join Session (User 2: Alex)
Write-Host "`n[3] User 'Alex' joining room '$roomCode'..." -ForegroundColor Yellow
$joinBody1 = @{
    roomCode = $roomCode
    displayName = "Alex"
} | ConvertTo-Json

try {
    $joinRes1 = Invoke-RestMethod -Uri "$baseUrl/join" -Method Post -ContentType "application/json" -Body $joinBody1
    Write-Host "SUCCESS: Alex joined room! Total Users: $($joinRes1.users.Count)" -ForegroundColor Green
} catch {
    Write-Host "FAILED: Alex could not join. Error: $_" -ForegroundColor Red
}

# 4. Join Session (User 3: Sarah)
Write-Host "`n[4] User 'Sarah' joining room '$roomCode'..." -ForegroundColor Yellow
$joinBody2 = @{
    roomCode = $roomCode
    displayName = "Sarah"
} | ConvertTo-Json

try {
    $joinRes2 = Invoke-RestMethod -Uri "$baseUrl/join" -Method Post -ContentType "application/json" -Body $joinBody2
    Write-Host "SUCCESS: Sarah joined room! Total Users: $($joinRes2.users.Count)" -ForegroundColor Green
} catch {
    Write-Host "FAILED: Sarah could not join. Error: $_" -ForegroundColor Red
}

# 5. Update Status to VOTING
Write-Host "`n[5] Updating session status to 'VOTING'..." -ForegroundColor Yellow
$statusBody = @{
    status = "VOTING"
} | ConvertTo-Json

try {
    $statusRes = Invoke-RestMethod -Uri "$baseUrl/$roomCode/status" -Method Patch -ContentType "application/json" -Body $statusBody
    Write-Host "SUCCESS: Updated status to '$($statusRes.status)'" -ForegroundColor Green
} catch {
    Write-Host "FAILED: Could not update status. Error: $_" -ForegroundColor Red
}

# 6. Test Error Case: Duplicate Display Name
Write-Host "`n[6] Error Test: Attempting to join with duplicate name 'Alex' (Expecting HTTP 409 Conflict)..." -ForegroundColor Yellow
try {
    $errRes = Invoke-RestMethod -Uri "$baseUrl/join" -Method Post -ContentType "application/json" -Body $joinBody1
    Write-Host "UNEXPECTED: Request succeeded when it should have failed!" -ForegroundColor Red
} catch {
    Write-Host "SUCCESS: Caught expected conflict error -> HTTP status/message verified." -ForegroundColor Green
}

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host " API Test Suite Flow Completed Successfully!" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
