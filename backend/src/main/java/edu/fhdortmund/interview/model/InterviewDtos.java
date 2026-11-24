package edu.fhdortmund.interview.model;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public final class InterviewDtos {
    private InterviewDtos() { }

    public record CreateRequest(@NotBlank String role, @NotBlank String topics,
                                @Min(2) @Max(5) int numberOfQuestions) { }
    public record AnswerRequest(@NotBlank String answer) { }
    public record Turn(String question, String answer) { }
    public record Assessment(int score, String summary, List<String> strengths,
                             List<String> improvements) { }
    public record InterviewView(String id, String role, String topics, String status,
                                int answered, int total, String currentQuestion,
                                List<Turn> turns, Assessment assessment) { }
}
