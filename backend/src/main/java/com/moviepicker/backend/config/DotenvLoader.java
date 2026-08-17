package com.moviepicker.backend.config;

import lombok.extern.slf4j.Slf4j;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Slf4j
public final class DotenvLoader {

    private DotenvLoader() {
    }

    public static void load() {
        List<Path> candidatePaths = List.of(
                Paths.get(".env"),
                Paths.get("backend", ".env"),
                Paths.get("..", ".env"),
                Paths.get("..", "backend", ".env")
        );

        for (Path path : candidatePaths) {
            if (Files.isRegularFile(path)) {
                log.info("Loading environment variables from: {}", path.toAbsolutePath());
                loadFromPath(path);
            }
        }
    }

    public static void loadFromPath(Path path) {
        if (!Files.isRegularFile(path)) {
            return;
        }

        try (BufferedReader reader = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) {
                    continue;
                }

                int eqIdx = line.indexOf('=');
                if (eqIdx <= 0) {
                    continue;
                }

                String key = line.substring(0, eqIdx).trim();
                String value = line.substring(eqIdx + 1).trim();

                if ((value.startsWith("\"") && value.endsWith("\"") && value.length() >= 2) ||
                    (value.startsWith("'") && value.endsWith("'") && value.length() >= 2)) {
                    value = value.substring(1, value.length() - 1);
                }

                if (System.getProperty(key) == null && System.getenv(key) == null) {
                    System.setProperty(key, value);
                }
            }
        } catch (IOException e) {
            log.warn("Could not read .env file at {}: {}", path, e.getMessage());
        }
    }
}
