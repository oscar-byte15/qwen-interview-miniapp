package edu.fhdortmund.interview.api;

import edu.fhdortmund.interview.model.InterviewDtos.AnswerRequest;
import edu.fhdortmund.interview.model.InterviewDtos.CreateRequest;
import edu.fhdortmund.interview.model.InterviewDtos.InterviewView;
import edu.fhdortmund.interview.service.InterviewService;
import edu.fhdortmund.interview.service.QwenGateway;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class InterviewController {
    private final InterviewService sessions;
    private final QwenGateway ai;

    public InterviewController(InterviewService sessions, QwenGateway ai) {
        this.sessions = sessions;
        this.ai = ai;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "model", ai.getModel(), "mode", ai.getMode());
    }

    @PostMapping("/interviews")
    public InterviewView start(@Valid @RequestBody CreateRequest request) {
        return sessions.start(request);
    }

    @GetMapping("/interviews")
    public List<InterviewView> all() { return sessions.all(); }

    @GetMapping("/interviews/{id}")
    public InterviewView find(@PathVariable String id) { return sessions.find(id); }

    @PostMapping("/interviews/{id}/answers")
    public InterviewView answer(@PathVariable String id, @Valid @RequestBody AnswerRequest request) {
        return sessions.answer(id, request);
    }
}
