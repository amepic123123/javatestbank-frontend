import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import QuestionCard from './QuestionCard';
import { Timer, Send, Play } from 'lucide-react';

const QuizPage = ({ onBack }) => {
    // Stage: 'setup' | 'quiz' | 'result'
    // Actually we can just track if started.
    const [started, setStarted] = useState(false);

    // Setup state
    const availableChapters = [9, 10, 11, 12, 13, 17];
    const [selectedChapters, setSelectedChapters] = useState([9, 10, 11, 12, 13, 17]);
    const [quizCount, setQuizCount] = useState(15);

    // Quiz state
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(15 * 60);
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const [feedbacks, setFeedbacks] = useState({});

    // Timer Logic
    useEffect(() => {
        if (!started || loading || submitted) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [started, loading, submitted]);

    const startQuiz = async () => {
        if (selectedChapters.length === 0) {
            alert("Please select at least one chapter.");
            return;
        }

        setLoading(true);
        try {
            const data = await api.getQuizQuestions(quizCount, selectedChapters);
            if (!data || data.length === 0) {
                alert("No questions found for selected chapters.");
                setLoading(false);
                return;
            }
            setQuestions(data);
            setStarted(true);
            setTimeLeft(quizCount * 60); // 1 min per question dynamic? Or just keep 15m fixed? logic says 15m default.
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
                    return { ...prev, [qId]: { ...current, selectedIndices: indices.filter(i => i !== index) } };
                } else {
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

        const promises = questions.map(async (q) => {
            const ans = userAnswers[q.id] || {};
            let result;
            try {
                result = await api.checkAnswer(q.id, ans.selectedIndex, 'quiz-user', ans.selectedIndices);
            } catch (e) {
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

    // --- Render: Loading ---
    if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading Quiz...</div>;

    // --- Render: Setup Screen ---
    if (!started) {
        return (
            <div className="quiz-container" style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
                <div className="card-glass" style={{ padding: '30px' }}>
                    <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '20px' }}>
                        &larr; Back to Home
                    </button>

                    <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>Result Quiz Setup</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Customize your quiz session.</p>

                    <div style={{ marginBottom: '30px' }}>
                        <h3 style={{ marginBottom: '15px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Select Chapters</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '15px' }}>
                            {availableChapters.map(ch => (
                                <label key={ch} style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '10px', borderRadius: '8px',
                                    background: selectedChapters.includes(ch) ? 'rgba(41, 121, 255, 0.1)' : 'var(--bg-secondary)',
                                    border: `1px solid ${selectedChapters.includes(ch) ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                                    cursor: 'pointer'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedChapters.includes(ch)}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedChapters(prev => [...prev, ch]);
                                            else setSelectedChapters(prev => prev.filter(c => c !== ch));
                                        }}
                                        style={{ accentColor: 'var(--accent-primary)' }}
                                    />
                                    Chapter {ch}
                                </label>
                            ))}
                        </div>
                        <div style={{ marginTop: '15px', display: 'flex', gap: '15px', fontSize: '0.9rem' }}>
                            <button onClick={() => setSelectedChapters(availableChapters)} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', textDecoration: 'underline' }}>Select All</button>
                            <button onClick={() => setSelectedChapters([])} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', textDecoration: 'underline' }}>Deselect All</button>
                        </div>
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                        <h3 style={{ marginBottom: '15px' }}>Question Count</h3>
                        <select
                            value={quizCount}
                            onChange={(e) => setQuizCount(Number(e.target.value))}
                            style={{ width: '100%', padding: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px' }}
                        >
                            <option value={10}>10 Questions (10 mins)</option>
                            <option value={15}>15 Questions (15 mins)</option>
                            <option value={20}>20 Questions (20 mins)</option>
                            <option value={30}>30 Questions (30 mins)</option>
                        </select>
                    </div>

                    <button
                        onClick={startQuiz}
                        className="action-btn"
                        style={{ width: '100%', padding: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontSize: '1.1rem' }}
                    >
                        <Play size={20} /> Start Quiz
                    </button>
                </div>
            </div>
        );
    }

    // --- Render: Quiz (Active/Result) ---
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
                <button
                    onClick={() => {
                        if (submitted || window.confirm("Progress will be lost. Exit?")) {
                            setStarted(false); setSubmitted(false); setScore(0); setUserAnswers({}); setFeedbacks({});
                        }
                    }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem' }}
                >
                    &larr; Quit Quiz
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
                        <br />
                        <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
                            Chapters: {selectedChapters.join(', ')}
                        </span>
                    </p>
                    <button
                        onClick={() => { setStarted(false); setSubmitted(false); setScore(0); setUserAnswers({}); setFeedbacks({}); }}
                        style={{ marginTop: '20px', padding: '10px 20px', background: 'var(--accent-primary)', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Start New Quiz
                    </button>
                </div>
            )}

            {/* Questions list */}
            <div className="questions-container" style={{ paddingtop: '20px' }}>
                {questions.map((q, idx) => {
                    const isMulti = (q.correctIndices && q.correctIndices.length > 1) || (q.text && q.text.toLowerCase().includes("select all"));
                    return (
                        <QuestionCard
                            key={q.id}
                            question={q}
                            selectedOption={userAnswers[q.id]?.selectedIndex}
                            selectedIndices={userAnswers[q.id]?.selectedIndices}
                            feedback={submitted ? feedbacks[q.id] : null}
                            onSelectOption={(i) => handleSelectOption(q.id, i, false)}
                            onToggleOption={(i) => handleSelectOption(q.id, i, true)}
                            onSubmitMulti={() => { }}
                            isAdmin={false}
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
