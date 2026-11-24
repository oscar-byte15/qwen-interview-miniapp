import { useEffect, useState } from 'react';
import { api, type Health, type Interview } from './api';

const STORAGE_KEY = 'qwen-miniapp-session';

export default function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [session, setSession] = useState<Interview | null>(null);
  const [role, setRole] = useState('Working Student — Software Engineer');
  const [topics, setTopics] = useState('Git fundamentals, Java, Spring Boot, REST APIs and testing');
  const [total, setTotal] = useState(3);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<Interview[]>([]);

  useEffect(() => {
    api.health().then(setHealth).catch(() => setHealth(null));
    api.list().then(setHistory).catch(() => {});
    const storedId = localStorage.getItem(STORAGE_KEY);
    if (storedId) api.get(storedId).then(setSession).catch(() => localStorage.removeItem(STORAGE_KEY));
  }, []);

  const syncHistory = () => api.list().then(setHistory).catch(() => {});

  async function start() {
    setBusy(true); setError('');
    try {
      const created = await api.create(role, topics, total);
      setSession(created);
      setAnswer('');
      localStorage.setItem(STORAGE_KEY, created.id);
      syncHistory();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function submit() {
    if (!session || answer.trim().length === 0) return;
    setBusy(true); setError('');
    try {
      const updated = await api.answer(session.id, answer.trim());
      setSession(updated);
      setAnswer('');
      syncHistory();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  function newInterview() {
    setSession(null); setAnswer(''); setError('');
    localStorage.removeItem(STORAGE_KEY);
  }

  async function openOld(id: string) {
    setBusy(true); setError('');
    try {
      const data = await api.get(id);
      setSession(data);
      localStorage.setItem(STORAGE_KEY, id);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  const progress = session ? Math.round(session.answered / session.total * 100) : 0;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" onClick={(e) => { e.preventDefault(); newInterview(); }}>
          <span className="brand-mark">✦</span><span>interview<span className="accent">lab</span></span>
        </a>
        <div className="header-right">
          <span className={`connection ${health ? 'online' : 'offline'}`}>
            <span className="status-dot" />
            {health ? (health.mode === 'demo' ? 'Demo model' : 'Qwen configured*') : 'Backend unavailable'}
          </span>
          <span className="pill">MVP • FH Dortmund</span>
        </div>
      </header>

      <main className="layout">
        <aside className="sidebar">
          <p className="eyebrow">YOUR WORKSPACE</p>
          <button className="nav-item selected" onClick={newInterview}>◈ &nbsp; Interview practice</button>
          <p className="eyebrow history-label">RECENT SESSIONS</p>
          {history.length === 0 && <p className="muted small">Your sessions will appear here.</p>}
          {history.slice().reverse().map((item) => (
            <button key={item.id} className="history-item" onClick={() => openOld(item.id)}>
              <span className="history-role">{item.role}</span>
              <span className="history-meta">{item.status === 'COMPLETED' ? `Completed · ${item.assessment?.score ?? '–'}/10` : `${item.answered}/${item.total} answered`}</span>
            </button>
          ))}
          <div className="side-note">
            <span>🔒 Hidden evaluation prompt</span>
            <p>Model instructions and API credentials stay on the Spring Boot server.</p>
          </div>
        </aside>

        <section className="main-panel">
          {!session ? (
            <>
              <div className="hero-label">AI-POWERED INTERVIEW PRACTICE</div>
              <h1>Practice smarter.<br/><span className="gradient-text">Interview with confidence.</span></h1>
              <p className="intro">Run a short technical interview powered by your university’s Qwen2.5 model. Questions adapt to your answers, with actionable feedback at the end.</p>
              <div className="form-card">
                <div className="card-header"><span className="step-icon">01</span><div><h2>Set up your assessment</h2><p>Tell the AI what role you’re preparing for.</p></div></div>
                <label htmlFor="role">Target role</label>
                <input id="role" maxLength={120} value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Junior Java Developer" />
                <label htmlFor="topics">Interview topics</label>
                <textarea id="topics" rows={3} maxLength={400} value={topics} onChange={(e) => setTopics(e.target.value)} placeholder="Git, Java, OOP, REST APIs…" />
                <label htmlFor="count">Number of questions</label>
                <select id="count" value={total} onChange={(e) => setTotal(Number(e.target.value))}>
                  {[2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} questions</option>)}
                </select>
                <button className="primary full" disabled={busy || !role.trim() || !topics.trim()} onClick={start}>{busy ? 'Generating first question…' : 'Start interview  →'}</button>
              </div>
            </>
          ) : session.status === 'COMPLETED' ? (
            <>
              <div className="hero-label">ASSESSMENT COMPLETED</div>
              <h1>Your interview <span className="gradient-text">results</span></h1>
              <p className="intro">{session.role} · {session.total} questions</p>
              <div className="result-card">
                <div className="score-ring"><strong>{session.assessment?.score ?? '–'}</strong><span>/ 10</span></div>
                <div><h2>Great work finishing!</h2><p>{session.assessment?.summary}</p></div>
              </div>
              <div className="result-columns">
                <div className="mini-card"><h3>✓ What you did well</h3><ul>{session.assessment?.strengths.map((v, i) => <li key={i}>{v}</li>)}</ul></div>
                <div className="mini-card"><h3>↗ Where to improve</h3><ul>{session.assessment?.improvements.map((v, i) => <li key={i}>{v}</li>)}</ul></div>
              </div>
              <h2 className="review-heading">Interview transcript</h2>
              {session.turns.map((t, i) => <div className="review-item" key={i}><strong>Q{i + 1}. {t.question}</strong><p>{t.answer}</p></div>)}
              <button className="primary" onClick={newInterview}>Practice again →</button>
            </>
          ) : (
            <>
              <div className="between"><div><div className="hero-label">LIVE ASSESSMENT</div><h1 className="in-session">Your technical interview</h1><p className="muted">{session.role}</p></div><span className="pill">Question {session.answered + 1} of {session.total}</span></div>
              <div className="progress-track"><div style={{ width: `${progress}%` }} /></div>
              <div className="question-card"><span className="ai-label">✦ QWEN AI INTERVIEWER</span><h2>{session.currentQuestion}</h2></div>
              <div className="answer-box"><label htmlFor="answer">YOUR ANSWER</label><textarea id="answer" rows={7} maxLength={3000} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Type your answer here. Explain your reasoning and give examples…" disabled={busy} /><div className="answer-footer"><span>{answer.length} / 3000 characters</span><button className="primary" disabled={busy || !answer.trim()} onClick={submit}>{busy ? 'Processing…' : session.answered === session.total - 1 ? 'Finish & evaluate →' : 'Submit answer →'}</button></div></div>
              <p className="info-text">The next question adapts to your previous answers. Your evaluation appears after the last question.</p>
            </>
          )}
          {error && <div className="error" role="alert"><strong>Something went wrong</strong><p>{error}</p><span>Check your backend terminal and the Qwen server connection, then retry.</span></div>}
        </section>
      </main>
      <footer>Built for the FH Dortmund Innovation Driven Software Engineering quickstart · {health?.mode === 'demo' ? 'Offline demonstration mode' : 'University Qwen API mode'} · *Backend running does not prove Qwen server connectivity</footer>
    </div>
  );
}
