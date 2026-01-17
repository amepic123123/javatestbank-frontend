package com.javatestbank.backend.repository;

import com.javatestbank.backend.model.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM questions ORDER BY RANDOM() LIMIT :limit", nativeQuery = true)
    java.util.List<Question> findRandomQuestions(@org.springframework.data.repository.query.Param("limit") int limit);

    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM questions WHERE text ~ :regex ORDER BY RANDOM() LIMIT :limit", nativeQuery = true)
    java.util.List<Question> findRandomQuestionsByRegex(@org.springframework.data.repository.query.Param("regex") String regex, @org.springframework.data.repository.query.Param("limit") int limit);
}
