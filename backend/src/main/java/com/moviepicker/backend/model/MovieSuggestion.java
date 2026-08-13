package com.moviepicker.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "movie_suggestions",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_session_tmdb", columnNames = {"session_id", "tmdb_id"})
    },
    indexes = {
        @Index(name = "idx_movie_suggestions_session_id", columnList = "session_id"),
        @Index(name = "idx_movie_suggestions_session_user", columnList = "session_id, user_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"session", "user"})
public class MovieSuggestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private Session session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "tmdb_id", nullable = false)
    private Long tmdbId;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(name = "poster_path", length = 500)
    private String posterPath;

    @Column(columnDefinition = "TEXT")
    private String overview;

    @Column(name = "release_year")
    private Integer releaseYear;

    @Column(name = "suggested_at", nullable = false, updatable = false)
    private LocalDateTime suggestedAt;

    @PrePersist
    protected void onCreate() {
        if (suggestedAt == null) {
            suggestedAt = LocalDateTime.now();
        }
    }
}
