# 🎧 ELMATECO — Site one-page (motion design)

Site web d'une seule page pour promouvoir l'artiste YouTube **ELMATECO** :
<https://www.youtube.com/@ELMATEKO>

Le site est **en anglais par défaut**, avec un bouton **🌐 ENG** en haut à
droite qui ouvre un sélecteur de **25 langues** (malais, tagalog et les
grandes langues d'Europe). Le choix du visiteur est mémorisé.

## 🚀 Ouvrir le site

Double-clique sur **`index.html`** — ça marche directement dans le navigateur
(aucun serveur requis). Pour le publier, mets tous les fichiers du dossier sur
n'importe quel hébergeur statique (GitHub Pages, Netlify, Vercel, OVH…).

## ☁️ Versioning / hébergement (GitHub)

Le projet est versionné sur GitHub (dépôt privé) :
<https://github.com/VibeCoderGPT/elmateco.com>

- **Télécharger le site complet** : page du dépôt → bouton vert **Code → Download ZIP**
  (GitHub fabrique le ZIP tout seul, musique incluse — pratique pour envoyer à un ami).
- **Cloner** : `git clone https://github.com/VibeCoderGPT/elmateco.com.git`
- Les MP3 de la playlist sont inclus dans le dépôt (`assets/music/`).

### 📤 Pousser une mise à jour sur GitHub

Après avoir modifié des fichiers, double-clique sur **`push-to-github.cmd`** :
le script envoie tout sur GitHub. La première fois, une fenêtre de connexion
GitHub s'ouvre — connecte-toi une fois, Windows s'en souvient.

> 💡 Le ZIP « elmateco-site.zip » n'est plus nécessaire : GitHub fournit le
> bouton **Code → Download ZIP**, toujours à jour.

## 📄 Ce qu'il contient

| Section | Description |
| --- | --- |
| **Hero** | Bannière officielle dans un cadre néon (jamais zoomée → toujours nette), photo de profil en anneau rotatif, stats animées |
| **🎬 Nouveau clip** | Le dernier clip YouTube avec gros bouton play (clic → lecture dans la page). En dessous : les 6 dernières sorties de la chaîne |
| **🎵 Musique en continu** | Les chansons s'enchaînent toutes seules, en boucle. Boutons lecture/pause, précédent/suivant, aléatoire, volume, barre de progression |
| **✨ À propos** | Bio, stats et liens (YouTube, Spotify, Apple Music, Amazon Music, TikTok, HyperFollow) |
| **🌐 Langues** | Bouton ENG (haut à droite) → menu animé de 25 langues : EN, FR, ES, DE, IT, PT, NL, PL, SV, DA, NO, FI, CS, RO, EL, HU, TR, UK, RU, BG, HR, SR, CA, MS (malais), TL (tagalog) |

## 🌐 Modifier les traductions

Tous les textes de l'interface sont dans **`js/i18n.js`** (section `STR`,
une clé par texte, 25 langues). Pour changer un texte :

1. Ouvre `js/i18n.js`
2. Trouve la clé (ex. `music_h2: 'The music plays on loop'`)
3. Modifie la valeur dans la ou les langues voulues

Les âges (« 3 days ago ») et les nombres (23.1 K, 1.2 K…) sont localisés
automatiquement par le navigateur (`Intl`) : rien à traduire pour eux.

## 🎵 Ajouter ou retirer des chansons

### Pour de bon (permanent)

1. Mets ton fichier audio (mp3 de préférence) dans le dossier **`assets/music/`**
2. Ouvre **`js/config.js`** et édite la section `PLAYLIST` :

```js
PLAYLIST: [
  { title: 'Zina Blue - BAD', artist: 'Elmateco feat. Zina Blue', src: 'assets/music/zina-blue-bad.mp3' },
  { title: 'Zina Blue - For One Night', artist: 'Elmateco feat. Zina Blue', src: 'assets/music/zina-blue-for-one-night.mp3' },
  // 👇 ajoute tes titres ici :
  { title: 'Mon nouveau titre', artist: 'Elmateco', src: 'assets/music/mon-titre.mp3' },
]
```

> 💡 Préfère des fichiers **MP3** (lisibles partout). Pour convertir un WAV :
> `ffmpeg -i titre.wav -codec:a libmp3lame -b:a 192k titre.mp3`

Pour **retirer** une chanson : efface simplement sa ligne.

> 🔒 Seul le webmaster gère la playlist (via ce fichier). Les visiteurs du site
> ne peuvent ni ajouter ni retirer de chansons — ils voient simplement la
> playlist et contrôlent la lecture.

### 🌍 Option : playlist distante (Supabase / JSON hébergé)

Si tu veux modifier la playlist **sans toucher au code** (ex. depuis un
dashboard Supabase), remplis `REMOTE_PLAYLIST_URL` dans `js/config.js` :

```js
REMOTE_PLAYLIST_URL: 'https://VOTREPROJET.supabase.co/rest/v1/songs?select=title,artist,src&order=position',
```

Le lecteur charge alors la playlist en ligne au démarrage (tableau JSON de
`{ title, artist, src }`, ou objet avec une clé `PLAYLIST`). Les MP3 doivent
être hébergés en HTTPS (Storage Supabase, hébergeur…). Si le chargement
échoue, le site retombe silencieusement sur la playlist locale.

## 🎬 Le nouveau clip + dernières sorties (mise à jour AUTOMATIQUE)

Le site suit la chaîne YouTube **tout seul** : au chargement, il lit le flux
officiel de la chaîne (RSS `https://www.youtube.com/feeds/videos.xml?channel_id=…`)
et affiche **la vidéo la plus récente** en vedette + les 6 suivantes. Résultat
mis en cache 1 heure (localStorage), donc aucune maintenance quand tu sors un
nouveau clip.

- Si le flux est inaccessible (hors ligne, proxy indisponible), le site retombe
  sur les données statiques de `js/config.js` (`latestVideo` + `recentVideos`)
  — utile uniquement comme filet de secours.
- Pour changer la chaîne : modifie `channelId` dans `js/config.js`.
- La miniature se règle toute seule : `maxresdefault` → `sddefault` → `hqdefault`.

## 🖼️ Images

Le profil et la bannière sont chargés depuis le CDN officiel de YouTube
(`yt3.googleusercontent.com`) : ce sont les vraies images de la chaîne, et elles
se mettent à jour si l'artiste les change. La bannière est affichée dans son
cadre **sans aucun agrandissement**, donc elle reste nette. Le site a besoin
d'une connexion internet (comme pour le lecteur YouTube).

## 🛠️ Fichiers

```
index.html        → la page (tout est là)
css/style.css     → design + animations (motion design)
js/config.js      → ⚙️ TOUTE la config : playlist, clip, liens, images, playlist distante
js/i18n.js        → 🌐 les 25 langues + le sélecteur de langue
js/main.js        → navigation, révélations, particules, compteurs, vidéo
js/player.js      → lecteur musical en continu + playlist (locale ou distante)
assets/music/     → les chansons
```

## ✅ Vérification rapide (optionnel, si Node est installé)

```
node _check.js
```

Vérifie que les 25 langues sont complètes, que toutes les clés de traduction
existent et que les IDs du HTML correspondent au JavaScript.

## ♿ Accessibilité

- Navigation clavier sur tous les boutons interactifs
- `prefers-reduced-motion` respecté : les animations sont réduites au minimum
- Contenus `aria-label` sur les contrôles audio/vidéo

---

*© ELMATECO. Tous droits réservés — la musique, les images et tout le contenu de ce site sont la propriété exclusive d'ELMATECO.*
