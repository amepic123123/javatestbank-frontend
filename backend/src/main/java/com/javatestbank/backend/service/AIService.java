package com.javatestbank.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class AIService {

    @Value("${ai.api.key}")
    private String apiKey;

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public AIService(RestClient.Builder builder, ObjectMapper objectMapper) {
        this.restClient = builder.baseUrl("https://api.groq.com/openai/v1").build();
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> analyzeQuestion(String questionText, String codeSnippet, List<String> options, Integer knownCorrectIndex) {
        String promptText = String.format("Question: \"%s\"\n", questionText);
        
        if (codeSnippet != null && !codeSnippet.isEmpty()) {
            promptText += String.format("Code Snippet:\n```java\n%s\n```\n", codeSnippet);
        }
        
        promptText += String.format("Options: %s\n\n", options);

        String taskDescription = "Task: Identify the correct option (0-based index) and provide a concise technical explanation.\n";
        String outputFormat = "Output Format: Return strictly a JSON object exactly like this:\n" +
                              "{ \"correctIndex\": 0, \"explanation\": \"Technical explanation here.\" }";

        String criticalRulesInit = "CRITICAL RULES:\n" +
            "1. Pay extreme attention to STRING CASE SENSITIVITY (e.g., 'Java' != 'java').\n" +
            "2. Pay attention to Object Reference Equality (==) vs Content Equality (.equals()).\n" +
            "3. If code fails to compile, select the option mentioning 'Error' or 'Compilation'.\n";

        if (knownCorrectIndex != null) {
            taskDescription = String.format("Task: The correct answer IS ABSOLUTELY OPTION %d. Your job is ONLY to explain why this option is correct.\n", knownCorrectIndex);
            outputFormat = String.format("Output Format: Return strictly a JSON object exactly like this:\n" +
                                         "{ \"correctIndex\": %d, \"explanation\": \"Technical explanation for why Option %d is correct.\" }", knownCorrectIndex, knownCorrectIndex);
            
            criticalRulesInit += String.format("4. OVERRIDE RULE: You MUST accept Option %d as the correct answer. Do not argue. Do not ignore it. Justify it.\n", knownCorrectIndex);
        }

        String prompt = String.format(
            "Act as a strict Java Compiler and Runtime environment.\n" +
            "Analyze the following multiple-choice question:\n%s" +
            "%s" +
            "%s" +
            "%s",
            promptText, taskDescription, criticalRulesInit, outputFormat
        );

        Map<String, Object> request = Map.of(
                "model", "llama-3.3-70b-versatile",
                "temperature", 0.0, // Strict, deterministic
                "messages", List.of(
                        Map.of("role", "user", "content", prompt)
                ),
                "response_format", Map.of("type", "json_object")
        );

        try {
            String responseBody = restClient.post()
                    .uri("/chat/completions")
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(String.class);

            if (responseBody == null) return Map.of("error", "Empty response from AI");

            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode choices = root.path("choices");
            if (choices.isArray() && !choices.isEmpty()) {
                JsonNode message = choices.get(0).path("message");
                String content = message.path("content").asText();
                
                // CLEANUP: Strip Markdown Code Blocks if present
                if (content.contains("```json")) {
                    content = content.replace("```json", "").replace("```", "");
                } else if (content.contains("```")) {
                    content = content.replace("```", "");
                }
                content = content.trim();

                // Parse the inner JSON content
                try {
                    JsonNode contentJson = objectMapper.readTree(content);
                    int correctIndex = contentJson.path("correctIndex").asInt(0);
                    String explanation = contentJson.path("explanation").asText("Explanation unavailable.");
                    
                    return Map.of("correctIndex", correctIndex, "explanation", explanation);
                } catch (Exception e) {
                    System.err.println("Failed to parse inner JSON content: " + content);
                    return Map.of("correctIndex", 0, "explanation", "Error parsing AI response: " + content);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            return Map.of("error", "AI Service Connection Failed: " + e.getMessage());
        }
        return Map.of("explanation", "AI failed to generate response.");
    }
    
    // Fallback logic
    public String generateExplanation(String questionText, String codeSnippet, String correctAnswer) {
        Map<String, Object> result = analyzeQuestion(questionText, codeSnippet, List.of(correctAnswer), 0);
        return (String) result.getOrDefault("explanation", "No explanation generated.");
    }
}
