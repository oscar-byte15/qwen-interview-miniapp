package edu.fhdortmund.interview.service;

import edu.fhdortmund.interview.model.InterviewDtos.AnswerRequest;
import edu.fhdortmund.interview.model.InterviewDtos.CreateRequest;
import edu.fhdortmund.interview.model.InterviewDtos.InterviewView;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import static org.junit.jupiter.api.Assertions.*;
import java.util.List;

class InterviewServiceTest {
    @Test
    void finishesAfterTwoQuestions() {
        QwenGateway ai = Mockito.mock(QwenGateway.class);
        Mockito.when(ai.question(Mockito.anyString(), Mockito.anyString(), Mockito.anyList()))
                .thenReturn("What is Git?");
        Mockito.when(ai.evaluate(Mockito.anyString(), Mockito.anyString(), Mockito.anyList()))
                .thenReturn(new edu.fhdortmund.interview.model.InterviewDtos.Assessment(
                        8, "Good", List.of("Clear"), List.of("More examples")));
        InterviewService service = new InterviewService(ai);
        InterviewView view = service.start(new CreateRequest("Java Developer", "Git", 2));
        assertEquals("IN_PROGRESS", view.status());
        view = service.answer(view.id(), new AnswerRequest("Git tracks changes."));
        assertEquals(1, view.answered());
        view = service.answer(view.id(), new AnswerRequest("Branches isolate work."));
        assertEquals("COMPLETED", view.status());
        assertEquals(8, view.assessment().score());
        assertNull(view.currentQuestion());
    }
}
