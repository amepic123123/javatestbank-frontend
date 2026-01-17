import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import QuestionCard from './QuestionCard';
import { Timer, Send } from 'lucide-react';

const QuizPage = ({ onBack }) => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    // Keyed by Question ID
    // { [qId]: { selectedIndex: number, selectedIndices: number[] } }
    const [userAnswers, setUserAnswers] = useState({});

    // Keyed by Question ID, contains the Feedback object from check-answer
    // Only populated AFTER submission
    const [feedbacks, setFeedbacks] = useState({});

    useEffect(() => {
        loadQuiz();
    }, []);

    useEffect(() => {
        if (loading || submitted) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit(true); // Auto submit
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [loading, submitted]);

    const loadQuiz = async () => {
        setLoading(true);
        try {
            const data = await api.getQuizQuestions(15);
            setQuestions(data);
        } catch (err) {
            console.error(err);
            alert("Failed to load quiz.");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectOption = (qId, index, isMulti = false) => {
        if (submitted) return;

        setUserAnswers(prev => {
            const current = prev[qId] || {};
            if (isMulti) {
                const indices = current.selectedIndices ? [...current.selectedIndices] : [];
                if (indices.includes(index)) {
                    // remove
                    return { ...prev, [qId]: { ...current, selectedIndices: indices.filter(i => i !== index) } };
                } else {
                    // add
                    return { ...prev, [qId]: { ...current, selectedIndices: [...indices, index] } };
                }
            } else {
                return { ...prev, [qId]: { ...current, selectedIndex: index } };
            }
        });
    };

    const handleSubmit = async (auto = false) => {
        if (submitted) return;
        if (!auto && !window.confirm("Are you sure you want to submit your quiz?")) return;

        setSubmitted(true);

        let newScore = 0;
        const newFeedbacks = {};

        // Process all questions
        // We can check answers locally if we trust the browser, or send to backend. 
        // Since we already have backend logic, let's just use the `checkAnswer` API for each to get the official feedback/explanation.
        // Parallel requests might be heavy, but for 15 it's okay.

        const promises = questions.map(async (q) => {
            const ans = userAnswers[q.id] || {};

            // Prepare payload for checking
            // Note: api.checkAnswer expects (questionId, selectedOptionIndex, username, selectedIndices)
            // We don't track username in this simplistic quiz user model, can pass 'guest' or null.

            let result;
            try {
                result = await api.checkAnswer(
                    q.id,
                    ans.selectedIndex,
                    'quiz-user',
                    ans.selectedIndices
                );
            } catch (e) {
                // Determine correctness locally if API fails or as fallback? 
                // Let's assume API works. If not, results will be empty.
                console.error("Failed to check", q.id, e);
                return;
            }

            if (result.correct) newScore++;
            newFeedbacks[q.id] = result;
        });

        await Promise.all(promises);

        setScore(newScore);
        setFeedbacks(newFeedbacks);
        if (auto) alert("Time's up! Quiz submitted.");
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading Quiz...</div>;

    return (
        <div className="quiz-container">
            {/* Header / Timer Bar */}
            <div style={{
                position: 'sticky', top: 0, zIndex: 100,
                background: 'rgba(18, 18, 18, 0.95)', backdropFilter: 'blur(10px)',
                padding: '15px 20px', borderBottom: '1px solid var(--border-color)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
            }}>
                <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem' }}>
                    &larr; Exit Quiz
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: timeLeft < 60 ? 'var(--accent-error)' : 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
                        <Timer size={24} />
                        {formatTime(timeLeft)}
                    </div>
                    {!submitted && (
                        <button onClick={() => handleSubmit(false)} className="action-btn" style={{ background: 'var(--accent-success)' }}>
                            Submit Answers
                        </button>
                    )}
                </div>
            </div>

            {/* Results Header */}
            {submitted && (
                <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-secondary)', marginBottom: '20px' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>Quiz Results</h1>
                    <p style={{ fontSize: '1.5rem' }}>
                        You scored <strong style={{ color: 'var(--accent-success)' }}>{score}</strong> / {questions.length}
                    </p>
                </div>
            )}

            {/* Questions list */}
            <div className="questions-container" style={{ paddingtop: '20px' }}>
                {questions.map((q, idx) => {
                    // Check if multi select logic applies
                    // We need to know if it IS multi select so we can pass that to handleSelectOption
                    // Reuse the logic or check backend data? 
                    // QuestionCard does logic internally. We can infer it:
                    const isMulti = (q.correctIndices && q.correctIndices.length > 1) || (q.text && q.text.toLowerCase().includes("select all"));

                    return (
                        <QuestionCard
                            key={q.id}
                            question={q}
                            selectedOption={userAnswers[q.id]?.selectedIndex}
                            selectedIndices={userAnswers[q.id]?.selectedIndices}
                            // Only show feedback if submitted
                            feedback={submitted ? feedbacks[q.id] : null}

                            onSelectOption={(i) => handleSelectOption(q.id, i, false)}
                            onToggleOption={(i) => handleSelectOption(q.id, i, true)}

                            // Multi select submit button inside card is not needed in quiz mode, 
                            // we submit all at once. So we mock it or pass empty?
                            // QuestionCard shows button if isMultiSelect && !feedback.
                            // We can hide it by passing feedback={} (not null) but that might break logic?
                            // Actually, QuestionCard shows button if !feedback. 
                            // We might just need to hide that button via CSS or modify QuestionCard to accept `hideSubmit`.
                            // For now, let's just make onSubmitMulti a no-op or handle it globally.
                            onSubmitMulti={() => { }} // No-op

                            isAdmin={false} // No delete in quiz mode
                            onDelete={() => { }}
                        />
                    );
                })}
            </div>

            {!submitted && (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <button onClick={() => handleSubmit(false)} className="action-btn" style={{ padding: '15px 40px', fontSize: '1.2rem' }}>
                        <Send size={20} style={{ marginRight: '10px' }} /> Submit Quiz
                    </button>
                </div>
            )}
        </div>
    );
};

export default QuizPage;
