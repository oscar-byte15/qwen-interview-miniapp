package edu.fhdortmund.interview.service;

import edu.fhdortmund.interview.model.InterviewDtos.AnswerRequest;
import edu.fhdortmund.interview.model.InterviewDtos.Assessment;
import edu.fhdortmund.interview.model.InterviewDtos.CreateRequest;
import edu.fhdortmund.interview.model.InterviewDtos.InterviewView;
import edu.fhdortmund.interview.model.InterviewDtos.Turn;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class InterviewService {
    private final QwenGateway ai;
    private final Map<String, Session> sessions = new ConcurrentHashMap<>();

    public InterviewService(QwenGateway ai) { this.ai = ai; }

    public InterviewView start(CreateRequest input) {
        String role = input.role().trim();
        String topics = input.topics().trim();
        if (role.length() > 120 || topics.length() > 400) {
            throw new IllegalArgumentException("Role must be <=120 characters and topics <=400 characters.");
        }
        if (input.numberOfQuestions() < 2 || input.numberOfQuestions() > 5) {
            throw new IllegalArgumentException("Choose between 2 and 5 questions.");
        }
        Session session = new Session(UUID.randomUUID().toString(), role, topics,
                input.numberOfQuestions(), ai.question(role, topics, List.of()));
        sessions.put(session.id, session);
        return session.view();
    }

    public InterviewView answer(String id, AnswerRequest input) {
        Session session = get(id);
        synchronized (session) {
            if (session.completed) throw new IllegalArgumentException("This interview is already completed.");
            String answer = input.answer().trim();
            if (answer.isEmpty() || answer.length() > 3000) {
                throw new IllegalArgumentException("Answer must contain 1–3000 characters.");
            }
            List<Turn> newTurns = new ArrayList<>(session.turns);
            newTurns.add(new Turn(session.currentQuestion, answer));
            // Only save the answer after the model responds successfully.
            if (newTurns.size() == session.total) {
                Assessment evaluation = ai.evaluate(session.role, session.topics, newTurns);
                session.turns.add(newTurns.get(newTurns.size() - 1));
                session.assessment = evaluation;
                session.currentQuestion = null;
                session.completed = true;
            } else {
                String nextQuestion = ai.question(session.role, session.topics, newTurns);
                session.turns.add(newTurns.get(newTurns.size() - 1));
                session.currentQuestion = nextQuestion;
            }
            return session.view();
        }
    }

    public InterviewView find(String id) { return get(id).view(); }

    public List<InterviewView> all() {
        return sessions.values().stream().map(Session::view)
                .sorted(Comparator.comparing(InterviewView::id)).toList();
    }

    private Session get(String id) {
        Session s = sessions.get(id);
        if (s == null) throw new NoSuchElementException("Interview session not found.");
        return s;
    }

    private static final class Session {
        private final String id;
        private final String role;
        private final String topics;
        private final int total;
        private final List<Turn> turns = new ArrayList<>();
        private String currentQuestion;
        private boolean completed;
        private Assessment assessment;

        private Session(String id, String role, String topics, int total, String firstQuestion) {
            this.id = id;
            this.role = role;
            this.topics = topics;
            this.total = total;
            this.currentQuestion = firstQuestion;
        }

        private synchronized InterviewView view() {
            return new InterviewView(id, role, topics, completed ? "COMPLETED" : "IN_PROGRESS",
                    turns.size(), total, currentQuestion, List.copyOf(turns), assessment);
        }
    }
}
