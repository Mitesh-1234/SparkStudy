import React, { useState } from 'react';
import { api } from './api';
import { dateKey } from './utils';

export function Overview({ data, plan, onNavigate }) {
  const today = dateKey();
  const done = data.tasks.filter((task) => task.done).length;
  const minutes = Math.round(data.sessions.reduce((sum, session) => sum + session.seconds, 0) / 60);
  const xp = data.games.reduce((sum, game) => sum + game.score, 0);
  const pending = data.tasks.filter((task) => !task.done).length;

  return <>
    <div className="hero"><small>YOUR NEXT LITTLE WIN</small><h1>Welcome, {data.name}.</h1><p>Make time for what matters. One study block at a time.</p><button onClick={() => onNavigate('Study Planner')}>Plan your day →</button></div>
    <div className="metrics">
      {[['Pending tasks', pending], ['Study minutes', minutes], ['Completed tasks', done], ['Spark points', xp]].map(([label, value]) =>
        <section className="panel" key={label}><small>{label}</small><h2>{value}</h2></section>)}
    </div>
    <section className="panel"><h2>Today's study blocks</h2>
      {plan.filter((item) => item.date === today).map((item, index) =>
        <div className="line" key={index}><b>{item.title}</b><span>{item.minutes} min · {item.subject}</span></div>)}
      {!pending && <p>No pending tasks. Add one to start.</p>}
    </section>
  </>;
}

export function StudyPlanner({ data, plan, capacity, setCapacity, action, refresh }) {
  const today = dateKey();
  return <>
    <div className="heading"><small>PLAN / 01</small><h1>Study planner</h1><p>Deadline-first scheduling with priority and daily time limits.</p></div>
    <div className="split">
      <form className="panel" onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const values = Object.fromEntries(new FormData(form));
        action(async () => {
          await api('/tasks', { ...values, minutes: Number(values.minutes), priority: Number(values.priority) });
          form.reset();
        });
      }}>
        <h2>Quick-add task / exam</h2>
        <label>Task or exam title<input name="title" required maxLength="100" /></label>
        <label>Subject<input name="subject" required maxLength="100" /></label>
        <div className="pair">
          <label>Deadline<input name="due" type="date" defaultValue={today} required /></label>
          <label>Minutes<input name="minutes" type="number" min="5" max="480" defaultValue="30" required /></label>
        </div>
        <label>Priority<select name="priority"><option value="1">High</option><option value="2">Medium</option><option value="3">Low</option></select></label>
        <button>Add to plan</button>
      </form>
      <section className="panel"><h2>Your tasks</h2>
        {data.tasks.map((task) => <div className="line" key={task._id}>
          <label className="check"><input type="checkbox" checked={task.done} onChange={() =>
            action(() => api('/tasks/' + task._id, { done: !task.done }, 'PATCH'))} />
            <span><b>{task.title}</b><small>{task.subject} · {task.due} · {task.minutes} min</small></span>
          </label>
          <button className="secondary" onClick={() => action(() => api('/tasks/' + task._id, null, 'DELETE'))}>Delete</button>
        </div>)}
      </section>
    </div>
    <section className="panel"><h2>Auto-schedule</h2>
      <label>Daily available minutes<select value={capacity} onChange={(event) => setCapacity(Number(event.target.value))}>
        {[30, 60, 90, 120, 180, 240].map((minutes) => <option key={minutes}>{minutes}</option>)}
      </select></label>
      {plan.slice(0, 100).map((item, index) => <div className="line" key={index}>
        <span>{item.date} · <b>{item.title}</b></span><span>{item.minutes} min {item.late && <em>Deadline risk</em>}</span>
      </div>)}
      <p>Incomplete tasks are recalculated from today. Deadlines are never silently changed.</p>
    </section>
  </>;
}

