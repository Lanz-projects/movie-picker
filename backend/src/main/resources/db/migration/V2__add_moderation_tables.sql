-- V2: Add Host Moderation & Kicking Tables
-- Supporting session-level permanent bans, round kicks, and cumulative kick counts

-- 1. Session Banned Users (Permanent Host Bans)
CREATE TABLE IF NOT EXISTS session_banned_users (
    session_id BIGINT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    PRIMARY KEY (session_id, display_name)
);

CREATE INDEX IF NOT EXISTS idx_session_banned_users_session_id ON session_banned_users(session_id);

-- 2. Session Round Kicked Users (Single-Round Kicks)
CREATE TABLE IF NOT EXISTS session_round_kicked_users (
    session_id BIGINT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    PRIMARY KEY (session_id, display_name)
);

CREATE INDEX IF NOT EXISTS idx_session_round_kicked_users_session_id ON session_round_kicked_users(session_id);

-- 3. Session Kick Counts (Cumulative Warning/Kick Counter)
CREATE TABLE IF NOT EXISTS session_kick_counts (
    session_id BIGINT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    kick_count INT NOT NULL DEFAULT 0,
    PRIMARY KEY (session_id, display_name)
);

CREATE INDEX IF NOT EXISTS idx_session_kick_counts_session_id ON session_kick_counts(session_id);
