/* Vérification croisée : i18n complet + IDs HTML/JS cohérents */
'use strict';
const fs = require('fs');

// 1. Charger les traductions
const i18nSrc = fs.readFileSync('js/i18n.js', 'utf8');
const sandbox = {
  window: {},
  document: {
    readyState: 'complete',
    getElementById: function () { return null; },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    addEventListener: function () {},
    dispatchEvent: function () {},
    documentElement: { lang: 'en', classList: { add: function () {}, remove: function () {} } },
    createElement: function () { return { setAttribute: function () {}, appendChild: function () {}, classList: { add: function () {}, remove: function () {} } }; },
    body: { appendChild: function () {} },
    title: ''
  },
  localStorage: { getItem: function () { return null; }, setItem: function () {} },
  CustomEvent: function () {},
  matchMedia: function () { return { matches: false }; },
  setTimeout: function () { return 0; },
  clearTimeout: function () {}
};
sandbox.window = sandbox;
sandbox.window.I18N = undefined;
const vm = require('vm');
const ctx = vm.createContext(sandbox);
try { vm.runInContext(i18nSrc, ctx); } catch (e) { console.error('ERREUR i18n.js :', e.message); process.exit(1); }
const STR = sandbox.I18N.STR;
const LANGS = sandbox.I18N.LANGS;
const langs = LANGS.map(l => l.code);
const enKeys = Object.keys(STR.en).sort();
console.log('Langues déclarées :', langs.length, langs.join(', '));
console.log('Clés (en) :', enKeys.length);

let ok = true;
for (const code of langs) {
  if (!STR[code]) { console.error('MANQUE la langue :', code); ok = false; continue; }
  const missing = enKeys.filter(k => !(k in STR[code]));
  const extra = Object.keys(STR[code]).filter(k => !enKeys.includes(k));
  if (missing.length) { console.error('  ' + code + ' — clés manquantes :', missing.join(', ')); ok = false; }
  if (extra.length) { console.error('  ' + code + ' — clés en trop :', extra.join(', ')); ok = false; }
}

// 2. Vérifier que chaque data-i18n / data-i18n-key du HTML existe dans STR.en
const html = fs.readFileSync('index.html', 'utf8');
const used = new Set();
const re1 = /data-i18n="([^"]+)"/g; let m;
while ((m = re1.exec(html))) used.add(m[1]);
const re2 = /data-i18n-key="([^"]+)"/g;
while ((m = re2.exec(html))) used.add(m[1]);
const htmlMissing = [...used].filter(k => !enKeys.includes(k));
if (htmlMissing.length) { console.error('HTML → clés absentes du i18n :', htmlMissing.join(', ')); ok = false; }
else console.log('HTML : toutes les clés data-i18n existent ✓');

// 3. Clés utilisées par le JS
const js = ['js/main.js', 'js/player.js', 'js/i18n.js'].map(f => fs.readFileSync(f, 'utf8')).join('\n');
const jsKeys = new Set();
const re3 = /\bt\('([a-z0-9_]+)'\)/g;
while ((m = re3.exec(js))) jsKeys.add(m[1]);
const jsMissing = [...jsKeys].filter(k => !enKeys.includes(k));
if (jsMissing.length) { console.error('JS → clés absentes du i18n :', jsMissing.join(', ')); ok = false; }
else console.log('JS : toutes les clés t() existent ✓');

// 4. IDs référencés par les JS existent dans le HTML
const ids = new Set();
const reId = /id="([a-zA-Z0-9_-]+)"/g;
while ((m = reId.exec(html))) ids.add(m[1]);
for (const f of ['js/main.js', 'js/player.js']) {
  const src = fs.readFileSync(f, 'utf8');
  const reGet = /\$\('([a-zA-Z0-9_-]+)'\)/g;
  while ((m = reGet.exec(src))) {
    if (!ids.has(m[1])) { console.error('ID manquant dans le HTML :', m[1], '(dans ' + f + ')'); ok = false; }
  }
}
console.log('IDs : vérification terminée ✓');

console.log(ok ? '\n✅ TOUT EST OK' : '\n❌ ERREURS TROUVÉES');
process.exit(ok ? 0 : 1);
