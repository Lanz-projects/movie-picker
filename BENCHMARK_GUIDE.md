# Movie Picker - Empirical Benchmark Execution Guide

This guide provides step-by-step instructions and automated scripts to run all performance benchmarks, generate raw evidence logs in `/benchmarks/`, and extract real, verifiable metrics for your resume and technical interviews.

---

## Quick Start (Automated All-in-One Execution)

You can run the full benchmark suite in one command using the included PowerShell script:

```powershell
# From the project root directory
.\benchmarks\run_all_benchmarks.ps1
```

This will automatically execute all 4 benchmarks, generate the evidence files in `/benchmarks/`, and display a summary table in your terminal.

---

## Step-by-Step Manual Execution

If you prefer to run and inspect each benchmark individually, follow the commands below from the project root:

### 1. Benchmark 1: Automated Test Suite Counts
Runs both the Spring Boot and Next.js test suites, verifying that 100% of tests pass and recording exact test counts.

```powershell
# 1. Run backend test suite
cd backend
.\mvnw.cmd test | Out-File -FilePath "..\benchmarks\04-test-suite-raw.txt" -Encoding utf8

# 2. Run frontend test suite and append output
cd ..\frontend
npm test -- --run | Out-File -FilePath "..\benchmarks\04-test-suite-raw.txt" -Append -Encoding utf8

# Return to root
cd ..

# Verify output:
Get-Content benchmarks\04-test-suite-raw.txt | Select-String "Tests run:|Tests "
```
* **Evidence File Created**: `benchmarks/04-test-suite-raw.txt`

---

### 2. Benchmark 2: TMDB Cache Miss vs. Cache Hit Latency
Runs `MovieCacheBenchmarkTest.java` (includes a discarded warm-up call, 5 unique outbound TMDB HTTPS misses, and 5 in-memory heap hits).

```powershell
# Run caching benchmark test
cd backend
.\mvnw.cmd test -Dtest=MovieCacheBenchmarkTest | Out-File -FilePath "..\benchmarks\03-cache-timing-raw.txt" -Encoding utf8
cd ..

# Display measured timings:
Get-Content benchmarks\03-cache-timing-raw.txt | Select-String "Cache MISS|Cache HIT|CACHE"
```
* **Evidence File Created**: `benchmarks/03-cache-timing-raw.txt`

---

### 3. Benchmark 3: Docker Image Sizes (Naive vs. Optimized)
Builds the unoptimized baseline images (`Dockerfile.naive`) and the production multi-stage images (`Dockerfile`), querying Docker for real byte sizes.

```powershell
# 1. Build Backend Images
docker build -f backend/Dockerfile.naive -t movie-picker-backend:naive backend/
docker build -f backend/Dockerfile -t movie-picker-backend:optimized backend/

# 2. Build Frontend Images
docker build -f frontend/Dockerfile.naive -t movie-picker-frontend:naive frontend/
docker build -f frontend/Dockerfile -t movie-picker-frontend:optimized frontend/

# 3. Save Raw Docker Sizes
docker images --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" | Select-String "movie-picker" | Out-File -FilePath "benchmarks/01-docker-sizes-raw.txt" -Encoding utf8

# Display results:
Get-Content benchmarks\01-docker-sizes-raw.txt
```
* **Evidence File Created**: `benchmarks/01-docker-sizes-raw.txt`

---

### 4. Benchmark 4: Docker Build Times (Cold vs. Incremental Rebuild)
Measures execution time across 3 cold builds (no cache) and 3 warm incremental rebuilds (modifying a Java controller to test Spring Boot `layertools` layer caching).

```powershell
"=== DOCKER BUILD TIME BENCHMARKS ===" | Out-File -FilePath "benchmarks/02-docker-build-times-raw.txt" -Encoding utf8
"COLD BUILDS (No Cache):" | Out-File -FilePath "benchmarks/02-docker-build-times-raw.txt" -Append -Encoding utf8

# 1. Measure 3 Cold Builds
$coldRuns = @()
for ($i = 1; $i -le 3; $i++) {
    Write-Host "Running Cold Build $i/3..."
    $t = (Measure-Command { docker build --no-cache -f backend/Dockerfile -t movie-picker-backend:bench backend/ }).TotalSeconds
    $coldRuns += $t
    $line = "Cold Run " + $i + ": " + [Math]::Round($t, 2) + " s"
    $line | Out-File -FilePath "benchmarks/02-docker-build-times-raw.txt" -Append -Encoding utf8
}
$avgCold = [Math]::Round(($coldRuns | Measure-Object -Average).Average, 2)
"Cold Average: " + $avgCold + " s" | Out-File -FilePath "benchmarks/02-docker-build-times-raw.txt" -Append -Encoding utf8

# 2. Measure 3 Warm Incremental Builds (Real Code Modification)
"WARM INCREMENTAL BUILDS (Application Layer Invalidation):" | Out-File -FilePath "benchmarks/02-docker-build-times-raw.txt" -Append -Encoding utf8

$warmRuns = @()
for ($i = 1; $i -le 3; $i++) {
    Write-Host "Running Warm Incremental Build $i/3..."
    $ts = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    Add-Content -Path "backend\src\main\java\com\moviepicker\backend\controller\MovieController.java" -Value "`n// benchmark-touch-$ts"
    
    $t = (Measure-Command { docker build -f backend/Dockerfile -t movie-picker-backend:bench backend/ }).TotalSeconds
    $warmRuns += $t
    $line = "Warm Run " + $i + " (timestamp " + $ts + "): " + [Math]::Round($t, 2) + " s"
    $line | Out-File -FilePath "benchmarks/02-docker-build-times-raw.txt" -Append -Encoding utf8
}
$avgWarm = [Math]::Round(($warmRuns | Measure-Object -Average).Average, 2)
"Warm Incremental Average: " + $avgWarm + " s" | Out-File -FilePath "benchmarks/02-docker-build-times-raw.txt" -Append -Encoding utf8

# 3. Clean up the test comment
git checkout -- backend/src/main/java/com/moviepicker/backend/controller/MovieController.java

# Display summary:
Get-Content benchmarks\02-docker-build-times-raw.txt
```
* **Evidence File Created**: `benchmarks/02-docker-build-times-raw.txt`

---

## Evidence Directory Summary

After running the benchmarks, your `/benchmarks/` directory will contain:

| File | Contains |
|---|---|
| `benchmarks/01-docker-sizes-raw.txt` | Raw table of Docker image sizes (`naive` vs `optimized`) |
| `benchmarks/02-docker-build-times-raw.txt` | Timings for 3 cold builds and 3 incremental rebuilds |
| `benchmarks/03-cache-timing-raw.txt` | Real execution times for 5 TMDB cache misses and 5 in-memory hits |
| `benchmarks/04-test-suite-raw.txt` | Complete terminal logs from `mvn test` (174) and `npm test` (241) |
| `benchmarks/05-websocket-framing-notes.md` | Architectural decision writeup and interview scripts |

---

## Updating `RESUME_METRICS.md`

Once you have generated your raw evidence files:
1. Open each `.txt` file in `benchmarks/`.
2. Replace the `[INSERT ...]` placeholders in [RESUME_METRICS.md](file:///c:/Users/Lanz%20Prod/Documents/Programming/movie-picker/RESUME_METRICS.md) with your exact numbers.
3. Keep the `/benchmarks/` directory committed in your repository so you have permanent, verifiable proof for interviews.
