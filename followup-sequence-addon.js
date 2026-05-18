/* ═══════════════════════════════════════════════════════════════════
   FOLLOW-UP SEQUENCE ADDON FOR LEADFLOW CRM
   Based on the EXEC Follow-Up Sequence (Booked → Show)
   
   HOW TO USE:
   1. Put this file next to your index.html
   2. Add AFTER the schedule addon in your index.html (before </body>):
      <script src="followup-sequence-addon.js"></script>
   3. Commit + push
   
   What it does:
   - Replaces the basic 3-reminder system with a full 7-touch sequence
   - Adds 6 new email templates (Touch 1-7 + No-Show Recovery)
   - Auto-creates properly-timed tasks for each touch when you book
   - Adds no-show recovery flow to the outcome system
   - Smart compression for same-day / next-day bookings
   ═══════════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  /* ─── 1. ADD FOLLOW-UP EMAIL TEMPLATES ─── */
  var FOLLOWUP_TEMPLATES = {
    touch1_confirm: {
      label: 'Touch 1 — Booking Confirmation',
      subject: "You're booked! {time} with {myName} — read this first",
      body: "Hey {client},\n\nLocked in. Here's everything you need:\n\n\uD83D\uDCC5 {date}\n\uD83D\uDD17 Zoom link: [paste your Zoom link]{meetLinkLine}\n\u23F1\uFE0F 30 minutes\n\nQUICK ASK: Before our call, reply to this email with one sentence \u2014 \"What does success from this call look like for you?\"\n\nThe reason: I want to bring my best thinking to your situation, not a generic pitch. Your answer shapes what I prep.\n\nTalk soon,\n{signature}\n\nP.S. Add this to your calendar now (invite attached). Most missed appointments come from people who don't calendar-block within an hour of booking."
    },
    touch2_value: {
      label: 'Touch 2 — Value Delivery (24h after booking)',
      subject: 'One thing to think about before {date}',
      body: "Hey {client},\n\nI was looking at {company} and thought of something you might want to consider before our call.\n\n[INSERT ONE SPECIFIC INSIGHT \u2014 pick the one that fits best:]\n\n- \"Most {company}-type businesses I see are leaving 20-30% of leads on the table because they don't have a system to follow up within 5 minutes. Worth checking if this applies to you.\"\n\n- \"Looked at your Google Business Profile \u2014 you're missing [specific thing] which is probably costing you [specific outcome].\"\n\n- \"Quick question to discuss on our call: when's the last time you got a lead from somewhere OTHER than word-of-mouth?\"\n\nNot homework. Just something to chew on before we connect.\n\nSee you {date}!\n\u2014 {myName}"
    },
    touch3_asset: {
      label: 'Touch 3 — Pre-Call Asset (48h before)',
      subject: 'Quick thing for our call',
      body: "Hey {client},\n\nCouple days out. Wanted to share something that'll make our 30 minutes way more useful.\n\nI made a 1-page \"growth audit framework\" for businesses like {company}. It's the same framework I use to identify the biggest opportunity in 10 minutes flat.\n\n[LINK TO YOUR GOOGLE DOC/PDF]\n\nQuick ask: spend 5 min filling out the first section before our call. Lets us skip small talk and get to what matters.\n\n(No stress if you don't have time \u2014 we'll do it live. But pre-filling saves us 10 min of discovery.)\n\nSee you {date} at {time}.\n\u2014 {myName}"
    },
    touch4_24h: {
      label: 'Touch 4 — 24-Hour Confirmation',
      subject: 'Tomorrow at {time}',
      body: "Hey {client},\n\nQuick reminder \u2014 we're on tomorrow at {time}.{meetLinkLine}\n\nLooking forward to digging into what we discussed. I've blocked off an hour after our call in case we want to keep going deep.\n\nOne last thing: if anything's come up and you can't make it, reply to this email. I'll prioritize someone else for that slot. Way better than no-showing \u2014 clients who reschedule respectfully always get priority over new bookings.\n\nSee you tomorrow.\n{signature}"
    },
    touch5_dayof: {
      label: 'Touch 5 — Day-Of Reminder (3-4h before)',
      subject: 'Talking in a few hours',
      body: "Hey {client} \u2014 talking in a few hours at {time}.{meetLinkLine}\n\nLooking forward to it.\n\n\u2014 {myName}"
    },
    touch6_imhere: {
      label: 'Touch 6 — I\'m Here (15 min before)',
      subject: 'Hopping in now',
      body: "Hopping into our Zoom now. See you in there.{meetLinkLine}\n\n\u2014 {myName}"
    },
    touch7_late: {
      label: 'Touch 7 — 5 Min Late Recovery',
      subject: 'At the Zoom whenever you\'re ready',
      body: "Hey {client} \u2014 at the Zoom whenever you're ready.{meetLinkLine}\n\nTech issues happen, just let me know if you need to reschedule.\n\n\u2014 {myName}"
    },
    noshow_recovery: {
      label: 'No-Show Recovery (24h after)',
      subject: 'Missed you yesterday',
      body: "Hey {client},\n\nHopped on our Zoom yesterday but didn't see you. No worries \u2014 life happens.\n\nIf you're still interested, here's my calendar to rebook: [YOUR BOOKING LINK]\n\nQuick note: I usually only reschedule once. Past that I assume timing wasn't right and stop reaching out. Not trying to be harsh \u2014 just respect both our time.\n\nIf you're out, just reply \"not now\" and we're good. No hard feelings.\n\n\u2014 {myName}"
    },
    noshow_rebooked: {
      label: 'No-Show Rebooked',
      subject: 'Glad we got it rebooked',
      body: "Hey {client},\n\nQuick note \u2014 glad we got you back on the calendar. Couple things:\n\n1. The new time ({date} at {time}) \u2014 please calendar-block it now if you haven't\n2. I'll send the standard reminders, but if there's a better way to reach you (text vs email) let me know\n\nThat's it. Talk to you {date}.\n\n\u2014 {myName}"
    },
    touch_longwait: {
      label: 'Long Wait Check-In (7+ days out)',
      subject: 'Quick update before our call',
      body: "Hey {client},\n\nHalfway between booking and our call on {date}. Wanted to share something.\n\n[INSERT: A case study, industry insight, or relevant news for {company}]\n\nSee you on {date}.\n\n\u2014 {myName}"
    }
  };

  // Inject templates into the existing template system
  if (typeof DEFAULT_TEMPLATES !== 'undefined') {
    Object.keys(FOLLOWUP_TEMPLATES).forEach(function(key) {
      DEFAULT_TEMPLATES[key] = FOLLOWUP_TEMPLATES[key];
    });
  }

  // Add to template dropdown options
  var emTemplateSelect = document.getElementById('emTemplate');
  if (emTemplateSelect) {
    var optgroup = document.createElement('optgroup');
    optgroup.label = '7-Touch Follow-Up Sequence';
    Object.keys(FOLLOWUP_TEMPLATES).forEach(function(key) {
      var opt = document.createElement('option');
      opt.value = key;
      opt.textContent = FOLLOWUP_TEMPLATES[key].label;
      optgroup.appendChild(opt);
    });
    emTemplateSelect.appendChild(optgroup);
  }

  // Also add to the template list page sidebar
  if (typeof TEMPLATE_LIST !== 'undefined') {
    Object.keys(FOLLOWUP_TEMPLATES).forEach(function(key) {
      TEMPLATE_LIST.push({ id: key, cat: 'Follow-Up Sequence' });
    });
  }

  /* ─── 2. HELPER: compute task dates for the 7-touch sequence ─── */
  function computeTouchDates(bookingTime, apptDateISO, apptTimeStr) {
    var apptDateTime = new Date(apptDateISO + 'T' + (apptTimeStr || '00:00'));
    var now = new Date();
    var hoursUntilCall = (apptDateTime - now) / 3600000;
    var bookTs = bookingTime || Date.now();

    var touches = [];

    // Calculate dates
    var tomorrow = new Date(bookTs + 24 * 3600000).toISOString().slice(0, 10);
    var twoDaysBefore = new Date(apptDateTime.getTime() - 2 * 86400000).toISOString().slice(0, 10);
    var oneDayBefore = new Date(apptDateTime.getTime() - 86400000).toISOString().slice(0, 10);
    var callDay = apptDateISO;
    var todayISO = new Date().toISOString().slice(0, 10);

    // Halfway point for long waits (7+ days)
    var halfwayMs = bookTs + (apptDateTime.getTime() - bookTs) / 2;
    var halfwayDate = new Date(halfwayMs).toISOString().slice(0, 10);

    if (hoursUntilCall > 168) {
      // 7+ days out — FULL sequence + long wait check-in
      touches.push({
        title: 'TOUCH 2: Send value delivery email',
        detail: 'Research their business. Send ONE specific insight. Not a pitch — genuine value.',
        dueDate: tomorrow,
        priority: 'medium',
        template: 'touch2_value',
        source: 'auto-touch2'
      });
      touches.push({
        title: 'TOUCH (LONG WAIT): Mid-wait check-in email',
        detail: 'They booked 7+ days out. Send a case study or industry insight to stay top-of-mind.',
        dueDate: halfwayDate,
        priority: 'low',
        template: 'touch_longwait',
        source: 'auto-touch-longwait'
      });
      touches.push({
        title: 'TOUCH 3: Send pre-call asset / growth audit framework',
        detail: '1-page framework doc. Ask them to fill out first section (5 min). Those who fill it show up 95%+.',
        dueDate: twoDaysBefore,
        priority: 'medium',
        template: 'touch3_asset',
        source: 'auto-touch3'
      });
      touches.push({
        title: 'TOUCH 4: Send 24-hour confirmation',
        detail: '"Blocked off an hour after" = perceived value. Offer easy reschedule path (kills ghosting).',
        dueDate: oneDayBefore,
        priority: 'high',
        template: 'touch4_24h',
        source: 'auto-touch4'
      });
      touches.push({
        title: 'TOUCH 5: Day-of reminder (3-4h before call)',
        detail: 'Short = high status. Include Zoom link. SMS if possible.',
        dueDate: callDay,
        priority: 'high',
        template: 'touch5_dayof',
        source: 'auto-touch5'
      });
      touches.push({
        title: 'TOUCH 6: "I\'m here" signal (15 min before)',
        detail: 'Signals you\'re ready and waiting. Loss aversion — they don\'t want to keep you waiting.',
        dueDate: callDay,
        priority: 'high',
        template: 'touch6_imhere',
        source: 'auto-touch6'
      });
      touches.push({
        title: 'TOUCH 7: Late recovery (if no-show, 5 min after)',
        detail: 'Don\'t shame. Offer grace. "Tech issues happen." Only send if they don\'t show.',
        dueDate: callDay,
        priority: 'high',
        template: 'touch7_late',
        source: 'auto-touch7'
      });

    } else if (hoursUntilCall > 48) {
      // 2-7 days out — skip long wait, keep rest
      touches.push({
        title: 'TOUCH 2: Send value delivery email',
        detail: 'Research their business. Send ONE specific insight.',
        dueDate: tomorrow > twoDaysBefore ? todayISO : tomorrow,
        priority: 'medium',
        template: 'touch2_value',
        source: 'auto-touch2'
      });
      touches.push({
        title: 'TOUCH 3: Send pre-call asset (growth audit framework)',
        detail: '1-page framework. Ask them to fill first section.',
        dueDate: twoDaysBefore,
        priority: 'medium',
        template: 'touch3_asset',
        source: 'auto-touch3'
      });
      touches.push({
        title: 'TOUCH 4: Send 24-hour confirmation',
        detail: '"Blocked off an hour after." Offer easy reschedule path.',
        dueDate: oneDayBefore,
        priority: 'high',
        template: 'touch4_24h',
        source: 'auto-touch4'
      });
      touches.push({
        title: 'TOUCH 5: Day-of reminder (3-4h before)',
        detail: 'Short. Include Zoom link.',
        dueDate: callDay,
        priority: 'high',
        template: 'touch5_dayof',
        source: 'auto-touch5'
      });
      touches.push({
        title: 'TOUCH 6: "I\'m here" (15 min before)',
        detail: 'Send Zoom link. Signal readiness.',
        dueDate: callDay,
        priority: 'high',
        template: 'touch6_imhere',
        source: 'auto-touch6'
      });
      touches.push({
        title: 'TOUCH 7: Late recovery (if no-show)',
        detail: 'Wait 5 min. Don\'t shame. Offer reschedule.',
        dueDate: callDay,
        priority: 'high',
        template: 'touch7_late',
        source: 'auto-touch7'
      });

    } else if (hoursUntilCall > 24) {
      // 24-48 hours — compressed: skip Touch 3
      touches.push({
        title: 'TOUCH 2: Send value delivery email (2-3h after booking)',
        detail: 'Compressed sequence. Send insight today.',
        dueDate: todayISO,
        priority: 'high',
        template: 'touch2_value',
        source: 'auto-touch2'
      });
      touches.push({
        title: 'TOUCH 4: Send 24-hour confirmation',
        detail: 'Confirmation + easy reschedule path.',
        dueDate: oneDayBefore > todayISO ? oneDayBefore : todayISO,
        priority: 'high',
        template: 'touch4_24h',
        source: 'auto-touch4'
      });
      touches.push({
        title: 'TOUCH 5: Day-of reminder (3-4h before)',
        detail: 'Short. Zoom link.',
        dueDate: callDay,
        priority: 'high',
        template: 'touch5_dayof',
        source: 'auto-touch5'
      });
      touches.push({
        title: 'TOUCH 6: "I\'m here" (15 min before)',
        detail: 'Zoom link at moment of need.',
        dueDate: callDay,
        priority: 'high',
        template: 'touch6_imhere',
        source: 'auto-touch6'
      });
      touches.push({
        title: 'TOUCH 7: Late recovery (if no-show)',
        detail: 'Wait 5 min after scheduled time.',
        dueDate: callDay,
        priority: 'high',
        template: 'touch7_late',
        source: 'auto-touch7'
      });

    } else {
      // Same-day — ultra compressed
      touches.push({
        title: 'TOUCH 5: Day-of reminder (3h before)',
        detail: 'Short. Zoom link.',
        dueDate: callDay,
        priority: 'high',
        template: 'touch5_dayof',
        source: 'auto-touch5'
      });
      touches.push({
        title: 'TOUCH 6: "I\'m here" (15 min before)',
        detail: 'Send Zoom link.',
        dueDate: callDay,
        priority: 'high',
        template: 'touch6_imhere',
        source: 'auto-touch6'
      });
      touches.push({
        title: 'TOUCH 7: Late recovery (if no-show)',
        detail: 'Wait 5 min.',
        dueDate: callDay,
        priority: 'high',
        template: 'touch7_late',
        source: 'auto-touch7'
      });
    }

    return touches;
  }

  /* ─── 3. WRAP saveAppt TO ADD 7-TOUCH TASKS ─── */
  var _origSaveAppt = window.saveAppt;
  if (typeof _origSaveAppt === 'function') {
    window.saveAppt = async function() {
      // Capture state before save
      var wasEditing = !!editingApptId;

      // Run original saveAppt
      await _origSaveAppt.apply(this, arguments);

      // After save: if this was a NEW appointment (not editing), add the touch sequence
      if (!wasEditing && appts.length > 0) {
        var newAppt = appts[0]; // most recently added (unshifted to front)
        if (!newAppt || !newAppt.date) return;

        // Remove the old auto-reminder tasks that the original code created
        // (we're replacing them with our 7-touch sequence)
        var oldSources = ['auto-reminder7', 'auto-reminder24', 'auto-reminder1h'];
        tasks = tasks.filter(function(t) {
          return !(t.apptId === newAppt.id && oldSources.indexOf(t.source) >= 0);
        });
        persistTasks();

        // Create the 7-touch sequence tasks
        var touches = computeTouchDates(Date.now(), newAppt.date, newAppt.time);
        var clientName = newAppt.client || 'client';
        touches.forEach(function(touch) {
          addTask({
            title: clientName + ' \u2014 ' + touch.title,
            priority: touch.priority,
            dueDate: touch.dueDate,
            apptId: newAppt.id,
            leadId: newAppt.leadId || null,
            source: touch.source,
            notes: touch.detail + '\n\nTemplate: ' + (touch.template || 'custom')
          });
        });

        // Log it
        logActivity('meeting', '7-touch sequence created for ' + clientName, touches.length + ' follow-up tasks scheduled');
        toast('7-touch follow-up sequence created (' + touches.length + ' tasks)', 3500, 'ok');

        // Refresh UI
        if (typeof renderTasks === 'function') renderTasks();
        if (typeof updateBadges === 'function') updateBadges();
      }
    };
  }

  /* ─── 4. WRAP setOutcome TO ADD NO-SHOW RECOVERY ─── */
  var _origSetOutcome = window.setOutcome;
  if (typeof _origSetOutcome === 'function') {
    window.setOutcome = function(kind) {
      // Get appointment info BEFORE calling original (which closes modal)
      var apptId = outcomeApptId;
      var appt = appts.find(function(a) { return a.id === apptId; });

      // Run original
      _origSetOutcome.apply(this, arguments);

      // If outcome is "lost" (no-show), add recovery sequence
      if (kind === 'lost' && appt) {
        var clientName = appt.client || 'client';
        var recoveryDate = new Date(Date.now() + 24 * 3600000).toISOString().slice(0, 10);

        addTask({
          title: clientName + ' \u2014 NO-SHOW RECOVERY: Send recovery email (24h after)',
          priority: 'high',
          dueDate: recoveryDate,
          apptId: appt.id,
          leadId: appt.leadId || null,
          source: 'auto-noshow-recovery',
          notes: 'Send the "Missed you yesterday" email. Template: noshow_recovery\n\n'
            + 'Key points:\n'
            + '- Don\'t shame them\n'
            + '- "I usually only reschedule once" = boundary + status\n'
            + '- "Reply not now" = safe out that paradoxically increases rebooks\n'
            + '- 60-70% of no-shows who get this email will rebook'
        });

        // Also mark old Touch tasks as done (they're no longer relevant)
        tasks.forEach(function(t) {
          if (t.apptId === appt.id && !t.done && t.source && t.source.indexOf('auto-touch') === 0) {
            t.done = true;
          }
        });
        persistTasks();

        logActivity('meeting', 'No-show recovery scheduled for ' + clientName, 'Recovery email task due ' + recoveryDate);
        toast('No-show recovery task created for ' + clientName, 3000, 'ok');

        if (typeof renderTasks === 'function') renderTasks();
        if (typeof updateBadges === 'function') updateBadges();
      }
    };
  }

  /* ─── 5. ADD SEQUENCE INDICATOR TO APPOINTMENT CARDS ─── */
  // Inject CSS for the sequence badge
  var style = document.createElement('style');
  style.textContent = [
    '.seq-badge{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:14px;font-size:10.5px;font-weight:700;letter-spacing:.04em;background:linear-gradient(135deg,#dbeafe,#ede9fe);color:#4338ca;border:1px solid #c7d2fe}',
    '.seq-badge .seq-count{background:#4338ca;color:#fff;font-size:9px;padding:1px 5px;border-radius:8px}',
    '.seq-progress{display:flex;gap:3px;margin-top:6px}',
    '.seq-dot{width:8px;height:8px;border-radius:50%;background:#e2e8f0;transition:background .2s}',
    '.seq-dot.done{background:#22c55e}',
    '.seq-dot.current{background:#3b82f6;box-shadow:0 0 0 2px rgba(59,130,246,.3)}',
    '.seq-dot.upcoming{background:#e2e8f0}',
  ].join('\n');
  document.head.appendChild(style);

  // Wrap renderAppts to add sequence info to appointment cards
  var _origRenderAppts = window.renderAppts;
  if (typeof _origRenderAppts === 'function') {
    window.renderAppts = function() {
      _origRenderAppts.apply(this, arguments);

      // After render, inject sequence badges into appointment cards
      appts.forEach(function(appt) {
        var touchTasks = tasks.filter(function(t) {
          return t.apptId === appt.id && t.source && t.source.indexOf('auto-touch') === 0;
        });
        if (!touchTasks.length) return;

        var done = touchTasks.filter(function(t) { return t.done; }).length;
        var total = touchTasks.length;

        // Find the appointment card and inject the badge
        // Look for elements containing this appointment's client name
        var cards = document.querySelectorAll('.apt-card');
        cards.forEach(function(card) {
          var clientEl = card.querySelector('.apt-client');
          if (clientEl && clientEl.textContent.indexOf(appt.client) >= 0) {
            // Check if badge already added
            if (card.querySelector('.seq-badge')) return;

            var badge = document.createElement('span');
            badge.className = 'seq-badge';
            badge.innerHTML = '\u2728 Follow-Up <span class="seq-count">' + done + '/' + total + '</span>';
            badge.title = done + ' of ' + total + ' touches completed';

            // Add after the existing badges
            var headDiv = card.querySelector('.apt-head');
            if (headDiv) {
              var badgeContainer = headDiv.querySelector('div:last-child') || headDiv;
              badgeContainer.appendChild(badge);
            }
          }
        });
      });
    };
  }

  /* ─── 6. LOG ─── */
  console.log('[LeadFlow] Follow-up sequence addon loaded. 7-touch templates + auto-task creation active.');

})();
