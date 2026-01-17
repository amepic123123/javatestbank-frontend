import React, { useState } from 'react';
import { api } from '../services/api';
import { PlusCircle, X } from 'lucide-react';

const AdminControls = ({ onQuestionAdded }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        text: '',
        codeSnippet: '',
        correctIndex: '', // null or '', handled as integer or null
        explanation: '',
        option1: '',
        option2: '',
        option3: '',
        option4: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Bulk Upload State
    const [isBulkOpen, setIsBulkOpen] = useState(false);
    const [bulkJson, setBulkJson] = useState('');
    const [bulkStatus, setBulkStatus] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                text: formData.text,
                codeSnippet: formData.codeSnippet,
                correctIndex: formData.correctIndex !== '' ? parseInt(formData.correctIndex) : null,
                explanation: formData.explanation,
                options: [formData.option1, formData.option2, formData.option3, formData.option4]
            };
            const newQ = await api.postQuestion(payload);
            onQuestionAdded(newQ);
            setIsOpen(false);
            setFormData({
                text: '', codeSnippet: '', correctIndex: '', explanation: '', option1: '', option2: '', option3: '', option4: ''
            });
            alert('Question Posted Successfully!');
        } catch (err) {
            alert('Failed to post question');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleBulkSubmit = async (e) => {
        e.preventDefault();
        setBulkStatus('Processing... this may take a moment for AI analysis.');
        try {
            const parsed = JSON.parse(bulkJson);
            if (!Array.isArray(parsed)) throw new Error("Input must be a JSON Array");

            const addedQuestions = await api.postQuestionsBulk(parsed);

            // Notify parent for each added question to update list
            // Ideally parent should handle bulk update, but for now we won't crash
            // We'll just alert success.
            alert(`Successfully added ${addedQuestions.length} questions!`);
            setBulkJson('');
            setIsBulkOpen(false);
            setBulkStatus('');
            // Trigger refresh logic if possible, or reload
            window.location.reload();
        } catch (err) {
            setBulkStatus('Error: ' + err.message);
        }
    };

    return (
        <>
            <div style={{ margin: '20px 0', textAlign: 'right' }}>
                <button className="admin-btn" onClick={() => setIsOpen(true)}>
                    <PlusCircle size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    Post New Question
                </button>
                <button className="admin-btn" onClick={() => setIsBulkOpen(true)} style={{ marginLeft: '10px', background: 'var(--accent-secondary)' }}>
                    Bulk Upload JSON
                </button>
            </div>

            {isOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, backdropFilter: 'blur(5px)'
                }}>
                    <div className="card-glass" style={{ width: '500px', maxWidth: '90%', textAlign: 'left', position: 'relative' }}>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{ position: 'absolute', top: '15px', right: '15px', padding: '5px', background: 'transparent', border: 'none' }}
                        >
                            <X size={24} />
                        </button>
                        <h2 style={{ marginTop: 0 }}>Post New Question</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Question Text</label>
                                <textarea
                                    name="text" required
                                    value={formData.text} onChange={handleChange}
                                    style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Code Snippet (Optional)</label>
                                <textarea
                                    name="codeSnippet"
                                    value={formData.codeSnippet} onChange={handleChange}
                                    style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px', fontFamily: 'monospace', minHeight: '100px' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Correct Answer (Optional - Auto-detect if empty)</label>
                                <select
                                    name="correctIndex"
                                    value={formData.correctIndex}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }}
                                >
                                    <option value="">Auto-detect (AI)</option>
                                    <option value="0">Option 1</option>
                                    <option value="1">Option 2</option>
                                    <option value="2">Option 3</option>
                                    <option value="3">Option 4</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Explanation (Optional - Auto-generate if empty)</label>
                                <textarea
                                    name="explanation"
                                    value={formData.explanation} onChange={handleChange}
                                    style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px', minHeight: '80px' }}
                                />
                            </div>

                            {[1, 2, 3, 4].map((num, idx) => (
                                <div key={num} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        name={`option${num}`}
                                        placeholder={`Option ${num}`}
                                        required
                                        value={formData[`option${num}`]}
                                        onChange={handleChange}
                                        style={{ flex: 1, padding: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }}
                                    />
                                </div>
                            ))}

                            <button type="submit" className="admin-btn" disabled={isSubmitting}>
                                {isSubmitting ? 'Posting...' : 'Post Question'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isBulkOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, backdropFilter: 'blur(5px)'
                }}>
                    <div className="card-glass" style={{ width: '600px', maxWidth: '90%', textAlign: 'left', position: 'relative' }}>
                        <button
                            onClick={() => setIsBulkOpen(false)}
                            style={{ position: 'absolute', top: '15px', right: '15px', padding: '5px', background: 'transparent', border: 'none' }}
                        >
                            <X size={24} />
                        </button>
                        <h2 style={{ marginTop: 0 }}>Bulk Upload Questions</h2>
                        <p style={{ fontSize: '0.9rem', color: '#ccc' }}>Paste a JSON array of questions. The AI will detect correct answers.</p>

                        <form onSubmit={handleBulkSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <textarea
                                value={bulkJson}
                                onChange={e => setBulkJson(e.target.value)}
                                placeholder={`[
  {
    "text": "What is Java?",
    "options": ["A Car", "A Language", "A Food", "A Country"]
  },
  {
    "text": "What is the output?",
    "codeSnippet": "System.out.println(1+1);",
    "options": ["11", "2", "Error", "None"],
    "correctIndex": 1,
    "explanation": "Because 1+1 is 2 in Java"
  }
]`}
                                style={{
                                    width: '100%', height: '300px', padding: '10px',
                                    background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                                    color: 'white', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.85rem'
                                }}
                            />
                            {bulkStatus && <p style={{ color: 'var(--accent-primary)', margin: 0 }}>{bulkStatus}</p>}
                            <button type="submit" className="admin-btn" disabled={!!bulkStatus && bulkStatus.startsWith('Processing')}>
                                Upload Bulk JSON
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminControls;
