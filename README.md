# Skyrim Checklist

Application web de suivi de progression pour *The Elder Scrolls V: Skyrim (Anniversary Edition)*.
Vanilla JavaScript, aucune dépendance externe, progression sauvegardée dans le `localStorage` du navigateur.

---

## Fonctionnalités

- **14 catégories actives** : Quêtes, Cris de Dragon, Sorts, Enchantement, Alchimie, et plus
- **Recherche globale** : filtre tous les items de toutes les catégories simultanément
- **Groupes pliables/dépliables** : chaque groupe commence replié, état conservé en mémoire de session
- **Progression en temps réel** : barre globale + badge done/total par onglet
- **Modal de détail (ⓘ)** : fiche complète par item (description, donneur, récompenses, etc.)
- **Persistance locale** : sauvegarde dans `localStorage` (clé `skyrim_checklist_v1`) avec indicateur de statut
- **Rendu adaptatif** : colonnes par acte pour les quêtes, grilles spéciales pour Daedric / Shouts / Sorts / Alchimie

---

## Stack technique

| Couche       | Technologie                                                     |
|:-------------|:----------------------------------------------------------------|
| HTML         | HTML5 sémantique (header, main, nav, dialog), ARIA              |
| CSS          | Vanilla CSS avec variables custom (`--gold-gradient`, etc.)     |
| JavaScript   | Vanilla ES6 (const/let, arrow functions, template literals)     |
| Fonts        | Google Fonts (DM Mono + Syne) + polices locales (.ttf)         |
| Images       | WebP (knotworks, logo) + WebP 64px (ingrédients, sorts)         |
| Stockage     | `localStorage` (JSON sérialisé)                                 |
| Build        | Aucun — ouvrir `index.html` directement dans le navigateur      |

---

## Lancer l'application

```
Ouvrir index.html dans un navigateur moderne (Chrome, Firefox, Edge, Safari).
Ou utiliser l'extension Live Server dans VS Code.
```

Aucun serveur, aucun build, aucune installation requise.

---

## Structure des fichiers

```
skyrim_project/
│
├── index.html                    ← Coque HTML (header, main, modal)
│
├── css/
│   └── style.css                 ← Tout le CSS (thème sombre + variables dorées)
│
├── script/
│   ├── app.js                    ← Logique principale (état, rendu, persistance)
│   └── data.js                   ← Données : CHECKLIST_DATA = { [cat]: [...items] }
│
├── assets/
│   ├── fonts/
│   │   ├── Futura Condensed.ttf  ← FuturaCondensed (titres, labels)
│   │   └── Dragon_script.ttf     ← DragonscriptRegular (mots Dragon Shouts)
│   │
│   ├── logos/
│   │   ├── logo_title.webp       ← Logo Skyrim (topbar gauche), 512×224 px
│   │   └── creation_club.png     ← (unused) Logo Creation Club
│   │
│   ├── knotworks/                ← Bandeaux décoratifs par groupe de quête (WebP, 1600×115 px)
│   │   ├── main_quest.webp
│   │   ├── companions_quest.webp
│   │   └── ...
│   │
│   ├── images/
│   │   ├── ingredients/          ← Icônes ingrédients alchimie (WebP, 56×56 px)
│   │   └── spells/               ← Icônes sorts (WebP, 28×28 px)
│   │
│   └── icons/
│       ├── achievements/         ← Icônes succès Steam/PlayStation (WebP)
│       ├── cities/               ← Icônes cités (SVG)
│       ├── craftings/            ← Icônes crafting (WebP)
│       └── magics/               ← Icônes écoles de magie (WebP)
│
├── CLAUDE.md                     ← Instructions projet pour Claude Code
├── TODO.md                       ← Tâches en cours et à venir
├── RESUME.txt                    ← Journal des sessions de développement
│
└── extract.py                    ← Régénère data.js depuis le fichier .xlsx source
```

---

## Architecture JavaScript (`app.js`)

### Modèle de données

