package com.moviepicker.backend.repository;

import com.moviepicker.backend.model.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface SessionRepository extends JpaRepository<Session, Long> {
    Optional<Session> findByRoomCode(String roomCode);
    boolean existsByRoomCode(String roomCode);
}
