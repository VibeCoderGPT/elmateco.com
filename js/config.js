/* ============================================================================
   ELMATECO — CONFIGURATION DU SITE (fichier du webmaster)
   ----------------------------------------------------------------------------
   👉 C'est ICI que tu modifies presque tout sans toucher au reste du code :
      - la playlist de chansons (ajouter / retirer des titres)
      - le dernier clip mis en avant
      - les liens sociaux
      - (optionnel) une playlist distante (Supabase, JSON hébergé…)

   📝 Les textes de l'interface (25 langues) se changent dans js/i18n.js.
   ============================================================================ */

window.ELMATEKO = {

  /* ---------- Chaîne YouTube ---------- */
  channelName: 'Elmateco',
  handle: '@ELMATEKO',
  channelId: 'UCIpYDfH22uzgsz77lrEhtYQ',
  channelUrl: 'https://www.youtube.com/@ELMATEKO',
  subscribeUrl: 'https://www.youtube.com/@ELMATEKO?sub_confirmation=1',

  /* ---------- Statistiques (affichées et traduites automatiquement) ---------- */
  stats: {
    subscribers: 23.1,   // en milliers (K)
    videos: 146,
    views: 6.4           // en millions (M)
  },

  /* ---------- Images officielles (profil + bannière de la chaîne) ---------- */
  avatarUrl: 'https://yt3.googleusercontent.com/rX7Kl1QVBpfA8F-n1XMFMrr4DgNn-jvtkCjabYcfRbaYGTJZLUdi8KRL9QgYeWQHjkTEMjDCfg=s800-c-k-c0x00ffffff-no-rj',
  bannerUrl: 'https://yt3.googleusercontent.com/fJtIQdmwDoXqJ-7_-HNLjSLJdrfBHD-7M_s291Q9YBBMGm38JBXJKY4mE9G0XDRaVBfyLKpbFeI=w2120-fcrop64=1,00005a57ffffa5a8-k-c0xffffffff-no-nd-rj',

  /* ---------- Nouveau clip (mis en avant sur la page) ----------
     Change l'ID + le titre quand un nouveau clip sort.
     age : { value: nombre négatif, unit: 'day' | 'week' | 'month' | 'year' }
     → l'âge s'affiche automatiquement dans la langue du visiteur. */
  latestVideo: {
    id: 'dZdvx9LJJJw',
    title: 'ELMATECO - BASS TEST STARTED 🔊 (Official Music Video)',
    age: { value: -3, unit: 'day' }
  },

  /* ---------- Dernières sorties (mini-vignettes) ----------
     views : nombre de vues (formaté automatiquement : 1,2 K, 13 K…)
     age   : comme ci-dessus. */
  recentVideos: [
    { id: 'dWyP11Me2cQ', title: 'DROP IT & BOUNCE — The Continuous Mix', views: 450,  age: { value: -8, unit: 'day' } },
    { id: 'WzC7b25g82c', title: 'ELMATECO – Mosquito 🦟⚡ | Official Music Video', views: 752,  age: { value: -11, unit: 'day' } },
    { id: 'EC6wmnEc2Mw', title: 'ELMATECO – AFTER DARK (Official Music Video) 💃🔥', views: 1200, age: { value: -2, unit: 'week' } },
    { id: 'uH8dHnvkbrQ', title: 'Elmateco – Bounce Control (Full Album Mix)', views: 1600, age: { value: -1, unit: 'month' } },
    { id: 'BRvQ6GitLNY', title: 'ELMATECO – What’s Hotter Than Your Girlfriend?', views: 1200, age: { value: -1, unit: 'month' } },
    { id: '7XyXvkbUmag', title: 'Elmateco – B.A.S.S. 🔊 (Official EDM Dance Video)', views: 13000, age: { value: -1, unit: 'month' } }
  ],

  /* ---------- Liens sociaux ---------- */
  socials: [
    { label: 'YouTube',   url: 'https://www.youtube.com/@ELMATEKO',                           emoji: '▶️',  color: '#ff0033' },
    { label: 'Spotify',   url: 'https://open.spotify.com/intl-fr/artist/1jnmquCWHzuyGLV4pJRiTU', emoji: '🎧', color: '#1db954' },
    { label: 'Apple Music', url: 'https://music.apple.com/fr/artist/elmateco/1817971885',    emoji: '🍎',  color: '#fa2d48' },
    { label: 'Amazon Music', url: 'https://music.amazon.com/artists/B0FBLH56TR/elmateco',    emoji: '📦',  color: '#ff9900' },
    { label: 'TikTok',    url: 'https://www.tiktok.com/@elmateco_official',                  emoji: '🎵',  color: '#69c9d0' },
    { label: 'HyperFollow', url: 'https://hyperfollow.com/elmateco',                         emoji: '🔗',  color: '#a855f7' }
  ],
  contactEmail: 'Info.elmateco@gmail.com',

  /* ---------- 🌍 PLAYLIST DISTANTE (optionnel, ex. Supabase) ----------
     Laisse '' pour utiliser la PLAYLIST locale ci-dessous.
     Si tu mets une URL, le lecteur charge la playlist depuis ce JSON :
       - soit un tableau direct :  [ {title, artist, src}, … ]
       - soit un objet avec une clé PLAYLIST : { PLAYLIST: [ … ] }
     Exemple Supabase (table "songs") :
       REMOTE_PLAYLIST_URL: 'https://VOTREPROJET.supabase.co/rest/v1/songs?select=title,artist,src&order=position',
     Les MP3 doivent être hébergés (Storage Supabase, hébergeur…) et accessibles
     en HTTPS. Si le chargement échoue, le site retombe sur la playlist locale. */
  REMOTE_PLAYLIST_URL: '',

  /* ============================================================================
     🎵 PLAYLIST — les chansons qui tournent en boucle sur le site
     ----------------------------------------------------------------------------
     POUR AJOUTER UNE CHANSON :
       1. Mets le fichier audio dans le dossier  assets/music/  (MP3 recommandé)
       2. Ajoute une ligne ci-dessous :
            { title: 'Titre', artist: 'Artiste', src: 'assets/music/mon-fichier.mp3' },
     POUR RETIRER UNE CHANSON : efface sa ligne (ou laisse-la en commentaire).
     Seul le webmaster gère cette playlist : les visiteurs du site ne peuvent
     ni ajouter ni retirer de titres.
     💡 Pour convertir un WAV : ffmpeg -i titre.wav -codec:a libmp3lame -b:a 192k titre.mp3
     ============================================================================ */
  PLAYLIST: [
    {
      title: 'Zina Blue - BAD',
      artist: 'Elmateco feat. Zina Blue',
      src: 'assets/music/zina-blue-bad.mp3'
    },
    {
      title: 'Zina Blue - For One Night',
      artist: 'Elmateco feat. Zina Blue',
      src: 'assets/music/zina-blue-for-one-night.mp3'
    }
  ]
};
