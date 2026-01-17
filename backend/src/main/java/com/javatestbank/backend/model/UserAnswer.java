package com.javatestbank.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "user_answers")
public class UserAnswer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = true)
    private User user;

    @ManyToOne
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    private int selectedOptionIndex;
    
    @ElementCollection
    @CollectionTable(name = "user_answer_indices", joinColumns = @JoinColumn(name = "user_answer_id"))
    @Column(name = "selected_index")
    private java.util.List<Integer> selectedIndices;

    private boolean isCorrect;

    public UserAnswer() {}

    public UserAnswer(User user, Question question, int selectedOptionIndex, boolean isCorrect) {
        this.user = user;
        this.question = question;
        this.selectedOptionIndex = selectedOptionIndex;
        this.isCorrect = isCorrect;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Question getQuestion() { return question; }
    public void setQuestion(Question question) { this.question = question; }

    public int getSelectedOptionIndex() { return selectedOptionIndex; }
    public void setSelectedOptionIndex(int selectedOptionIndex) { this.selectedOptionIndex = selectedOptionIndex; }

    public java.util.List<Integer> getSelectedIndices() { return selectedIndices; }
    public void setSelectedIndices(java.util.List<Integer> selectedIndices) { this.selectedIndices = selectedIndices; }

    public boolean isCorrect() { return isCorrect; }
    public void setCorrect(boolean correct) { isCorrect = correct; }
}
