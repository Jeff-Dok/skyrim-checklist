# Documentation — css/style.css

> Tout le CSS en un seul fichier. Thème sombre inspiré de Skyrim.
> **Approche mobile-first** (legacy desktop-first en place, à migrer progressivement).
> Sections numérotées 1–19.

---

## Polices

| Famille CSS | Fichier source | Utilisée pour |
|---|---|---|
| `FuturaCondensed` | `assets/fonts/Futura Condensed.ttf` | Titres, onglets, headers de groupe, boutons |
| `DragonscriptRegular` | `assets/fonts/Dragon_script.ttf` | Mots draconiques uniquement |
| `DM Mono` | Google Fonts (preload) | Labels monospace, badges, métadonnées |
| `Syne` | Google Fonts (preload) | Corps de texte général |

### Chargement des polices Google
Stratégie non-bloquante dans le `<head>` :
```html
<link rel="preload" as="style" href="..." onload="this.rel='stylesheet'"/>
<noscript><link rel="stylesheet" href="..."/></noscript>
```
Charge la feuille de style sans bloquer le rendu initial.

---

## Variables CSS (`:root`)

### Fonds & surfaces
```css
--bg:        #0d0d0f   /* fond de page principal */
--surface:   #141417   /* topbar, fond du modal */
--surface2:  #1a1a1e   /* hover sur items, inputs */
--border:    #2a2a30   /* bordures très subtiles */
--border2:   #3a3a44   /* bordures en état actif/hover */
```

### Texte
```css
--text:      #e8e6f0   /* texte principal (items, labels) */
--muted:     #5a5870   /* texte secondaire (descriptions) */
--muted2:    #7a7890   /* métadonnées profils */
--done-text: #44424f   /* texte barré quand item coché */
--danger:    #ff5c6a   /* rouge erreur storage */
```

### Palette dorée (4 tons)
```css
--gold-1: #a8885a   /* bronze chaud — début du dégradé */
--gold-2: #c9a55a   /* or brillant — couleur principale */
--gold-3: #9a7830   /* or moyen — bordures, labels discrets */
--gold-4: #5c420a   /* or profond / ombré — fin du dégradé */
```

### Dégradés partagés
```css
--gold-gradient   : linear-gradient(180deg, #a8885a 0%, #c9a55a 40%, #9a7830 70%, #5c420a 100%)
/* Utilisé pour : textes titre, % completion, knotwork-pct, onglet actif, etc. */

--gold-line       : linear-gradient(90deg, transparent, #9a7830 30%, #c9a55a 50%, #9a7830 70%, transparent)
/* Utilisé pour : act-section-header lignes décoratives (large, "point lumineux" central) */

--gold-line-short : linear-gradient(90deg, transparent, #9a7830, transparent)
/* Utilisé pour : act-col-header et daedric-prince lignes courtes */
```

---

## Section 3 — Base

### `body`
- `background-color: var(--bg)` — fond noir
- `font-family: 'Syne', sans-serif` — police par défaut
- `display: flex; flex-direction: column; min-height: 100vh`

### `body::before` — Overlay de grain
```css
body::before {
  content: '';
  position: fixed; inset: 0;
  background-image: url("data:image/svg+xml,...fractalNoise...");
  pointer-events: none;  /* ne capte pas les clics */
  opacity: 0.04;
  z-index: 0;
}
```
Texture SVG `fractalNoise` superposée sur tout le fond pour casser le noir plat.

---

## Section 4 — Layout principal

### `.app`
```css
.app {
  position: relative; z-index: 1;
  display: flex; flex-direction: column;
  height: 100vh; overflow: hidden;  /* empêche le scroll de la page */
}
```
L'unique wrapper de `skyrim.html`. Column flex qui remplit le viewport.
Le scroll est géré par `.list-scroll` à l'intérieur de `.content`.

---

## Section 5 — Header (topbar)

### `.topbar`
```css
.topbar {
  flex-shrink: 0;          /* ne se compresse pas */
  padding: 12px 14px 0;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}
```
Contient 3 niveaux :
1. `.topbar-head` — logo | "Checklist" | % + badge
2. `.global-progress` — barre de progression 2px
3. `.tabs-row` — recherche + onglets

### `.topbar-head`
```css
.topbar-head {
  position: relative;
  display: flex; align-items: center; justify-content: space-between;
}
```
- `.topbar-left` — `flex: 1` → logo
- `.topbar-center` — `position: absolute; left: 50%; transform: translateX(-50%)` → titre centré
- `.topbar-right` — `flex: 1; align-items: flex-end` → %, badge, character-btn

### `.checklist-title`
```css
font-family: 'FuturaCondensed';
font-size: clamp(36px, 5vw, 64px);  /* fluide entre 36px et 64px */
background: var(--gold-gradient);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```
Texte "Checklist" avec dégradé doré. `clamp()` pour taille responsive sans media query.

