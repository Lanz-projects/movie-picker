package com.moviepicker.backend.security.auth;

import com.moviepicker.backend.exception.ForbiddenException;
import com.moviepicker.backend.exception.UnauthorizedException;
import com.moviepicker.backend.model.Session;
import com.moviepicker.backend.model.SessionStatus;
import com.moviepicker.backend.model.User;
import com.moviepicker.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class SessionSecurityServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private SessionSecurityService securityService;

    private Session sampleSession;
    private User hostUser;
    private User regularUser;

    @BeforeEach
    public void setUp() {
        sampleSession = Session.builder()
                .id(1L)
                .roomCode("TEST")
                .hostName("Alice")
                .status(SessionStatus.WAITING)
                .build();

        hostUser = User.builder()
                .id(10L)
                .session(sampleSession)
                .displayName("Alice")
                .sessionToken("host-token-123")
                .build();

        regularUser = User.builder()
                .id(20L)
                .session(sampleSession)
                .displayName("Bob")
                .sessionToken("bob-token-456")
                .build();
    }

    @Test
    public void testValidateUserToken_Success() {
        when(userRepository.findBySessionTokenWithSession("bob-token-456"))
                .thenReturn(Optional.of(regularUser));

        User user = securityService.validateUserToken("TEST", 20L, "bob-token-456");
        assertThat(user).isNotNull();
        assertThat(user.getDisplayName()).isEqualTo("Bob");
    }

    @Test
    public void testValidateUserToken_MissingToken_ThrowsUnauthorized() {
        assertThatThrownBy(() -> securityService.validateUserToken("TEST", 20L, null))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Missing authentication token");

        assertThatThrownBy(() -> securityService.validateUserToken("TEST", 20L, "   "))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    public void testValidateUserToken_InvalidToken_ThrowsUnauthorized() {
        when(userRepository.findBySessionTokenWithSession("fake-token"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> securityService.validateUserToken("TEST", 20L, "fake-token"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Invalid session authentication token");
    }

    @Test
    public void testValidateUserToken_MismatchedRoom_ThrowsForbidden() {
        when(userRepository.findBySessionTokenWithSession("bob-token-456"))
                .thenReturn(Optional.of(regularUser));

        assertThatThrownBy(() -> securityService.validateUserToken("OTHER", 20L, "bob-token-456"))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("does not match the requested room");
    }

    @Test
    public void testValidateUserToken_MismatchedUserId_ThrowsForbidden() {
        when(userRepository.findBySessionTokenWithSession("bob-token-456"))
                .thenReturn(Optional.of(regularUser));

        assertThatThrownBy(() -> securityService.validateUserToken("TEST", 99L, "bob-token-456"))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("does not match the requested user identity");
    }

    @Test
    public void testValidateHostToken_Success() {
        when(userRepository.findBySessionTokenWithSession("host-token-123"))
                .thenReturn(Optional.of(hostUser));

        User host = securityService.validateHostToken("TEST", "host-token-123");
        assertThat(host).isNotNull();
        assertThat(host.getDisplayName()).isEqualTo("Alice");
    }

    @Test
    public void testValidateHostToken_NonHostUser_ThrowsForbidden() {
        when(userRepository.findBySessionTokenWithSession("bob-token-456"))
                .thenReturn(Optional.of(regularUser));

        assertThatThrownBy(() -> securityService.validateHostToken("TEST", "bob-token-456"))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Only the room host is authorized");
    }

    @Test
    public void testValidateHostToken_MismatchedRoom_ThrowsForbidden() {
        when(userRepository.findBySessionTokenWithSession("host-token-123"))
                .thenReturn(Optional.of(hostUser));

        assertThatThrownBy(() -> securityService.validateHostToken("OTHER", "host-token-123"))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Authentication token does not belong to the requested room");
    }

    @Test
    public void testValidateHostTokenBySessionId_Success() {
        when(userRepository.findBySessionTokenWithSession("host-token-123"))
                .thenReturn(Optional.of(hostUser));

        User host = securityService.validateHostTokenBySessionId(1L, "host-token-123");
        assertThat(host).isNotNull();
        assertThat(host.getDisplayName()).isEqualTo("Alice");
    }

    @Test
    public void testValidateUserTokenBySessionId_Success() {
        when(userRepository.findBySessionTokenWithSession("bob-token-456"))
                .thenReturn(Optional.of(regularUser));

        User user = securityService.validateUserTokenBySessionId(1L, 20L, "bob-token-456");
        assertThat(user).isNotNull();
        assertThat(user.getDisplayName()).isEqualTo("Bob");
    }
}
