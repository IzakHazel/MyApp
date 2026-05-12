import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Pencil, CheckCircle2, RotateCcw, Bell, CalendarDays, Trophy } from 'lucide-react';

const STORAGE_KEY = 'adhd_quest_planner_v1';

const WEEKDAYS = [
  { id: 0, label: 'Sun' },
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
];

const EMOJIS = ['🔥','💪','🧠','💸','🏋️','📚','🚗','🧼','🍗','💧','🛏️','🎬','📝','🧘','❤️','⚡','🌙','👑','🎯','✅'];

const todayKey = () => new Date().toISOString().slice(0, 10);

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

function isQuestDueToday(quest) {
  const now = new Date();
  const today = todayKey();
  const day = now.getDay();

  if (quest.repeat === 'once') return quest.date === today;
  if (quest.repeat === 'daily') return true;
  if (quest.repeat === 'weekdays') return quest.days.includes(day);
  return true;
}

function defaultQuest() {
  return {
    id: uid(),
    title: '',
    emoji: '🎯',
    time: '09:00',
    repeat: 'daily',
    date: todayKey(),
    days: [1,2,3,4,5],
    completedDates: [],
    createdAt: new Date().toISOString()
  };
}

export default function App() {
  const [quests, setQuests] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    return [
      { ...defaultQuest(), id: uid(), title: 'Drink water', emoji: '💧', time: '09:00', repeat: 'daily' },
      { ...defaultQuest(), id: uid(), title: 'Work / study block', emoji: '🧠', time: '11:00', repeat: 'daily' },
      { ...defaultQuest(), id: uid(), title: 'Gym or walk', emoji: '🏋️', time: '15:00', repeat: 'weekdays', days: [1,3,5] },
    ];
  });

  const [form, setForm] = useState(defaultQuest());
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('Build momentum. Close tiny quests. Win the day.');
  const [notificationOk, setNotificationOk] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quests));
  }, [quests]);

  const todaysQuests = useMemo(() => quests.filter(isQuestDueToday), [quests]);
  const completedToday = todaysQuests.filter(q => q.completedDates.includes(todayKey())).length;
  const totalToday = todaysQuests.length;
  const progress = totalToday ? Math.round((completedToday / totalToday) * 100) : 0;
  const dayClosed = totalToday > 0 && completedToday === totalToday;

  useEffect(() => {
    if (dayClosed) {
      setMessage('🏆 Perfect day closed. You did not negotiate with chaos today.');
    } else if (progress >= 70) {
      setMessage('🔥 Almost there. One more quest and your brain gets the dopamine cookie.');
    } else if (progress > 0) {
      setMessage('⚡ Good. Momentum is real. Keep clicking life into order.');
    }
  }, [progress, dayClosed]);

  useEffect(() => {
    if (!notificationOk) return;

    const interval = setInterval(() => {
      const now = new Date();
      const current = now.toTimeString().slice(0,5);
      const today = todayKey();

      quests.forEach(q => {
        if (!isQuestDueToday(q)) return;
        if (q.completedDates.includes(today)) return;
        if (q.time === current && Notification.permission === 'granted') {
          new Notification(`${q.emoji} Quest reminder`, {
            body: q.title,
          });
        }
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [quests, notificationOk]);

  async function enableNotifications() {
    if (!('Notification' in window)) {
      setMessage('Notifications are not supported in this browser.');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationOk(permission === 'granted');
    setMessage(permission === 'granted' ? '🔔 Reminders enabled.' : 'Notifications were not allowed.');
  }

  function saveQuest(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setMessage('Name the quest first.');
      return;
    }

    const clean = { ...form, title: form.title.trim(), emoji: form.emoji || '🎯' };

    if (editingId) {
      setQuests(prev => prev.map(q => q.id === editingId ? clean : q));
      setEditingId(null);
      setMessage('✏️ Quest updated.');
    } else {
      setQuests(prev => [clean, ...prev]);
      setMessage('🎯 New quest added.');
    }

    setForm(defaultQuest());
  }

  function editQuest(q) {
    setForm(q);
    setEditingId(q.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function deleteQuest(id) {
    setQuests(prev => prev.filter(q => q.id !== id));
    setMessage('🗑️ Quest deleted.');
  }

  function toggleQuest(id) {
    const today = todayKey();
    setQuests(prev => prev.map(q => {
      if (q.id !== id) return q;
      const done = q.completedDates.includes(today);
      return {
        ...q,
        completedDates: done
          ? q.completedDates.filter(d => d !== today)
          : [...q.completedDates, today]
      };
    }));
  }

  function resetToday() {
    const today = todayKey();
    setQuests(prev => prev.map(q => ({
      ...q,
      completedDates: q.completedDates.filter(d => d !== today)
    })));
    setMessage('↩️ Today reset. Start again clean.');
  }

  function updateDay(day) {
    setForm(prev => {
      const exists = prev.days.includes(day);
      return {
        ...prev,
        days: exists ? prev.days.filter(d => d !== day) : [...prev.days, day].sort()
      };
    });
  }

  return (
    <main className="app">
      <section className="hero">
        <div>
          <p className="eyebrow">ADHD QUEST PLANNER</p>
          <h1>Win today, not your whole life.</h1>
          <p className="sub">{message}</p>
        </div>
        <div className="level-card">
          <Trophy size={28} />
          <strong>{progress}%</strong>
          <span>{completedToday}/{totalToday} quests</span>
        </div>
      </section>

      <section className="progress-wrap">
        <div className="progress-bar">
          <div style={{ width: `${progress}%` }} />
        </div>
        {dayClosed && <div className="reward">👑 Day closed. Dopamine unlocked.</div>}
      </section>

      <form className="panel form" onSubmit={saveQuest}>
        <div className="row">
          <div className="emoji-box">
            <input
              value={form.emoji}
              onChange={e => setForm({ ...form, emoji: e.target.value })}
              maxLength="4"
              aria-label="Emoji"
            />
          </div>
          <input
            className="title-input"
            placeholder="Quest name..."
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div className="emoji-grid">
          {EMOJIS.map(e => (
            <button type="button" key={e} onClick={() => setForm({ ...form, emoji: e })}>{e}</button>
          ))}
        </div>

        <div className="grid">
          <label>
            <span>Time</span>
            <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
          </label>

          <label>
            <span>Repeat</span>
            <select value={form.repeat} onChange={e => setForm({ ...form, repeat: e.target.value })}>
              <option value="daily">Every day</option>
              <option value="once">One time</option>
              <option value="weekdays">Specific days</option>
            </select>
          </label>

          {form.repeat === 'once' && (
            <label>
              <span>Date</span>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </label>
          )}
        </div>

        {form.repeat === 'weekdays' && (
          <div className="days">
            {WEEKDAYS.map(day => (
              <button
                type="button"
                key={day.id}
                className={form.days.includes(day.id) ? 'active' : ''}
                onClick={() => updateDay(day.id)}
              >
                {day.label}
              </button>
            ))}
          </div>
        )}

        <button className="primary" type="submit">
          <Plus size={18} />
          {editingId ? 'Save quest' : 'Add quest'}
        </button>
      </form>

      <section className="actions">
        <button onClick={enableNotifications}><Bell size={17} /> Enable reminders</button>
        <button onClick={resetToday}><RotateCcw size={17} /> Reset today</button>
      </section>

      <section className="quest-list">
        <h2><CalendarDays size={20} /> Today’s quests</h2>

        {todaysQuests.length === 0 && (
          <div className="empty">No quests for today. Add one tiny thing. Even 5 minutes counts.</div>
        )}

        {todaysQuests.map(q => {
          const done = q.completedDates.includes(todayKey());
          return (
            <article className={`quest ${done ? 'done' : ''}`} key={q.id}>
              <button className="check" onClick={() => toggleQuest(q.id)}>
                <CheckCircle2 size={24} />
              </button>

              <div className="quest-main" onClick={() => toggleQuest(q.id)}>
                <div className="quest-title">
                  <span>{q.emoji}</span>
                  <strong>{q.title}</strong>
                </div>
                <p>{q.time} · {q.repeat === 'daily' ? 'Every day' : q.repeat === 'once' ? 'One time' : 'Selected days'}</p>
              </div>

              <button className="icon" onClick={() => editQuest(q)}><Pencil size={18} /></button>
              <button className="icon danger" onClick={() => deleteQuest(q.id)}><Trash2 size={18} /></button>
            </article>
          );
        })}
      </section>
    </main>
  );
}
