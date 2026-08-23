package com.moviepicker.backend.service;

import com.moviepicker.backend.dto.MovieSearchResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.ArrayList;
import java.util.List;

@SpringBootTest(properties = "tmdb.api.key=79af54be39772765b0dccef67d23f3a0")
public class MovieCacheBenchmarkTest {

    @Autowired
    private MovieSearchService movieSearchService;

    @Test
    public void runEmpiricalCacheBenchmark() {
        // 0. JVM & Connection Pool Warm-Up Call (Discarded)
        // Eliminates SSL handshake init, classloading, and connection pool cold-start skew
        System.out.println("Executing JVM & HTTP connection pool warm-up call (discarded)...");
        try {
            movieSearchService.searchMovies("warmup-test-init", 1);
        } catch (Exception ignored) {
            // Ignored - solely for priming classes & SSL context
        }

        String[] missQueries = {"Inception", "Interstellar", "Gladiator", "Matrix", "Alien"};
        List<Long> missTimes = new ArrayList<>();
        List<Long> hitTimes = new ArrayList<>();

        System.out.println("=================================================");
        System.out.println("   TMDB CACHE BENCHMARK (5 MISSES vs 5 HITS)     ");
        System.out.println("=================================================");

        // 1. Five Unique Cache Misses (Real Outbound TMDB HTTPS Calls)
        for (int i = 0; i < missQueries.length; i++) {
            long start = System.nanoTime();
            MovieSearchResponse res = movieSearchService.searchMovies(missQueries[i], 1);
            long elapsedMs = (System.nanoTime() - start) / 1_000_000;
            missTimes.add(elapsedMs);
            int count = (res != null && res.getMovies() != null) ? res.getMovies().size() : 0;
            System.out.printf("Cache MISS [%d/5] (Query: '%s') -> %d ms (Results: %d)%n",
                    i + 1, missQueries[i], elapsedMs, count);
        }

        // 2. Prime the Cache for Hit Test
        movieSearchService.searchMovies("The Godfather", 1);

        // 3. Five Repeated Cache Hits (In-Memory Heap Lookups)
        for (int i = 0; i < 5; i++) {
            long start = System.nanoTime();
            MovieSearchResponse res = movieSearchService.searchMovies("The Godfather", 1);
            long elapsedMs = (System.nanoTime() - start) / 1_000_000;
            hitTimes.add(elapsedMs);
            System.out.printf("Cache HIT  [%d/5] (Query: 'The Godfather') -> %d ms%n", i + 1, elapsedMs);
        }

        // Compute Statistics
        double avgMiss = missTimes.stream().mapToLong(v -> v).average().orElse(0.0);
        long minMiss = missTimes.stream().mapToLong(v -> v).min().orElse(0);
        long maxMiss = missTimes.stream().mapToLong(v -> v).max().orElse(0);

        double avgHit = hitTimes.stream().mapToLong(v -> v).average().orElse(0.0);
        long minHit = hitTimes.stream().mapToLong(v -> v).min().orElse(0);
        long maxHit = hitTimes.stream().mapToLong(v -> v).max().orElse(0);

        System.out.println("-------------------------------------------------");
        System.out.printf("CACHE MISS STATS (5 Unique Queries): Avg = %.2f ms | Min = %d ms | Max = %d ms%n", avgMiss, minMiss, maxMiss);
        System.out.printf("CACHE HIT STATS  (5 In-Memory Hits): Avg = %.2f ms | Min = %d ms | Max = %d ms%n", avgHit, minHit, maxHit);
        System.out.println("=================================================");
    }
}
