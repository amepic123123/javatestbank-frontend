package com.javatestbank.backend.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "questions")
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 1000)
    private String text;

    @ElementCollection
    @CollectionTable(name = "question_options", joinColumns = @JoinColumn(name = "question_id"))
    @Column(name = "option_text")
    private List<String> options;

    @Column(nullable = false)
    private Integer correctIndex;

    @Column(length = 2000)
    private String explanation;

    @Column(length = 5000)
    private String codeSnippet;

    @ElementCollection
    @CollectionTable(name = "question_correct_indices", joinColumns = @JoinColumn(name = "question_id"))
    @Column(name = "correct_index")
    private List<Integer> correctIndices;

    @ElementCollection
    @CollectionTable(name = "question_answer_explanations", joinColumns = @JoinColumn(name = "question_id"))
    @Column(name = "explanation_text", length = 3000)
    private List<String> answerExplanations;

    public Question() {}

    public Question(String text, List<String> options, Integer correctIndex, String explanation) {
        this.text = text;
        this.options = options;
        this.correctIndex = correctIndex;
        this.explanation = explanation;
    }

    public Question(String text, List<String> options, Integer correctIndex, String explanation, String codeSnippet) {
        this.text = text;
        this.options = options;
        this.correctIndex = correctIndex;
        this.explanation = explanation;
        this.codeSnippet = codeSnippet;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public List<String> getOptions() { return options; }
    public void setOptions(List<String> options) { this.options = options; }

    public Integer getCorrectIndex() { return correctIndex; }
    public void setCorrectIndex(Integer correctIndex) { this.correctIndex = correctIndex; }

    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }

    public String getCodeSnippet() { return codeSnippet; }
    public void setCodeSnippet(String codeSnippet) { this.codeSnippet = codeSnippet; }

    public List<Integer> getCorrectIndices() { return correctIndices; }
    public void setCorrectIndices(List<Integer> correctIndices) { this.correctIndices = correctIndices; }

    public List<String> getAnswerExplanations() { return answerExplanations; }
    public void setAnswerExplanations(List<String> answerExplanations) { this.answerExplanations = answerExplanations; }
}
