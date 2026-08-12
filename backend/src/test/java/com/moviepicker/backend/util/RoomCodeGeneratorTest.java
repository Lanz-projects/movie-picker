package com.moviepicker.backend.util;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

public class RoomCodeGeneratorTest {

    private RoomCodeGenerator roomCodeGenerator;

    @BeforeEach
    public void setUp() {
        roomCodeGenerator = new RoomCodeGenerator();
    }

    @Test
    public void testGenerate_LengthAndPattern() {
        String code = roomCodeGenerator.generate();
        assertThat(code).isNotNull();
        assertThat(code).hasSize(6);
        assertThat(code).matches("^[A-Z0-9]{6}$");
    }

    @Test
    public void testGenerate_UniquenessAcrossMultipleCalls() {
        int count = 1000;
        Set<String> generatedCodes = new HashSet<>();
        for (int i = 0; i < count; i++) {
            generatedCodes.add(roomCodeGenerator.generate());
        }
        // With 36^6 = 2.17 billion possibilities, 1000 codes should be unique
        assertThat(generatedCodes).hasSize(count);
    }
}
