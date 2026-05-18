/* ═══════════════════════════════════════════════════════════════════
   RESCUE.JS — Auto-detects and fixes broken script blocks
   
   HOW: Add this as the FIRST script before your other addons:
   <script src="rescue.js"></script>
   ═══════════════════════════════════════════════════════════════════ */
(async function(){
  var needed = [
    'updateDash','updateBadges','renderTasks','renderAppts','renderActivity',
    'openNewAppt','openNewTask','findOpenSlots','saveAppt','closeApptModal',
    'editAppt','deleteAppt','setApptView','setApptFilter','setTaskFilter',
    'openOutcome','closeOutcomeModal','setOutcome','renderCalendar',
    'openManualConvertWizard','renderClientsPage','renderKpi','renderCommand',
    'renderDeliverables','renderProspecting','renderKb','renderReviews',
    'manualRefreshGcalPage','syncApptToGoogle','openEmailFromAppt',
    'checkApptConflict','loadOpenSlots','formatSlot','checkSlotConflict'
  ];
  // Check if functions already exist
  var missing = needed.filter(function(name){ return typeof window[name] !== 'function'; });
  if(missing.length === 0){
    console.log('[Rescue] All functions OK — nothing to fix.');
    return;
  }
  console.warn('[Rescue] '+missing.length+' functions missing: '+missing.slice(0,5).join(', ')+'...');
  console.log('[Rescue] Fetching page source to recover broken script blocks...');

  try {
    var resp = await fetch(location.href, {cache:'no-store'});
    var html = await resp.text();

    // Extract all inline script blocks
    var regex = /<script(?:\s[^>]*)?>(?![\s]*(?:https?:|\/\/))([\s\S]*?)<\/script>/gi;
    var blocks = [];
    var m;
    while((m = regex.exec(html)) !== null){
      var code = m[1].trim();
      if(code.length > 50) blocks.push(code);
    }
    console.log('[Rescue] Found '+blocks.length+' script blocks in source.');

    // Test each block for syntax errors
    var broken = [];
    blocks.forEach(function(code, i){
      try { new Function(code); }
      catch(e){
        console.error('[Rescue] Block '+(i+1)+' BROKEN: '+e.message);
        broken.push({index:i, code:code, error:e.message});
      }
    });

    if(broken.length === 0){
      console.warn('[Rescue] No syntax errors found in source blocks. Functions may be undefined due to runtime errors.');
      return;
    }

    console.log('[Rescue] '+broken.length+' broken block(s). Attempting repairs...');

    broken.forEach(function(b){
      var fixed = b.code;

      // FIX 1: Remove any </script><script> that was incorrectly inserted
      fixed = fixed.replace(/<\/script>\s*<script[^>]*>/gi, '\n/* rescued-split */\n');

      // FIX 2: If there's a stray < that's not in a string, it may be an HTML parse issue
      // This handles cases where the browser's HTML parser split a script block incorrectly

      // Test if fix worked
      try {
        new Function(fixed);
        console.log('[Rescue] Block '+(b.index+1)+' FIXED! Re-executing...');
        var el = document.createElement('script');
        el.textContent = fixed;
        document.head.appendChild(el);

        // Verify functions now exist
        var stillMissing = needed.filter(function(name){ return typeof window[name] !== 'function'; });
        console.log('[Rescue] After fix: '+stillMissing.length+' functions still missing'+(stillMissing.length?': '+stillMissing.slice(0,5).join(', '):''));
      } catch(e2){
        console.error('[Rescue] Fix attempt failed: '+e2.message);
        console.error('[Rescue] Trying chunk-by-chunk recovery...');

        // FIX 3: Nuclear — split by top-level function/var/const/let declarations and eval each independently
        var chunks = fixed.split(/\n(?=(?:function\s+\w|const\s+\w|let\s+\w|var\s+\w|async\s+function))/);
        var recovered = 0, failed = 0;
        chunks.forEach(function(chunk){
          chunk = chunk.trim();
          if(!chunk || chunk.length < 10) return;
          try {
            (0, eval)(chunk);
            recovered++;
          } catch(e3){
            failed++;
            // Log first 80 chars of the failing chunk
            if(failed <= 5) console.warn('[Rescue] Chunk failed: '+e3.message+' → '+chunk.substring(0,80).replace(/\n/g,' '));
          }
        });
        console.log('[Rescue] Chunk recovery: '+recovered+' OK, '+failed+' failed');

        var finalMissing = needed.filter(function(name){ return typeof window[name] !== 'function'; });
        console.log('[Rescue] Final state: '+finalMissing.length+' functions still missing'+(finalMissing.length?': '+finalMissing.join(', '):''));
      }
    });

    // Final check
    var finalMissing = needed.filter(function(name){ return typeof window[name] !== 'function'; });
    if(finalMissing.length === 0){
      console.log('%c[Rescue] ✅ ALL FUNCTIONS RECOVERED!','color:green;font-weight:bold;font-size:14px');
      // Re-run boot sequence
      if(typeof updateDash === 'function') try { updateDash(); } catch(e){}
      if(typeof updateBadges === 'function') try { updateBadges(); } catch(e){}
      if(typeof renderCommand === 'function') try { renderCommand(); } catch(e){}
    } else {
      console.error('%c[Rescue] ⚠ '+finalMissing.length+' functions could not be recovered','color:red;font-weight:bold');
      console.error('[Rescue] Missing: '+finalMissing.join(', '));
    }

  } catch(fetchErr){
    console.error('[Rescue] Could not fetch page source:',fetchErr);
  }
})();
