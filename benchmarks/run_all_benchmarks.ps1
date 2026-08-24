# Movie Picker - Automated Benchmark Suite Execution Script
# Run this script from the project root: .\benchmarks\run_all_benchmarks.ps1

Write-Host ""
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "   MOVIE PICKER - EMPIRICAL BENCHMARK SUITE EXECUTION    " -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""

# Ensure output directory exists
$benchmarksDir = Join-Path $PSScriptRoot ""
if (-not (Test-Path $benchmarksDir)) {
    New-Item -ItemType Directory -Path $benchmarksDir | Out-Null
}

# ---------------------------------------------------------
# 1. Test Suite Verification
# ---------------------------------------------------------
Write-Host "[1/4] Running Automated Test Suites (Backend + Frontend)..." -ForegroundColor Yellow
$testSuiteOut = Join-Path $benchmarksDir "04-test-suite-raw.txt"

Write-Host "  -> Running Spring Boot JUnit test suite..."
Push-Location "backend"
.\mvnw.cmd test | Out-File -FilePath $testSuiteOut -Encoding utf8
Pop-Location

Write-Host "  -> Running Next.js Vitest test suite..."
Push-Location "frontend"
npm test -- --run --no-color | Out-File -FilePath $testSuiteOut -Append -Encoding utf8
Pop-Location
Write-Host "  OK: Test suite evidence saved to benchmarks/04-test-suite-raw.txt" -ForegroundColor Green
Write-Host ""

# ---------------------------------------------------------
# 2. TMDB Caching Benchmark
# ---------------------------------------------------------
Write-Host "[2/4] Running TMDB Multi-Run Caching Benchmark..." -ForegroundColor Yellow
$cacheOut = Join-Path $benchmarksDir "03-cache-timing-raw.txt"

Push-Location "backend"
.\mvnw.cmd test -Dtest=MovieCacheBenchmarkTest | Out-File -FilePath $cacheOut -Encoding utf8
Pop-Location
Write-Host "  OK: Cache timing evidence saved to benchmarks/03-cache-timing-raw.txt" -ForegroundColor Green
Write-Host ""

# ---------------------------------------------------------
# 3. Docker Image Sizes (Naive vs. Optimized)
# ---------------------------------------------------------
Write-Host "[3/4] Building and Measuring Docker Image Sizes..." -ForegroundColor Yellow
$dockerSizeOut = Join-Path $benchmarksDir "01-docker-sizes-raw.txt"

Write-Host "  -> Building Backend Naive..."
docker build -f backend/Dockerfile.naive -t movie-picker-backend:naive backend/ | Out-Null
Write-Host "  -> Building Backend Optimized..."
docker build -f backend/Dockerfile -t movie-picker-backend:optimized backend/ | Out-Null

Write-Host "  -> Building Frontend Naive..."
docker build -f frontend/Dockerfile.naive -t movie-picker-frontend:naive frontend/ | Out-Null
Write-Host "  -> Building Frontend Optimized..."
docker build -f frontend/Dockerfile -t movie-picker-frontend:optimized frontend/ | Out-Null

docker images --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" | Select-String "movie-picker" | Out-File -FilePath $dockerSizeOut -Encoding utf8
Write-Host "  OK: Docker size evidence saved to benchmarks/01-docker-sizes-raw.txt" -ForegroundColor Green
Write-Host ""

# ---------------------------------------------------------
# 4. Docker Build Times (Cold vs. Warm Incremental)
# ---------------------------------------------------------
Write-Host "[4/4] Measuring Docker Build Times (Cold vs. Incremental)..." -ForegroundColor Yellow
$dockerTimeOut = Join-Path $benchmarksDir "02-docker-build-times-raw.txt"

"=== DOCKER BUILD TIME BENCHMARKS ===" | Out-File -FilePath $dockerTimeOut -Encoding utf8
"COLD BUILDS (No Cache):" | Out-File -FilePath $dockerTimeOut -Append -Encoding utf8

$coldRuns = @()
for ($i = 1; $i -le 3; $i++) {
    Write-Host "  -> Running Cold Build $i of 3..."
    $t = (Measure-Command { docker build --no-cache -f backend/Dockerfile -t movie-picker-backend:bench backend/ }).TotalSeconds
    $coldRuns += $t
    $line = "Cold Run " + $i + ": " + [Math]::Round($t, 2) + " s"
    $line | Out-File -FilePath $dockerTimeOut -Append -Encoding utf8
}
$avgCold = [Math]::Round(($coldRuns | Measure-Object -Average).Average, 2)
"Cold Average: " + $avgCold + " s" | Out-File -FilePath $dockerTimeOut -Append -Encoding utf8

"WARM INCREMENTAL BUILDS (Application Layer Invalidation):" | Out-File -FilePath $dockerTimeOut -Append -Encoding utf8

$warmRuns = @()
for ($i = 1; $i -le 3; $i++) {
    Write-Host "  -> Running Warm Incremental Build $i of 3..."
    $ts = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    Add-Content -Path "backend\src\main\java\com\moviepicker\backend\controller\MovieController.java" -Value "// benchmark-touch"
    
    $t = (Measure-Command { docker build -f backend/Dockerfile -t movie-picker-backend:bench backend/ }).TotalSeconds
    $warmRuns += $t
    $line = "Warm Run " + $i + " (timestamp " + $ts + "): " + [Math]::Round($t, 2) + " s"
    $line | Out-File -FilePath $dockerTimeOut -Append -Encoding utf8
}
$avgWarm = [Math]::Round(($warmRuns | Measure-Object -Average).Average, 2)
"Warm Incremental Average: " + $avgWarm + " s" | Out-File -FilePath $dockerTimeOut -Append -Encoding utf8

# Clean up test comments from source code
git checkout -- backend/src/main/java/com/moviepicker/backend/controller/MovieController.java
Write-Host "  OK: Reverted benchmark test comments from source code."
Write-Host "  OK: Docker build timing evidence saved to benchmarks/02-docker-build-times-raw.txt" -ForegroundColor Green
Write-Host ""

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "             ALL BENCHMARKS COMPLETED SUCCESSFULLY!        " -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "Check your raw evidence files in the /benchmarks folder."
Write-Host ""
