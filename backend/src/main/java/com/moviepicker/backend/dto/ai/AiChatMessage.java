package com.moviepicker.backend.dto.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiChatMessage {

    @NotBlank(message = "Role must not be blank")
    @Pattern(regexp = "^(?i)(user|assistant|model)$", message = "Role must be either 'user', 'assistant', or 'model'")
    private String role;

    @NotBlank(message = "Message content must not be blank")
    @Size(max = 1000, message = "Message content must not exceed 1000 characters")
    private String content;
}
