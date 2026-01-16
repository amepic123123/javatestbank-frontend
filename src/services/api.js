/**
 * API Service connecting to Spring Boot Backend
 * Base URL: http://localhost:8080/api
 */

const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
  if (!url.endsWith("/api")) {
    url += "/api";
  }
  return url;
};

const API_BASE_URL = getBaseUrl();

export const api = {
  getQuestions: async (page = 0, size = 10) => {
    const response = await fetch(`${API_BASE_URL}/questions?page=${page}&size=${size}`);
    if (!response.ok) throw new Error("Failed to fetch questions");
    return await response.json();
  },

  checkAnswer: async (questionId, selectedOptionIndex, username) => {
    const response = await fetch(`${API_BASE_URL}/check-answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, selectedOptionIndex, username })
    });
    if (!response.ok) throw new Error("Failed to check answer");
    return await response.json();
  },

  getUserProgress: async (username) => {
    if (!username || username === 'admin') return {};
    const response = await fetch(`${API_BASE_URL}/user/${username}/progress`);
    if (!response.ok) return {};
    return await response.json();
  },

  login: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) return null;
    return await response.json();
  },

  register: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    if (response.status === 409) throw new Error("Username already taken");
    if (!response.ok) throw new Error("Registration failed");
    return await response.json();
  },

  postQuestion: async (questionData) => {
    const response = await fetch(`${API_BASE_URL}/admin/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(questionData)
    });
    if (!response.ok) throw new Error("Failed to post question");
    return await response.json();
  },

  postQuestionsBulk: async (questionsList) => {
    const response = await fetch(`${API_BASE_URL}/admin/questions/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(questionsList)
    });
    if (!response.ok) throw new Error("Failed to bulk post questions");
    return await response.json();
  }
};
