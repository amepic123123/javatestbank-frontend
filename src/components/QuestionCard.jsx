import React from 'react';
import { Trash2 } from 'lucide-react';

const QuestionCard = ({ question, selectedOption, selectedIndices, onSelectOption, onToggleOption, onSubmitMulti, feedback, isSubmitting, isAdmin, onDelete }) => {
    if (!question) return null;

    // Determine if multi-select based on correctIndices existence/length > 0
    // OR if the text implies it.
    // OR if the parent passes selectedIndices array.
    const isMultiSelect = (question.correctIndices && question.correctIndices.length > 0) ||
        (question.text && question.text.toLowerCase().includes("select all")) ||
        Array.isArray(selectedIndices);

    return (
        <div className="card-glass question-card-container">
            {isAdmin && (
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--accent-error)',
                        cursor: 'pointer',
                        padding: '5px'
                    }}
                    title="Delete Question"
                >
                    <Trash2 size={20} />
                </button>
            )}
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', paddingRight: '40px' }}>
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
                    const isSelected = isMultiSelect
                        ? selectedIndices.includes(index)
                        : selectedOption === index;

                    if (feedback) {
                        // Show Correct/Incorrect
                        const isCorrectIndex = isMultiSelect
                            ? feedback.correctIndices && feedback.correctIndices.includes(index)
                            : index === feedback.correctIndex;

                        if (isCorrectIndex) {
                            optionStyle.borderColor = 'var(--accent-success)';
                            optionStyle.background = 'rgba(0, 230, 118, 0.1)';
                        } else if (isSelected && !feedback.correct) {
                            // Highlight selected wrong answers
                            // In multi-select, if I selected it but it's not in correctIndices, it's wrong.
                            if (!isCorrectIndex) {
                                optionStyle.borderColor = 'var(--accent-error)';
                                optionStyle.background = 'rgba(255, 23, 68, 0.1)';
                            }
                        }
                    } else if (isSelected) {
                        optionStyle.borderColor = 'var(--accent-primary)';
                        optionStyle.background = 'rgba(41, 121, 255, 0.1)';
                    }

                    return (
                        <div
                            key={index}
                            onClick={() => {
                                if (feedback || isSubmitting) return;
                                if (isMultiSelect) onToggleOption(index);
                                else onSelectOption(index);
                            }}
                            style={optionStyle}
                            className="option-item"
                        >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: isMultiSelect ? '4px' : '50%', // Square for check, Circle for radio
                                    border: `2px solid ${isSelected || (feedback && (isMultiSelect ? feedback.correctIndices?.includes(index) : index === feedback.correctIndex)) ? 'currentColor' : '#555'}`,
                                    marginRight: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    {(isSelected || (feedback && (isMultiSelect ? feedback.correctIndices?.includes(index) : index === feedback.correctIndex))) && (
                                        <div style={{
                                            width: isMultiSelect ? '14px' : '12px',
                                            height: isMultiSelect ? '14px' : '12px',
                                            borderRadius: isMultiSelect ? '2px' : '50%',
                                            background: 'currentColor'
                                        }} />
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

            {isMultiSelect && !feedback && (
                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                    <button
                        onClick={() => onSubmitMulti()}
                        disabled={isSubmitting || !selectedIndices || selectedIndices.length === 0}
                        style={{
                            background: 'var(--accent-primary)',
                            color: 'white',
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '6px',
                            opacity: (!selectedIndices || selectedIndices.length === 0) ? 0.5 : 1,
                            cursor: (!selectedIndices || selectedIndices.length === 0) ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                    >
                        Submit Answer
                    </button>
                </div>
            )}

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
