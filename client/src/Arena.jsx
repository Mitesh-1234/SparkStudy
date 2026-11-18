import React, { useEffect, useRef, useState } from 'react';
import { api } from './api';

const subjects = { dsa: 'Data Structures', dbms: 'DBMS', java: 'Java', networks: 'Computer Networks' };

export default function Arena({ refresh }) {
  const [subject, setSubject] = useState('dsa');
  const [question, setQuestion] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [leaders, setLeaders] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const locked = useRef(false);

  useEffect(() => {
    api('/leaderboard').then(setLeaders).catch((requestError) => setError(requestError.message));
    const timer = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(timer);
  }, []);

  async function answer(choice) {
    if (locked.current || !question || feedback) return;
    locked.current = true;
    setBusy(true);
    try {
      const result = await api('/arena/answer', { id: question.id, index: question.index, choice });
      setFeedback(result);
      setScore(result.score);
      if (result.finished) {
        await refresh();
        setLeaders(await api('/leaderboard'));
      }
    } catch (requestError) {
      setError(requestError.message);
      setQuestion(null);
    } finally {
      setBusy(false);
      locked.current = false;
    }
  }

  useEffect(() => {
    if (question && !feedback && !busy && now >= question.deadline) answer(-1);
  }, [now, question, feedback, busy]);

  return (
    <>
      <div className="heading"><small>PLAY / 03</small><h1>Study Battle Arena</h1><p>Timed solo quizzes and shared rankings</p></div>
      <div className="split">
        <section className="panel">
          <h2>{question ? `Question ${question.index + 1} / ${question.total}` : 'Choose your challenge'}</h2>
          {!question ? (
            <>
              <label>Subject<select value={subject} onChange={(event) => setSubject(event.target.value)}>
                {Object.entries(subjects).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
              </select></label>
              <button disabled={busy} onClick={async () => {
                setBusy(true);
                try {
                  setQuestion(await api('/arena/start', { subject }));
                  setFeedback(null);
                  setScore(0);
                  setError('');
                } catch (requestError) { setError(requestError.message); }
                finally { setBusy(false); }
              }}>Start battle</button>
            </>
          ) : (
            <>
              <div className="notice">{feedback ? 'Answered' : `${Math.max(0, Math.ceil((question.deadline - now) / 1000))} seconds`} · {score} points</div>
              <h3>{question.q}</h3>
              {question.o.map((option, index) => (
                <button key={index} disabled={busy || !!feedback}
                  className={'option ' + (feedback?.answer === index ? 'correct' : '')}
                  onClick={() => answer(index)}>{option}</button>
              ))}
              {feedback && <>
                <p>{feedback.correct ? 'Correct! ' : 'Not quite. '}{feedback.explanation}</p>
                <button disabled={busy} onClick={async () => {
                  if (feedback.finished) { setQuestion(null); setFeedback(null); return; }
                  setBusy(true);
                  try {
                    setQuestion(await api('/arena/next', feedback.next));
                    setFeedback(null);
                  } catch (requestError) { setError(requestError.message); setQuestion(null); setFeedback(null); }
                  finally { setBusy(false); }
                }}>{feedback.finished ? `Finish · ${score}/50` : 'Next question'}</button>
              </>}
            </>
          )}
          {error && <p className="error">{error}</p>}
        </section>
        <section className="panel">
          <h2>Leaderboard</h2>
          {leaders.map((leader, index) => <div key={index} className="line"><b>{index + 1}. {leader.name}</b><span>{leader.score}/50</span></div>)}
          {!leaders.length && <p>No completed battles yet.</p>}
        </section>
      </div>
    </>
  );
}
