import React from 'react';

const QuestionCard = ({ question, selectedOption, onSelectOption, feedback, isSubmitting }) => {
    if (!question) return null;

    return (
        <div className="card-glass" style={{ textAlign: 'left', margin: '20px auto', maxWidth: '800px' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                <span style={{ color: 'var(--text-secondary)', marginRight: '10px' }}>#{question.id}</span>
                {question.text}
            </h3>

            {question.codeSnippet && (
                <pre style={{
                    background: '#1e1e1e',
                    padding: '15px',
                    borderRadius: '8px',
                    overflowX: 'auto',
                    marginBottom: '20px',
                    border: '1px solid var(--border-color)',
                    fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
                    fontSize: '0.9rem',
                    color: '#e0e0e0'
                }}>
                    <code>{question.codeSnippet}</code>
                </pre>
            )}

            <div className="options-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {question.options.map((option, index) => {
                    let optionStyle = {
                        padding: '16px',
                        borderRadius: '8px',
                        border: '2px solid var(--border-color)',
                        cursor: isSubmitting || feedback ? 'default' : 'pointer',
                        background: 'var(--bg-secondary)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        position: 'relative',
                        overflow: 'hidden'
                    };

                    // Styling based on state
                    const isSelected = selectedOption === index;

                    if (feedback) {
                        // Show Correct/Incorrect
                        if (index === feedback.correctIndex) {
                            optionStyle.borderColor = 'var(--accent-success)';
                            optionStyle.background = 'rgba(0, 230, 118, 0.1)';
                        } else if (isSelected && !feedback.correct) {
                            optionStyle.borderColor = 'var(--accent-error)';
                            optionStyle.background = 'rgba(255, 23, 68, 0.1)';
                        }
                    } else if (isSelected) {
                        optionStyle.borderColor = 'var(--accent-primary)';
                        optionStyle.background = 'rgba(41, 121, 255, 0.1)';
                    }

                    return (
                        <div
                            key={index}
                            onClick={() => !feedback && !isSubmitting && onSelectOption(index)}
                            style={optionStyle}
                            className="option-item"
                        >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    border: `2px solid ${isSelected || (feedback && index === feedback.correctIndex) ? 'currentColor' : '#555'}`,
                                    marginRight: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    {(isSelected || (feedback && index === feedback.correctIndex)) && (
                                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'currentColor' }} />
                                    )}
                                </div>
                                <span style={{ fontSize: '1rem', zIndex: 1 }}>{option}</span>
                            </div>

                            {/* Stats Display */}
                            {feedback && feedback.stats && feedback.stats.total > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', zIndex: 1 }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        {Math.round(((feedback.stats.counts[index] || 0) / feedback.stats.total) * 100)}%
                                    </span>
                                </div>
                            )}

                            {/* Progress Bar Background */}
                            {feedback && feedback.stats && feedback.stats.total > 0 && (
                                <div style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: `${((feedback.stats.counts[index] || 0) / feedback.stats.total) * 100}%`,
                                    background: 'currentColor',
                                    opacity: 0.05,
                                    zIndex: 0
                                }} />
                            )}
                        </div>
                    );
                })}
            </div>

            {feedback && (
                <div style={{ marginTop: '20px', padding: '15px', borderRadius: '8px', background: feedback.correct ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 23, 68, 0.1)', border: `1px solid ${feedback.correct ? 'var(--accent-success)' : 'var(--accent-error)'}` }}>
                    <h4 style={{ margin: '0 0 8px 0', color: feedback.correct ? 'var(--accent-success)' : 'var(--accent-error)' }}>
                        {feedback.correct ? 'Correct!' : 'Incorrect'}
                    </h4>
                    <p style={{ margin: 0 }}>{feedback.explanation}</p>
                </div>
            )}
        </div>
    );
};

export default QuestionCard;
