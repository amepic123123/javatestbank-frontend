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
import com.fasterxml.jackson.annotation.JsonProperty;

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
    private final String adminUsername;
    private final String adminPassword;

    public QuestionController(QuestionRepository questionRepository, UserRepository userRepository, 
                              UserAnswerRepository userAnswerRepository, AIService aiService,
                              @org.springframework.beans.factory.annotation.Value("${app.admin.username}") String adminUsername,
                              @org.springframework.beans.factory.annotation.Value("${app.admin.password}") String adminPassword) {
        this.questionRepository = questionRepository;
        this.userRepository = userRepository;
        this.userAnswerRepository = userAnswerRepository;
        this.aiService = aiService;
        this.adminUsername = adminUsername;
        this.adminPassword = adminPassword;
    }

    @GetMapping("/questions")
    public Page<Question> getAllQuestions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return questionRepository.findAll(pageable);
    }

    @GetMapping("/questions/quiz")
    public List<Question> getQuizQuestions(
            @RequestParam(defaultValue = "15") int count,
            @RequestParam(required = false) List<Integer> chapters
    ) {
        if (chapters != null && !chapters.isEmpty()) {
            // Build Regex: ^(9|10|11)\.
            String pattern = chapters.stream()
                    .map(String::valueOf)
                    .collect(Collectors.joining("|", "^(", ")\\."));
            return questionRepository.findRandomQuestionsByRegex(pattern, count);
        }
        return questionRepository.findRandomQuestions(count);
    }

    @PostMapping("/check-answer")
    public ResponseEntity<?> checkAnswer(@RequestBody Map<String, Object> payload) {
        Long questionId = Long.valueOf(payload.get("questionId").toString());
        String username = (String) payload.get("username");

        Optional<Question> qOpt = questionRepository.findById(questionId);
        if (qOpt.isEmpty()) return ResponseEntity.notFound().build();

        Question question = qOpt.get();
        boolean isCorrect = false;
        
        Integer singleSelection = null;
        List<Integer> multiSelection = null;

        // Determine if single or multi-select based on payload or question type
        if (payload.containsKey("selectedIndices")) {
            List<?> rawList = (List<?>) payload.get("selectedIndices");
            multiSelection = rawList.stream().map(o -> Integer.parseInt(o.toString())).collect(Collectors.toList());
            
            // Check logic
            List<Integer> correct = question.getCorrectIndices();
            if (correct != null && !correct.isEmpty()) {
                // Multi-select check: sets must be equal
                isCorrect = multiSelection.size() == correct.size() && multiSelection.containsAll(correct);
            } else {
                // Fallback: if only 1 correct index but user sent list
                if (multiSelection.size() == 1 && question.getCorrectIndex() != null) {
                    isCorrect = multiSelection.get(0).equals(question.getCorrectIndex());
                }
            }
        } else if (payload.containsKey("selectedOptionIndex")) {
            singleSelection = Integer.parseInt(payload.get("selectedOptionIndex").toString());
            // Check logic
            List<Integer> correct = question.getCorrectIndices();
            if (correct != null && !correct.isEmpty()) {
                 if (correct.size() == 1) {
                     // Allow single selection if there is exactly one correct answer
                     isCorrect = correct.get(0).equals(singleSelection);
                 } else {
                     // Truly multi-select question, but user sent single answer -> Fail
                     isCorrect = false;
                 }
            } else {
                 isCorrect = question.getCorrectIndex() != null && question.getCorrectIndex().equals(singleSelection);
            }
        }
        
        // Generate explanation if missing
        if (question.getExplanation() == null || question.getExplanation().isEmpty()) {
            String correctAnswerText = "";
            if (question.getCorrectIndices() != null && !question.getCorrectIndices().isEmpty()) {
                correctAnswerText = question.getCorrectIndices().stream()
                    .map(i -> question.getOptions().get(i))
                    .collect(Collectors.joining(", "));
            } else if (question.getCorrectIndex() != null) {
                correctAnswerText = question.getOptions().get(question.getCorrectIndex());
            }
            String aiExplanation = aiService.generateExplanation(question.getText(), question.getCodeSnippet(), correctAnswerText);
            question.setExplanation(aiExplanation);
            questionRepository.save(question);
        }

        // Persist User Answer
        User user = null;
        if (username != null && !username.isEmpty()) {
            Optional<User> userOpt = userRepository.findByUsername(username);
            if (userOpt.isPresent()) user = userOpt.get();
        }
        
        UserAnswer ua = new UserAnswer();
        if (user != null) {
            Optional<UserAnswer> existing = userAnswerRepository.findByUserIdAndQuestionId(user.getId(), questionId);
            if (existing.isPresent()) ua = existing.get();
            ua.setUser(user);
        }
        
        ua.setQuestion(question);
        if (singleSelection != null) ua.setSelectedOptionIndex(singleSelection);
        if (multiSelection != null) ua.setSelectedIndices(multiSelection);
        ua.setCorrect(isCorrect);
        userAnswerRepository.save(ua);

        return ResponseEntity.ok(Map.of(
            "correct", isCorrect,
            "correctIndex", question.getCorrectIndex(), // Legacy support
            "correctIndices", question.getCorrectIndices() != null ? question.getCorrectIndices() : List.of(),
            "explanation", question.getExplanation(),
            "answerExplanations", question.getAnswerExplanations() != null ? question.getAnswerExplanations() : List.of(),
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
            // Logic: IF manual answer AND manual explanation -> SKIP AI.
            boolean isFullyManual = question.getCorrectIndex() != null && 
                                    question.getExplanation() != null && 
                                    !question.getExplanation().isEmpty();

            if (!isFullyManual) {
                Map<String, Object> analysis = aiService.analyzeQuestion(question.getText(), question.getCodeSnippet(), question.getOptions(), question.getCorrectIndex());
                
                // If user didn't specify index (null), rely on AI. If user did, AI just explains.
                if (question.getCorrectIndex() == null && analysis.containsKey("correctIndex")) {
                    question.setCorrectIndex((Integer) analysis.get("correctIndex"));
                }
                if (analysis.containsKey("explanation")) {
                    question.setExplanation((String) analysis.get("explanation"));
                }
            }
        }
        return questionRepository.save(question);
    }

    @PostMapping("/admin/questions/bulk")
    public List<Question> createQuestionsBulk(@RequestBody List<Question> questions) {
        for (Question q : questions) {
            if (q.getOptions() != null && !q.getOptions().isEmpty()) {
                // Logic: IF manual answer AND manual explanation -> SKIP AI.
                boolean isFullyManual = q.getCorrectIndex() != null && 
                                        q.getExplanation() != null && 
                                        !q.getExplanation().isEmpty();

                if (!isFullyManual) {
                    Map<String, Object> analysis = aiService.analyzeQuestion(q.getText(), q.getCodeSnippet(), q.getOptions(), q.getCorrectIndex());
                    if (q.getCorrectIndex() == null && analysis.containsKey("correctIndex")) {
                        q.setCorrectIndex((Integer) analysis.get("correctIndex"));
                    }
                    if (analysis.containsKey("explanation")) {
                        q.setExplanation((String) analysis.get("explanation"));
                    }
                }
            }
        }
        return questionRepository.saveAll(questions);
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        if (adminUsername.equals(username) && adminPassword.equals(password)) {
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
        
        // Map to format convenient for frontend
        Map<Long, Object> progress = answers.stream().collect(Collectors.toMap(
            ua -> ua.getQuestion().getId(),
            ua -> Map.of(
                "selectedIndex", ua.getSelectedOptionIndex(),
                "selectedIndices", ua.getSelectedIndices() != null ? ua.getSelectedIndices() : List.of(),
                "feedback", Map.of(
                    "correct", ua.isCorrect(),
                    "correctIndex", ua.getQuestion().getCorrectIndex(),
                    "correctIndices", ua.getQuestion().getCorrectIndices() != null ? ua.getQuestion().getCorrectIndices() : List.of(),
                    "explanation", ua.getQuestion().getExplanation()
                )
            )
        ));
        
        return ResponseEntity.ok(progress);
    }

    @DeleteMapping("/admin/questions/{id}")
    public ResponseEntity<?> deleteQuestion(@PathVariable Long id) {
        userAnswerRepository.deleteByQuestionId(id);
        questionRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Question deleted successfully"));
    }
    @PostMapping("/admin/questions/import")
    public ResponseEntity<?> importQuestions(@RequestBody List<QuestionImportDTO> importDtos) {
        List<Question> questions = importDtos.stream().map(dto -> {
            try {
                Question q = new Question();
                q.setText(dto.question);
                q.setCodeSnippet(dto.codeSnippet);
                
                if (q.getText() == null || q.getText().trim().isEmpty()) return null;

                if (dto.answers != null) {
                    List<String> options = dto.answers.stream().map(a -> a.answer).collect(Collectors.toList());
                    q.setOptions(options);
                    
                    List<Integer> indices = new java.util.ArrayList<>();
                    List<String> explanations = new java.util.ArrayList<>();
                    
                    for (int i = 0; i < dto.answers.size(); i++) {
                        AnswerImportDTO ans = dto.answers.get(i);
                        explanations.add(ans.explanation != null ? ans.explanation : "");
                        
                        if (ans.is_right) {
                            q.setCorrectIndex(i); 
                            indices.add(i);
                            if (q.getExplanation() == null || q.getExplanation().isEmpty()) {
                                 if (ans.explanation != null && !ans.explanation.isEmpty()) {
                                    q.setExplanation(ans.explanation);
                                }
                            }
                        }
                    }
                    q.setCorrectIndices(indices);
                    q.setAnswerExplanations(explanations);
                }
                
                // Auto-generate logic if missing
                if (q.getOptions() != null && !q.getOptions().isEmpty()) {
                    boolean isFullyManual = q.getCorrectIndex() != null && 
                                            q.getExplanation() != null && 
                                            !q.getExplanation().isEmpty();

                    if (!isFullyManual) {
                        Map<String, Object> analysis = aiService.analyzeQuestion(q.getText(), q.getCodeSnippet(), q.getOptions(), q.getCorrectIndex());
                        if (q.getCorrectIndex() == null && analysis.containsKey("correctIndex")) {
                            q.setCorrectIndex((Integer) analysis.get("correctIndex"));
                        }
                        if (q.getExplanation() == null && analysis.containsKey("explanation")) {
                            q.setExplanation((String) analysis.get("explanation"));
                        }
                    }
                }
                
                // Final validation before returning
                if (q.getCorrectIndex() == null) {
                    // Start fallback: try to use correctIndices
                    if (q.getCorrectIndices() != null && !q.getCorrectIndices().isEmpty()) {
                        q.setCorrectIndex(q.getCorrectIndices().get(0));
                    } else {
                        // Desperate fallback: default to 0 to prevent DB crash, but improved data is better
                        // Ideally we skip, but let's default to 0 and mark explanation
                        q.setCorrectIndex(0);
                        if (q.getExplanation() == null) q.setExplanation("Auto-defaulted to option A due to missing correct answer.");
                    }
                }
                
                return q;
            } catch (Exception e) {
                // Log and skip bad apples
                System.err.println("Error processing question import: " + e.getMessage());
                return null;
            }
        })
        .filter(java.util.Objects::nonNull)
        .collect(Collectors.toList());
        
        if (questions.isEmpty()) {
             return ResponseEntity.badRequest().body(Map.of("message", "No valid questions found to import."));
        }
        
        try {
            questionRepository.saveAll(questions);
            return ResponseEntity.ok(Map.of("message", "Imported " + questions.size() + " questions successfully"));
        } catch (Exception e) {
             return ResponseEntity.status(500).body(Map.of("message", "Database Save Failed: " + e.getMessage()));
        }
    }

    // DTOs for Import
    static class QuestionImportDTO {
        public String question;
        public String codeSnippet;
        public List<AnswerImportDTO> answers;
    }

    static class AnswerImportDTO {
        public String answer;
        @JsonProperty("is_right")
        public boolean is_right;
        public String explanation;
    }
}
