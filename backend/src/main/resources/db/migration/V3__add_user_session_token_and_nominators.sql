-- V3: Add User Session Token & Movie Suggestion Nominators
-- Supporting ephemeral session authentication and multi-user nominations

-- 1. Add session_token to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS session_token VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_users_session_token ON users(session_token);

-- 2. Create movie_suggestion_nominators table for multi-user nominations
CREATE TABLE IF NOT EXISTS movie_suggestion_nominators (
    movie_suggestion_id BIGINT NOT NULL REFERENCES movie_suggestions(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (movie_suggestion_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ms_nominators_suggestion ON movie_suggestion_nominators(movie_suggestion_id);
CREATE INDEX IF NOT EXISTS idx_ms_nominators_user ON movie_suggestion_nominators(user_id);