---

## Section 6 — Barre de progression globale

### `.global-progress` + `.global-progress-fill`
```css
.global-progress { height: 2px; background: var(--border); }
.global-progress-fill {
  height: 100%;
  background: var(--gold-gradient);
  transition: width .4s ease;  /* animation fluide */
  /* width défini en inline style par renderStats() */
}
```

---

## Section 7 — Onglets

### `.tabs-row`
```css
/* Mobile : 1 colonne (search + lang sur une ligne, tabs en dessous) */
.tabs-row { display: grid; grid-template-columns: 1fr; gap: 8px; }

/* Tablette (600px) : 2 colonnes [230px] [reste] */
@media (min-width: 600px) {
  .tabs-row { grid-template-columns: 230px 1fr; }
}

/* Desktop (900px) : [270px] [reste] */
@media (min-width: 900px) {
  .tabs-row { grid-template-columns: 270px 1fr; }
}
```

### `.tab-btn`
Bouton d'onglet inactif : fond `--surface`, bordure `--border`.
Bouton actif `.active` : fond `var(--gold-gradient)`, texte sombre `#1a1208`.

### `.tab-badge` — Compteur done/total
```css
.tab-badge {
  font-size: 10px; color: #9090a8; /* WCAG AA : contraste 5.7:1 */
  font-family: 'DM Mono'; text-transform: none;
}
.tab-btn.active .tab-badge { color: #7a5820; } /* sombre sur fond doré */
```

---

## Section 8 — Zone de contenu

### `.content`
```css
.content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
```
Remplit l'espace sous le topbar. Le débordement est contrôlé par `.list-scroll`.

### `.list-scroll`
```css
.list-scroll {
  flex: 1; overflow-y: scroll;
  padding: 4px 10px 40px;  /* mobile */
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}
/* Desktop */
@media (min-width: 900px) { .list-scroll { padding: 0 28px 40px; } }
```

---

## Section 9 — Recherche

### `.search-input`
```css
.search-input {
  background: var(--surface2); border: 1px solid var(--border);
  font-family: 'DM Mono'; font-size: 13px; padding: 9px 14px;
}
.search-input:focus {
  border-color: var(--gold-2);
  box-shadow: 0 0 0 2px rgba(169,136,90,.35), 0 0 8px rgba(201,165,90,.15);
}
```

### `.search-results-wrap`
```css
/* Desktop : limité à 25vw centré pour un affichage compact */
.search-results-wrap { width: 25vw; min-width: 260px; margin: 0 auto; }
```

### `.search-cat-label`
En-tête de catégorie dans les résultats (ex: "QUÊTES", "SORTS").
FuturaCondensed, 11px, couleur `--muted`, bordure bottom.

---

## Section 10 — Groupes

### `.group`
Simple conteneur avec `margin-bottom: 4px`.

### `.group-header`
```css
.group-header {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; cursor: pointer;
  border-radius: 8px; transition: background .15s;
}
```
Variante **avec knotwork** (quêtes) :
```css
.group-header:has(.group-knotwork-wrap) {
  background: #000; border-radius: 12px; padding: 10px;
  display: block; position: relative;
}
/* Pas de hover highlight sur fond noir */
.group-header:has(.group-knotwork-wrap):hover { background: #000; }
```

### `.group-knotwork-wrap`
Position relative pour overlay du texte `%` par-dessus l'image.
Variante `.no-img` : flex centré, sans image.

### `.group-knotwork-pct`
```css
.group-knotwork-pct {
  position: absolute; left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  font-family: 'FuturaCondensed';
  font-size: clamp(20px, 2.5vw, 34px);
  background: var(--gold-gradient); /* texte en dégradé doré */
  -webkit-text-fill-color: transparent;
  pointer-events: none;
}
```

### `.knotwork-pct-value`
La partie "— X%" du texte knotwork.
Masquée sur mobile (`display: none`), visible dès tablette.

### `.group-knotwork`
```css
.group-knotwork {
  width: 100%; height: auto; max-height: 70px;
  object-fit: contain;
}
```

---

## Section 11 — Grilles de sections

### `.story-radiant-wrap`
```css
/* Mobile : colonne */
.story-radiant-wrap { display: flex; flex-direction: column; }
.story-section  { flex: 0 0 100%; }
.radiant-section { flex: 0 0 100%; }

/* Tablette+ : story 25% | radiant 75% côte à côte */
@media (min-width: 600px) {
  .story-radiant-wrap { flex-direction: row; gap: 16px; }
  .story-section  { flex: 0 0 25%; }
  .radiant-section { flex: 0 0 75%; }
}
```