```js
// Source de vérité (data.js) — jamais muté en runtime
CHECKLIST_DATA = {
  'Quests':              [{ id, name, group, desc, giver, city?, reward? }],
  'Dragon Shouts':       [{ id, name, group, word_en, translation, dlc, desc, location }],
  'Spells':              [{ id, name, group, level, dlc, desc, img? }],
  'Enchanting Effects':  [{ id, name, group, slots, desc }],
  'Alchemy Ingredients': [{ id, name, section, effects[], origin, source, garden, img? }],
  // ... autres catégories
}

// État mutable (session courante)
checked          = { [id]: true }         // items cochés — persiste en localStorage
currentCat       = String                 // onglet actif
searchQuery      = String                 // requête de recherche globale
collapsedGroups  = { [catKey]: true }     // groupes repliés (catKey = cat + '::' + group)
```

### Constantes de configuration

| Constante             | Rôle                                                       |
|:----------------------|:-----------------------------------------------------------|
| `STORAGE_KEY`         | Clé localStorage (`'skyrim_checklist_v1'`)                 |
| `CATEGORIES`          | Ordre des onglets (dérivé de `CATEGORY_META`)              |
| `CATEGORY_META`       | `{ [dataKey]: { label: string } }` — libellé affiché      |
| `QUEST_GROUPS`        | Ordre + image knotwork + label court par groupe de quête   |
| `QUEST_GROUP_MAP`     | `{ [name]: img }` — dérivé de `QUEST_GROUPS`              |
| `QUEST_GROUP_ORDER`   | `[name, ...]` — dérivé de `QUEST_GROUPS`                  |
| `QUEST_ACTS`          | Sections (colonnes) par groupe : `{ [group]: [{ label, firstId }] }` |
| `QUEST_ACTS_META`     | Labels optionnels preLabel/gridLabel par groupe            |
| `QUEST_CARD_GROUPS`   | `Set<string>` — groupes rendus en grille de cartes (Daedric) |
| `DRAGON_SCRIPT_ENC`   | `{ [mot]: encoded }` — encodage DragonscriptRegular        |

### Cycle de vie

```
init()
  ├── load()              ← localStorage → checked
  ├── collapsedGroups     ← tous les groupes repliés par défaut
  ├── renderTabs()        ← génère les boutons d'onglet + badges
  ├── renderStats()       ← calcule et affiche la progression globale
  ├── renderList()        ← construit le DOM de la catégorie active
  └── setBadge('saved')   ← initialise l'indicateur localStorage

toggle(id)  [clic checkbox]
  ├── mutate checked
  ├── save()              ← debounce 600ms → localStorage
  ├── renderList()
  ├── renderStats()
  └── renderTabBadges()
```

### Fonctions principales

| Fonction                               | Rôle                                                    |
|:---------------------------------------|:--------------------------------------------------------|
| `load()` / `save()`                   | Lecture / écriture localStorage, debounce 600ms         |
| `setBadge(state)`                     | Met à jour l'indicateur (saved / saving / error)        |
| `toggle(id)`                          | Coche/décoche un item, relance le rendu                 |
| `toggleGroup(cat, group)`             | Plie/déplie un groupe, relance le rendu                 |
| `checkGroup(cat, group, value)`       | Coche/décoche tous les items d'un groupe                |
| `globalStats()` / `catStats(cat)`     | Calcule done/total/pct globalement ou par catégorie     |
| `renderTabs()`                        | Génère les boutons nav + badges done/total              |
| `renderTabBadges()`                   | Met à jour uniquement les badges (sans rebuild tabs)    |
| `renderStats()`                       | Met à jour % + barre + aria-valuenow                   |
| `renderList()`                        | Rebuild complet du DOM (catégorie active ou recherche)  |
| `renderItemsHtml(items, cat, forceExpand)` | Génère le HTML de tous les groupes d'une catégorie |
| `buildSub(item)`                      | Construit le texte de sous-info d'un item              |
| `openInfoModal(id)` / `closeInfoModal()` | Ouvre/ferme la fiche de détail                       |
| `onSearch(val)`                       | Met à jour searchQuery et relance renderList()          |
| `escHtml(str)` / `escJs(str)`         | Échappement sécurité (XSS / injection onclick)          |
| `makeInfoRow(label, val, raw)`        | Construit une rangée label/valeur pour le modal         |

