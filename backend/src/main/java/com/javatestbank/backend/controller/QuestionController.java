package com.javatestbank.backend.controller;

import com.javatestbank.backend.model.Question;
import com.javatestbank.backend.model.User;
import com.javatestbank.backend.model.UserAnswer;
import com.javatestbank.backend.repository.QuestionRepository;
import com.javatestbank.backend.repository.UserAnswerRepository;
import com.javatestbank.backend.repository.UserRepository;
import com.javatestbank.backend.service.AIService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")

public class QuestionController {

    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final UserAnswerRepository userAnswerRepository;
    private final AIService aiService;

    public QuestionController(QuestionRepository questionRepository, UserRepository userRepository, 
                              UserAnswerRepository userAnswerRepository, AIService aiService) {
        this.questionRepository = questionRepository;
        this.userRepository = userRepository;
        this.userAnswerRepository = userAnswerRepository;
        this.aiService = aiService;
    }

    @GetMapping("/questions")
    public Page<Question> getAllQuestions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return questionRepository.findAll(pageable);
    }

    @PostMapping("/check-answer")
    public ResponseEntity<?> checkAnswer(@RequestBody Map<String, Object> payload) {
        Long questionId = Long.valueOf(payload.get("questionId").toString());
        int selectedOptionIndex = Integer.parseInt(payload.get("selectedOptionIndex").toString());
        String username = (String) payload.get("username"); // Optional username

        Optional<Question> qOpt = questionRepository.findById(questionId);
        if (qOpt.isEmpty()) return ResponseEntity.notFound().build();

        Question question = qOpt.get();
        boolean isCorrect = question.getCorrectIndex() == selectedOptionIndex;
        
        // Generate explanation if missing
        if (question.getExplanation() == null || question.getExplanation().isEmpty()) {
            String correctAnswerText = question.getOptions().get(question.getCorrectIndex());
            String aiExplanation = aiService.generateExplanation(question.getText(), correctAnswerText);
            question.setExplanation(aiExplanation);
            questionRepository.save(question);
        }

        // Persist User Answer (Member or Anonymous)
        User user = null;
        if (username != null && !username.isEmpty()) {
            Optional<User> userOpt = userRepository.findByUsername(username);
            if (userOpt.isPresent()) user = userOpt.get();
        }

        if (user != null) {
            // Logged in: Check if updated existing
            Optional<UserAnswer> existing = userAnswerRepository.findByUserIdAndQuestionId(user.getId(), questionId);
            UserAnswer ua = existing.orElse(new UserAnswer());
            ua.setUser(user);
            ua.setQuestion(question);
            ua.setSelectedOptionIndex(selectedOptionIndex);
            ua.setCorrect(isCorrect);
            userAnswerRepository.save(ua);
        } else {
            // Anonymous: Create new entry every time (no tracking)
            UserAnswer ua = new UserAnswer();
            ua.setUser(null);
            ua.setQuestion(question);
            ua.setSelectedOptionIndex(selectedOptionIndex);
            ua.setCorrect(isCorrect);
            userAnswerRepository.save(ua);
        }

        return ResponseEntity.ok(Map.of(
            "correct", isCorrect,
            "correctIndex", question.getCorrectIndex(),
            "explanation", question.getExplanation(),
            "stats", getQuestionStats(questionId)
        ));
    }

    private Map<String, Object> getQuestionStats(Long questionId) {
        long total = userAnswerRepository.countByQuestionId(questionId);
        if (total == 0) return Map.of("total", 0);
        
        Map<Integer, Long> counts = new java.util.HashMap<>();
        for (int i = 0; i < 4; i++) {
            counts.put(i, userAnswerRepository.countByQuestionIdAndSelectedOptionIndex(questionId, i));
        }
        
        return Map.of(
            "total", total,
            "counts", counts
        );
    }

    @PostMapping("/admin/questions")
    public Question createQuestion(@RequestBody Question question) {
        if (question.getOptions() != null && !question.getOptions().isEmpty()) {
            Map<String, Object> analysis = aiService.analyzeQuestion(question.getText(), question.getCodeSnippet(), question.getOptions());
            
            if (analysis.containsKey("correctIndex")) {
                question.setCorrectIndex((Integer) analysis.get("correctIndex"));
            }
            if (analysis.containsKey("explanation")) {
                question.setExplanation((String) analysis.get("explanation"));
            }
        }
        return questionRepository.save(question);
    }

    @PostMapping("/admin/questions/bulk")
    public List<Question> createQuestionsBulk(@RequestBody List<Question> questions) {
        for (Question q : questions) {
            if (q.getOptions() != null && !q.getOptions().isEmpty()) {
                Map<String, Object> analysis = aiService.analyzeQuestion(q.getText(), q.getCodeSnippet(), q.getOptions());
                if (analysis.containsKey("correctIndex")) {
                    q.setCorrectIndex((Integer) analysis.get("correctIndex"));
                }
                if (analysis.containsKey("explanation")) {
                    q.setExplanation((String) analysis.get("explanation"));
                }
            }
        }
        return questionRepository.saveAll(questions);
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        if ("admin".equals(username) && "admin123".equals(password)) {
            return ResponseEntity.ok(Map.of("id", "admin", "name", "Muhammed Alhomiedat", "isAdmin", true));
        }
        
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getPassword() != null && user.getPassword().equals(password)) {
                return ResponseEntity.ok(Map.of("id", user.getId(), "name", user.getUsername(), "isAdmin", false));
            }
        }
        return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        if (userRepository.findByUsername(username).isPresent()) {
            return ResponseEntity.status(409).body(Map.of("error", "Username already exists"));
        }

        User newUser = userRepository.save(new User(username, password));
        return ResponseEntity.ok(Map.of("id", newUser.getId(), "name", newUser.getUsername(), "isAdmin", false));
    }

    @GetMapping("/user/{username}/progress")
    public ResponseEntity<?> getUserProgress(@PathVariable String username) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) return ResponseEntity.ok(Map.of());

        List<UserAnswer> answers = userAnswerRepository.findByUserId(userOpt.get().getId());
        
        // Map to format convenient for frontend: { questionId: { selectedIndex, feedback: { correct, correctIndex, explanation } } }
        Map<Long, Object> progress = answers.stream().collect(Collectors.toMap(
            ua -> ua.getQuestion().getId(),
            ua -> Map.of(
                "selectedIndex", ua.getSelectedOptionIndex(),
                "feedback", Map.of(
                    "correct", ua.isCorrect(),
                    "correctIndex", ua.getQuestion().getCorrectIndex(),
                    "explanation", ua.getQuestion().getExplanation()
                )
            )
        ));
        
        return ResponseEntity.ok(progress);
    }
}
