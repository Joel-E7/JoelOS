const { onSchedule } = require('firebase-functions/v2/scheduler');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();
const db = getFirestore();
const messaging = getMessaging();

const ZONE = 'Europe/London';

function nowInZone(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const g = t => parts.find(p => p.type === t)?.value;
  const y = g('year');
  const m = g('month');
  const d = g('day');
  const weekdayName = g('weekday');
  const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const weekday = map[weekdayName] ?? 0;
  const mondayShift = weekday === 0 ? -6 : 1 - weekday;
  const monday = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d) + mondayShift));
  const mondayKey = monday.toISOString().slice(0, 10);
  return {
    dateKey: `${y}-${m}-${d}`,
    hhmm: `${g('hour')}:${g('minute')}`,
    weekday,
    mondayKey
  };
}

function hhmmToMin(s) {
  const [h, mi] = String(s || '00:00').split(':').map(n => parseInt(n, 10) || 0);
  return h * 60 + mi;
}

function alreadyLogged(slot, daily) {
  if (!daily) return false;
  const energies = daily.energies || [];
  if (slot === 'morning' && (energies.some(e => e.label === 'Wake-up') || daily.energy)) return true;
  if (slot === 'midday' && energies.some(e => e.label === 'Midday')) return true;
  if (slot === 'evening' && energies.some(e => e.label === 'Bedtime')) return true;
  const moods = daily.moods || [];
  const times = moods.map(m => hhmmToMin(m.time)).filter(n => n >= 0);
  if (slot === 'morning') return times.some(t => t < 12 * 60);
  if (slot === 'midday') return times.some(t => t >= 12 * 60 && t < 18 * 60);
  if (slot === 'evening') return times.some(t => t >= 18 * 60);
  return false;
}

async function sendData(token, data) {
  try {
    await messaging.send({
      token,
      data: {
        label: String(data.label || ''),
        title: String(data.title || 'JE OS'),
        body: String(data.body || ''),
        url: String(data.url || 'https://joelos.web.app')
      }
    });
    return true;
  } catch (e) {
    const code = e.errorInfo?.code || e.code || '';
    if (String(code).includes('registration-token-not-registered') || String(code).includes('invalid-registration-token')) {
      return 'dead';
    }
    console.warn('send failed', code, e.message);
    return false;
  }
}

async function weeklyDigest(uid, mondayKey) {
  const [weekSnap, archiveSnap, dailies] = await Promise.all([
    db.doc(`users/${uid}/weeks/${mondayKey}`).get(),
    db.doc(`users/${uid}/archives/priority_archive`).get(),
    Promise.all(Array.from({ length: 7 }, (_, i) => {
      const d = new Date(mondayKey + 'T00:00');
      d.setDate(d.getDate() + i);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return db.doc(`users/${uid}/daily/${k}`).get().then(s => s.exists ? { id: k, ...s.data() } : null);
    }))
  ]);
  const week = weekSnap.exists ? weekSnap.data() : {};
  const archive = archiveSnap.exists ? archiveSnap.data() : { items: [] };
  const days = dailies.filter(Boolean);
  const logged = days.length;
  if (!logged && !(week.priorities || []).length && !(archive.items || []).length) return null;

  const weekStart = new Date(mondayKey + 'T00:00');
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);
  const done = (archive.items || []).filter(p => {
    if (!p.completed_at) return false;
    const at = new Date(p.completed_at);
    return at >= weekStart && at < weekEnd;
  }).length;
  const wins = days.reduce((s, d) => s + (d.wins || []).length, 0);
  const pages = days.reduce((s, d) => s + (d.reading?.pages || 0), 0);
  const eDays = days.filter(d => d.energy);
  const avgE = eDays.length ? (eDays.reduce((s, d) => s + d.energy, 0) / eDays.length).toFixed(1) : null;
  const open = (week.priorities || []).length;

  if (!logged) {
    return {
      label: 'drift',
      title: 'Quiet week',
      body: 'Nothing was logged. Open Review if you want to set next week up anyway.'
    };
  }
  const bits = [];
  if (done) bits.push(`${done} priorit${done === 1 ? 'y' : 'ies'} finished`);
  if (wins) bits.push(`${wins} win${wins === 1 ? '' : 's'}`);
  if (pages) bits.push(`${pages} pages`);
  if (avgE) bits.push(`avg energy ${avgE}`);
  const lead = bits.length ? bits.join(', ') : `${logged} day${logged === 1 ? '' : 's'} logged`;
  const drift = open ? ` · ${open} still open` : '';
  return {
    label: 'drift',
    title: 'Weekly digest',
    body: `${lead}${drift}. Open Review.`
  };
}

exports.energyReminderScheduler = onSchedule({
  schedule: 'every 15 minutes',
  timeZone: ZONE,
  region: 'europe-west2'
}, async () => {
  const now = nowInZone();
  const users = await db.collection('users').listDocuments();
  for (const ref of users) {
    const uid = ref.id;
    try {
      const [prefsSnap, dailySnap, logSnap] = await Promise.all([
        db.doc(`users/${uid}/user_data/notification_prefs`).get(),
        db.doc(`users/${uid}/daily/${now.dateKey}`).get(),
        db.doc(`users/${uid}/notif_log/${now.dateKey}`).get()
      ]);
      if (!prefsSnap.exists) continue;
      const prefs = prefsSnap.data() || {};
      const daily = dailySnap.exists ? dailySnap.data() : null;
      const sent = logSnap.exists ? (logSnap.data() || {}) : {};

      const slots = [
        { key: 'morning', time: prefs.morning || '09:00', title: 'Morning check-in', body: 'How is your energy this morning?' },
        { key: 'midday', time: prefs.midday || '14:00', title: 'Midday check-in', body: 'Quick energy check — one tap.' },
        { key: 'evening', time: prefs.evening || '22:00', title: 'Evening check-in', body: 'How did the day land?' }
      ];

      const nowMin = hhmmToMin(now.hhmm);
      const due = [];
      for (const s of slots) {
        if (sent[s.key]) continue;
        if (nowMin < hhmmToMin(s.time)) continue;
        if (alreadyLogged(s.key, daily)) continue;
        due.push({ ...s, label: s.key });
      }

      const driftDay = prefs.drift_day === null ? null : (prefs.drift_day ?? 0);
      if (driftDay !== null && now.weekday === driftDay && !sent.drift) {
        const driftTime = prefs.drift_time || '18:00';
        if (nowMin >= hhmmToMin(driftTime)) {
          const digest = await weeklyDigest(uid, now.mondayKey);
          if (digest) due.push(digest);
        }
      }

      if (!due.length) continue;

      const tokenSnap = await db.collection(`users/${uid}/fcm_tokens`).get();
      const tokens = tokenSnap.docs.map(d => d.data().token).filter(Boolean);
      if (!tokens.length) continue;

      for (const payload of due) {
        let delivered = false;
        for (const token of tokens) {
          const res = await sendData(token, payload);
          if (res === 'dead') {
            await db.doc(`users/${uid}/fcm_tokens/${token}`).delete().catch(() => {});
          } else if (res === true) {
            delivered = true;
          }
        }
        if (delivered) {
          await db.doc(`users/${uid}/notif_log/${now.dateKey}`).set({
            [payload.label]: FieldValue.serverTimestamp()
          }, { merge: true });
        }
      }
    } catch (e) {
      console.error('user failed', uid, e.message);
    }
  }
});
