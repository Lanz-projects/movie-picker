package com.moviepicker.backend.config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

public class DotenvLoaderTest {

    @Test
    public void testLoadFromPath_ParsesKeyValueAndQuotes(@TempDir Path tempDir) throws IOException {
        Path envFile = tempDir.resolve(".env");
        List<String> lines = List.of(
                "# This is a comment",
                "",
                "TEST_DOTENV_KEY_1=simpleValue",
                "TEST_DOTENV_KEY_2=\"quotedValue\"",
                "TEST_DOTENV_KEY_3='singleQuotedValue'",
                "TEST_DOTENV_KEY_4=value=with=equals",
                "INVALID_LINE_WITHOUT_EQUALS"
        );
        Files.write(envFile, lines);

        DotenvLoader.loadFromPath(envFile);

        assertThat(System.getProperty("TEST_DOTENV_KEY_1")).isEqualTo("simpleValue");
        assertThat(System.getProperty("TEST_DOTENV_KEY_2")).isEqualTo("quotedValue");
        assertThat(System.getProperty("TEST_DOTENV_KEY_3")).isEqualTo("singleQuotedValue");
        assertThat(System.getProperty("TEST_DOTENV_KEY_4")).isEqualTo("value=with=equals");

        // Clean up
        System.clearProperty("TEST_DOTENV_KEY_1");
        System.clearProperty("TEST_DOTENV_KEY_2");
        System.clearProperty("TEST_DOTENV_KEY_3");
        System.clearProperty("TEST_DOTENV_KEY_4");
    }

    @Test
    public void testLoadFromPath_NonExistentFileDoesNotThrow() {
        Path nonExistent = Path.of("non-existent-file-path-xyz.env");
        DotenvLoader.loadFromPath(nonExistent);
    }
}