### Rendus spéciaux par catégorie

| Catégorie            | Détection                        | Rendu                                         |
|:---------------------|:---------------------------------|:----------------------------------------------|
| Quests               | `cat === 'Quests'`               | Knotworks + colonnes d'actes (story + radiant)|
| Dragon Shouts        | `cat === 'Dragon Shouts'`        | Grille 3 col., DragonScript + latin + trad.   |
| Spells               | `cat === 'Spells'`               | Colonnes par niveau (Novice → Special)        |
| Enchanting Effects   | `cat === 'Enchanting Effects'`   | Grille 6 colonnes compacte                   |
| Alchemy Ingredients  | `cat === 'Alchemy Ingredients'`  | Grille 5 col., icônes 56px, 2 sections        |
| Daedric (dans Quests)| `QUEST_CARD_GROUPS.has(group)`   | Grille 4 cartes (exception de groupe)         |

---

## Structure d'une donnée (exemples)

### Quête standard
```js
{ id: 1, name: "Unbound", group: "Main Quest", desc: "Escape from Helgen...",
  giver: "Hadvar / Ralof", reward: "Access to Skyrim" }
```

### Mot de cri Dragon
```js
{ id: 658, name: "Fus", group: "Unrelenting Force", word_en: "Force",
  translation: "Force", dlc: null, desc: "...", location: "Bleak Falls Barrow" }
```

### Sort
```js
{ id: 739, name: "Flames", group: "Destruction", level: "Novice",
  dlc: null, desc: "...", img: "Fire" }
```

### Ingrédient alchimie
```js
{ id: 962, name: "Abecean Longfin", section: "Ingredients",
  effects: ["Weakness to Frost", "Fortify Sneak", "Weakness to Poison", "Fortify Restoration"],
  origin: "Base Game", source: "Fishing / looting", garden: false,
  img: "Abecean_Longfin.webp" }
```

---

## Ajouter un nouveau groupe de quêtes

1. **`data.js`** — ajouter les items dans `CHECKLIST_DATA['Quests']` avec IDs séquentiels.

2. **`app.js` — `QUEST_GROUPS`** — ajouter une entrée :
   ```js
   { name: 'Mon Groupe', img: 'mon_groupe.webp' }
   // img: null si pas encore de knotwork
   ```

3. **`app.js` — `QUEST_ACTS`** — définir les colonnes :
   ```js
   'Mon Groupe': [
     { label: 'Story',    firstId: 100 },
     { label: 'Side',     firstId: 115 },
   ]
   ```

4. **`app.js` — `QUEST_ACTS_META`** *(optionnel)* — si des items précèdent le premier acte :
   ```js
   'Mon Groupe': { preLabel: 'Story' }
   ```

5. **`assets/knotworks/`** — placer l'image WebP (1600×115 px, RGBA).

---

## Ajouter une nouvelle catégorie

1. **`data.js`** — déclarer le nouveau tableau :
   ```js
   CHECKLIST_DATA['Ma Catégorie'] = [
     { id: 1145, name: "Item 1", group: "Sous-groupe" },
     ...
   ]
   ```

2. **`app.js` — `CATEGORY_META`** — enregistrer la catégorie :
   ```js
   'Ma Catégorie': { label: 'Ma Cat' }
   ```

3. **`app.js` — `renderItemsHtml()`** — ajouter un rendu spécialisé si nécessaire
   (early-return avec flag `isMaCat = cat === 'Ma Catégorie'`).

4. Si la catégorie utilise `group` plutôt que `section`, les groupes seront
   repliés automatiquement par la boucle dans `init()`.

---

