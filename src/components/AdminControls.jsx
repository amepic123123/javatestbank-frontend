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
            // Validate JSON
            const parsed = JSON.parse(jsonInput);
            if (!Array.isArray(parsed)) {
                alert('Input must be a JSON array of questions.');
                setBulkStatus('Error: Input must be a JSON array.');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/admin/questions/import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add Authorization header if needed, e.g., for basic auth
                    // ...(username && password ? { 'Authorization': 'Basic ' + btoa(username + ':' + password) } : {})
                },
                body: jsonInput
            });

            if (response.ok) {
                alert('Bulk Import Successful!');
                setJsonInput('');
                setIsBulkOpen(false);
                setBulkStatus(''); // Clear status on success
                // Optionally, trigger a refresh of the question list
                // onQuestionAdded(); // If onQuestionAdded can trigger a full refresh
            } else {
                const errorData = await response.json();
                alert('Import Failed: ' + (errorData.message || response.statusText));
                setBulkStatus('Error: ' + (errorData.message || response.statusText));
            }
        } catch (err) {
            console.error(err);
            alert('Error parsing JSON or uploading.');
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
                                value={jsonInput}
                                onChange={e => setJsonInput(e.target.value)}
                                placeholder={`[
  {
    "question": "Which code creates a Date object?",
    "codeSnippet": "// A:\\nnew java.util.Date();\\n\\n// B:\\njava.util.Date date = new java.util.Date();",
    "answers": [
      { "answer": "A", "is_right": false, "explanation": "" },
      { "answer": "B", "is_right": false, "explanation": "" },
      { "answer": "Both", "is_right": true, "explanation": "Both create valid objects." },
      { "answer": "Neither", "is_right": false, "explanation": "" }
    ]
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
