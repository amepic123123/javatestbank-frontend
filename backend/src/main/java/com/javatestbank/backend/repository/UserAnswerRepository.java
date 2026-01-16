package com.javatestbank.backend.repository;

import com.javatestbank.backend.model.UserAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserAnswerRepository extends JpaRepository<UserAnswer, Long> {
    List<UserAnswer> findByUserId(Long userId);
    Optional<UserAnswer> findByUserIdAndQuestionId(Long userId, Long questionId);
    long countByQuestionId(Long questionId);
    long countByQuestionIdAndSelectedOptionIndex(Long questionId, int selectedOptionIndex);
    
    @org.springframework.transaction.annotation.Transactional
    void deleteByQuestionId(Long questionId);
}
