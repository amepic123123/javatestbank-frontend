import React, { useEffect, useState } from 'react';
import { useAuth } from './context/AuthContext';
import { api } from './services/api';
import QuestionCard from './components/QuestionCard';
import AdminControls from './components/AdminControls';
import { LogIn, LogOut, CheckCircle, Coffee } from 'lucide-react';

function App() {
  const { user, login, register, logout, error: authError } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  // State to track answers: { [questionId]: { selectedIndex, feedback } }
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);

  // Sync progress when user logs in
  useEffect(() => {
    if (user && !user.isAdmin) {
      api.getUserProgress(user.name).then(savedAnswers => {
        setAnswers(prev => ({ ...prev, ...savedAnswers }));
        // Recalculate score based on saved answers
        const savedScore = Object.values(savedAnswers).filter(a => a.feedback.correct).length;
        setScore(savedScore);
      });
    }
  }, [user]);

  // Login Form State
  // Login Form State
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Sync auth error to local state
  useEffect(() => {
    if (authError) setLoginError(authError);
  }, [authError]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadQuestions(currentPage);
  }, [currentPage]);

  const loadQuestions = async (page) => {
    setIsLoadingQuestions(true);
    try {
      const data = await api.getQuestions(page);
      setQuestions(data.content); // Spring Page object has content field
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error("Failed to load questions", err);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleAnswer = async (questionId, index) => {
    if (answers[questionId]) return; // Already answered

    try {
      const result = await api.checkAnswer(questionId, index, user?.name);
      const newAnswers = {
        ...answers,
        [questionId]: {
          selectedIndex: index,
          feedback: result
        }
      };
      setAnswers(newAnswers);

      if (result.correct) {
        setScore(curr => curr + 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setLoginError("Please fill in all fields");
      return;
    }

    let success;
    if (isRegistering) {
      success = await register(username, password);
    } else {
      success = await login(username, password);
    }

    if (!success) setLoginError(authError || (isRegistering ? 'Registration failed' : 'Invalid credentials'));
    else setLoginError('');
  };

  const allAnswered = questions.length > 0 && questions.every(q => answers[q.id]);

  return (
    <div className="app-container">
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Coffee size={32} color="var(--accent-primary)" />
          <h1 style={{ margin: 0, fontSize: '2rem' }}>JavaHu</h1>
        </div>

        <div>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <span>Welcome, <strong style={{ color: 'var(--accent-primary)' }}>{user.name}</strong></span>
              <button onClick={() => { logout(); window.location.reload(); }} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                <LogOut size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
              <form onSubmit={handleAuth} style={{ display: 'flex', gap: '10px' }}>
                <input
                  placeholder="Username"
                  value={username} onChange={e => setUsername(e.target.value)}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'white' }}
                />
                <input
                  type="password" placeholder="Password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'white' }}
                />
                <button type="submit" style={{ padding: '8px 12px', background: isRegistering ? 'var(--accent-primary)' : 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'white' }}>
                  {isRegistering ? 'Sign Up' : <LogIn size={16} />}
                </button>
              </form>
              <div style={{ fontSize: '0.8rem' }}>
                {isRegistering ? "Already have an account? " : "New here? "}
                <button
                  onClick={() => { setIsRegistering(!isRegistering); setLoginError(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {isRegistering ? "Login" : "Sign up"}
                </button>
              </div>
              {loginError && <div style={{ color: 'var(--accent-error)', fontSize: '0.8rem' }}>{loginError}</div>}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* Score Board */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginBottom: '30px' }}>
          <div className="card-glass" style={{ padding: '15px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Questions</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{questions.length}</span>
          </div>
          <div className="card-glass" style={{ padding: '15px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Score</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-success)' }}>{score}</span>
          </div>
        </div>

        {user?.isAdmin && (
          <AdminControls onQuestionAdded={(newQ) => setQuestions([...questions, newQ])} />
        )}

        {/* Questions List */}
        <div className="questions-container">
          {questions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              selectedOption={answers[q.id]?.selectedIndex}
              feedback={answers[q.id]?.feedback}
              onSelectOption={(idx) => handleAnswer(q.id, idx)}
              isSubmitting={!!answers[q.id]}
            />
          ))}

          {questions.length === 0 && !isLoadingQuestions && (
            <div style={{ padding: '40px', color: 'var(--text-secondary)' }}>
              <h3>No questions found.</h3>
              {user?.isAdmin ? <p>Use the Admin panel to add some!</p> : <p>Please wait for an admin to add questions.</p>}
            </div>
          )}

          {isLoadingQuestions && (
            <div style={{ padding: '40px', color: 'var(--text-secondary)' }}>
              Loading questions...
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '40px', gap: '5px' }}>
          <button
            disabled={currentPage === 0}
            onClick={() => setCurrentPage(c => c - 1)}
            style={{ padding: '8px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px', cursor: currentPage === 0 ? 'not-allowed' : 'pointer' }}
          >
            Previous
          </button>

          {/* Numbered Page Links */}
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              style={{
                padding: '8px 12px',
                background: currentPage === i ? 'var(--accent-primary)' : 'transparent',
                border: '1px solid var(--border-color)',
                color: 'white',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={currentPage >= totalPages - 1}
            onClick={() => setCurrentPage(c => c + 1)}
            style={{ padding: '8px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px', cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer' }}
          >
            Next
          </button>
        </div>

        {allAnswered && (
          <div className="card-glass" style={{ marginTop: '40px', padding: '40px' }}>
            <h2>Quiz Complete!</h2>
            <p style={{ fontSize: '1.2rem' }}>You scored <strong style={{ color: 'var(--accent-success)' }}>{score}</strong> out of {questions.length}</p>
            <button onClick={() => window.location.reload()} style={{ marginTop: '20px', background: 'var(--accent-primary)', border: 'none', color: 'white' }}>
              Restart Quiz
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ marginTop: '60px', padding: '20px', borderTop: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        <p>JavaHu &copy; 2026</p>
        <p style={{ opacity: 0.8 }}>made by muhammed alhomiedat</p>
      </footer>
    </div>
  );
}

export default App;
