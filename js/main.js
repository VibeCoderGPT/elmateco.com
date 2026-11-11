/* ============================================================================
   ELMATECO — main.js : navigation, révélations, particules, compteurs, vidéo
   ----------------------------------------------------------------------------
   Les textes traduits passent par window.t() (js/i18n.js).
   Les dates (« il y a 3 jours ») et les nombres sont localisés via Intl.
   ============================================================================ */
(function () {
  'use strict';

  const C = window.ELMATEKO;
  const t = window.t;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (id) => document.getElementById(id);

  /* ---------- Année dans le footer ---------- */
  $('year').textContent = new Date().getFullYear();

  /* ---------- Navigation : fond au scroll ---------- */
  const nav = $('nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 12);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Révélation au scroll (stagger 0-320 ms) ---------- */
  const revealables = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add('in'));
  }

  /* ---------- Formatage localisé (langue courante) ---------- */
  function locale() { return window.I18N ? I18N.current : 'en'; }

  function fmtNum(n, decimals) {
    try {
      return Number(n).toLocaleString(locale(), {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
    } catch (err) { return String(n); }
  }

  function fmtCompact(n) {
    try {
      return new Intl.NumberFormat(locale(), { notation: 'compact', maximumFractionDigits: 1 }).format(n);
    } catch (err) { return String(n); }
  }

  function fmtAge(age) {
    if (!age || typeof age.value !== 'number') return '';
    try {
      if (window.Intl && Intl.RelativeTimeFormat) {
        return new Intl.RelativeTimeFormat(locale(), { numeric: 'auto' }).format(age.value, age.unit);
      }
    } catch (err) { /* fallback ci-dessous */ }
    // Repli simple (anglais) si RelativeTimeFormat n'existe pas
    const units = { day: 'day', week: 'week', month: 'month', year: 'year' };
    const u = units[age.unit] || 'day';
    return Math.abs(age.value) + ' ' + u + (Math.abs(age.value) === 1 ? '' : 's') + ' ago';
  }

  /* ---------- Compteurs animés (stats du hero) ---------- */
  const statNums = document.querySelectorAll('.stat-num');
  function countUp(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const dur = 1400;
    const t0 = performance.now();
    function frame(now) {
      const t = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out
      const val = target * eased;
      el.textContent = fmtNum(val, decimals);
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          countUp(e.target);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    statNums.forEach((el) => io.observe(el));
  } else {
    statNums.forEach(countUp);
  }

  /* ---------- Particules (braises) du hero ---------- */
  const canvas = $('heroCanvas');
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    const COLORS = ['#ff2e9a', '#ffc53d', '#2ee6ff', '#8a2bff', '#ff7a1a'];
    let W = 0, H = 0, running = true;
    const parts = [];
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    function spawn(fromBottom) {
      parts.push({
        x: Math.random() * W,
        y: fromBottom ? H + 10 : Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -(0.25 + Math.random() * 0.55),
        r: 1 + Math.random() * 2.2,
        a: 0.25 + Math.random() * 0.5,
        tw: Math.random() * Math.PI * 2,
        c: COLORS[(Math.random() * COLORS.length) | 0]
      });
    }
    function tick() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx + Math.sin(p.tw) * 0.2;
        p.y += p.vy;
        p.tw += 0.03;
        p.a -= 0.0022;
        if (p.y < -20 || p.a <= 0) parts.splice(i, 1);
      }
      for (const p of parts) {
        ctx.globalAlpha = Math.max(p.a, 0);
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (parts.length < 55 && Math.random() < 0.35) spawn(true);
      requestAnimationFrame(tick);
    }
    resize();
    for (let i = 0; i < 40; i++) spawn(false);
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', () => {
      running = !document.hidden;
      if (running) requestAnimationFrame(tick);
    });
    requestAnimationFrame(tick);
  }

  /* ---------- Lecteur du nouveau clip (façade → iframe) ---------- */
  const facade = $('videoFacade');
  const frame = $('videoFrame');
  const iframe = $('ytFrame');
  const latest = C.latestVideo;

  // Chaîne de secours pour la miniature : on essaie la plus belle, et si le
  // fichier n'existe pas on descend jusqu'à hqdefault (existe TOUJOURS).
  function thumbFallbackChain(id) {
    const variants = ['maxresdefault', 'sddefault', 'hqdefault'];
    return function () {
      const img = this;
      const step = parseInt(img.dataset.step || '0', 10);
      if (step >= variants.length) return;
      img.dataset.step = String(step + 1);
      img.src = 'https://i.ytimg.com/vi/' + id + '/' + variants[step] + '.jpg';
    };
  }

  const thumb = $('facadeThumb');
  thumb.onerror = thumbFallbackChain(latest.id);
  thumb.src = 'https://i.ytimg.com/vi/' + latest.id + '/maxresdefault.jpg';

  function renderFacadeTexts() {
    thumb.alt = t('thumb_prefix') + ' ' + latest.title;
    $('facadeTitle').textContent = latest.title;
    $('facadeAge').textContent = fmtAge(latest.age);
  }
  renderFacadeTexts();

  function playVideo() {
    facade.setAttribute('hidden', '');
    frame.removeAttribute('hidden');
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + latest.id +
      '?autoplay=1&rel=0&color=white&modestbranding=1&playsinline=1';
  }
  facade.addEventListener('click', playVideo);
  facade.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      playVideo();
    }
  });
  // Mode démo (tests / captures d'écran) : index.html?demo=video
  if (/[?&]demo=video/.test(location.search)) {
    window.addEventListener('load', () => setTimeout(playVideo, 800));
  }

  /* ---------- Grille « dernières sorties » (reconstruite à chaque langue) ---------- */
  const grid = $('recentGrid');
  function buildGrid() {
    grid.innerHTML = '';
    (C.recentVideos || []).forEach((v) => {
      const a = document.createElement('a');
      a.className = 'v-card';
      a.href = 'https://www.youtube.com/watch?v=' + v.id;
      a.target = '_blank';
      a.rel = 'noopener';

      const thumbDiv = document.createElement('div');
      thumbDiv.className = 'v-thumb';
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.alt = t('thumb_prefix') + ' ' + v.title;
      img.onerror = thumbFallbackChain(v.id);
      img.src = 'https://i.ytimg.com/vi/' + v.id + '/hq720.jpg';
      thumbDiv.appendChild(img);

      const info = document.createElement('div');
      info.className = 'v-info';
      const title = document.createElement('p');
      title.className = 'v-title';
      title.textContent = v.title;
      const meta = document.createElement('p');
      meta.className = 'v-meta';
      meta.textContent = fmtCompact(v.views) + ' ' + t('card_views') + ' · ' + fmtAge(v.age);
      info.appendChild(title);
      info.appendChild(meta);

      a.appendChild(thumbDiv);
      a.appendChild(info);
      grid.appendChild(a);
    });
  }
  buildGrid();

  /* ---------- Stats « à propos » localisées ---------- */
  function formatAboutStats() {
    const s = C.stats || {};
    $('aboutSubs').textContent = fmtNum(s.subscribers, 1) + ' K';
    $('aboutVideos').textContent = fmtNum(s.videos, 0);
    $('aboutViews').textContent = fmtNum(s.views, 1) + ' M';
  }
  formatAboutStats();

  /* ---------- Changement de langue : rafraîchit les contenus dynamiques ---------- */
  document.addEventListener('elm:langchange', () => {
    renderFacadeTexts();
    buildGrid();
    formatAboutStats();
    // Re-formate les compteurs déjà animés dans la nouvelle locale
    statNums.forEach((el) => {
      const target = parseFloat(el.dataset.count);
      const decimals = parseInt(el.dataset.decimals || '0', 10);
      el.textContent = fmtNum(target, decimals);
    });
  });

  /* ---------- Filet de sécurité : si un avatar ne charge pas ---------- */
  // Remplace l'image cassée par un rond en dégradé avec la lettre « E »
  // (évite de voir le texte « Elmateco avatar » si le CDN est indisponible).
  document.querySelectorAll('img[src*="yt3.googleusercontent"]').forEach((img) => {
    function applyFallback() {
      img.removeEventListener('error', applyFallback);
      const fb = document.createElement('span');
      fb.className = img.className + ' avatar-fallback';
      fb.textContent = 'E';
      fb.setAttribute('aria-hidden', 'true');
      img.replaceWith(fb);
    }
    if (img.complete && img.naturalWidth === 0) {
      applyFallback();
    } else {
      img.addEventListener('error', applyFallback);
    }
  });
})();
