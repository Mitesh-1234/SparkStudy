import React, { useEffect, useRef, useState } from 'react';
import { api } from './api';

const subjects = {
  mixed: 'Mixed challenge',
  dsa: 'Data Structures',
  dbms: 'DBMS',
  java: 'Java',
  networks: 'Computer Networks',
};

export default function Arena({ refresh }) {
  const [subject, setSubject] = useState('mixed');
  const [question, setQuestion] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [stats, setStats] = useState({ battles: 0, best: 0, xp: 0 });
  const [leaders, setLeaders] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [roomMessage, setRoomMessage] = useState('');
  const [roomState, setRoomState] = useState(null);
  const [roomFeedback, setRoomFeedback] = useState(null);
  const [now, setNow] = useState(Date.now());
  const locked = useRef(false);

  useEffect(() => {
    let active = true;
    async function refreshArena() {
      try {
        const [arenaStats, leaderboard] = await Promise.all([api('/arena/stats'), api('/leaderboard')]);
        if (active) {
          setStats(arenaStats);
          setLeaders(leaderboard);
        }
      } catch (requestError) {
        if (active) setError(requestError.message);
      }
    }
    refreshArena();
    const arenaTimer = setInterval(refreshArena, 10000);
    const clockTimer = setInterval(() => setNow(Date.now()), 200);
    function refreshOnFocus() {
      if (!document.hidden) refreshArena();
    }
    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnFocus);
    return () => {
      active = false;
      clearInterval(arenaTimer);
      clearInterval(clockTimer);
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnFocus);
    };
  }, []);

  useEffect(() => {
    if (!roomCode) return undefined;
    let active = true;
    async function loadRoom() {
      try {
        const state = await api('/arena/room/' + roomCode);
        if (active) setRoomState(state);
      } catch (requestError) {
        if (active) setRoomMessage(requestError.message);
      }
    }
    loadRoom();
    const timer = setInterval(loadRoom, 1000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [roomCode]);

  useEffect(() => {
    setRoomFeedback(null);
  }, [roomState?.index, roomState?.status]);

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
        setStats(await api('/arena/stats'));
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

  async function startBattle() {
    setBusy(true);
    setError('');
    try {
      setQuestion(await api('/arena/start', { subject }));
      setFeedback(null);
      setScore(0);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function createRoom() {
    setBusy(true);
    setRoomMessage('');
    try {
      const room = await api('/arena/room/create', { subject });
      setRoomCode(room.code);
      setRoomMessage(`Room ${room.code} created`);
    } catch (requestError) {
      setRoomMessage(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function copyInvite() {
    if (!roomCode) return;
    await navigator.clipboard?.writeText(roomCode);
    setRoomMessage(`Invite code ${roomCode} copied`);
  }

  async function joinRoom() {
    setBusy(true);
    setRoomMessage('');
    try {
      const room = await api('/arena/room/join', { code: joinCode });
      setRoomCode(room.code);
      setSubject(room.subject);
      setRoomMessage(`Joined room ${room.code} · ${room.players} player${room.players === 1 ? '' : 's'}`);
    } catch (requestError) {
      setRoomMessage(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function startRoom() {
    if (!roomCode) return;
    setBusy(true);
    setRoomMessage('');
    setRoomFeedback(null);
    try {
      await api('/arena/room/start', { code: roomCode });
      setRoomState(await api('/arena/room/' + roomCode));
    } catch (requestError) {
      setRoomMessage(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function answerRoom(choice) {
    if (!roomCode || roomFeedback || busy) return;
    setBusy(true);
    try {
      const result = await api('/arena/room/answer', { code: roomCode, choice });
      setRoomFeedback(result);
      setRoomState(await api('/arena/room/' + roomCode));
    } catch (requestError) {
      setRoomMessage(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="heading"><small>PLAY / 03</small><h1>Study Battle Arena</h1><p>Timed solo quizzes and friendly challenges</p></div>
      <div className="arena-metrics">
        <div className="panel"><strong>{stats.battles}</strong><span>Battles played</span></div>
        <div className="panel"><strong>{stats.best}</strong><span>Best score</span></div>
        <div className="panel"><strong>{stats.xp}</strong><span>Arena XP earned</span></div>
      </div>

      <div className="arena-layout">
        <div className="arena-main">
          <section className="panel arena-battle">
            <div className="arena-battle-head">
              <div>
                <h2>{question ? `Question ${question.index + 1} / ${question.total}` : 'Ready for a battle?'}</h2>
                <p>{question ? `${subject === 'mixed' ? 'Mixed challenge' : subjects[subject]} · ${score} points` : 'Choose a subject and test what you know.'}</p>
              </div>
              {!question && <button className="arena-solo" disabled={busy} onClick={startBattle}>Start battle</button>}
            </div>

            {!question ? (
              <>
                <div className="arena-setup">
                  <label>Choose subject
                    <select value={subject} onChange={(event) => setSubject(event.target.value)}>
                      {Object.entries(subjects).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                    </select>
                  </label>
                </div>

                <div className="arena-friends">
                  <h3>Challenge friends</h3>
                  <p>Create a private room or enter a friend's room code to prepare a head-to-head study battle.</p>
                  <div className="arena-room-actions">
                    <button type="button" className="secondary" disabled={busy} onClick={createRoom}>Create friend room</button>
                    <button type="button" className="secondary" disabled={!roomCode} onClick={copyInvite}>Copy invite code</button>
                  </div>
                  {roomCode && <div className="arena-room-code"><span>ROOM CODE</span><strong>{roomCode}</strong></div>}
                  <div className="arena-join">
                    <input inputMode="numeric" maxLength="6" value={joinCode}
                      onChange={(event) => setJoinCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="ENTER 6-DIGIT CODE" aria-label="Room code" />
                    <button type="button" disabled={busy || joinCode.length !== 6} onClick={joinRoom}>Join room</button>
                  </div>
                  {roomMessage && <p className="arena-room-message">{roomMessage}</p>}
                  {roomCode && roomState?.status && (
                    <div className="arena-live-room">
                      <div className="arena-live-head">
                        <strong>{roomState.status === 'waiting' ? 'Waiting room' : roomState.status === 'finished' ? 'Battle finished' : `Question ${roomState.index + 1} / ${roomState.question?.total || 5}`}</strong>
                        <span>{roomState.players?.length || 0} player(s)</span>
                      </div>
                      {roomState.status === 'waiting' && roomState.isOwner && (
                        <button type="button" disabled={busy} onClick={startRoom}>Start friend battle</button>
                      )}
                      {roomState.status === 'waiting' && !roomState.isOwner && (
                        <p>Waiting for the room creator to start.</p>
                      )}
                      {roomState.status === 'playing' && roomState.question && (
                        <div className="arena-room-battle">
                          <h3>{roomState.question.q}</h3>
                          {roomState.question.o.map((option, index) => (
                            <button key={option} type="button" disabled={busy || !!roomFeedback}
                              className={'option ' + (roomFeedback?.answer === index ? 'correct' : '')}
                              onClick={() => answerRoom(index)}>{option}</button>
                          ))}
                          {roomFeedback && <p>{roomFeedback.correct ? 'Correct! ' : 'Not quite. '}{roomFeedback.explanation}</p>}
                        </div>
                      )}
                      <div className="arena-room-scores">
                        {(roomState.players || []).map((player) => <div key={player.id}><b>{player.name}</b><span>{player.score} pts</span></div>)}
                      </div>
                    </div>
                  )}
                </div>
                <div className="arena-rule">Each battle has 5 questions. Correct answers earn up to 10 points; quick answers earn a speed bonus. Read the explanation after each answer.</div>
              </>
            ) : (
              <>
                <div className="arena-timer">{feedback ? 'Answered' : `${Math.max(0, Math.ceil((question.deadline - now) / 1000))} seconds`} · {score} points</div>
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
                    } catch (requestError) {
                      setError(requestError.message);
                      setQuestion(null);
                      setFeedback(null);
                    } finally { setBusy(false); }
                  }}>{feedback.finished ? `Finish · ${score}/50` : 'Next question'}</button>
                </>}
              </>
            )}
            {error && <p className="error">{error}</p>}
          </section>
        </div>

        <aside className="arena-leaderboard panel">
          <h2>Arena leaderboard</h2>
          <p>Today's top scores</p>
          {leaders.map((leader, index) => (
            <div className="arena-leader" key={`${leader.name}-${index}`}>
              <span className={'rank rank-' + (index + 1)}>{index + 1}</span>
              <b>{leader.name}</b>
              <strong>{leader.score} pts</strong>
            </div>
          ))}
          {!leaders.length && <p>No completed battles yet.</p>}
          <div className="arena-ranks">
            <h3>Earn your title</h3>
            <div><span>0-19</span><b>Rookie Spark</b></div>
            <div><span>20-34</span><b>Quick Thinker</b></div>
            <div><span>35-44</span><b>Knowledge Knight</b></div>
            <div><span>45-50</span><b>Study Champion</b></div>
          </div>
        </aside>
      </div>
    </>
  );
}
