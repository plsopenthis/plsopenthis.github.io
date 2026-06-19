/* ═══════════════════════════════════════════════════════════
   ROMANTIC CONFESSION LETTER — JAVASCRIPT
   ─────────────────────────────────────────────────────────
   Handles:
   1. Envelope click → open animation
   2. Background music playback (autoplay-policy safe)
   3. Letter reveal transition
   4. "Done reading" → paper shredder animation sequence
   5. Aftermath screen reveal
   6. localStorage persistence (shredded state survives refresh)
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  // ── Element references ────────────────────────────────────
  const envelopeWrapper = document.getElementById('envelope-wrapper');
  const envelope        = document.getElementById('envelope');
  const bgMusic         = document.getElementById('bg-music');
  const promptText      = document.getElementById('prompt-text');
  const letter          = document.getElementById('letter');
  const letterPaper     = document.querySelector('.letter-paper');
  const doneBtn         = document.getElementById('done-reading-btn');
  const ashScreen       = document.getElementById('ash-screen');
  const playMusicBtn    = document.getElementById('play-music-btn');

  // ── State ─────────────────────────────────────────────────
  const STORAGE_KEY  = 'confessionLetterShredded';
  let hasOpened      = false;
  let musicStarted   = false;

  // ══════════════════════════════════════════════════════════
  // CHECK: Was the letter already shredded on a previous visit?
  // If so, skip straight to the aftermath screen.
  // ══════════════════════════════════════════════════════════
  if (localStorage.getItem(STORAGE_KEY) === 'true') {
    showShreddedState();
    return; // No need to set up envelope / letter listeners
  }

  // ══════════════════════════════════════════════════════════
  // MUSIC HELPER
  // Handles browser autoplay policies safely.
  // ══════════════════════════════════════════════════════════
  function startMusic() {
    if (musicStarted || !bgMusic) return;
    bgMusic.volume = 0.5;
    const playPromise = bgMusic.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Audio play blocked or no source:', err.message);
      });
    }
    musicStarted = true;
  }

  // ══════════════════════════════════════════════════════════
  // ENVELOPE CLICK → OPEN
  // ══════════════════════════════════════════════════════════
  envelopeWrapper.addEventListener('click', () => {
    if (hasOpened) return;
    hasOpened = true;

    // Step 1: Open the flap
    envelope.classList.add('open');

    // Step 2: Hide prompt text
    promptText.classList.add('hide');

    // Step 3: Play background music
    startMusic();

    // Step 4: After flap opens, slide envelope away & reveal letter
    setTimeout(() => {
      envelopeWrapper.classList.add('opened');
      document.body.classList.add('opened');
    }, 900);
  });

  // ── Keyboard accessibility for envelope ─────────────────
  envelopeWrapper.setAttribute('tabindex', '0');
  envelopeWrapper.setAttribute('role', 'button');
  envelopeWrapper.setAttribute('aria-label', 'Open the love letter envelope');
  envelopeWrapper.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      envelopeWrapper.click();
    }
  });

  // ══════════════════════════════════════════════════════════
  // "DONE READING" BUTTON → SHRED SEQUENCE
  // ══════════════════════════════════════════════════════════
  doneBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Don't bubble up
    startShredSequence();
  });

  /**
   * Orchestrates the full paper shredder animation:
   * 1. Scroll letter to top & lock scrolling
   * 2. Vibrate letter (shredder motor)
   * 3. Show slice lines
   * 4. Replace real letter with DOM clones (strips)
   * 5. Animate strips falling down
   * 6. Show aftermath screen & persist state
   */
  function startShredSequence() {
    // Scroll the letter to the top so the shred looks right
    letter.scrollTo({ top: 0, behavior: 'smooth' });

    // Hide the button immediately
    doneBtn.style.display = 'none';

    // Small delay for scroll, then start shredding
    setTimeout(() => {
      // Lock scrolling during shred
      letter.style.overflow = 'hidden';

      // 1. Motor vibration
      letter.classList.add('shredding');

      // 2. Slice lines appear on paper
      letterPaper.classList.add('slicing');

      // 3. Wait for slice lines, then execute physical shredding
      setTimeout(() => {
        executePhysicalShredding();
      }, 1200); // 1.2s to show vibration + lines
    }, 400);
  }

  function executePhysicalShredding() {
    // Number of strips to slice into
    const STRIP_COUNT = 14;

    // Get the exact visual bounding box of the letter paper
    const rect = letterPaper.getBoundingClientRect();

    // Create a container for the falling strips
    const shredContainer = document.createElement('div');
    shredContainer.className = 'shred-container';
    shredContainer.style.top = rect.top + 'px';
    shredContainer.style.left = rect.left + 'px';
    shredContainer.style.width = rect.width + 'px';
    shredContainer.style.height = rect.height + 'px';

    // Clone the paper for the strips
    // We clone the inner HTML so we get the text and styling
    const originalHTML = letterPaper.outerHTML;

    // Create each strip
    const stripWidth = rect.width / STRIP_COUNT;
    const stripWidthPercent = 100 / STRIP_COUNT;

    for (let i = 0; i < STRIP_COUNT; i++) {
      const strip = document.createElement('div');
      strip.className = 'shred-strip';

      // Position the strip
      strip.style.width = stripWidthPercent + '%';
      strip.style.left = (i * stripWidthPercent) + '%';
      strip.style.height = '100%';

      // Assign random physics properties
      // Rotation between -15deg and 15deg
      const rot = (Math.random() * 30 - 15).toFixed(2) + 'deg';
      // Drift between -30px and 30px
      const drift = (Math.random() * 60 - 30).toFixed(2) + 'px';
      // Stagger delay (fall from bottom to top of paper or random?)
      // We will make outer strips fall slightly later or random
      const delay = (Math.random() * 0.4).toFixed(2) + 's';
      // Fall duration (1.5s - 2.5s)
      const fallDur = (1.5 + Math.random() * 1).toFixed(2) + 's';

      strip.style.setProperty('--rot', rot);
      strip.style.setProperty('--drift', drift);
      strip.style.setProperty('--delay', delay);
      strip.style.setProperty('--fall-dur', fallDur);

      // Insert the cloned paper, offset to the correct left position
      const paperClone = document.createElement('div');
      paperClone.innerHTML = originalHTML;
      const innerPaper = paperClone.firstElementChild;
      innerPaper.style.width = rect.width + 'px';
      innerPaper.style.height = rect.height + 'px';
      innerPaper.style.left = -(i * stripWidth) + 'px';
      innerPaper.style.position = 'absolute';
      // Remove the slicing lines from the falling clones
      innerPaper.classList.remove('slicing');

      strip.appendChild(innerPaper);
      shredContainer.appendChild(strip);
    }

    // Add container to body
    document.body.appendChild(shredContainer);

    // Hide original letter
    letter.classList.add('shredded');
    letter.classList.remove('shredding');

    // Trigger fall on all strips
    // Use a tiny timeout to ensure DOM painted
    setTimeout(() => {
      const strips = shredContainer.querySelectorAll('.shred-strip');
      strips.forEach(s => s.classList.add('falling'));

      // 4. After fall finishes, show aftermath screen
      // Max duration is ~2.5s + 0.4s delay = ~2.9s. Wait 3.5s to be safe.
      setTimeout(() => {
        // Transition to shredded aesthetic
        document.body.classList.add('shredded');
        ashScreen.classList.add('visible');

        // Clean up DOM
        shredContainer.remove();

        // Persist the state
        localStorage.setItem(STORAGE_KEY, 'true');
      }, 3500);
    }, 50);
  }

  // ══════════════════════════════════════════════════════════
  // SHREDDED STATE (on page reload)
  // ══════════════════════════════════════════════════════════
  /**
   * Immediately show the aftermath screen without any animations.
   * The user needs to tap a button to start music (autoplay policy).
   */
  function showShreddedState() {
    // Apply final visual state instantly
    document.body.classList.add('opened', 'shredded');

    // Hide everything that shouldn't be visible
    envelopeWrapper.style.display = 'none';
    promptText.style.display = 'none';
    letter.style.display = 'none';

    // Show the ash screen
    ashScreen.classList.add('visible');

    // Show the music play button (can't autoplay without interaction)
    if (playMusicBtn) {
      playMusicBtn.style.display = 'inline-block';
      playMusicBtn.addEventListener('click', () => {
        startMusic();
        // Fade out the button after tapping
        playMusicBtn.style.opacity = '0';
        playMusicBtn.style.transform = 'scale(0.9)';
        setTimeout(() => {
          playMusicBtn.style.display = 'none';
        }, 400);
      });
    }
  }

  // ══════════════════════════════════════════════════════════
  // RESET (for testing)
  // ──────────────────────────────────────────────────────────
  // Press Ctrl+Shift+L to clear the shredded state and reload.
  // Remove this in production if you don't want anyone to
  // be able to reset the letter.
  // ══════════════════════════════════════════════════════════
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'L') {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
  });
});
