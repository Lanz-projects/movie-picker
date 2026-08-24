package com.moviepicker.backend.model;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum VoteType {
    LIKE,
    PASS,
    SUPERLIKE,
    SKIP,
    YES,
    NO;

    @JsonCreator
    public static VoteType fromString(String value) {
        if (value == null) return null;
        String upper = value.trim().toUpperCase();
        return switch (upper) {
            case "LIKE" -> LIKE;
            case "PASS" -> PASS;
            case "SUPERLIKE" -> SUPERLIKE;
            case "SKIP" -> SKIP;
            case "YES" -> YES;
            case "NO" -> NO;
            default -> valueOf(upper);
        };
    }
}

