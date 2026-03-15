# Documentation — Pages HTML

> `index.html` (page d'accueil) et `skyrim.html` (checklist principale).

---

## index.html — Page d'accueil

### Rôle
Sélection, création et suppression de profils de personnages.
Redirige vers `skyrim.html` après sélection d'un profil.

### Structure du DOM

```
<body>
  <button class="lang-btn">               ← Bouton FR/EN (position: fixed, coin sup. droit)
  <main class="welcome-page">
    <div class="welcome-inner">           ← Boîte centrale (max-width: 560px)

      <div class="welcome-hero">          ← Logo + "CHECKLIST"
        <img class="welcome-logo">
        <p class="welcome-checklist-label">Checklist</p>

      <h1 id="welcomeTitle">             ← "Select a Character" (injecté par applyI18n())
      <div class="welcome-divider">      ← Ligne dorée décorative

      <div id="profileList">             ← Liste des profils (injectée par renderProfiles())
        <!-- Pour chaque profil :
        <div class="welcome-profile-card">
          <div class="welcome-card-info">
            <span class="welcome-card-name">NOM</span>
            <span class="welcome-card-meta">42% · créé le 14/03/2026</span>
          </div>
          <div class="welcome-card-actions">
            <button class="welcome-btn-play">▶ Jouer</button>
            <button class="welcome-btn-delete">✕</button>
          </div>
        </div>
        -->

      <div class="welcome-new-wrap">     ← Section nouveau personnage
        <p id="newCharLabel">New Character</p>
        <div class="welcome-divider">
        <div class="welcome-new-form">
          <input id="profileNameInput">  ← Champ de saisie du nom
          <button id="btnCreate">Create</button>
```

### Scripts inline (dans `<body>`)

Les scripts sont **inline** sur index.html (pas de `defer`) :
```html
<script src="script/i18n.js"></script>
<script src="script/profiles.js"></script>
<script>
  // Fonctions locales à cette page
  function escHtml(s) { ... }
  function applyI18n() { ... }
  function playProfile(id) { ... }
  function confirmDeleteProfile(id, name) { ... }
  function renderProfiles() { ... }
  function handleCreate() { ... }

  // Initialisation
  migrateV1IfNeeded(); // migration depuis l'ancienne version
  applyI18n();         // applique les traductions
  renderProfiles();    // affiche la liste des profils
</script>
```

### Fonctions locales

#### `applyI18n()`
Injecte les chaînes traduites dans les éléments statiques :
```js
document.getElementById('welcomeTitle').textContent   = t('selectTitle');
document.getElementById('newCharLabel').textContent   = t('newCharacter');
document.getElementById('profileNameInput').placeholder = t('placeholder');
document.getElementById('btnCreate').textContent      = t('btnCreate');
document.querySelector('.lang-btn').textContent       = t('langBtn');
```

#### `renderProfiles()`
Reconstruit `#profileList` avec la liste actuelle des profils.
Chaque carte appelle `playProfile(id)` ou `confirmDeleteProfile(id, name)`.

#### `playProfile(id)`
```js
function playProfile(id) {
  localStorage.setItem(ACTIVE_PROFILE_KEY, id);
  window.location.href = 'skyrim.html';
}
```
Enregistre le profil actif et redirige vers la checklist.

#### `handleCreate()`
Lit la valeur du `#profileNameInput`, crée le profil, redirige.
Déclenché par le bouton "Create" ou la touche Entrée.

---

## skyrim.html — Checklist principale

### Rôle
Page principale de l'app. Tout le contenu est généré par JavaScript (`app.js`).
Se redirige vers `index.html` si aucun profil actif.

### Structure du DOM

```
<body>
  <div class="app">                     ← Wrapper principal (height: 100vh)

    <!--── HEADER ──────────────────────────────────────────────────────-->
    <header class="topbar">

      <div class="topbar-head">         ← Ligne 1 : logo | titre | stats

        <div class="topbar-left">
          <img class="logo-title">      ← Logo Skyrim (webp)

        <div class="topbar-center">
          <h1 class="checklist-title">Checklist</h1>

        <div class="topbar-right">
          <a class="character-btn" id="characterBtn">  ← Nom du perso (→ index.html)
          <div class="topbar-right-pct">
            <span class="complete-label">Complete @</span>
            <span class="complete-pct" id="globalPct">0%</span>    ← mis à jour par renderStats()
          </div>
          <div class="storage-badge" id="storageBadge"> ← dot + "saved"
            <span class="dot">
            <span class="storage-label">localStorage</span>

      <div class="global-progress" id="globalProgress">  ← Barre de progression
        <div class="global-progress-fill" id="globalFill">  ← largeur = % coché

      <div class="tabs-row">
        <div class="search-lang-wrap">
          <button class="lang-btn" id="langBtn">  ← FR/EN
          <input class="search-input" id="searchInput">  ← Recherche globale
        <nav class="tabs-wrap" id="tabs">  ← Onglets (générés par renderTabs())

    <!--── CONTENU ─────────────────────────────────────────────────────-->
    <main class="content">
      <div class="list-scroll">
        <div id="itemList">  ← Reconstruit par renderList() à chaque action

    <!--── MODAL ───────────────────────────────────────────────────────-->
    <div id="infoModal" class="info-modal-overlay" onclick="closeInfoModal()">
      <div class="info-modal" onclick="event.stopPropagation()">
        <button class="info-modal-close" onclick="closeInfoModal()">✕</button>
        <div id="infoModalContent">  ← Injecté par openInfoModal(id)
```

### Chargement des scripts

```html
<script src="script/i18n.js" defer></script>                    <!-- 1er -->
<script src="script/profiles.js" defer></script>               <!-- 2e -->
<script src="script/data/quests.js" defer></script>            <!-- 3e -->
<script src="script/data/shouts.js" defer></script>            <!-- 4e -->
<script src="script/data/spells.js" defer></script>            <!-- 5e -->
<script src="script/data/enchanting.js" defer></script>        <!-- 6e -->
<script src="script/data/alchemy.js" defer></script>           <!-- 7e -->
<script src="script/data/achievements.js" defer></script>      <!-- 8e -->
<script src="script/data/index.js" defer></script>             <!-- 9e — expose CHECKLIST_DATA -->
<script src="script/app.js" defer></script>                    <!-- 10e — appelle init() -->
```

`defer` garantit que chaque script s'exécute **après le parsing du HTML complet**
et **dans l'ordre déclaré**.

### IDs DOM ciblés par app.js

| ID | Élément | Mis à jour par |
|---|---|---|
| `#itemList` | Conteneur principal des items | `renderList()` |
| `#tabs` | Nav des onglets | `renderTabs()` |
| `#globalPct` | "42%" | `renderStats()` |
| `#globalFill` | Barre de progression | `renderStats()` |
| `#globalProgress` | Barre (aria) | `renderStats()` |
| `#storageBadge` | Badge stockage | `setBadge()` |
| `#searchInput` | Champ de recherche | `init()` (événement input) |
| `#characterBtn` | Bouton nom du perso | `updateCharacterBtn()` |
| `#langBtn` | Bouton FR/EN | `init()` |
| `#infoModal` | Modal overlay | `openInfoModal()`, `closeInfoModal()` |
| `#infoModalContent` | Contenu du modal | `openInfoModal()` |
| `badge-{cat}` | Badge done/total sur onglet | `renderTabBadges()` |

---

## Optimisations de chargement

### Preload du logo
```html
<link rel="preload" href="assets/images/logos/logo_title.webp" as="image" fetchpriority="high" />
```
Le logo est l'image la plus visible au démarrage → préchargé en priorité maximale.

### Preload des polices Google (non-bloquant)
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preload" as="style" href="..." onload="this.onload=null;this.rel='stylesheet'" />
<noscript><link href="..." rel="stylesheet" /></noscript>
```
1. `preconnect` — DNS + TCP en avance
2. `preload as="style"` — télécharge la CSS sans bloquer
3. `onload` — l'applique quand disponible
4. `<noscript>` — fallback si JavaScript désactivé

### Images dans les items
```html
<img loading="lazy" />
```
Toutes les images des items (knotworks, icônes) ont `loading="lazy"` : chargées
seulement quand elles entrent dans le viewport.
