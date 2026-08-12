package com.moviepicker.backend.repository;

import com.moviepicker.backend.model.Session;
import com.moviepicker.backend.model.SessionStatus;
import com.moviepicker.backend.model.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class SessionRepositoryTest {

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    public void testSaveSessionAndAutoDefaults() {
        Session session = Session.builder()
                .roomCode("ABCD12")
                .hostName("Lanz")
                .build();

        Session savedSession = sessionRepository.save(session);

        assertThat(savedSession.getId()).isNotNull();
        assertThat(savedSession.getRoomCode()).isEqualTo("ABCD12");
        assertThat(savedSession.getHostName()).isEqualTo("Lanz");
        assertThat(savedSession.getMaxUsers()).isEqualTo(10); // Check default
        assertThat(savedSession.getMaxSuggestionsPerUser()).isEqualTo(5); // Check default
        assertThat(savedSession.getStatus()).isEqualTo(SessionStatus.WAITING); // Check default
        assertThat(savedSession.getCreatedAt()).isNotNull();
        assertThat(savedSession.getVersion()).isNotNull();
    }

    @Test
    public void testFindByRoomCodeAndExistsByRoomCode() {
        Session session = Session.builder()
                .roomCode("XYZ789")
                .hostName("Alex")
                .build();
        sessionRepository.save(session);

        Optional<Session> found = sessionRepository.findByRoomCode("XYZ789");
        assertThat(found).isPresent();
        assertThat(found.get().getHostName()).isEqualTo("Alex");

        boolean exists = sessionRepository.existsByRoomCode("XYZ789");
        assertThat(exists).isTrue();

        boolean nonExistent = sessionRepository.existsByRoomCode("NOTEXIST");
        assertThat(nonExistent).isFalse();
    }

    @Test
    public void testSaveUserAndRelationQueries() {
        Session session = Session.builder()
                .roomCode("ROOM11")
                .hostName("Bob")
                .build();
        Session savedSession = sessionRepository.save(session);

        User user1 = User.builder()
                .session(savedSession)
                .displayName("Charlie")
                .build();
        User user2 = User.builder()
                .session(savedSession)
                .displayName("David")
                .build();

        userRepository.save(user1);
        userRepository.save(user2);

        List<User> usersById = userRepository.findBySessionId(savedSession.getId());
        assertThat(usersById).hasSize(2);
        assertThat(usersById).extracting(User::getDisplayName).containsExactlyInAnyOrder("Charlie", "David");

        List<User> usersByRoomCode = userRepository.findBySessionRoomCode("ROOM11");
        assertThat(usersByRoomCode).hasSize(2);
        assertThat(usersByRoomCode).extracting(User::getDisplayName).containsExactlyInAnyOrder("Charlie", "David");
    }

    @Test
    public void testVersionIncrementsOnUpdate() {
        Session session = Session.builder()
                .roomCode("VERS01")
                .hostName("Emily")
                .build();
        Session savedSession = sessionRepository.saveAndFlush(session);
        Long initialVersion = savedSession.getVersion();

        savedSession.setHostName("Emily Modified");
        Session updatedSession = sessionRepository.saveAndFlush(savedSession);

        assertThat(updatedSession.getVersion()).isGreaterThan(initialVersion);
    }
}
