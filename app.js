(() => {
  'use strict';

  const KEY = 'clutch-lab.sessions.v1';
  const labels = {
    crosshair: 'Crosshair', positioning: 'Positioning', utility: 'Utility',
    timing: 'Timing', movement: 'Movement', comms: 'Comms'
  };
  const prompts = {
    crosshair: 'Try 10 minutes of pre-aim drills. Keep your crosshair at head height before each peek.',
    positioning: 'Review one lost duel and ask: where could I have held an easier angle?',
    utility: 'Pick one site and practice a flash or smoke that creates a safer first fight.',
    timing: 'Review when you swung. Wait for a teammate or a sound cue before your next peek.',
    movement: 'Practice stopping fully before firing. Reset your strafe between bursts.',
    comms: 'Call one clear piece of information after each contact: location, damage, or rotation.'
  };
  const $ = (id) => document.getElementById(id);
  const today = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };
  const daysAgo = (n) => {
    const date = new Date();
    date.setDate(date.getDate() - n);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };
  const demo = [
    ['Mirage', 22, 15, 10, 5, 3, 'positioning', 'Held mid too wide; try a tighter angle.', 0],
    ['Ancient', 19, 16, 8, 4, 4, 'utility', 'Forgot the flash before entering A.', 2],
    ['Inferno', 24, 14, 11, 6, 2, 'crosshair', 'Pre-aim felt better on Banana.', 4],
    ['Nuke', 16, 18, 7, 3, 5, 'timing', 'Pushed through smoke without support.', 6],
    ['Dust II', 21, 17, 9, 5, 4, 'positioning', 'Repeated the same long peek.', 8],
    ['Mirage', 18, 18, 6, 3, 4, 'movement', 'Shot while still moving.', 10],
    ['Anubis', 17, 20, 7, 2, 5, 'utility', 'Use a flash for the first contact.', 12],
    ['Inferno', 15, 19, 5, 2, 6, 'positioning', 'Standing in the open on retake.', 14]
  ].map(([map, kills, deaths, headshots, duelWins, duelLosses, reason, note, age], i) =>
    ({ id: `demo-${i}`, date: daysAgo(age), map, kills, deaths, headshots, duelWins, duelLosses, reason, note }));

  function readSaved() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(data) ? data.filter(validSession) : [];
    } catch { return []; }
  }
  function validSession(s) {
    return s && typeof s.id === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.date) &&
      typeof s.map === 'string' && Object.hasOwn(labels, s.reason) &&
      ['kills', 'deaths', 'headshots', 'duelWins', 'duelLosses'].every(k => Number.isInteger(s[k]) && s[k] >= 0);
  }
  let own = readSaved();
  let demoMode = own.length === 0;

  const form = $('session-form');
  const dialog = $('log-dialog');
  const dateField = form.elements.namedItem('date');
  dateField.max = today();
  dateField.value = today();
  $('reason-options').replaceChildren(...Object.entries(labels).map(([key, label], i) => {
    const item = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'radio'; input.name = 'reason'; input.value = key; input.required = true;
    if (i === 0) input.checked = true;
    const span = document.createElement('span'); span.textContent = label;
    item.append(input, span);
    return item;
  }));

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }
  const ratio = s => s.deaths ? s.kills / s.deaths : s.kills;
  const pct = (num, den) => den ? `${Math.round(num / den * 100)}%` : '—';
  const shortDate = date => new Date(`${date}T12:00:00`).toLocaleDateString('en', { month: 'short', day: 'numeric' });
  function sorted() { return [...(demoMode ? demo : own)].sort((a, b) => b.date.localeCompare(a.date)); }

  function render() {
    const list = sorted();
    const banner = $('mode-banner');
    banner.querySelector('strong').textContent = demoMode ? 'Demo run is live' : 'Your private practice log';
    banner.querySelector('p').textContent = demoMode
      ? 'You are viewing fictional sessions. Log your own match to start a private journal on this device.'
      : 'These sessions are stored only in this browser. Export JSON to keep a backup.';
    $('switch-mode').innerHTML = demoMode ? 'START MY LOG <span>↗</span>' : 'VIEW DEMO <span>↗</span>';
    $('period-label').textContent = `${Math.min(list.length, 8)} SESSION${list.length === 1 ? '' : 'S'} ${demoMode ? '· DEMO' : '· MY LOG'}`;
    const kills = list.reduce((n, s) => n + s.kills, 0);
    const deaths = list.reduce((n, s) => n + s.deaths, 0);
    const wins = list.reduce((n, s) => n + s.duelWins, 0);
    const losses = list.reduce((n, s) => n + s.duelLosses, 0);
    const heads = list.reduce((n, s) => n + s.headshots, 0);
    const counts = Object.fromEntries(Object.keys(labels).map(key => [key, list.filter(s => s.reason === key).length]));
    const top = Object.keys(labels).sort((a, b) => counts[b] - counts[a])[0];
    $('metric-kd').textContent = list.length ? (deaths ? kills / deaths : kills).toFixed(2) : '—';
    $('metric-duels').textContent = pct(wins, wins + losses);
    $('metric-hs').textContent = pct(heads, kills);
    $('metric-focus').textContent = list.length ? labels[top] : '—';
    $('coach-tip').textContent = list.length ? prompts[top] : 'Log a match and choose one mistake to get a focused practice prompt.';
    renderTrend(list);
    renderReasons(counts, list.length);
    renderSessions(list);
    $('export-data').disabled = own.length === 0;
    $('export-data').title = own.length ? 'Download your sessions as JSON' : 'Log a session before exporting';
  }

  function renderTrend(list) {
    const chart = $('trend-chart');
    chart.replaceChildren();
    const recent = list.slice(0, 8).reverse();
    if (!recent.length) {
      chart.append(el('p', 'empty-chart', 'Your K/D trend will appear after your first session.'));
      chart.setAttribute('aria-label', 'No session data yet');
      return;
    }
    const max = Math.max(2, ...recent.map(ratio));
    chart.setAttribute('aria-label', `K/D trend: ${recent.map(s => `${s.map} ${ratio(s).toFixed(2)}`).join(', ')}`);
    recent.forEach((s, i) => {
      const col = el('div', 'chart-col');
      const value = el('span', 'chart-value', ratio(s).toFixed(2));
      const bar = el('div', `chart-bar${i === recent.length - 1 ? ' highlight' : ''}`);
      bar.style.height = `${Math.max(5, ratio(s) / max * 135)}px`;
      bar.title = `${s.map} · ${shortDate(s.date)}: ${ratio(s).toFixed(2)} K/D`;
      col.append(value, bar, el('span', 'chart-label', s.map.slice(0, 3).toUpperCase()));
      chart.append(col);
    });
  }
  function renderReasons(counts, total) {
    const target = $('reason-list'); target.replaceChildren();
    if (!total) { target.append(el('p', 'no-reasons', 'Your practice patterns will appear here.')); return; }
    Object.keys(labels).filter(key => counts[key]).sort((a, b) => counts[b] - counts[a]).slice(0, 4).forEach(key => {
      const row = el('div', 'reason-row');
      const track = el('div', 'reason-track');
      const fill = el('div', 'reason-fill'); fill.style.width = `${counts[key] / total * 100}%`;
      track.append(fill);
      row.append(el('span', '', labels[key]), track, el('span', 'reason-count', counts[key]));
      target.append(row);
    });
  }
  function renderSessions(list) {
    const target = $('session-list'); target.replaceChildren();
    if (!list.length) {
      const empty = el('div', 'empty-state');
      empty.append(el('span', '', '✳'), el('h3', '', 'Your first match starts here.'), el('p', '', 'Log a session to see your progress and repeat patterns.'));
      target.append(empty); return;
    }
    list.forEach(s => {
      const card = el('article', 'session-card');
      const main = el('div', 'session-main');
      main.append(el('strong', '', s.map), el('p', '', `${shortDate(s.date)} · ${typeof s.note === 'string' && s.note ? s.note : 'No note added'}`));
      const stats = el('div', 'session-stats');
      [['K / D', `${s.kills} / ${s.deaths}`], ['HS %', pct(s.headshots, s.kills)], ['ENTRY W', `${s.duelWins} / ${s.duelWins + s.duelLosses}`]].forEach(([label, value]) => {
        const block = el('div'); block.append(el('b', '', value), el('small', '', label)); stats.append(block);
      });
      card.append(el('div', 'map-icon', s.map.slice(0, 1).toUpperCase()), main, stats, el('span', 'reason-tag', labels[s.reason]));
      if (!demoMode) {
        const del = el('button', 'delete-btn', '×'); del.type = 'button';
        del.setAttribute('aria-label', `Delete ${s.map} session from ${shortDate(s.date)}`);
        del.addEventListener('click', () => {
          if (!window.confirm(`Delete your ${s.map} session from ${shortDate(s.date)}?`)) return;
          const next = own.filter(item => item.id !== s.id);
          if (persist(next)) { own = next; render(); }
        });
        card.append(del);
      }
      target.append(card);
    });
  }
  function persist(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); return true; }
    catch { window.alert('Could not save to this browser. Check that local storage is enabled and try again.'); return false; }
  }
  function open() {
    form.reset(); dateField.value = today(); dateField.max = today();
    $('reason-options input').checked = true;
    $('form-error').hidden = true;
    dialog.showModal();
    dateField.focus();
  }
  $('open-log').addEventListener('click', open);
  $('open-log-2').addEventListener('click', open);
  $('close-log').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  $('switch-mode').addEventListener('click', () => { demoMode = !demoMode; render(); });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(form);
    const number = key => Number(data.get(key));
    const item = {
      id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      date: String(data.get('date')), map: String(data.get('map')),
      kills: number('kills'), deaths: number('deaths'), headshots: number('headshots'),
      duelWins: number('duelWins'), duelLosses: number('duelLosses'),
      reason: String(data.get('reason')), note: String(data.get('note')).trim()
    };
    const error = $('form-error');
    let message = '';
    if (!validSession(item) || item.date > today() || !/^[A-Za-z0-9 ]{2,30}$/.test(item.map)) message = 'Check the date, map, and match numbers.';
    else if (item.headshots > item.kills) message = 'Headshot kills cannot exceed total kills.';
    else if (item.duelWins > item.kills || item.duelLosses > item.deaths) message = 'Opening duel wins or losses exceed your match totals.';
    if (message) { error.textContent = message; error.hidden = false; return; }
    const next = [item, ...own];
    if (!persist(next)) return;
    own = next; demoMode = false; dialog.close(); render();
    $('sessions').scrollIntoView({ behavior: 'smooth' });
  });
  $('export-data').addEventListener('click', () => {
    if (!own.length) return;
    const blob = new Blob([JSON.stringify({ app: 'Clutch Lab', version: 1, exportedAt: new Date().toISOString(), sessions: own }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = `clutch-lab-${today()}.json`;
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  document.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', () => {
    document.querySelectorAll('.nav-link').forEach(item => item.classList.toggle('active', item === link));
  }));
  render();
})();
