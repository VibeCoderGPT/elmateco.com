/* ============================================================================
   ELMATECO — main.js : navigation, révélations, particules, compteurs, vidéo
   ----------------------------------------------------------------------------
   • Les textes traduits passent par window.t() (js/i18n.js).
   • Les dates et les nombres sont localisés via Intl.
   • 📺 Les vidéos (« nouveau clip » + dernières sorties) sont chargées en
     DIRECT depuis le flux officiel de la chaîne YouTube (RSS) : la page suit
     la chaîne automatiquement, aucune mise à jour manuelle. Si le flux est
     inaccessible (hors ligne, proxy indisponible), repli sur les données
     statiques de js/config.js.
   ============================================================================ */
(function () {
  'use strict';

  const C = window.ELMATEKO;
  const t = window.t;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (id) => document.getElementById(id);

  /* ============================================================
     VIDEOS — flux RSS officiel de la chaîne (auto-mise à jour)
     ============================================================ */
  const FEED_URL = 'https://www.youtube.com/feeds/videos.xml?channel_id=' + C.channelId;
  const FEED_PROXIES = [
    (url) => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url),
    (url) => 'https://corsproxy.io/?url=' + encodeURIComponent(url)
  ];
  const CACHE_KEY = 'elmateco-feed-cache';
  const CACHE_TTL = 60 * 60 * 1000; // 1 heure

  const state = { videos: null, latestId: C.latestVideo.id };

  /* ---------- Utilitaires réseau ---------- */
  function fetchTimeout(url, ms) {
    const ctrl = ('AbortController' in window) ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), ms) : 0;
    return fetch(url, { signal: ctrl ? ctrl.signal : undefined, cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .finally(() => { if (timer) clearTimeout(timer); });
  }

  /* ---------- Parsing du RSS (DOMParser, sorties en texte sûr) ---------- */
  function parseFeedXml(xmlText) {
    const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
    if (doc.querySelector('parsererror') || !doc.querySelector('entry')) return [];
    const NS_YT = 'http://www.youtube.com/xml/schemas/2015';
    const NS_MEDIA = 'http://search.yahoo.com/mrss/';
    const out = [];
    doc.querySelectorAll('entry').forEach((entry) => {
      const id = (entry.getElementsByTagNameNS(NS_YT, 'videoId')[0] || {}).textContent;
      const title = (entry.querySelector('title') || {}).textContent;
      const published = (entry.querySelector('published') || {}).textContent;
      const stats = entry.getElementsByTagNameNS(NS_MEDIA, 'statistics')[0];
      const views = stats ? parseInt(stats.getAttribute('views') || '0', 10) : 0;
      if (id && title && published) out.push({ id: id, title: title.trim(), published: published, views: views });
    });
    return out;
  }

  /* ---------- Cache local (limite les appels au flux) ---------- */
  function readFeedCache() {
    try {
      const raw = window.localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const c = JSON.parse(raw);
      if (!c || !Array.isArray(c.videos) || !c.ts) return null;
      if (Date.now() - c.ts > CACHE_TTL) return null;
      return c.videos;
    } catch (err) { return null; }
  }
  function writeFeedCache(videos) {
    try { window.localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), videos: videos })); }
    catch (err) { /* stockage plein ou indisponible : on ignore */ }
  }

  /* ---------- Chargement avec repli en cascade ---------- */
  function loadFeed() {
    const attempts = [() => fetchTimeout(FEED_URL, 8000)]
      .concat(FEED_PROXIES.map((p) => () => fetchTimeout(p(FEED_URL), 8000)));
    const chain = (i) => {
      if (i >= attempts.length) return Promise.reject(new Error('feed unreachable'));
      return attempts[i]()
        .then((text) => {
          const vids = parseFeedXml(text);
          if (!vids.length) throw new Error('empty feed');
          return vids;
        })
        .catch(() => chain(i + 1));
    };
    return chain(0);
  }

  /* ---------- Âge relatif à partir d'une date ISO ---------- */
  function relAgeFromDate(iso) {
    const then = new Date(iso).getTime();
    const diff = then - Date.now(); // négatif si passé
    if (!isFinite(diff)) return { value: 0, unit: 'day' };
    const abs = Math.abs(diff);
    if (abs < 3600000) return { value: Math.round(diff / 60000), unit: 'minute' };
    if (abs < 86400000) return { value: Math.round(diff / 3600000), unit: 'hour' };
    if (abs < 7 * 86400000) return { value: Math.round(diff / 86400000), unit: 'day' };
    if (abs < 60 * 86400000) return { value: Math.round(diff / (7 * 86400000)), unit: 'week' };
    if (abs < 730 * 86400000) return { value: Math.round(diff / (30.44 * 86400000)), unit: 'month' };
    return { value: Math.round(diff / (365.25 * 86400000)), unit: 'year' };
  }

  /* ---------- Repli statique (config.js) ---------- */
  function fallbackVideos() {
    const out = [{
      id: C.latestVideo.id,
      title: C.latestVideo.title,
      age: C.latestVideo.age,
      views: null
    }];
    (C.recentVideos || []).forEach((v) => {
      out.push({ id: v.id, title: v.title, age: v.age, views: v.views });
    });
    return out;
  }

  /* ============================================================
     BASE
     ============================================================ */

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
    } catch (err) { /* repli ci-dessous */ }
    const units = { minute: 'minute', hour: 'hour', day: 'day', week: 'week', month: 'month', year: 'year' };
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

  /* ============================================================
     LECTEUR DU NOUVEAU CLIP (façade → iframe YouTube)
     ============================================================ */
  const facade = $('videoFacade');
  const frame = $('videoFrame');
  const iframe = $('ytFrame');
  const thumb = $('facadeThumb');

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

  function playVideo() {
    facade.setAttribute('hidden', '');
    frame.removeAttribute('hidden');
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + state.latestId +
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

  /* ============================================================
     RENDU DES VIDÉOS (données dynamiques, texte toujours sûr)
     ============================================================ */
  function renderFacade(v) {
    if (!v) return;
    state.latestId = v.id;
    thumb.onerror = thumbFallbackChain(v.id);
    thumb.src = 'https://i.ytimg.com/vi/' + v.id + '/maxresdefault.jpg';
    thumb.alt = t('thumb_prefix') + ' ' + v.title;
    $('facadeTitle').textContent = v.title;
    const age = v.age || relAgeFromDate(v.published);
    $('facadeAge').textContent = fmtAge(age);
  }

  const grid = $('recentGrid');
  function renderGrid(videos) {
    grid.innerHTML = '';
    videos.forEach((v) => {
      const a = document.createElement('a');
      a.className = 'v-card';
      a.href = 'https://www.youtube.com/watch?v=' + v.id;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';

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
      const age = v.age || relAgeFromDate(v.published);
      meta.textContent = (typeof v.views === 'number' && v.views > 0)
        ? fmtCompact(v.views) + ' ' + t('card_views') + ' · ' + fmtAge(age)
        : fmtAge(age);
      info.appendChild(title);
      info.appendChild(meta);

      a.appendChild(thumbDiv);
      a.appendChild(info);
      grid.appendChild(a);
    });
  }

  function applyVideos(videos) {
    if (!videos || !videos.length) return;
    state.videos = videos;
    renderFacade(videos[0]);
    renderGrid(videos.slice(1, 7));
  }

  function initVideos() {
    const cached = readFeedCache();
    if (cached && cached.length) {
      applyVideos(cached);
    }
    loadFeed()
      .then((videos) => {
        if (videos.length) {
          writeFeedCache(videos);
          applyVideos(videos);
        }
      })
      .catch(() => {
        // Repli statique uniquement si on n'a rien pu afficher (pas de cache)
        if (!state.videos) applyVideos(fallbackVideos());
      });
  }
  initVideos();

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
    if (state.videos && state.videos.length) {
      applyVideos(state.videos);
    }
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
