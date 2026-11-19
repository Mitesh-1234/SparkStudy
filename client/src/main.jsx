import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { api } from './api';
import Auth from './Auth';
import Arena from './Arena';
import Focus from './Focus';
import { Analytics, CreateLab, Overview, StudyPlanner, Upgrade } from './pages';
import { dateKey, emptyData } from './utils';
import './style.css';

const pages = ['Overview', 'Study Planner', 'Focus Guard', 'Battle Arena', 'Create Lab', 'Analytics', 'Upgrade'];
const dataCacheKey = 'studyspark-dashboard-cache';

function readCachedData() {
  try {
    return JSON.parse(sessionStorage.getItem(dataCacheKey) || 'null');
  } catch {
    return null;
  }
}

function writeCachedData(account) {
  try {
    sessionStorage.setItem(dataCacheKey, JSON.stringify(account));
    window.dispatchEvent(new CustomEvent('studyspark-data', { detail: account }));
  } catch {}
}

function App() {
  const cachedData = readCachedData();
  const [auth, setAuth] = useState(cachedData ? { name: cachedData.name } : null);
  const [page, setPage] = useState('Overview');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [data, setData] = useState(cachedData || emptyData);
  const [error, setError] = useState('');
  const [capacity, setCapacity] = useState(90);

  async function refresh() {
    const account = await api('/data');
    setData(account);
    writeCachedData(account);
    setAuth({ name: account.name });
    return account;
  }

  async function action(callback) {
    try {
      setError('');
      await callback();
      await refresh();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  useEffect(() => {
    let active = true;
    async function refreshSession() {
      try {
        await refresh();
        if (active) setError('');
      } catch (requestError) {
        if (!active) return;
        setError(requestError.message);
        if (requestError.message === 'Please sign in') {
          sessionStorage.removeItem(dataCacheKey);
          setAuth(null);
          setData(emptyData);
        }
      }
    }

    refreshSession();
    const timer = setInterval(refreshSession, 10000);
    function refreshOnFocus() {
      if (!document.hidden) refreshSession();
    }
    function refreshOnOnline() {
      refreshSession();
    }
    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnFocus);
    window.addEventListener('online', refreshOnOnline);

    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnFocus);
      window.removeEventListener('online', refreshOnOnline);
    };
  }, []);

  useEffect(() => {
    if (!auth) return undefined;
    function storageChanged(event) {
      if (event.key === dataCacheKey && event.newValue) {
        try {
          setData(JSON.parse(event.newValue));
        } catch {}
      }
    }
    function dataChanged(event) {
      if (event.detail) setData(event.detail);
    }
    window.addEventListener('storage', storageChanged);
    window.addEventListener('studyspark-data', dataChanged);
    return () => {
      window.removeEventListener('storage', storageChanged);
      window.removeEventListener('studyspark-data', dataChanged);
    };
  }, [auth]);

  function logout() {
    api('/auth/logout', undefined, 'POST').finally(() => {
      sessionStorage.removeItem(dataCacheKey);
      setMobileMenu(false);
      setAuth(null);
      setData(emptyData);
      setPage('Overview');
    });
  }

  if (!auth) return <Auth onLogin={(account) => setAuth(account)} />;

  const pending = data.tasks.filter((task) => !task.done).sort((left, right) =>
    left.due.localeCompare(right.due) || left.priority - right.priority);
  const plan = [];
  let day = new Date();
  let remaining = capacity;
  for (const task of pending) {
    let left = task.minutes;
    while (left > 0) {
      if (!remaining) {
        day.setDate(day.getDate() + 1);
        remaining = capacity;
      }
      const minutes = Math.min(left, remaining);
      plan.push({
        title: task.title,
        subject: task.subject,
        date: dateKey(day),
        minutes,
        late: dateKey(day) > task.due,
      });
      left -= minutes;
      remaining -= minutes;
    }
  }

  return (
    <div className="shell">
      <aside>
        <img className="app-logo" src="/studyspark-logo.png" alt="StudySpark" /><small>YOUR STUDY SPACE</small>
        {pages.map((label, index) => <button key={label} className={'nav ' + (page === label ? 'selected' : '')}
          onClick={() => { setPage(label); setError(''); }}><span>{label}</span></button>)}
        <div className="account"><b>{auth.name}</b><button className="secondary" onClick={logout}>Sign out</button></div>
      </aside>
      <main>
        <div className="mobile-header">
          <div className="mobile-brand"><img src="/studyspark-logo.png" alt="StudySpark" /></div>
          <button className={'menu-button ' + (mobileMenu ? 'open' : '')} type="button"
            aria-label="Open navigation menu" aria-expanded={mobileMenu}
            onClick={() => setMobileMenu(!mobileMenu)}><i></i><i></i><i></i></button>
          {mobileMenu && <nav className="mobile-menu" aria-label="Mobile navigation">
            <div className="mobile-menu-head"><span>{auth.name}</span><small>{data.subscription} plan</small></div>
            {pages.map((label) => <button key={label} className={page === label ? 'selected' : ''} type="button"
              onClick={() => { setPage(label); setMobileMenu(false); setError(''); }}>{label}</button>)}
            <button type="button" className="mobile-signout" onClick={logout}>Sign out</button>
          </nav>}
        </div>
        <header className="desktop-header"><small>STUDENT WORKSPACE</small><span>{new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}</span></header>
        {error && <div className="error" role="alert">{error}</div>}
        {page === 'Overview' && <Overview data={data} plan={plan} onNavigate={setPage} />}
        {page === 'Study Planner' && <StudyPlanner data={data} plan={plan} capacity={capacity} setCapacity={setCapacity} action={action} refresh={refresh} />}
        {page === 'Focus Guard' && <Focus save={async (session) => { await api('/sessions', session); await refresh(); }} />}
        {page === 'Battle Arena' && <Arena refresh={refresh} />}
        {page === 'Create Lab' && <CreateLab data={data} action={action} />}
        {page === 'Analytics' && <Analytics data={data} />}
        {page === 'Upgrade' && <Upgrade data={data} action={action} />}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
