# Guide Principal — Skyrim AE Checklist

> Documentation hors-ligne complète. Dernière mise à jour : 2026-03-14.

---

## Table des matières

| Fichier doc | Ce qu'il explique |
|---|---|
| [index-html.md](index-html.md) | Page d'accueil (sélection de profils) |
| [skyrim-html.md](skyrim-html.md) | Page principale de la checklist |
| [app-js.md](app-js.md) | Logique principale — le cœur de l'app |
| [profiles-js.md](profiles-js.md) | Gestion des profils de personnages |
| [i18n-js.md](i18n-js.md) | Internationalisation FR / EN |
| [data-js.md](data-js.md) | Données des items + traductions FR |
| [style-css.md](style-css.md) | Tout le CSS, section par section |
| [comment-ajouter.md](comment-ajouter.md) | Guide pratique pour ajouter des données |

---

## Architecture en un coup d'œil

```
skyrim_project/
├── index.html          ← Page d'accueil (profils)
├── skyrim.html         ← Checklist principale
├── css/
│   └── style.css       ← Tout le CSS (thème sombre doré)
├── script/
│   ├── i18n.js         ← Traductions FR/EN (chargé en premier)
│   ├── profiles.js     ← CRUD profils + localStorage (chargé en 2e)
│   ├── data.js         ← Données brutes CHECKLIST_DATA (chargé en 3e)
│   ├── data_fr.js      ← Noms FR + mots dragon FR (chargé en 4e)
│   └── app.js          ← Logique complète (chargé en dernier)
├── assets/
│   ├── fonts/          ← FuturaCondensed.ttf + Dragon_script.ttf
│   └── images/
│       ├── logos/      ← logo_title.webp + favicon.ico
│       ├── knotworks/  ← Bandeaux de groupes de quêtes (WebP)
│       ├── schools/    ← Icônes écoles de magie (*_2.webp)
│       ├── spells/     ← Icônes de sorts (WebP)
│       ├── craftings/  ← alchemy.webp + enchanting.webp
│       ├── ingredients/← Icônes ingrédients 64px (WebP)
│       └── potions/    ← Icônes potions/poisons (WebP)
└── docs/               ← CE DOSSIER — documentation hors-ligne
```

---

## Flux de données (comment tout s'enchaîne)

```
Utilisateur ouvre index.html
    ↓
Choisit / crée un profil → localStorage: skyrim_active_profile = 'profile_xxx'
    ↓
Redirigé vers skyrim.html
    ↓
app.js → init()
    ├── Lit activeProfileId depuis localStorage
    ├── Redirige vers index.html si aucun profil valide
    ├── Charge checked = JSON.parse(localStorage['skyrim_checklist_xxx'])
    ├── initCollapsedGroups() — tous les groupes repliés
    ├── renderTabs()      — génère les boutons d'onglets
    ├── renderStats()     — met à jour le % global + barre
    ├── renderList()      — génère la liste d'items
    └── Branche événements (search, Échap)

Utilisateur coche un item → toggle(id)
    ├── checked[id] = true / delete checked[id]
    ├── save() → localStorage (debounce 600ms)
    ├── renderList()
    ├── renderStats()
    └── renderTabBadges()
```

---

## Ordre de chargement des scripts (IMPORTANT)

Les scripts dans `skyrim.html` sont chargés avec `defer` dans cet ordre :
```html
<script src="script/i18n.js" defer></script>      <!-- 1er — t(), getLang(), toggleLang() -->
<script src="script/profiles.js" defer></script>   <!-- 2e — getProfiles(), ACTIVE_PROFILE_KEY -->
<script src="script/data.js" defer></script>       <!-- 3e — CHECKLIST_DATA -->
<script src="script/data_fr.js" defer></script>    <!-- 4e — DATA_FR_NAMES, DATA_FR_WORDS -->
<script src="script/app.js" defer></script>        <!-- 5e — tout le reste, appelle init() -->
```
⚠️ **Ne jamais changer cet ordre.** app.js dépend de tout ce qui précède.

