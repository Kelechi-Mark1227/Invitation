/* ============================================
   JANE & NICHOLAS — INTERACTIVE SCRIPTS
   MP3 background music (Golden_Brown.mp3) with a
   Web Audio arpeggio fallback, envelope hero banner,
   auto-assist scratch, gate unlock, 9-photo film
   carousel, responsive
   ============================================ */

(function () {
  'use strict';

  const WEDDING_DATE = new Date('2026-11-21T15:00:00+01:00');
  const SCRATCH_THRESHOLD = 0.28;
  const SLIDESHOW_INTERVAL_MS = 5000;
  const HERO_SLIDESHOW_INTERVAL_MS = 4200;

  // ═══════════════════════════════════════════
  //  MUSIC — Web Audio API Arpeggio
  //  (Plays a gentle romantic piano loop)
  //  Replace with your own MP3 in "Background song" folder
  // ═══════════════════════════════════════════
  const bgMusic     = document.getElementById('bg-music');
  const musicToggle = document.getElementById('music-toggle');
  let musicPlaying  = false;
  let audioCtx      = null;
  let masterGain    = null;
  let arpeggioTimer = null;
  let usingWebAudio = false;

  function startMusic() {
    if (musicPlaying) return;

    // Try the MP3 file first
    if (bgMusic) {
      bgMusic.volume = 0.4;
      const p = bgMusic.play();
      if (p !== undefined) {
        p.then(() => {
          musicPlaying = true;
          updateMusicUI(true);
        }).catch(() => {
          // MP3 not found → fall back to Web Audio arpeggio
          startWebAudioMusic();
        });
      }
    } else {
      startWebAudioMusic();
    }
  }

  function startWebAudioMusic() {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      usingWebAudio = true;

      // Master volume — fade in gently
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
      masterGain.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 3);
      masterGain.connect(audioCtx.destination);

      // Play first pattern immediately
      schedulePattern(0);

      // Loop the pattern every 10 seconds
      arpeggioTimer = setInterval(() => {
        if (musicPlaying && audioCtx && audioCtx.state === 'running') {
          schedulePattern(0);
        }
      }, 10000);

      musicPlaying = true;
      updateMusicUI(true);
    } catch (e) {
      console.log('Web Audio not supported');
    }
  }

  function schedulePattern(offset) {
    // Gentle romantic arpeggio — C major 7 pattern
    const t = audioCtx.currentTime + offset;
    const notes = [
      // First phrase — ascending
      { freq: 261.63, time: 0.0,  dur: 3.0 },  // C4
      { freq: 329.63, time: 0.5,  dur: 2.8 },  // E4
      { freq: 392.00, time: 1.0,  dur: 2.6 },  // G4
      { freq: 493.88, time: 1.5,  dur: 3.0 },  // B4
      { freq: 523.25, time: 2.0,  dur: 3.5 },  // C5
      // Second phrase — descending with variation
      { freq: 440.00, time: 3.5,  dur: 2.8 },  // A4
      { freq: 392.00, time: 4.0,  dur: 2.5 },  // G4
      { freq: 349.23, time: 4.5,  dur: 2.8 },  // F4
      { freq: 329.63, time: 5.0,  dur: 3.0 },  // E4
      // Third phrase — resolution
      { freq: 293.66, time: 6.5,  dur: 2.5 },  // D4
      { freq: 329.63, time: 7.0,  dur: 2.8 },  // E4
      { freq: 392.00, time: 7.5,  dur: 3.0 },  // G4
      { freq: 523.25, time: 8.0,  dur: 3.5 },  // C5
      // Sustained bass note
      { freq: 130.81, time: 0.0,  dur: 5.0 },  // C3 (bass)
      { freq: 174.61, time: 5.0,  dur: 5.0 },  // F3 (bass)
    ];

    notes.forEach(n => playNote(n.freq, t + n.time, n.dur));
  }

  function playNote(freq, startTime, duration) {
    if (!audioCtx || !masterGain) return;

    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;

    // Soft piano-like envelope: attack → sustain → release
    const vol = freq < 200 ? 0.025 : 0.04; // Bass notes quieter
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + 0.08);        // Attack
    gain.gain.setValueAtTime(vol, startTime + duration * 0.5);       // Sustain
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // Release

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
  }

  function stopMusic() {
    if (bgMusic && !bgMusic.paused) {
      bgMusic.pause();
      bgMusic.currentTime = 0;
    }
    if (usingWebAudio && masterGain) {
      masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.8);
      if (arpeggioTimer) clearInterval(arpeggioTimer);
      setTimeout(() => {
        if (audioCtx) audioCtx.close().catch(() => {});
        audioCtx = null;
        masterGain = null;
        usingWebAudio = false;
      }, 1000);
    }
    musicPlaying = false;
    updateMusicUI(false);
  }

  function toggleMusic() {
    if (musicPlaying) stopMusic();
    else startMusic();
  }

  function updateMusicUI(playing) {
    if (!musicToggle) return;
    musicToggle.classList.toggle('playing', playing);
    musicToggle.classList.toggle('muted', !playing);
  }

  if (musicToggle) {
    musicToggle.addEventListener('click', toggleMusic);
  }

  // ═══════════════════════════════════════════
  //  ENVELOPE
  // ═══════════════════════════════════════════
  const envelopeOverlay = document.getElementById('envelope-overlay');
  const envelope        = document.getElementById('envelope');
  const seal            = document.getElementById('seal');
  const envelopeHint    = document.getElementById('envelope-hint');
  const scrollContainer = document.getElementById('main-content');
  let sealBroken = false;

  if (seal) {
    seal.addEventListener('click', breakSeal);
    seal.addEventListener('touchend', function (e) {
      e.preventDefault();
      breakSeal();
    });
  }

  function breakSeal() {
    if (sealBroken) return;
    sealBroken = true;

    // Break seal animation
    seal.classList.add('breaking');
    envelopeHint.style.opacity = '0';

    // Start music (within user gesture → allowed by browsers)
    setTimeout(() => startMusic(), 500);

    // Show music toggle
    setTimeout(() => {
      if (musicToggle) musicToggle.classList.add('visible');
    }, 1500);

    // Open flap
    setTimeout(() => envelope.classList.add('open'), 1200);

    // Dismiss overlay
    setTimeout(() => envelopeOverlay.classList.add('dismissed'), 2800);

    // Cleanup & unlock scroll — this is when the "next page" (the invitation) loads
    setTimeout(() => {
      envelopeOverlay.style.display = 'none';
      scrollContainer.classList.remove('locked');
      triggerInvitationAnimations();
      startSlideshow();
      // Safety net: if the first play() attempt got blocked, try again now
      // that we're definitely inside the resulting user-activation window.
      if (!musicPlaying) startMusic();
    }, 4200);
  }

  // ═══════════════════════════════════════════
  //  ENVELOPE HERO BANNER — dynamic transparent
  //  crossfading photo backdrop behind the envelope
  // ═══════════════════════════════════════════
  function startEnvelopeHeroSlideshow() {
    const slides = document.querySelectorAll('#envelope-hero-slideshow .envelope-hero-slide');
    if (slides.length < 2) return;
    let current = 0;

    setInterval(() => {
      slides[current].classList.remove('active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('active');
    }, HERO_SLIDESHOW_INTERVAL_MS);
  }

  // ═══════════════════════════════════════════
  //  INVITATION ANIMATIONS
  // ═══════════════════════════════════════════
  function triggerInvitationAnimations() {
    document.querySelectorAll('#page-invitation .fade-in').forEach(el => {
      const delay = parseInt(el.dataset.delay || '0', 10);
      setTimeout(() => el.classList.add('visible'), delay);
    });
  }

  // ═══════════════════════════════════════════
  //  BACKGROUND SLIDESHOW
  // ═══════════════════════════════════════════
  function startSlideshow() {
    const slides = document.querySelectorAll('#inv-slideshow .inv-bg-slide');
    if (slides.length < 2) return;
    let current = 0;

    setInterval(() => {
      slides[current].classList.remove('active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('active');
    }, SLIDESHOW_INTERVAL_MS);
  }

  // ═══════════════════════════════════════════
  //  SCRATCH CARD with AUTO-ASSIST
  // ═══════════════════════════════════════════
  const scratchCanvas = document.getElementById('scratch-canvas');
  const scratchArea   = document.getElementById('scratch-area');
  const scratchInstr  = document.getElementById('scratch-instruction');
  const countdownSec  = document.getElementById('countdown-section');
  let scratchCtx, isScratching = false, scratchComplete = false;
  let scratchW = 0, scratchH = 0, scratchDpr = 1;

  function initScratchCard() {
    if (!scratchCanvas || !scratchArea) return;

    const rect = scratchArea.getBoundingClientRect();
    scratchDpr = window.devicePixelRatio || 1;
    scratchW = rect.width;
    scratchH = rect.height;

    scratchCanvas.width  = scratchW * scratchDpr;
    scratchCanvas.height = scratchH * scratchDpr;
    scratchCanvas.style.width  = scratchW + 'px';
    scratchCanvas.style.height = scratchH + 'px';

    scratchCtx = scratchCanvas.getContext('2d');
    scratchCtx.scale(scratchDpr, scratchDpr);

    // Gold gradient fill
    const grad = scratchCtx.createLinearGradient(0, 0, scratchW, scratchH);
    grad.addColorStop(0, '#c9a84c');
    grad.addColorStop(0.3, '#e6cb7a');
    grad.addColorStop(0.6, '#c9a84c');
    grad.addColorStop(1, '#a07c2e');
    scratchCtx.fillStyle = grad;
    scratchCtx.fillRect(0, 0, scratchW, scratchH);

    // Subtle texture
    scratchCtx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let i = 0; i < 200; i++) {
      scratchCtx.beginPath();
      scratchCtx.arc(Math.random() * scratchW, Math.random() * scratchH, Math.random() * 2 + 0.5, 0, Math.PI * 2);
      scratchCtx.fill();
    }

    // Label
    scratchCtx.fillStyle = 'rgba(92, 51, 23, 0.35)';
    scratchCtx.font = '600 14px "Outfit", sans-serif';
    scratchCtx.textAlign = 'center';
    scratchCtx.textBaseline = 'middle';
    scratchCtx.fillText('✦  SCRATCH HERE  ✦', scratchW / 2, scratchH / 2);

    // Events
    scratchCanvas.addEventListener('mousedown', onStart);
    scratchCanvas.addEventListener('mousemove', onMove);
    scratchCanvas.addEventListener('mouseup', onEnd);
    scratchCanvas.addEventListener('mouseleave', onEnd);
    scratchCanvas.addEventListener('touchstart', onStart, { passive: false });
    scratchCanvas.addEventListener('touchmove', onMove, { passive: false });
    scratchCanvas.addEventListener('touchend', onEnd);
  }

  function getPos(e) {
    const r = scratchCanvas.getBoundingClientRect();
    const s = e.touches ? e.touches[0] : e;
    return { x: s.clientX - r.left, y: s.clientY - r.top };
  }

  function onStart(e) {
    if (scratchComplete) return;
    e.preventDefault();
    isScratching = true;
    doScratch(getPos(e));
  }

  function onMove(e) {
    if (!isScratching || scratchComplete) return;
    e.preventDefault();
    doScratch(getPos(e));
  }

  function onEnd() {
    isScratching = false;
    if (!scratchComplete) checkProgress();
  }

  function doScratch(p) {
    scratchCtx.globalCompositeOperation = 'destination-out';

    scratchCtx.beginPath();
    scratchCtx.arc(p.x, p.y, 26, 0, Math.PI * 2);
    scratchCtx.fill();

    // Soft edge
    const g = scratchCtx.createRadialGradient(p.x, p.y, 26, p.x, p.y, 38);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    scratchCtx.fillStyle = g;
    scratchCtx.beginPath();
    scratchCtx.arc(p.x, p.y, 38, 0, Math.PI * 2);
    scratchCtx.fill();

    scratchCtx.globalCompositeOperation = 'source-over';

    // Periodic progress check while scratching
    if (Math.random() < 0.12) checkProgress();
  }

  function checkProgress() {
    const data = scratchCtx.getImageData(0, 0, scratchCanvas.width, scratchCanvas.height).data;
    let clear = 0;
    for (let i = 3; i < data.length; i += 16) {
      if (data[i] === 0) clear++;
    }
    const pct = clear / ((scratchCanvas.width * scratchCanvas.height) / 4);
    if (pct >= SCRATCH_THRESHOLD) autoComplete();
  }

  /** Auto-assist: rapidly dissolve remaining gold then reveal */
  function autoComplete() {
    if (scratchComplete) return;
    scratchComplete = true;
    isScratching = false;

    let frame = 0;
    const total = 28;

    function burst() {
      scratchCtx.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 10; i++) {
        scratchCtx.beginPath();
        scratchCtx.arc(
          Math.random() * scratchW,
          Math.random() * scratchH,
          Math.random() * 50 + 20,
          0, Math.PI * 2
        );
        scratchCtx.fill();
      }
      scratchCtx.globalCompositeOperation = 'source-over';

      if (++frame < total) {
        requestAnimationFrame(burst);
      } else {
        scratchCanvas.classList.add('revealed');
        finishReveal();
      }
    }

    requestAnimationFrame(burst);
  }

  function finishReveal() {
    if (scratchInstr) scratchInstr.classList.add('faded');

    setTimeout(() => {
      if (countdownSec) countdownSec.classList.remove('hidden');
      startCountdown();
    }, 800);

    setTimeout(() => unlockGatedPages(), 1400);
  }

  // ═══════════════════════════════════════════
  //  COUNTDOWN
  // ═══════════════════════════════════════════
  let cdInterval;

  function startCountdown() {
    updateCD();
    cdInterval = setInterval(updateCD, 1000);
  }

  function updateCD() {
    const diff = WEDDING_DATE - new Date();
    if (diff <= 0) {
      clearInterval(cdInterval);
      const el = document.getElementById('countdown');
      if (el) el.innerHTML = '<p style="font-family:var(--font-serif);font-size:1.3rem;font-style:italic;color:var(--royal-brown);">Today is the day! ♥</p>';
      return;
    }
    setCd('cd-days',  Math.floor(diff / 86400000).toString().padStart(3, '0'));
    setCd('cd-hours', Math.floor((diff / 3600000) % 24).toString().padStart(2, '0'));
    setCd('cd-mins',  Math.floor((diff / 60000) % 60).toString().padStart(2, '0'));
    setCd('cd-secs',  Math.floor((diff / 1000) % 60).toString().padStart(2, '0'));
  }

  function setCd(id, val) {
    const el = document.getElementById(id);
    if (!el || el.textContent === val) return;
    el.textContent = val;
    el.style.animation = 'none';
    el.offsetHeight;
    el.style.animation = 'cdPulse 0.35s ease';
  }

  // ═══════════════════════════════════════════
  //  GATE UNLOCK
  // ═══════════════════════════════════════════
  function unlockGatedPages() {
    document.querySelectorAll('.gated').forEach(el => el.classList.add('unlocked'));

    // Reset scroll-snap so browser recalculates snap points
    if (scrollContainer) {
      scrollContainer.style.scrollSnapType = 'none';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollContainer.style.scrollSnapType = 'y mandatory';
          initFilmStrip();
        });
      });
    }
  }

  // ═══════════════════════════════════════════
  //  FILM STRIP
  // ═══════════════════════════════════════════
  let filmReady = false;

  function initFilmStrip() {
    if (filmReady) return;
    filmReady = true;

    const frames    = document.getElementById('film-frames');
    const spTop     = document.getElementById('sprockets-top');
    const spBottom  = document.getElementById('sprockets-bottom');

    if (frames) frames.innerHTML += frames.innerHTML; // Duplicate for loop

    [spTop, spBottom].forEach(c => {
      if (!c) return;
      const frag = document.createDocumentFragment();
      for (let i = 0; i < 120; i++) {
        const h = document.createElement('div');
        h.className = 'sprocket-hole';
        frag.appendChild(h);
      }
      c.appendChild(frag);
    });
  }

  function initFilmStripTouchPause() {
    const frames = document.getElementById('film-frames');
    if (!frames) return;
    frames.addEventListener('touchstart', () => frames.classList.add('paused'), { passive: true });
    frames.addEventListener('touchend', () => frames.classList.remove('paused'), { passive: true });
    frames.addEventListener('touchcancel', () => frames.classList.remove('paused'), { passive: true });
  }

  // ═══════════════════════════════════════════
  //  RSVP FORM
  // ═══════════════════════════════════════════
  const rsvpForm    = document.getElementById('rsvp-form');
  const rsvpSuccess = document.getElementById('rsvp-success');

  if (rsvpForm) {
    rsvpForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const name   = document.getElementById('rsvp-name');
      const phone  = document.getElementById('rsvp-phone');
      const attend = document.getElementById('rsvp-attend');
      let valid = true;

      [name, phone, attend].forEach(f => {
        f.classList.remove('error');
        if (!f.value.trim()) { f.classList.add('error'); valid = false; }
      });

      if (!valid) return;

      const btn = document.getElementById('rsvp-submit');
      btn.disabled = true;
      btn.querySelector('.btn-text').textContent = 'Sending...';

      setTimeout(() => {
        rsvpForm.classList.add('hidden');
        rsvpSuccess.classList.remove('hidden');
        console.log('RSVP:', Object.fromEntries(new FormData(rsvpForm)));
      }, 1600);
    });

    rsvpForm.querySelectorAll('input, select, textarea').forEach(el => {
      el.addEventListener('focus', () => el.classList.remove('error'));
    });
  }

  // ═══════════════════════════════════════════
  //  SCROLL REVEAL
  // ═══════════════════════════════════════════
  function initScrollReveal() {
    if (!scrollContainer) return;

    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll('.fade-in:not(.visible)').forEach((el, i) => {
            const d = parseInt(el.dataset.delay || '0', 10) || i * 150;
            setTimeout(() => el.classList.add('visible'), d);
          });
        }
      });
    }, { root: scrollContainer, threshold: 0.3 });

    document.querySelectorAll('.page').forEach(p => obs.observe(p));
  }

  // ═══════════════════════════════════════════
  //  INIT
  // ═══════════════════════════════════════════
  function init() {
    initScratchCard();
    initScrollReveal();
    startEnvelopeHeroSlideshow();
    initFilmStripTouchPause();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  let rT;
  window.addEventListener('resize', () => {
    clearTimeout(rT);
    rT = setTimeout(() => { if (!scratchComplete) initScratchCard(); }, 400);
  });

})();