## Pipeline d'assets

### Images

| Type            | Format source | Format final | Dimensions       | Script              |
|:----------------|:-------------|:-------------|:-----------------|:--------------------|
| Logo Skyrim     | PNG           | WebP         | 512×224 px       | Pillow (manuel)     |
| Knotworks       | PNG           | WebP         | 1030×74 px       | Pillow (manuel)     |
| Ingrédients     | PNG (UESP)    | WebP         | 64×64 px         | `process_ingredient_images.py` |
| Sorts           | PNG (UESP)    | WebP         | 28×28 px         | `download_uesp_images.py`      |
| Icônes succès   | WebP (UESP)   | WebP         | Variable         | —                   |

### Données source

```
Skyrim Checklist — Master.xlsx
  └── extract.py
        └── script/data.js   (CHECKLIST_DATA)
```

### Outils Python disponibles

| Script                        | Rôle                                                  |
|:------------------------------|:------------------------------------------------------|
| `extract.py`                  | Régénère `data.js` depuis le fichier `.xlsx`          |
| `analyze_image.py`            | Analyse une image via l'API Anthropic, écrit `.txt`   |
| `batch_analyze.py`            | Analyse en batch tous les PNG/JPG/WebP d'un dossier   |
| `download_uesp_images.py`     | Scrape les images UESP depuis une URL HTML            |
| `process_ingredient_images.py`| Retire préfixe, convertit PNG→WebP 64px               |

---

## Conventions de code

### Sécurité
- **`escHtml(str)`** — obligatoire sur toutes les chaînes insérées dans `innerHTML`
- **`escJs(str)`** — obligatoire sur les noms de groupes/catégories dans les attributs `onclick`
  (les apostrophes cassent les chaînes JS inline)

### Rendu
- **Rebuild complet** à chaque changement — pas de diffing/patching partiel
- **`forceExpand = true`** passé à `renderItemsHtml()` lors d'une recherche (tous les groupes ouverts)
- **`collapsedGroups`** non muté pendant la recherche — état restauré à la fermeture

### IDs
- Séquentiels sur toutes les catégories, jamais réutilisés
- Dernier ID utilisé : **1144** (Alchemy Ingredients)
- Prochains IDs libres : **1145+**

### Dégradé doré (CSS)
- Toujours via `var(--gold-gradient)` — ne pas écrire la valeur inline
- Texte doré : `background: var(--gold-gradient); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;`
- Les pseudo-éléments `::before/::after` nécessitent `-webkit-text-fill-color: initial` pour reset

---

## Catégories à implémenter (roadmap)

| Catégorie              | Statut     | Notes                                   |
|:-----------------------|:-----------|:----------------------------------------|
| Books (Skill Books)    | ☐ À faire  | ~90 livres, 1 par skill par niveau      |
| Perks                  | ☐ À faire  | Perks spéciaux à définir               |
| Collectible            | ☐ À faire  | Scope à définir                        |
| Unique Gear            | ☐ À faire  | Armes/armures uniques                  |
| Locations              | ☐ À faire  | Lieux à découvrir                      |
| Merchants              | ☐ À faire  | Marchands particuliers                 |
| Recruitable Followers  | ☐ À faire  | Compagnons recrutables                 |
| Achievements           | ☐ À faire  | Icônes déjà présentes dans `assets/`   |

---

## Fonctionnalités UI à venir

- [ ] Export / Import de progression (JSON)
- [ ] Bouton Reset avec confirmation
- [ ] Grille Achievements avec icônes
- [ ] Knotworks manquants : Divine Quests, Greybeards, Blades, Dungeon
- [ ] Responsive mobile amélioré

---

## Compatibilité navigateurs

Nécessite un navigateur moderne supportant :
- CSS Custom Properties (`var()`)
- CSS `background-clip: text`
- `localStorage`
- `defer` sur les scripts
- Format WebP

Testé sur Chrome, Firefox, Edge. Safari ≥ 14 recommandé (WebP + backdrop-filter).
