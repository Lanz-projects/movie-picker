package com.moviepicker.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "sessions",
    indexes = {
        @Index(name = "idx_sessions_room_code", columnList = "room_code", unique = true)
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 10)
    private String roomCode;

    @Column(nullable = false)
    private String hostName;

    @Builder.Default
    @Column(nullable = false)
    private Integer maxUsers = 10;

    @Builder.Default
    @Column(nullable = false)
    private Integer maxSuggestionsPerUser = 5;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SessionStatus status;

    @Version
    private Long version;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "session_banned_users", joinColumns = @JoinColumn(name = "session_id"))
    @Column(name = "display_name")
    @Builder.Default
    private java.util.Set<String> bannedDisplayNames = new java.util.HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "session_round_kicked_users", joinColumns = @JoinColumn(name = "session_id"))
    @Column(name = "display_name")
    @Builder.Default
    private java.util.Set<String> roundKickedDisplayNames = new java.util.HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "session_kick_counts", joinColumns = @JoinColumn(name = "session_id"))
    @MapKeyColumn(name = "display_name")
    @Column(name = "kick_count")
    @Builder.Default
    private java.util.Map<String, Integer> kickCounts = new java.util.HashMap<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = SessionStatus.WAITING;
        }
    }
}