### `.acts-grid`
```css
/* Mobile : 1 colonne */
.acts-grid { display: grid; grid-template-columns: 1fr; }
/* Tablette : 2 colonnes */
@media (min-width: 600px) { .acts-grid { grid-template-columns: repeat(2, 1fr); } }
/* Desktop : 3 colonnes */
@media (min-width: 900px) { .acts-grid { grid-template-columns: repeat(3, 1fr); } }
```

### `.act-divider`
Séparateur entre actes dans les listes plates (mode replié/fallback).
Ligne horizontale avec texte centré en DM Mono gris.

---

## Section 12 — Headers de colonnes/sections (PARTAGÉS)

**4 éléments partagent la même structure visuelle** :
```css
.act-col-header,
.act-section-header,
.daedric-prince,
.search-group-label {
  display: flex; align-items: center; gap: 8px;
  font-family: 'FuturaCondensed';
  font-size: 22px; letter-spacing: 0.12em; text-transform: uppercase;
  background: var(--gold-gradient);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
```

**Lignes décoratives** via `::before` / `::after` :
- `.act-section-header` → `--gold-line` (large avec point lumineux central)
- `.act-col-header`, `.daedric-prince`, `.search-group-label` → `--gold-line-short` (courte)

⚠️ Les pseudo-éléments héritent de `-webkit-text-fill-color: transparent`.
Il faut reset avec `background: ...; -webkit-text-fill-color: initial;` pour que la
ligne soit visible.

---

## Section 13 — Items

### `.item`
```css
.item { border-radius: 8px; transition: background .15s; }
.item:hover { background: var(--surface2); }
.item.done  { opacity: .5; }  /* 50% transparence si coché */
```

### `.item-label`
```css
.item-label {
  display: flex; align-items: center; gap: 10px;
  padding: 7px 10px; cursor: pointer; width: 100%;
}
```

### Checkbox personnalisée
Structure HTML :
```html
<span class="cb-wrap">
  <input type="checkbox" />  <!-- masqué (display:none) -->
  <span class="cb-box"></span>  <!-- carré visuel 16×16px -->
</span>
```
Quand coché :
```css
.cb-wrap input:checked + .cb-box {
  background: linear-gradient(135deg, gold-1, gold-2, gold-3);
}
.cb-wrap input:checked + .cb-box::after {
  transform: rotate(45deg) scale(1);  /* coche animée apparaît */
}
```

### `.item-name`
```css
.item-name { font-size: 16px; word-break: break-word; }
.item.done .item-name { color: var(--done-text); text-decoration: line-through; }
```

### `.item-sub` — Sous-texte compact
```css
/* Masqué mobile, visible desktop */
.item-sub { display: none; font-family: 'DM Mono'; font-size: 10px; }
@media (min-width: 900px) { .item-sub { display: inline; } }
```

### `.info-btn` — Bouton ⓘ
```css
.info-btn {
  background: none; border: none; color: var(--gold-3);
  font-size: 20px; cursor: pointer; margin-left: auto;
  transition: color .15s, transform .15s;
}
.info-btn:hover { color: var(--gold-2); transform: scale(1.15); }
```

---

## Section 14 — Storage Badge

```css
/* Trois états contrôlés par data-state */
.storage-badge[data-state="saved"]  .dot { background: #44ff99; }  /* vert */
.storage-badge[data-state="saving"] .dot { background: #ffd84d; animation: pulse-dot .6s ...; }
.storage-badge[data-state="error"]  .dot { background: var(--danger); }  /* rouge */
```

---

## Section 15 — Modal d'information

### `.info-modal-overlay`
```css
/* Caché par défaut */
.info-modal-overlay { position: fixed; inset: 0; opacity: 0; pointer-events: none; }
/* Visible avec .open */
.info-modal-overlay.open { opacity: 1; pointer-events: all; }
```

### `.info-modal`
```css
.info-modal {
  background: var(--surface);
  border: 1px solid var(--gold-3);
  border-radius: 12px; padding: 28px 20px;
  width: min(640px, 92vw);  /* max 640px, min 92% viewport */
  transform: translateY(12px);  /* légèrement décalé vers le bas */
  transition: transform .2s;
}
.info-modal-overlay.open .info-modal { transform: translateY(0); }  /* slide up */
```

### `.info-row` — Rangée label + valeur
```css
.info-row   { display: flex; flex-direction: column; gap: 4px; }
.info-label { font-family: 'DM Mono'; font-size: 11px; color: var(--gold-3); text-transform: uppercase; }
.info-val   { font-size: 15px; color: var(--text); line-height: 1.5; }
/* Desktop */
@media (min-width: 600px) { .info-val { font-size: 17px; } }
```

---

## Section 16 — Rendus spéciaux

