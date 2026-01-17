import React from 'react';
import { Trash2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const QuestionCard = ({ question, selectedOption, selectedIndices, onSelectOption, onToggleOption, onSubmitMulti, feedback, isSubmitting, isAdmin, onDelete }) => {
    if (!question) return null;

    const isMultiSelect = (question.correctIndices && question.correctIndices.length > 1) ||
        (question.text && question.text.toLowerCase().includes("select all")) ||
        (Array.isArray(selectedIndices) && selectedIndices.length > 0);

    return (
        <div className="card-glass question-card-container">
            {isAdmin && (
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    style={{
                        position: 'absolute', top: '15px', right: '15px', background: 'transparent',
                        border: 'none', color: 'var(--accent-error)', cursor: 'pointer', padding: '5px'
                    }}
                    title="Delete Question"
                >
                    <Trash2 size={20} />
                </button>
            )}
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', paddingRight: '40px' }}>
                {question.text}
            </h3>

            {question.codeSnippet && (
                <pre style={{
                    background: '#1e1e1e', padding: '15px', borderRadius: '8px', overflowX: 'auto',
                    marginBottom: '20px', border: '1px solid var(--border-color)',
                    fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
                    fontSize: '0.9rem', color: '#e0e0e0'
                }}>
                    <code>{question.codeSnippet}</code>
                </pre>
            )}

            <div className="options-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {question.options.map((option, index) => {
                    const isSelected = isMultiSelect
                        ? selectedIndices && selectedIndices.includes(index)
                        : selectedOption === index;

                    let optionStyle = {
                        padding: '16px', borderRadius: '8px', border: '2px solid var(--border-color)',
                        cursor: isSubmitting || feedback ? 'default' : 'pointer',
                        background: 'var(--bg-secondary)', transition: 'all 0.2s ease',
                        display: 'flex', flexDirection: 'column',
                        position: 'relative', overflow: 'hidden'
                    };

                    let statusIcon = null;
                    let explanation = null;
                    let statusColor = null;

                    if (feedback) {
                        const isCorrectOption = isMultiSelect
                            ? feedback.correctIndices && feedback.correctIndices.includes(index)
                            : index === feedback.correctIndex;

                        if (isCorrectOption) {
                            // It is a correct answer
                            statusColor = 'var(--accent-success)';
                            optionStyle.borderColor = 'var(--accent-success)';
                            optionStyle.background = 'rgba(0, 230, 118, 0.1)';

                            if (isSelected) {
                                statusIcon = <CheckCircle size={20} color="var(--accent-success)" />;
                            } else {
                                // Correct but missed
                                statusIcon = <AlertCircle size={20} color="var(--accent-success)" />; // Or some other icon for "Missed"
                                optionStyle.borderStyle = 'dashed'; // Visually indicate it was missed
                            }
                        } else if (isSelected) {
                            // Selected but wrong
                            statusColor = 'var(--accent-error)';
                            optionStyle.borderColor = 'var(--accent-error)';
                            optionStyle.background = 'rgba(255, 23, 68, 0.1)';
                            statusIcon = <XCircle size={20} color="var(--accent-error)" />;
                        }

                        // Get Explanation
                        if (feedback.answerExplanations && feedback.answerExplanations[index]) {
                            explanation = feedback.answerExplanations[index];
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
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                                    <div style={{
                                        width: '24px', height: '24px',
                                        borderRadius: isMultiSelect ? '4px' : '50%',
                                        border: `2px solid ${isSelected || (feedback && (isMultiSelect ? feedback.correctIndices?.includes(index) : index === feedback.correctIndex)) ? (statusColor || 'currentColor') : '#555'}`,
                                        marginRight: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                    }}>
                                        {(isSelected || (feedback && (isMultiSelect ? feedback.correctIndices?.includes(index) : index === feedback.correctIndex))) && (
                                            <div style={{
                                                width: isMultiSelect ? '14px' : '12px', height: isMultiSelect ? '14px' : '12px',
                                                borderRadius: isMultiSelect ? '2px' : '50%',
                                                background: statusColor || 'currentColor'
                                            }} />
                                        )}
                                    </div>
                                    <span style={{ fontSize: '1rem', zIndex: 1 }}>{option}</span>
                                </div>
                                {statusIcon && <div style={{ marginLeft: '10px' }}>{statusIcon}</div>}
                            </div>

                            {/* Per-option explanation */}
                            {explanation && (
                                <div style={{
                                    marginTop: '10px', padding: '10px',
                                    background: 'rgba(0,0,0,0.2)', borderRadius: '6px',
                                    fontSize: '0.9rem', color: '#ddd', borderLeft: `3px solid ${statusColor || 'var(--text-secondary)'}`
                                }}>
                                    {explanation}
                                </div>
                            )}

                            {/* Stats Display */}
                            {feedback && feedback.stats && feedback.stats.total > 0 && (
                                <div style={{ position: 'absolute', bottom: '5px', right: '10px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                                    {Math.round(((feedback.stats.counts[index] || 0) / feedback.stats.total) * 100)}%
                                </div>
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
                            background: 'var(--accent-primary)', color: 'white', padding: '10px 20px',
                            border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold',
                            opacity: (!selectedIndices || selectedIndices.length === 0) ? 0.5 : 1
                        }}
                    >
                        Submit Answer
                    </button>
                </div>
            )}

            {feedback && (
                <div style={{
                    marginTop: '20px', padding: '15px', borderRadius: '8px',
                    background: feedback.correct ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 23, 68, 0.1)',
                    border: `1px solid ${feedback.correct ? 'var(--accent-success)' : 'var(--accent-error)'}`
                }}>
                    <h4 style={{ margin: '0 0 8px 0', color: feedback.correct ? 'var(--accent-success)' : 'var(--accent-error)' }}>
                        {feedback.correct ? 'Correct!' : isMultiSelect ? 'Incorrect / Incomplete' : 'Incorrect'}
                    </h4>

                    {/* Main Explanation or AI Summary */}
                    <div style={{ color: '#eee' }}>
                        {feedback.explanation}
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuestionCard;
