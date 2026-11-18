import React, { useEffect, useState } from 'react';
import { api } from './api';

export default function Auth({ onLogin }) {
  const [register, setRegister] = useState(false);
  const [error, setError] = useState('');
  const [signupCount, setSignupCount] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadSignupCount() {
      try {
        const response = await fetch('/api/auth/signup-count', { cache: 'no-store' });
        if (!response.ok) return;
        const result = await response.json();
        if (active) setSignupCount(result.count);
      } catch {
        // Keep the placeholder when the public count endpoint is unavailable.
      }
    }

    loadSignupCount();
    const timer = setInterval(loadSignupCount, 30000);
    window.addEventListener('focus', loadSignupCount);

    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener('focus', loadSignupCount);
    };
  }, []);

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      const account = await api(
        '/auth/' + (register ? 'register' : 'login'),
        Object.fromEntries(new FormData(event.currentTarget)),
      );
      onLogin(account);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <main className="studyspark-welcome">
      <nav className="welcome-nav">
        <div className="brand welcome-brand"><img src="/studyspark-logo.png" alt="StudySpark" /></div>
        <div className="welcome-nav-links">
          <a href="#welcome-features">Features</a>
          <a href="#welcome-preview">Progress</a>
          <span className="welcome-pill">YOUR LEARNING PLAYGROUND</span>
        </div>
      </nav>
      <div className="welcome-grid">
        <div className="welcome-copy">
          <small>LESS PRESSURE. MORE POSSIBILITY.</small>
          <h1>Your ideas deserve to <span>spark.</span></h1>
          <p>A little planning, a lot of creativity. Turn study sessions into quests, turn big topics into your own ideas, and make learning feel like you.</p>
          <form className="panel auth welcome-auth" onSubmit={submit}>
            <h2>{register ? 'Create your account' : 'Welcome back'}</h2>
            {register && <label>Name<input name="name" required maxLength="40" /></label>}
            <label>Email<input name="email" type="email" required /></label>
            <label>Password<input name="password" type="password" required minLength={register ? '12' : '8'} maxLength="72" /></label>
            <button>{register ? 'Create account' : 'Sign in'}</button>
            <button type="button" className="secondary" onClick={() => setRegister(!register)}>
              {register ? 'Already registered? Sign in' : 'New here? Register'}
            </button>
            {error && <p className="error">{error}</p>}
          </form>
        </div>
        <div className="welcome-art" id="welcome-preview" aria-label="StudySpark dashboard preview">
          <div className="welcome-art-glow"></div>
          <div className="welcome-window">
            <div className="welcome-window-top"><span>Your space</span><span>STUDY</span></div>
            <div className="welcome-window-hero">
              <small>YOUR NEXT CHAPTER STARTS HERE</small>
              <strong>Hey, future you!</strong>
              <p>Pick a vibe. Create something. Celebrate a tiny win.</p>
            </div>
            <div className="welcome-stats">
              <div><strong>{signupCount === null ? '—' : signupCount}</strong><span>REGISTERED STUDENTS</span></div>
              <div><strong>01</strong><span>STUDY PLANNER</span></div>
              <div><strong>02</strong><span>NEW IDEAS</span></div>
            </div>
            <div className="welcome-task"><span>Break a big topic into small steps</span></div>
            <div className="welcome-task"><span>Create something, not just notes</span></div>
          </div>
        </div>
      </div>
      <div className="welcome-features" id="welcome-features">
        <button type="button" className="selected">
          <span>01</span>
          <div><strong>Play &amp; progress</strong><small>Mini-quests and rewards</small></div>
        </button>
        <button type="button">
          <span>02</span>
          <div><strong>Make ideas</strong><small>Learn by creating</small></div>
        </button>
        <button type="button">
          <span>03</span>
          <div><strong>Find your flow</strong><small>A plan that fits you</small></div>
        </button>
      </div>
    </main>
  );
}