### 16a. Daedric Grid
```css
/* Mobile : 1 colonne → Desktop : 4 colonnes */
.daedric-grid { display: grid; grid-template-columns: 1fr; }
@media (min-width: 900px) { .daedric-grid { grid-template-columns: repeat(4, 1fr); } }
.daedric-card.done { opacity: 0.4; }
```

### 16b. Dragon Shouts
```css
.word-en::before { content: '('; }
.word-en::after  { content: ')'; }
.word-dragon { font-family: 'DragonscriptRegular'; font-size: 20px; }
```

### 16c. Spells
```css
.spell-icon { width: 28px; height: 28px; border-radius: 50%; }

/* Filtres couleur par école (CSS filter pour teinter l'icône) */
.spell-school-destruction .spell-school-icon { filter: brightness(2) sepia(1) hue-rotate(340deg) saturate(6); } /* rouge */
.spell-school-conjuration .spell-school-icon  { filter: brightness(2) sepia(1) hue-rotate(205deg) saturate(5); } /* violet */
.spell-school-alteration .spell-school-icon   { filter: brightness(2) sepia(1) hue-rotate(50deg)  saturate(4); } /* vert */
.spell-school-restoration .spell-school-icon  { filter: brightness(4) sepia(1) hue-rotate(30deg)  saturate(1.5); } /* blanc chaud */
.spell-school-illusion .spell-school-icon     { filter: brightness(2) sepia(1) hue-rotate(270deg) saturate(4); } /* violet clair */
```

### 16d. Enchanting Effects
```css
/* Desktop : 1 colonne (assez large sans multi-colonnes) */
.enchant-grid { display: grid; grid-template-columns: 1fr; gap: 2px 8px; }
```

### 16e. Alchemy Ingredients
```css
/* Desktop : 1 colonne */
.alchemy-grid { display: grid; grid-template-columns: 1fr; }
.alchemy-img  { width: 44px; height: 44px; }  /* 56px desktop */

/* Potions — sous-headers Health/Magicka/Stamina/Skill */
.potion-subgroup-header { background: #000; border-radius: 10px; }
.potion-sub-name { font-family: 'FuturaCondensed'; background: var(--gold-gradient); }

/* Sous-sous-header de type (Fortify Alteration, etc.) */
.potion-type-header { border-left: 2px solid var(--gold-2); opacity: 0.6; }
```

---

## Section 17 — Profils

### `.lang-btn`
```css
/* Dans .search-lang-wrap sur skyrim.html */
.lang-btn { border: 1px solid var(--gold-3); color: var(--gold-2); }

/* Sur index.html : enfant direct de body → position fixe */
body > .lang-btn { position: fixed; top: 14px; right: 14px; z-index: 100; }
```

### `.character-btn`
Bouton de retour vers index.html. Affiche le nom du personnage actif.
```css
.character-btn {
  max-width: 110px; overflow: hidden; text-overflow: ellipsis;
  white-space: nowrap;  /* ... si le nom est long */
  text-decoration: none;  /* c'est un <a> pas un <button> */
}
```

---

## Section 18 — État vide

```css
.empty { text-align: center; padding: 60px 0; color: var(--muted); }
.empty-icon { display: block; font-size: 32px; opacity: .3; }
```
Affiché quand catégorie vide ou aucun résultat de recherche.

---

## Section 19 — Responsive (mobile-first)

### Breakpoints
| Taille | Media query | Cible |
|---|---|---|
| Base | (aucune) | Mobile ≤ 599px |
| Tablette | `@media (min-width: 600px)` | Tablette + |
| Desktop | `@media (min-width: 900px)` | Desktop + |

### Ce qui change à 600px (tablette)
- `.complete-label` et `.storage-label` → visibles (`display: inline`)
- `.knotwork-pct-value` (le "— X%") → visible
- `.tabs-row` → 2 colonnes `230px 1fr`
- `.story-radiant-wrap` → story (25%) + radiant (75%) côte à côte
- `.acts-grid` → 2 colonnes
- Modal → padding plein + texte 17px

### Ce qui change à 900px (desktop)
- `.tabs-row` → `270px 1fr`
- `.item-sub` → visible (`display: inline`)
- `.acts-grid` → 3 colonnes
- `.daedric-grid` → 4 colonnes
- `.info-btn` → 15px (réduit légèrement)
- `.alchemy-img` → 56px

---

## Règle CSS mobile-first (OBLIGATOIRE pour nouveau code)

```css
/* ✅ CORRECT — mobile-first */
.mon-element { font-size: 14px; }                        /* base mobile */
@media (min-width: 600px) { .mon-element { font-size: 16px; } }  /* tablette */
@media (min-width: 900px) { .mon-element { font-size: 18px; } }  /* desktop */

/* ❌ INTERDIT — desktop-first */
.mon-element { font-size: 18px; }
@media (max-width: 900px) { .mon-element { font-size: 14px; } }
```