---

## Persistance localStorage

| Clé | Contenu | Qui écrit | Qui lit |
|---|---|---|---|
| `skyrim_profiles_v1` | `[{id, name, createdAt}]` | profiles.js | profiles.js |
| `skyrim_active_profile` | `'profile_xxx'` | index.html | app.js |
| `skyrim_checklist_{id}` | `{[id]: true}` | app.js | app.js |
| `skyrim_total_items` | `'1435'` (nombre total d'items) | app.js | profiles.js (pour %) |
| `skyrim_lang` | `'en'` ou `'fr'` | i18n.js | i18n.js |

---

## Palettes & typographies

### Polices
| Famille | Fichier | Utilisée pour |
|---|---|---|
| `FuturaCondensed` | `assets/fonts/Futura Condensed.ttf` | Titres, onglets, headers |
| `DragonscriptRegular` | `assets/fonts/Dragon_script.ttf` | Mots draconiques (Dragon Shouts) |
| `DM Mono` | Google Fonts | Labels, badges, code |
| `Syne` | Google Fonts | Corps de texte |

### Variables CSS clés (dans `:root`)
```css
--bg        : #0d0d0f  /* fond de page */
--surface   : #141417  /* topbar, modal */
--surface2  : #1a1a1e  /* hover, inputs */
--border    : #2a2a30  /* bordures fines */
--text      : #e8e6f0  /* texte principal */
--gold-1    : #a8885a  /* bronze chaud */
--gold-2    : #c9a55a  /* or principal */
--gold-3    : #9a7830  /* or moyen */
--gold-4    : #5c420a  /* or profond */
--gold-gradient : linear-gradient(180deg, ...) /* dégradé doré vertical */
--gold-line     : linear-gradient(90deg, ...)  /* ligne décorative large */
--gold-line-short : ...                        /* ligne décorative courte */
```

---

## IDs des items (séquentiels, jamais réutilisés)

| Plage | Contenu |
|---|---|
| 1 – 657 | Quêtes (Main Quest → Creation Club) |
| 658 – 738 | Dragon Shouts (81 mots) |
| 739 – 908 | Spells (sorts) |
| 909 – 961 | Enchanting Effects |
| 962 – 1144 | Alchemy Ingredients |
| 1145 – 1356 | Potions |
| 1357 – 1435 | Poisons |
| **Prochain** | **1436** |

---

## Règles de code à respecter

1. **`escHtml(str)`** — obligatoire sur toute chaîne insérée dans `innerHTML`
2. **`escJs(str)`** — obligatoire sur les noms de groupes dans les attributs `onclick`
3. **CSS mobile-first** — jamais de `max-width`, toujours `min-width`
4. **Pas de git push automatique** — seulement sur demande explicite
5. **IDs uniques et séquentiels** — ne jamais réutiliser un ID supprimé

---

## Catégories de la checklist (ordre des onglets)

```js
'Quests'              → onglet "Quests" / "Quêtes"
'Dragon Shouts'       → onglet "Shouts" / "Cris"
'Spells'              → onglet "Spells" / "Sorts"
'Enchanting Effects'  → onglet "Enchantments" / "Enchantements"
'Alchemy Ingredients' → onglet "Alchemy" / "Alchimie"
'Books'               → onglet "Books" / "Livres"          [placeholder]
'Perks'               → onglet "Perks" / "Atouts"          [placeholder]
'Collectible'         → onglet "Collectibles" / "Collections" [vide]
'Unique Gear'         → onglet "Unique Gears" / "Artéfacts"  [vide]
'Locations'           → onglet "Locations" / "Lieux"          [vide]
'Merchants'           → onglet "Merchants" / "Marchands"      [vide]
'Recruitable Followers' → onglet "Followers" / "Compagnons"   [vide]
'Achievements'        → onglet "Achievements" / "Succès"      [vide]
```
