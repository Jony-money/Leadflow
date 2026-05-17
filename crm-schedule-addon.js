/* ═══════════════════════════════════════════════════════════════════
   SCHEDULE ADDON FOR LEADFLOW CRM
   
   HOW TO USE:
   1. Put this file (crm-schedule-addon.js) next to your index.html
   2. Add this line right before </body> in your index.html:
      <script src="crm-schedule-addon.js"></script>
   3. Commit + push to GitHub Pages
   4. Done — "Schedule" appears in your sidebar
   ═══════════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  /* ─── 1. INJECT CSS ─── */
  const style = document.createElement('style');
  style.textContent = `
.sched-day-tabs{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:14px}
.sched-day-tabs button{padding:6px 14px;border-radius:20px;font-size:12.5px;font-weight:600;border:1px solid var(--border-strong);background:var(--surface);color:var(--text-secondary);cursor:pointer;font-family:inherit;transition:all .12s}
.sched-day-tabs button:hover{border-color:var(--primary);color:var(--text)}
.sched-day-tabs button.active{background:var(--primary);color:#fff;border-color:var(--primary)}
.sched-block{display:grid;grid-template-columns:80px 5px 1fr auto;gap:12px;align-items:center;padding:11px 14px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);margin-bottom:5px;transition:all .12s}
.sched-block:hover{border-color:var(--border-strong)}
.sched-block.tag-fitness{border-left:4px solid #10b981}
.sched-block.tag-personal{border-left:4px solid #8b5cf6}
.sched-block.tag-outreach{border-left:4px solid #f59e0b}
.sched-block.tag-work{border-left:4px solid #3b82f6}
.sched-block.tag-sales{border-left:4px solid #ef4444}
.sched-block.tag-break{border-left:4px solid #94a3b8}
.sched-block.tag-sleep{border-left:4px solid #1e293b;background:#f8fafc}
.sched-block.is-now{background:linear-gradient(90deg,#ecfdf5,#fff);border-color:#6ee7b7}
.sched-block.is-past{opacity:.4}
.sched-time{font-family:ui-monospace,monospace;font-size:12px;font-weight:700;color:var(--text)}
.sched-title{font-size:13.5px;font-weight:600;color:var(--text)}
.sched-duration{font-size:11px;color:var(--text-muted)}
.sched-tag-dot{width:8px;height:8px;border-radius:50%;justify-self:center}
.sched-now-pill{font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;background:var(--primary);color:#fff;padding:2px 8px;border-radius:10px;animation:schedPulse 2s ease infinite}
@keyframes schedPulse{0%,100%{opacity:1}50%{opacity:.55}}
.sched-note{font-size:10.5px;color:var(--text-muted);font-style:italic}
.sched-rules-bar{background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:1px solid #6ee7b7;border-radius:var(--radius);padding:14px 18px;margin-bottom:16px;font-size:12.5px;color:#065f46;line-height:1.65}
.sched-rules-bar strong{color:#064e3b}
.sched-now-card{background:linear-gradient(135deg,#1e293b,#334155);color:#fff;border-radius:var(--radius);padding:18px 22px;margin-bottom:16px;position:relative;overflow:hidden}
.sched-now-card::before{content:'';position:absolute;top:-30px;right:-30px;width:120px;height:120px;border-radius:50%;background:#22c55e;opacity:.07}
.sched-now-label{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#22c55e;margin-bottom:4px}
.sched-now-title{font-size:20px;font-weight:800;letter-spacing:-.02em;margin-bottom:3px}
.sched-now-time{font-family:ui-monospace,monospace;font-size:13px;color:#94a3b8}
.sched-now-next{font-size:12px;color:#94a3b8;margin-top:8px}
.sched-now-next strong{color:#cbd5e1}
.sched-now-bar{height:4px;background:rgba(255,255,255,.1);border-radius:2px;margin-top:10px;overflow:hidden}
.sched-now-fill{height:100%;background:#22c55e;border-radius:2px;transition:width 1s}
.sched-stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}
.sched-stat{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px 14px;text-align:center}
.sched-stat .v{font-size:22px;font-weight:800;color:var(--text);font-family:ui-monospace,monospace}
.sched-stat .l{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);margin-top:2px}
@media(max-width:680px){.sched-stats-grid{grid-template-columns:1fr 1fr}}
`;
  document.head.appendChild(style);

  /* ─── 2. INJECT SIDEBAR NAV ITEM ─── */
  const navLabels = document.querySelectorAll('.nav-label');
  const firstLabel = navLabels[0]; // "Overview"
  if (firstLabel) {
    const schedLabel = document.createElement('div');
    schedLabel.className = 'nav-label';
    schedLabel.textContent = 'Daily';
    const schedBtn = document.createElement('button');
    schedBtn.className = 'nav-item';
    schedBtn.dataset.page = 'schedule';
    schedBtn.innerHTML = '<span class="nav-icon">&#9201;</span>Schedule';
    schedBtn.onclick = function() { navigate('schedule'); };
    firstLabel.parentNode.insertBefore(schedBtn, firstLabel);
    firstLabel.parentNode.insertBefore(schedLabel, schedBtn);
  }

  /* ─── 3. INJECT PAGE HTML ─── */
  const mainEl = document.querySelector('.main');
  if (mainEl) {
    const page = document.createElement('div');
    page.id = 'page-schedule';
    page.className = 'page';
    page.innerHTML = `
      <div class="page-header">
        <div><h1>Daily Schedule</h1><p>Your time blocks — pushable to Google Calendar with 5-min reminders</p></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" onclick="schedCopyText()">📋 Copy as text</button>
          <a href="schedule.html" target="_blank" class="btn btn-secondary btn-sm" style="text-decoration:none">📱 Open mobile view</a>
          <button class="btn btn-primary" id="schedPushBtn2" onclick="schedPushToGCal()">📆 Push to Google Calendar</button>
        </div>
      </div>
      <div class="page-body">
        <div id="schedNowCard2" class="sched-now-card" style="display:none">
          <div class="sched-now-label">RIGHT NOW</div>
          <div class="sched-now-title" id="schedNowTitle2">—</div>
          <div class="sched-now-time" id="schedNowTime2">—</div>
          <div class="sched-now-next" id="schedNowNext2"></div>
          <div class="sched-now-bar"><div class="sched-now-fill" id="schedNowBar2"></div></div>
        </div>
        <div class="sched-rules-bar">
          <strong>⚡ Hard rules:</strong> Lights out 22:00 · 7-hour sleep floor · 30+ min movement · Read the Word · Real meal no screens · Phone OUT of bedroom · No Sunday client work
        </div>
        <div id="schedStats2" class="sched-stats-grid"></div>
        <div class="sched-day-tabs" id="schedTabs2"></div>
        <div id="schedBlocks2"></div>
        <div style="margin-top:18px;padding:14px 18px;background:#f9fafb;border:1px solid var(--border);border-radius:var(--radius);font-size:12px;color:var(--text-secondary);line-height:1.6">
          <strong>How notifications work:</strong> "Push to Google Calendar" creates recurring weekly events with a 5-minute popup reminder before each block.
          Your phone's Google Calendar app pings you automatically. Re-push whenever you edit the schedule code.
          <br/><br/><strong>Mobile app:</strong> Open <code>schedule.html</code> on your phone → Share → Add to Home Screen. It reads the same Google auth from localStorage.
        </div>
      </div>
    `;
    mainEl.appendChild(page);
  }

  /* ─── 4. SCHEDULE DATA ─── */
  const SCHED = {
    weekday: [
      { start:'05:00', end:'05:05', title:'Wake + hydrate', tag:'personal' },
      { start:'05:05', end:'05:35', title:'Calisthenics (PPL/Core)', tag:'fitness' },
      { start:'05:35', end:'05:55', title:'Shower', tag:'personal' },
      { start:'05:55', end:'06:15', title:'Word + coffee', tag:'personal' },
      { start:'06:15', end:'06:45', title:'Breakfast (real meal)', tag:'personal' },
      { start:'06:45', end:'08:15', title:'Builder Outreach', tag:'outreach', note:'Their prime window' },
      { start:'08:15', end:'08:25', title:'Stretch / step outside', tag:'break' },
      { start:'08:25', end:'09:30', title:'Build block', tag:'work' },
      { start:'09:30', end:'09:45', title:'Prep for sales calls', tag:'break' },
      { start:'09:45', end:'12:00', title:'Sales Meetings', tag:'sales' },
      { start:'12:00', end:'12:45', title:'Lunch — no screens', tag:'personal' },
      { start:'12:45', end:'13:00', title:'DM check (15 min cap)', tag:'outreach' },
      { start:'13:00', end:'15:00', title:'Build block', tag:'work' },
      { start:'15:00', end:'15:15', title:'Break — snack, sun, walk', tag:'break' },
      { start:'15:15', end:'17:00', title:'Build / content / follow-ups', tag:'work' },
      { start:'17:00', end:'18:30', title:'Detailer Outreach', tag:'outreach', note:'Their prime window' },
      { start:'18:30', end:'19:30', title:'Wrap + pipeline review', tag:'work' },
      { start:'19:30', end:'20:00', title:'Dinner', tag:'personal' },
      { start:'20:00', end:'21:15', title:'Personal — family / friends', tag:'personal' },
      { start:'21:15', end:'21:45', title:'Shutdown — phone OUT', tag:'personal' },
      { start:'21:45', end:'22:00', title:'Read / wind down', tag:'sleep' },
      { start:'22:00', end:'05:00', title:'LIGHTS OUT', tag:'sleep' },
    ],
    weekdayRun: null,
    friday: [
      { start:'05:00', end:'05:05', title:'Wake + hydrate', tag:'personal' },
      { start:'05:05', end:'06:30', title:'Gym — Push', tag:'fitness' },
      { start:'06:30', end:'06:50', title:'Shower', tag:'personal' },
      { start:'06:50', end:'07:20', title:'Breakfast + Word + coffee', tag:'personal' },
      { start:'07:20', end:'09:30', title:'Build / outreach', tag:'work' },
      { start:'09:30', end:'09:45', title:'Prep', tag:'break' },
      { start:'09:45', end:'12:00', title:'Sales Meetings', tag:'sales' },
      { start:'12:00', end:'13:00', title:'Lunch — no screens', tag:'personal' },
      { start:'13:00', end:'14:45', title:'Build / outreach', tag:'work' },
      { start:'14:45', end:'17:30', title:'Wrap + reporting + Fri sales', tag:'sales' },
      { start:'17:30', end:'18:30', title:'Next-week planning', tag:'work' },
      { start:'18:30', end:'19:30', title:'Dinner', tag:'personal' },
      { start:'19:30', end:'23:00', title:'OFF — go out', tag:'personal' },
    ],
    saturday: [
      { start:'06:00', end:'06:05', title:'Wake', tag:'personal' },
      { start:'06:05', end:'07:30', title:'Gym — Legs', tag:'fitness' },
      { start:'07:30', end:'08:15', title:'Shower + big breakfast', tag:'personal' },
      { start:'08:15', end:'12:00', title:'Catch-up (admin, learning)', tag:'work' },
      { start:'12:00', end:'13:00', title:'Lunch', tag:'personal' },
      { start:'13:00', end:'21:30', title:'OFF — recharge', tag:'personal' },
      { start:'21:30', end:'22:00', title:'Plan the week', tag:'personal' },
    ],
    sunday: [
      { start:'06:00', end:'06:05', title:'Wake', tag:'personal' },
      { start:'06:05', end:'07:00', title:'Gym — Pull', tag:'fitness' },
      { start:'07:00', end:'08:00', title:'Extended Word', tag:'personal' },
      { start:'08:00', end:'09:00', title:'Breakfast + slow morning', tag:'personal' },
      { start:'09:00', end:'12:00', title:'Family / personal', tag:'personal' },
      { start:'12:00', end:'13:30', title:'Long run + recovery', tag:'fitness' },
      { start:'13:30', end:'21:30', title:'Family — NO client work', tag:'personal' },
      { start:'21:30', end:'22:00', title:'Shutdown + plan Monday', tag:'personal' },
    ],
  };
  // Build Tue/Thu (run day)
  SCHED.weekdayRun = SCHED.weekday.filter(b => !(b.start >= '12:00' && b.end <= '13:00')).concat([
    { start:'12:00', end:'12:35', title:'Mid-day run', tag:'fitness' },
    { start:'12:35', end:'13:00', title:'Quick lunch + shower', tag:'personal' },
  ]).sort((a,b) => a.start.localeCompare(b.start));

  const SCHED_DAY_MAP = [
    { dow:1, label:'Mon', type:'weekday',     byday:'MO' },
    { dow:2, label:'Tue', type:'weekdayRun',  byday:'TU' },
    { dow:3, label:'Wed', type:'weekday',     byday:'WE' },
    { dow:4, label:'Thu', type:'weekdayRun',  byday:'TH' },
    { dow:5, label:'Fri', type:'friday',      byday:'FR' },
    { dow:6, label:'Sat', type:'saturday',    byday:'SA' },
    { dow:0, label:'Sun', type:'sunday',      byday:'SU' },
  ];

  let schedDow = new Date().getDay();
  const TAG_COLORS = { fitness:'#10b981', personal:'#8b5cf6', outreach:'#f59e0b', work:'#3b82f6', sales:'#ef4444', break:'#94a3b8', sleep:'#1e293b' };

  /* ─── 5. RENDER FUNCTIONS ─── */
  function _tm(t) { const [h,m] = t.split(':').map(Number); return h*60 + m; }
  function _fmt(t) { const [h,m] = t.split(':'); const hr = parseInt(h); return `${hr>12?hr-12:hr||12}:${m} ${hr>=12?'PM':'AM'}`; }

  window.renderSchedulePage = function() {
    const entry = SCHED_DAY_MAP.find(d => d.dow === schedDow);
    const blocks = SCHED[entry.type];
    const now = new Date();
    const isToday = schedDow === now.getDay();
    const nowMin = now.getHours()*60 + now.getMinutes();

    // Tabs
    const todayDow = now.getDay();
    document.getElementById('schedTabs2').innerHTML = SCHED_DAY_MAP.map(d =>
      `<button class="${d.dow === schedDow ? 'active' : ''}" onclick="schedDow=${d.dow};renderSchedulePage()">${d.label}${d.dow === todayDow ? ' •' : ''}</button>`
    ).join('');
    // Make schedDow accessible
    window.schedDow = schedDow;

    // Stats
    const moveMins = blocks.filter(b => b.tag === 'fitness').reduce((s,b) => { const e = b.end < b.start ? 24*60 : _tm(b.end); return s + e - _tm(b.start); }, 0);
    const remaining = isToday ? blocks.filter(b => _tm(b.start) > nowMin && b.tag !== 'sleep').length : blocks.filter(b => b.tag !== 'sleep').length;
    const outMins = blocks.filter(b => b.tag === 'outreach').reduce((s,b) => s + _tm(b.end) - _tm(b.start), 0);
    const workMins = blocks.filter(b => b.tag === 'work' || b.tag === 'sales').reduce((s,b) => s + _tm(b.end) - _tm(b.start), 0);
    document.getElementById('schedStats2').innerHTML = `
      <div class="sched-stat"><div class="v">${remaining}</div><div class="l">Blocks left</div></div>
      <div class="sched-stat"><div class="v">${moveMins}m</div><div class="l">Movement</div></div>
      <div class="sched-stat"><div class="v">${outMins}m</div><div class="l">Outreach</div></div>
      <div class="sched-stat"><div class="v">${Math.round(workMins/60)}h</div><div class="l">Deep work</div></div>
    `;

    // Now card
    if (isToday) {
      let current = null, next = null;
      for (let i = 0; i < blocks.length; i++) {
        const sMin = _tm(blocks[i].start);
        const eMin = blocks[i].end < blocks[i].start ? 24*60 : _tm(blocks[i].end);
        if (nowMin >= sMin && nowMin < eMin) {
          current = blocks[i]; if (i+1 < blocks.length) next = blocks[i+1];
          const pct = Math.round(((nowMin - sMin) / (eMin - sMin)) * 100);
          document.getElementById('schedNowBar2').style.width = pct + '%';
          document.getElementById('schedNowTime2').textContent = `${blocks[i].start} → ${blocks[i].end} · ${eMin - nowMin}m remaining`;
          break;
        }
      }
      if (current) {
        document.getElementById('schedNowCard2').style.display = '';
        document.getElementById('schedNowTitle2').textContent = current.title;
        document.getElementById('schedNowNext2').innerHTML = next ? `Up next: <strong>${esc(next.title)}</strong> at ${_fmt(next.start)}` : '';
      } else {
        document.getElementById('schedNowCard2').style.display = 'none';
      }
    } else {
      document.getElementById('schedNowCard2').style.display = 'none';
    }

    // Blocks
    const displayBlocks = blocks.filter(b => !(b.tag === 'sleep' && b.end < b.start));
    document.getElementById('schedBlocks2').innerHTML = displayBlocks.map(b => {
      const sMin = _tm(b.start);
      const eMin = b.end < b.start ? 24*60 : _tm(b.end);
      const dur = eMin - sMin;
      const isNow = isToday && nowMin >= sMin && nowMin < eMin;
      const isPast = isToday && nowMin >= eMin;
      const cls = isNow ? 'is-now' : isPast ? 'is-past' : '';
      const durStr = dur >= 60 ? Math.floor(dur/60) + 'h' + (dur%60 ? ' ' + dur%60 + 'm' : '') : dur + 'm';
      return `<div class="sched-block tag-${b.tag} ${cls}">
        <div class="sched-time">${b.start} – ${b.end}</div>
        <div class="sched-tag-dot" style="background:${TAG_COLORS[b.tag]||'#94a3b8'}"></div>
        <div class="sched-title">${esc(b.title)}${b.note ? ' <span class="sched-note">(' + esc(b.note) + ')</span>' : ''}${isNow ? ' <span class="sched-now-pill">NOW</span>' : ''}</div>
        <div class="sched-duration">${durStr}</div>
      </div>`;
    }).join('');
  };

  window.schedCopyText = function() {
    const entry = SCHED_DAY_MAP.find(d => d.dow === schedDow);
    const blocks = SCHED[entry.type];
    const text = `${entry.label} Schedule\n` + blocks.map(b => `${b.start}–${b.end}  ${b.title}`).join('\n');
    navigator.clipboard.writeText(text).then(() => toast('Schedule copied'));
  };

  /* ─── 6. GOOGLE CALENDAR PUSH ─── */
  window.schedPushToGCal = async function() {
    if (!gToken) { toast('Connect Google first (sidebar)', 3000, 'err'); return; }
    if (!confirm('Replace all schedule events in Google Calendar?')) return;
    const btn = document.getElementById('schedPushBtn2');
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Pushing…';
    try {
      const removed = await _schedDeleteOld();
      let created = 0;
      for (const dayEntry of SCHED_DAY_MAP) {
        const blocks = SCHED[dayEntry.type].filter(b => !(b.tag === 'sleep' && b.end < b.start));
        for (const b of blocks) {
          if (b.start === b.end) continue;
          try { await _schedCreateEvent(b, dayEntry.byday); created++; await delay(200); }
          catch(e) { console.warn('Failed:', dayEntry.label, b.title, e); }
        }
      }
      toast(removed + ' removed, ' + created + ' created', 4000, 'ok');
      if (typeof refreshGcalAvailability === 'function') refreshGcalAvailability(true);
    } catch(e) { toast('Push failed: ' + e.message, 4000, 'err'); }
    finally { btn.disabled = false; btn.textContent = '📆 Push to Google Calendar'; }
  };

  async function _schedDeleteOld() {
    const tok = await ensureToken();
    let count = 0, pt = null;
    do {
      const p = new URLSearchParams({ privateExtendedProperty:'zSchedule=true', maxResults:'250', showDeleted:'false' });
      if (pt) p.set('pageToken', pt);
      const r = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?' + p, { headers:{ 'Authorization':'Bearer ' + tok } });
      if (!r.ok) break;
      const data = await r.json();
      for (const ev of (data.items || [])) {
        try { await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events/' + ev.id, { method:'DELETE', headers:{'Authorization':'Bearer '+tok} }); count++; await delay(60); } catch(e) {}
      }
      pt = data.nextPageToken;
    } while (pt);
    return count;
  }

  async function _schedCreateEvent(block, byday) {
    const tok = await ensureToken();
    const today = new Date(); today.setHours(0,0,0,0);
    const [sh,sm] = block.start.split(':').map(Number);
    const [eh,em] = block.end.split(':').map(Number);
    const start = new Date(today); start.setHours(sh,sm,0,0);
    const end = new Date(today); end.setHours(eh,em,0,0);
    const COLOR = { fitness:'10', personal:'1', outreach:'6', work:'9', sales:'11', break:'8', sleep:'8' };
    const body = {
      summary: block.title,
      description: 'Managed by Zelaya Schedule. Re-push to update.',
      start:{ dateTime:start.toISOString(), timeZone:tz() },
      end:{ dateTime:end.toISOString(), timeZone:tz() },
      recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=' + byday],
      reminders:{ useDefault:false, overrides:[{ method:'popup', minutes:5 }] },
      extendedProperties:{ private:{ zSchedule:'true' } },
      colorId: COLOR[block.tag] || '1',
      transparency: (block.tag === 'personal' || block.tag === 'break' || block.tag === 'sleep') ? 'transparent' : 'opaque',
    };
    const r = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method:'POST', headers:{ 'Authorization':'Bearer '+tok, 'Content-Type':'application/json' },
      body: JSON.stringify(body)
    });
    if (!r.ok) { const e = await r.json().catch(()=>({})); throw new Error(e.error?.message || 'Error '+r.status); }
  }

  /* ─── 7. HOOK INTO NAVIGATE ─── */
  const _prevNav = window.navigate;
  window.navigate = function(id) {
    _prevNav(id);
    if (id === 'schedule') renderSchedulePage();
  };

  // Auto-update current block every 30 sec
  setInterval(function() {
    if (document.getElementById('page-schedule') && document.getElementById('page-schedule').classList.contains('active')) {
      renderSchedulePage();
    }
  }, 30000);

})();
