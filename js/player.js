/* ============================================================================
   ELMATECO — player.js : lecteur musical en continu
   ----------------------------------------------------------------------------
   • Les chansons s'enchaînent toutes seules, en boucle (lecture continue).
   • La playlist est définie par le webmaster dans  js/config.js  (PLAYLIST),
     ou chargée depuis REMOTE_PLAYLIST_URL (Supabase / JSON hébergé).
     Les visiteurs ne peuvent ni ajouter ni retirer de titres.
   • Tous les messages passent par window.t() (js/i18n.js).
   ============================================================================ */
(function () {
  'use strict';

  const C = window.ELMATEKO;
  const t = window.t;
  const $ = (id) => document.getElementById(id);

  const audio = new Audio();
  audio.preload = 'metadata';

  /* ---------- État ---------- */
  let playlist = (C.PLAYLIST || []).map((tr) => Object.assign({}, tr));
  let index = 0;
  let shuffle = false;
  let started = false;      // la musique a déjà été lancée au moins une fois
  let autoAdvance = true;   // enchaîner automatiquement au morceau suivant

  /* ---------- Éléments UI ---------- */
  const player = document.querySelector('.player');
  const btnPlay = $('btnPlay');
  const btnPrev = $('btnPrev');
  const btnNext = $('btnNext');
  const btnShuffle = $('btnShuffle');
  const seek = $('seek');
  const volume = $('volume');
  const timeNow = $('timeNow');
  const timeDur = $('timeDur');
  const trackTitle = $('trackTitle');
  const trackArtist = $('trackArtist');
  const playlistList = $('playlistList');
  const playlistCount = $('playlistCount');
  const miniPlayer = $('miniPlayer');
  const miniTitle = $('miniTitle');
  const miniToggle = $('miniToggle');
  const musicPill = $('musicPill');
  const nativeFallback = $('nativeFallback');
  const nativeList = $('nativeList');

  /* ---------- Utilitaires ---------- */
  function fmt(s) {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    return m + ':' + String(ss).padStart(2, '0');
  }

  function currentTrack() { return playlist[index] || null; }

  /* ---------- Rendu de la playlist ---------- */
  function renderPlaylist() {
    playlistList.innerHTML = '';
    playlist.forEach((tr, i) => {
      const li = document.createElement('li');
      if (i === index) li.classList.add('playing');

      const eq = document.createElement('span');
      eq.className = 'row-eq';
      eq.setAttribute('aria-hidden', 'true');
      for (let b = 0; b < 3; b++) eq.appendChild(document.createElement('i'));

      const info = document.createElement('span');
      info.className = 'row-title';
      const tt = document.createElement('span');
      tt.className = 't';
      tt.textContent = tr.title;
      const ta = document.createElement('span');
      ta.className = 'a';
      ta.textContent = tr.artist;
      info.appendChild(tt);
      info.appendChild(ta);

      li.appendChild(eq);
      li.appendChild(info);
      li.addEventListener('click', () => jumpTo(i));
      playlistList.appendChild(li);
    });
    if (playlist.length) {
      const word = playlist.length > 1 ? t('playlist_tracks') : t('playlist_track');
      playlistCount.textContent = '(' + playlist.length + ' ' + word + ')';
    } else {
      playlistCount.textContent = t('playlist_empty');
    }
  }

  /* ---------- Info / UI de lecture ---------- */
  function updateInfo() {
    const tr = currentTrack();
    if (!tr) {
      trackTitle.textContent = t('playlist_empty_title');
      trackArtist.textContent = t('playlist_empty_hint');
      miniTitle.textContent = '—';
      return;
    }
    trackTitle.textContent = tr.title;
    trackArtist.textContent = tr.artist;
    miniTitle.textContent = tr.title;
    updateMediaSession(tr);
  }

  function setPlayingUI(on) {
    player.classList.toggle('playing', on);
    miniPlayer.classList.toggle('playing', on);
    btnPlay.textContent = on ? '⏸' : '▶';
    miniToggle.textContent = on ? '⏸' : '▶';
    const aria = t(on ? 'btn_pause' : 'btn_play');
    btnPlay.setAttribute('aria-label', aria);
    miniToggle.setAttribute('aria-label', aria);
  }

  function updateProgress() {
    const d = audio.duration || 0;
    timeNow.textContent = fmt(audio.currentTime);
    if (d) {
      const pct = (audio.currentTime / d) * 100;
      seek.value = String(Math.round((audio.currentTime / d) * 1000));
      seek.style.setProperty('--val', pct + '%');
      volume.style.setProperty('--val', (audio.volume * 100) + '%');
    }
  }

  function updateMediaSession(tr) {
    if (!('mediaSession' in navigator) || !tr) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: tr.title,
        artist: tr.artist,
        album: t('media_album'),
        artwork: [{ src: C.avatarUrl, sizes: '512x512', type: 'image/jpeg' }]
      });
    } catch (err) { /* silencieux : média non supporté */ }
  }

  /* ---------- Lecture ---------- */
  function load(i) {
    index = ((i % playlist.length) + playlist.length) % playlist.length;
    const tr = currentTrack();
    if (!tr) return;
    audio.src = tr.src;
    audio.load();
    updateInfo();
    renderPlaylist();
  }

  function play() {
    if (!playlist.length) {
      musicPill.classList.add('hidden');
      return;
    }
    if (!audio.src) load(index);
    const p = audio.play();
    if (p && p.then) {
      p.then(() => { started = true; hidePill(); }).catch(() => {
        if (!started) showPill();
      });
    }
  }

  function pause() { audio.pause(); }

  function toggle() { audio.paused ? play() : pause(); }

  function next() {
    if (!playlist.length) return;
    if (shuffle && playlist.length > 1) {
      let n;
      do { n = (Math.random() * playlist.length) | 0; } while (n === index);
      index = n;
    } else {
      index = (index + 1) % playlist.length;
    }
    load(index);
    if (started || autoAdvance) play();
  }

  function prev() {
    if (!playlist.length) return;
    index = (index - 1 + playlist.length) % playlist.length;
    load(index);
    if (started) play();
  }

  function jumpTo(i) {
    if (i === index && audio.src) { toggle(); return; }
    load(i);
    play();
  }

  /* ---------- Pilule « lance la musique » (si autoplay bloqué) ---------- */
  function showPill() {
    if (started) return;
    musicPill.classList.remove('hidden');
  }
  function hidePill() { musicPill.classList.add('hidden'); }

  /* ---------- Lecteur natif de secours (si tout le reste échoue) ---------- */
  function showNativeFallback() {
    if (!nativeFallback || !nativeList) return;
    nativeList.innerHTML = '';
    playlist.forEach((tr) => {
      const div = document.createElement('div');
      div.className = 'n-track';
      const label = document.createElement('span');
      label.className = 'n-label';
      label.textContent = tr.title + ' — ' + tr.artist;
      const a = document.createElement('audio');
      a.controls = true;
      a.preload = 'none';
      a.src = tr.src;
      div.appendChild(label);
      div.appendChild(a);
      nativeList.appendChild(div);
    });
    nativeFallback.classList.remove('hidden');
  }
  function hideNativeFallback() {
    if (nativeFallback) nativeFallback.classList.add('hidden');
  }

  /* ---------- Événements audio ---------- */
  audio.addEventListener('play', () => setPlayingUI(true));
  audio.addEventListener('pause', () => setPlayingUI(false));
  audio.addEventListener('ended', () => { if (autoAdvance) next(); });
  audio.addEventListener('timeupdate', updateProgress);
  audio.addEventListener('loadedmetadata', () => {
    timeDur.textContent = fmt(audio.duration);
    updateProgress();
  });

  // En cas d'erreur de lecture : on essaie chaque titre une fois, puis on
  // bascule sur le lecteur natif de secours (et on évite toute boucle infinie).
  let errorCount = 0;
  audio.addEventListener('error', () => {
    errorCount++;
    const tr = currentTrack();
    const code = audio.error ? audio.error.code : '?';
    // code 2 = fichier introuvable, 3 = fichier illisible, 4 = format non supporté
    trackArtist.textContent = t('err_cant_play') + ' (' + code + ') : ' + (tr ? tr.title : t('err_unknown'));
    setPlayingUI(false);
    if (errorCount <= playlist.length) {
      setTimeout(() => next(), 700); // essaie le titre suivant
    } else {
      showNativeFallback();          // tout a échoué → lecteur natif
    }
  });
  audio.addEventListener('playing', () => {
    errorCount = 0;
    hideNativeFallback();
  });

  /* ---------- Événements UI ---------- */
  btnPlay.addEventListener('click', toggle);
  btnNext.addEventListener('click', next);
  btnPrev.addEventListener('click', prev);
  miniToggle.addEventListener('click', toggle);
  btnShuffle.addEventListener('click', () => {
    shuffle = !shuffle;
    btnShuffle.classList.toggle('active', shuffle);
  });
  musicPill.addEventListener('click', () => { play(); });

  seek.addEventListener('input', () => {
    const d = audio.duration || 0;
    if (d) audio.currentTime = (Number(seek.value) / 1000) * d;
  });
  volume.addEventListener('input', () => {
    audio.volume = Number(volume.value);
    updateProgress();
  });

  /* ---------- Media Session (contrôles système) ---------- */
  if ('mediaSession' in navigator) {
    try {
      navigator.mediaSession.setActionHandler('play', play);
      navigator.mediaSession.setActionHandler('pause', pause);
      navigator.mediaSession.setActionHandler('nexttrack', next);
      navigator.mediaSession.setActionHandler('previoustrack', prev);
    } catch (err) { /* silencieux */ }
  }

  /* ---------- Playlist distante (Supabase / JSON hébergé) ---------- */
  // Si REMOTE_PLAYLIST_URL est rempli dans config.js, on charge la playlist
  // en ligne ; en cas d'échec on garde la playlist locale, sans erreur visible.
  function initPlaylist() {
    const url = String(C.REMOTE_PLAYLIST_URL || '').trim();
    if (!url) { renderPlaylist(); return; }
    fetch(url, { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then((data) => {
        const arr = Array.isArray(data) ? data : (data && Array.isArray(data.PLAYLIST) ? data.PLAYLIST : null);
        if (arr && arr.length) {
          playlist = arr.map((tr) => Object.assign({}, tr));
          index = 0;
        }
        renderPlaylist();
        updateInfo();
      })
      .catch(() => { renderPlaylist(); }); // silencieux : playlist locale
  }

  /* ---------- Autoplay : tentative + relance au premier clic ---------- */
  window.addEventListener('load', () => {
    play(); // si le navigateur l'autorise, la musique démarre en arrivant
  });

  // Suivi du dernier geste utilisateur réel (pour distinguer « pas de geste »
  // d'un « geste fait mais lecture quand même bloquée » par le navigateur).
  let lastGesture = 0;
  document.addEventListener('pointerdown', () => { lastGesture = Date.now(); }, { capture: true, passive: true });

  document.addEventListener('pointerdown', function firstTap(e) {
    // Important : si le premier clic vise les contrôles du lecteur (bouton
    // play, pilule, mini-lecteur…), on ne lance RIEN ici, sinon le même clic
    // démarrerait la musique puis la mettrait en pause aussitôt (double action).
    if (e.target && e.target.closest('.player, #miniPlayer, #musicPill, .native-fallback')) return;
    document.removeEventListener('pointerdown', firstTap, true);
    if (!started && playlist.length) play();
  }, { capture: true, passive: true });

  /* ---------- Changement de langue : rafraîchit tous les textes ---------- */
  document.addEventListener('elm:langchange', () => {
    renderPlaylist();
    updateInfo();
    setPlayingUI(!audio.paused && !audio.ended);
    updateMediaSession(currentTrack());
  });

  /* ---------- Init ---------- */
  audio.volume = 0.9;
  volume.value = '0.9';
  updateInfo();
  initPlaylist();

  // Le mini-lecteur apparaît dès que la musique a démarré au moins une fois.
  const origPlay = audio.play.bind(audio);
  audio.play = function () {
    const r = origPlay();
    if (r && r.then) {
      r.then(() => {
        started = true;
        miniPlayer.classList.remove('hidden');
        hidePill();
      }).catch((e) => {
        // Le navigateur bloque la lecture MÊME après un clic réel
        // (politique stricte) → on bascule sur le lecteur natif de secours.
        if (e && e.name === 'NotAllowedError' && Date.now() - lastGesture < 1500) {
          showNativeFallback();
        }
      });
    }
    return r;
  };

  /* ---------- Point d'inspection (diagnostic, inoffensif) ---------- */
  window.__playerDebug = function () {
    return {
      paused: audio.paused,
      readyState: audio.readyState,
      networkState: audio.networkState,
      errorCode: audio.error ? audio.error.code : null,
      currentTime: audio.currentTime,
      duration: audio.duration,
      src: audio.src,
      started: started,
      pillVisible: !musicPill.classList.contains('hidden')
    };
  };
  window.__tryPlay = function () {
    return audio.play()
      .then(() => 'PLAY-OK')
      .catch((e) => 'PLAY-ERR: ' + (e && e.name) + ' — ' + (e && e.message));
  };
})();
