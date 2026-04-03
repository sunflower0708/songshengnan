/* ============================================
   宋胜男 — Personal Site JS
   Splash screen, radial nav, scroll reveals,
   ASCII cursor trail
   ============================================ */

(function() {
  'use strict';

  // --- Splash Screen ---
  const splash = document.getElementById('splash');
  const mainSite = document.getElementById('mainSite');
  const radialNav = document.getElementById('radialNav');
  let splashDismissed = false;

  function dismissSplash() {
    if (splashDismissed) return;
    splashDismissed = true;

    splash.classList.add('splash--exit');
    document.body.classList.remove('splash-active');
    mainSite.classList.add('visible');

    // Show radial nav after a beat
    setTimeout(() => {
      radialNav.classList.add('visible');
    }, 600);

    // Remove splash from DOM after animation
    setTimeout(() => {
      splash.classList.add('splash--hidden');
    }, 900);
  }

  // Auto-dismiss after 2.5s
  setTimeout(dismissSplash, 2500);

  // Dismiss on click
  splash.addEventListener('click', dismissSplash);

  // Dismiss on scroll attempt
  window.addEventListener('wheel', dismissSplash, { once: true, passive: true });
  window.addEventListener('touchstart', dismissSplash, { once: true, passive: true });

  // Dismiss on keypress
  window.addEventListener('keydown', dismissSplash, { once: true });


  // --- Radial Navigation: Active Section Tracking ---
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.radial-nav__item');

  function updateRadialNav() {
    const scrollPos = window.scrollY + window.innerHeight / 3;

    let currentSection = '';
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        currentSection = section.getAttribute('id');
      }
    });

    navItems.forEach(item => {
      const href = item.getAttribute('href').replace('#', '');
      item.classList.toggle('active', href === currentSection);
    });
  }

  window.addEventListener('scroll', updateRadialNav, { passive: true });

  // Smooth scroll for radial nav links
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = item.getAttribute('href').replace('#', '');
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Smooth scroll for all anchor links in main site
  document.querySelectorAll('.main-site a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href').replace('#', '');
      const target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });


  // --- Scroll Reveal ---
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -30px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));


  // --- Smooth Number Count Animation ---
  function animateNumbers() {
    const numbers = document.querySelectorAll('[data-count]');
    numbers.forEach(el => {
      const target = parseInt(el.dataset.count);
      const suffix = el.textContent.replace(/[0-9]/g, '');
      let current = 0;
      const increment = target / 40;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        el.textContent = Math.round(current) + suffix;
      }, 30);
    });
  }

  // Run number animation when stats section is in view
  const statsSection = document.querySelector('.stats');
  if (statsSection) {
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateNumbers();
          statsObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    statsObserver.observe(statsSection);
  }


  // --- Parallax glow elements ---
  const glows = document.querySelectorAll('.hero__glow');

  if (glows.length && window.matchMedia('(min-width: 768px)').matches) {
    window.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;

      glows.forEach((glow, i) => {
        const factor = i === 0 ? 1 : -0.6;
        glow.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
      });
    }, { passive: true });
  }


  // --- ASCII Cursor Trail ---
  // Only on desktop (non-touch devices)
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const ASCII_CHARS = '01{}[]<>/\\|~^*#@&$%!?+=-_.,:;ABCDEFabcdef';
    const POOL_SIZE = 40;
    const SPAWN_INTERVAL = 50;   // ms between spawns
    const CHAR_LIFETIME = 900;   // ms total lifetime
    const DRIFT_Y = -30;         // px upward drift
    const SPREAD = 18;           // px random offset from cursor

    // Pre-create a pool of DOM elements
    const pool = [];
    const container = document.createElement('div');
    container.setAttribute('aria-hidden', 'true');
    container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;';
    document.body.appendChild(container);

    for (let i = 0; i < POOL_SIZE; i++) {
      const el = document.createElement('span');
      el.style.cssText = [
        'position:absolute',
        'font-family:"JetBrains Mono","Fira Code","Courier New",monospace',
        'font-size:14px',
        'font-weight:600',
        'line-height:1',
        'pointer-events:none',
        'user-select:none',
        'will-change:transform,opacity',
        'opacity:0',
      ].join(';');
      container.appendChild(el);
      pool.push({ el, active: false, born: 0 });
    }

    let mouseX = -100, mouseY = -100;
    let lastSpawn = 0;
    let rafId = null;

    // Color palette that shifts between primary cyan and accent purple
    function getColor(t) {
      // t in [0,1] — cycle through golden yellow hue range
      const hue = 80 + t * 20; // 80 → 100 (gold to warm yellow)
      return `oklch(0.82 0.16 ${hue})`;
    }

    let colorCycle = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    function spawnChar(now) {
      // Find an inactive element from the pool
      const item = pool.find(p => !p.active);
      if (!item) return;

      const char = ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)];
      const offsetX = (Math.random() - 0.5) * SPREAD * 2;
      const offsetY = (Math.random() - 0.5) * SPREAD * 2;
      const rotation = (Math.random() - 0.5) * 60; // ±30 deg
      const scale = 0.7 + Math.random() * 0.6;      // 0.7 → 1.3

      colorCycle = (colorCycle + 0.03) % 1;
      const color = getColor(colorCycle + Math.random() * 0.15);

      item.el.textContent = char;
      item.el.style.left = (mouseX + offsetX) + 'px';
      item.el.style.top = (mouseY + offsetY) + 'px';
      item.el.style.color = color;
      item.el.style.textShadow = `0 0 8px ${color}`;
      item.el.style.transform = `translate(-50%,-50%) rotate(${rotation}deg) scale(${scale})`;
      item.el.style.opacity = '1';
      item.el.style.transition = 'none';
      item.active = true;
      item.born = now;
      item.startX = mouseX + offsetX;
      item.startY = mouseY + offsetY;
      item.rotation = rotation;
      item.scale = scale;
    }

    function tick(now) {
      // Spawn new characters at interval
      if (now - lastSpawn > SPAWN_INTERVAL && mouseX > 0) {
        spawnChar(now);
        lastSpawn = now;
      }

      // Animate active particles
      for (const item of pool) {
        if (!item.active) continue;

        const age = now - item.born;
        const progress = age / CHAR_LIFETIME;

        if (progress >= 1) {
          item.el.style.opacity = '0';
          item.active = false;
          continue;
        }

        // Ease out for smooth fade
        const easeOut = 1 - (1 - progress) * (1 - progress);
        const opacity = 1 - easeOut;
        const driftY = DRIFT_Y * easeOut;
        const driftX = Math.sin(progress * Math.PI * 2) * 5; // subtle horizontal wave
        const currentScale = item.scale * (1 - progress * 0.3);
        const currentRotation = item.rotation + progress * 20;

        item.el.style.transform = `translate(calc(-50% + ${driftX}px), calc(-50% + ${driftY}px)) rotate(${currentRotation}deg) scale(${currentScale})`;
        item.el.style.opacity = opacity.toFixed(3);
      }

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);

    // Respect prefers-reduced-motion
    const motionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
    function handleMotionPref(e) {
      if (e.matches) {
        cancelAnimationFrame(rafId);
        container.style.display = 'none';
      } else {
        container.style.display = '';
        rafId = requestAnimationFrame(tick);
      }
    }
    motionMQ.addEventListener('change', handleMotionPref);
    if (motionMQ.matches) {
      cancelAnimationFrame(rafId);
      container.style.display = 'none';
    }
  }

})();
