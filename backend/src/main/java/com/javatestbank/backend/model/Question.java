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
    private int correctIndex;

    @Column(length = 2000)
    private String explanation;

    @Column(length = 5000)
    private String codeSnippet;

    public Question() {}

    public Question(String text, List<String> options, int correctIndex, String explanation) {
        this.text = text;
        this.options = options;
        this.correctIndex = correctIndex;
        this.explanation = explanation;
    }

    public Question(String text, List<String> options, int correctIndex, String explanation, String codeSnippet) {
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

    public int getCorrectIndex() { return correctIndex; }
    public void setCorrectIndex(int correctIndex) { this.correctIndex = correctIndex; }

    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }

    public String getCodeSnippet() { return codeSnippet; }
    public void setCodeSnippet(String codeSnippet) { this.codeSnippet = codeSnippet; }
}
