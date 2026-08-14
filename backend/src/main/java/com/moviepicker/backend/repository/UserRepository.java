package com.moviepicker.backend.repository;

import com.moviepicker.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    List<User> findBySessionId(Long sessionId);
    List<User> findBySessionRoomCode(String roomCode);
    List<User> findBySessionIdOrderByJoinedAtAsc(Long sessionId);
    List<User> findBySessionRoomCodeOrderByJoinedAtAsc(String roomCode);
}