export function CreateLab({ data, action }) {
  const [topic, setTopic] = useState('');
  const [note, setNote] = useState('');
  return <>
    <div className="heading"><small>CREATE / 04</small><h1>Create Lab</h1><p>Turn a topic into your own learning notes.</p></div>
    <section className="panel">
      <label>Topic<input value={topic} onChange={(event) => setTopic(event.target.value)} /></label>
      <button disabled={!topic.trim()} onClick={() => setNote(`Topic: ${topic}\n1. Define it in your own words.\n2. List four key concepts.\n3. Draw connections.\n4. Solve an example.\n5. Test yourself.`)}>Create revision template</button>
      <label>Your notes<textarea rows="8" value={note} onChange={(event) => setNote(event.target.value)} /></label>
      <button onClick={() => action(async () => {
        await api('/notes', { topic, body: note });
        setNote('');
        setTopic('');
      })}>Save notes</button>
    </section>
    {data.notes.map((saved) => <section className="panel" key={saved._id}><h2>{saved.topic}</h2><pre>{saved.body}</pre></section>)}
  </>;
}

export function Analytics({ data }) {
  const done = data.tasks.filter((task) => task.done).length;
  const minutes = Math.round(data.sessions.reduce((sum, session) => sum + session.seconds, 0) / 60);
  const xp = data.games.reduce((sum, game) => sum + game.score, 0);
  return <>
    <div className="heading"><small>PROGRESS / 05</small><h1>Your study analytics</h1><p>Reports based on saved tasks, sessions and quiz attempts.</p></div>
    <div className="metrics">{[
      ['Completion', data.tasks.length ? Math.round(done / data.tasks.length * 100) + '%' : '0%'],
      ['Study minutes', minutes], ['Quiz attempts', data.games.length], ['Spark points', xp],
    ].map(([label, value]) => <section className="panel" key={label}><small>{label}</small><h2>{value}</h2></section>)}</div>
    <section className="panel"><h2>Focus session history</h2>
      {data.sessions.map((session) => <div className="line" key={session._id}>
        <span>{new Date(session.createdAt).toLocaleDateString()} · {session.seconds}s</span>
        <span>{session.observed ? Math.round(session.clear / session.observed * 100) + '% clear observations' : 'No camera observations'} · {session.events} alerts</span>
      </div>)}
      <p>Clear observations are not a measure of actual concentration.</p>
    </section>
  </>;
}

export function Upgrade({ data, action }) {
  const plans = [
    { plan: 'Free', price: '₹0', note: 'Start your learning journey', features: ['Study planner', 'Focus timer', 'Basic quizzes', 'Basic progress'], featured: false },
    { plan: 'Plus', price: '₹49', note: 'More room to grow', features: ['Unlimited study planner', 'Unlimited focus sessions', 'Unlimited quizzes', 'Progress reports'], featured: true },
    { plan: 'Pro', price: '₹99', note: 'For serious study sessions', features: ['Everything in Plus', 'Detailed progress reports', 'Priority feature access'], featured: false },
  ];
  return <>
    <div className="upgrade-hero">
      <div><small>STUDY SMARTER, SPEND LESS</small><h1>Find your kind of Spark.</h1><p>Choose the plan that fits your study rhythm.</p></div>
      <div className="upgrade-orbit">SPARK</div>
    </div>
    <div className="heading"><h2>Choose your plan</h2><span className="plan-status">Current plan: Spark {data.subscription}</span></div>
    <div className="plan-deck">{plans.map((item) => <section className={'plan-card ' + (item.featured ? 'featured' : '')} key={item.plan}>
      <small>{item.featured ? 'STUDENT FAVOURITE · ' : ''}SPARK {item.plan.toUpperCase()}</small>
      <div className="plan-price">{item.price}<span> / month</span></div>
      <p>{item.note}</p>
      <ul>{item.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
      <button className={item.featured ? '' : 'secondary'} disabled={data.subscription === item.plan}
        onClick={() => action(() => api('/subscription', { plan: item.plan }, 'PUT'))}>
        {data.subscription === item.plan ? 'Current plan' : 'Switch to ' + item.plan}
      </button>
    </section>)}</div>
    <section className="panel"><h2>Simple and transparent</h2><p>Plans are stored on your StudySpark account. No payment details are collected in this version.</p></section>
  </>;
}
