package com.moviepicker.backend.repository;

import com.moviepicker.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    List<User> findBySessionId(Long sessionId);
    List<User> findBySessionRoomCode(String roomCode);
    List<User> findBySessionIdOrderByJoinedAtAsc(Long sessionId);
    List<User> findBySessionRoomCodeOrderByJoinedAtAsc(String roomCode);
    Optional<User> findBySessionToken(String sessionToken);
    Optional<User> findBySessionRoomCodeAndSessionToken(String roomCode, String sessionToken);

    @Query("SELECT u FROM User u JOIN FETCH u.session WHERE u.sessionToken = :sessionToken")
    Optional<User> findBySessionTokenWithSession(@Param("sessionToken") String sessionToken);
}
