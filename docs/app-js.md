# Documentation — script/app.js

> Logique principale de la Skyrim Checklist. Le fichier le plus long et le plus important.
> Chargé en DERNIER (après i18n.js, profiles.js, data.js, data_fr.js).

---

## Structure du fichier (sections dans l'ordre)

| Ligne approx. | Section |
|---|---|
| 1–20 | En-tête JSDoc — dépendances, DOM ciblé, localStorage |
| 21–390 | **CONFIGURATION** — constantes & métadonnées |
| 391–440 | **PERSISTANCE** — load(), save(), setBadge() |
| 441–465 | **PROFIL ACTIF** — itemName(), updateCharacterBtn() |
| 466–540 | **STATE** — isChecked(), toggle(), toggleGroup(), checkGroup() |
| 541–570 | **STATS** — globalStats(), catStats() |
| 571–615 | **UTILITIES** — escHtml(), escJs(), makeInfoRow() |
| 616–1230 | **RENDERING** — tout le rendu DOM |
| 1231–1395 | **MODAL** — openInfoModal(), closeInfoModal() |
| 1396–1445 | **INITIALISATION** — initCollapsedGroups(), init() |

---

## 1. CONFIGURATION — Constantes & métadonnées

### `QUEST_GROUPS` (tableau)
```js
const QUEST_GROUPS = [
  { name: 'Main Quest', img: 'main_quest.webp', labelFr: 'Quête Principale' },
  ...
];
```
- **`name`** — clé exacte dans `CHECKLIST_DATA['Quests']` (item.group)
- **`img`** — nom du fichier WebP dans `assets/images/knotworks/` (`null` = pas d'image)
- **`label`** — (optionnel) libellé court EN affiché sur le knotwork
- **`labelFr`** — libellé FR affiché si langue = FR
- **L'ordre du tableau = ordre d'affichage des groupes**

Dérivés automatiques :
```js
QUEST_GROUP_MAP      = { [name]: img }         // lookup image
QUEST_GROUP_LABEL_MAP = { [name]: label }       // lookup label court EN
QUEST_GROUP_FR_MAP    = { [name]: labelFr }     // lookup label FR
QUEST_GROUP_ORDER     = [name, ...]             // ordre trié
```

### `SPELL_SCHOOL_FR_MAP`
```js
{ 'Alteration': 'Altération', 'Restoration': 'Guérison', ... }
```
Traduit les noms d'écoles dans les headers de groupes Spells.

### `SHOUT_GROUP_FR_MAP`
```js
{ 'Animal Allegiance': 'Allégeance Animale', ... }
```
Traduit les 27 noms de cris de dragon dans les headers.

### `QUEST_CARD_GROUPS` (Set)
```js
const QUEST_CARD_GROUPS = new Set(['Daedric']);
```
Groupes qui utilisent le rendu en **grille de cartes** au lieu du pattern standard.
Pour ajouter un nouveau groupe en mode cartes : `QUEST_CARD_GROUPS.add('NomDuGroupe')`.

### `QUEST_ACTS` (objet)
```js
const QUEST_ACTS = {
  'Main Quest': [
    { label: 'ACT 1', firstId: 1  },
    { label: 'ACT 2', firstId: 8  },
    { label: 'ACT 3', firstId: 14 },
  ],
  ...
};
```
Définit les **colonnes d'actes** pour chaque groupe de quêtes.
- `firstId` : ID du premier item de cette colonne
- Les items dont l'ID est **inférieur** au premier `firstId` → section "pre-act" (Story)

### `QUEST_ACTS_META` (objet)
```js
const QUEST_ACTS_META = {
  'Companions': { preLabel: 'Story', gridLabel: 'Radiant Quests' },
  ...
};
```
- `preLabel` : label de la section avant la grille (ex: "Story", "Innkeepers")
- `gridLabel` : label au-dessus de la grille d'actes (optionnel)

### `CATEGORY_META` (objet)
```js
const CATEGORY_META = {
  'Quests':             { label: 'Quests',       labelFr: 'Quêtes' },
  'Dragon Shouts':      { label: 'Shouts',        labelFr: 'Cris' },
  ...
};
```
Définit l'**ordre des onglets** (l'ordre des clés = ordre d'affichage).
Chaque entrée = un onglet dans la nav.

### `CATEGORIES` (tableau)
```js
const CATEGORIES = Object.keys(CATEGORY_META);
// ['Quests', 'Dragon Shouts', 'Spells', ...]
```
Liste ordonnée dérivée de CATEGORY_META.

### `DRAGON_SCRIPT_ENC` (objet)
```js
const DRAGON_SCRIPT_ENC = {
  'Fus': 'FUS', 'Ro': 'RO', 'Dah': 'D4', ...
};
```
Table d'encodage pour la police `DragonscriptRegular`.
La police réinterprète certains glyphes ASCII pour afficher l'alphabet draconique.
Ex : `'Fus'` → `'FUS'` sera rendu visuellement en caractères dragon par la police.

### Variables d'état (mutables)
```js
let currentCat      = CATEGORIES[0]; // onglet actif (ex: 'Quests')
let searchQuery     = '';             // requête de recherche en cours
let checked         = {};             // { [id: number]: true } — items cochés
let collapsedGroups = {};             // { [catKey]: true } — groupes repliés
let activeProfileId = null;           // id du profil actif
```

### Sections Alchemy
```js
const POTION_SECTIONS = ['Health', 'Magicka', 'Stamina', 'Skill'];
const POISON_SECTIONS = ['Damage', 'Crowd Control', 'Weakness', 'Lingering', 'Special'];
```
Sous-groupes de la section Potions et Poisons dans la catégorie Alchemy.

### Images spéciales
```js
const SPELL_SCHOOL_IMG = {
  'Alteration':  'alteration_2.webp',
  ...
};
```
Header d'école de magie : icône dans `assets/images/schools/`.

---

## 2. PERSISTANCE

### `load()`
```js
function load() {
  checked = JSON.parse(localStorage.getItem(getStorageKey(activeProfileId))) || {};
}
```
Charge `checked` depuis le localStorage du profil actif.
En cas d'erreur JSON → `checked = {}`.

### `save()` (avec debounce)
```js
function save() {
  setBadge('saving');    // dot jaune pulsant
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    localStorage.setItem(getStorageKey(activeProfileId), JSON.stringify(checked));
    setBadge('saved');   // dot vert
  }, 600);               // attend 600ms avant d'écrire
}
```
Le debounce évite d'écrire dans le localStorage à chaque milliseconde si l'utilisateur
coche/décoche rapidement plusieurs items.

### `setBadge(state)`
```js
setBadge('saved')   // dot vert  + "saved" / "sauvegardé"
setBadge('saving')  // dot jaune + "saving…" / "sauvegarde…"
setBadge('error')   // dot rouge + "save failed" / "erreur"
```
Met à jour le point coloré `#storageBadge` dans la topbar.

---

## 3. PROFIL ACTIF

### `itemName(item)`
```js
function itemName(item) {
  if (getLang() === 'fr') {
    const fr = DATA_FR_NAMES[item.id];
    if (fr) return fr;
  }
  return item.name;
}
```
Retourne le nom traduit si langue = FR et traduction disponible dans `data_fr.js`.
Sinon retourne `item.name` (nom anglais de base).

### `updateCharacterBtn()`
Met à jour le bouton `#characterBtn` dans la topbar avec le nom du profil actif.
Appelé dans `init()` au démarrage.

---

## 4. STATE — Mutation de l'état

### `toggle(id)`
```js
function toggle(id) {
  if (checked[id]) delete checked[id];
  else checked[id] = true;
  save();
  renderList();
  renderStats();
  renderTabBadges();
}
```
Appelé par `onchange` des checkboxes. Bascule l'item, sauvegarde, re-rend tout.

### `toggleGroup(cat, group)`
Plie/déplie un groupe. Ajoute/retire la clé `"cat::group"` de `collapsedGroups`.
**Ne mute jamais collapsedGroups pendant une recherche** (la recherche force tout déplié).

### `checkGroup(cat, group, value)`
Coche (`value=true`) ou décoche (`value=false`) **tous** les items d'un groupe en une fois.

### `groupKey(cat, group)`
```js
function groupKey(cat, group) { return cat + '::' + group; }
// ex: groupKey('Quests', 'Main Quest') → 'Quests::Main Quest'
```
Format des clés dans `collapsedGroups`.

---

## 5. STATS

### `globalStats()`
```js
{ total: number, done: number, pct: number }
```
Progression sur **toutes** les catégories. Utilisé par `renderStats()`.

### `catStats(cat)`
```js
{ total: number, done: number, pct: number }
```
Progression pour **une** catégorie. Utilisé par `renderTabBadges()`.

---

## 6. UTILITIES

### `escHtml(str)` — OBLIGATOIRE dans innerHTML
```js
escHtml('<script>alert(1)</script>')
// → '&lt;script&gt;alert(1)&lt;/script&gt;'
```
À utiliser sur **toute** chaîne utilisateur insérée dans `innerHTML`. Prévient le XSS.

### `escJs(str)` — OBLIGATOIRE dans onclick="..."
```js
escJs("Angi's Camp")
// → "Angi\\'s Camp"
```
À utiliser sur les noms de groupes utilisés dans `onclick='toggleGroup(...)'`.
Sans ça, les apostrophes cassent le JavaScript inline.

### `makeInfoRow(label, val, raw = false)`
```js
makeInfoRow('Quest Group', 'Main Quest')
// → '<div class="info-row"><span class="info-label">Quest Group</span><span class="info-val">Main Quest</span></div>'
```
Construit une rangée label/valeur pour le modal. Si `raw=true`, `val` est inséré
tel quel (HTML non-échappé — à utiliser seulement avec des valeurs déjà sécurisées).

---

## 7. RENDERING

### `renderStats()`
Met à jour :
- `#globalPct` → `"42%"`
- `#globalFill` → `style.width = "42%"` (barre de progression)
- `#globalProgress` → `aria-valuenow="42"`

### `renderTabBadges()`
Met à jour les badges `<span id="badge-{cat}">done/total</span>` sur chaque onglet.

### `renderTabs()`
Génère les boutons `<button class="tab-btn">` dans `#tabs`.
Chaque bouton : onclick = `switchCat('catName')`.

### `switchCat(cat)`
Change l'onglet actif. Efface la recherche. Relance `renderList()`.

---

### `renderList()` — FONCTION CENTRALE
```
Si searchQuery non vide :
    → Parcourt TOUTES les catégories
    → Filtre les items dont name ou group contient la query
    → Affiche avec renderSearchResults() par catégorie
Sinon :
    → Affiche uniquement currentCat
    → Utilise renderItemsHtml()
```

---

### `renderItemsHtml(items, cat, forceExpand)` — PLUS LONGUE FONCTION

Gère **tous les types de rendu** selon la catégorie :

| Catégorie | Rendu spécial |
|---|---|
| `Books` | 3 groupes placeholder (Skills, Quests, Lores) |
| `Perks` | 6 groupes avec sous-groupes, "Data coming soon" |
| `Alchemy Ingredients` | 4 sections (Ingredients, Potions, Poisons, Recipes) |
| `Dragon Shouts` | Liste plate par cri, alphabet draconique |
| `Enchanting Effects` | Grille compacte multi-colonnes |
| `Spells` | Colonnes par niveau (Novice → Special) |
| groupe Daedric | Grille de cartes 4 colonnes |
| Quêtes standard | knotwork + section Story + grille d'actes |

**Paramètre `forceExpand`** : si `true`, tous les groupes sont affichés dépliés
(utilisé pendant la recherche). `collapsedGroups` n'est jamais muté dans ce cas.

**Headers de groupe** (logique de génération) :
```
isQuests && img  → knotwork PNG + texte "Groupe — X%"
isQuests && !img → texte doré centré sur fond noir
isSpells && SPELL_SCHOOL_IMG[group] → [icône] Nom [icône] avec filter couleur
isEnchanting     → [icône enchanting] Nom [icône]
sinon            → <span class="group-name">Nom</span>
```

---

### `renderSearchResults(items, cat)`
Rendu simplifié pour la recherche :
- Pas de knotworks
- Pas de colonnes d'actes
- Juste : header de groupe + liste plate des items filtrés

---

### `buildSub(item)`
Construit le texte compact `.item-sub` (visible seulement sur desktop).
Agrège les champs disponibles : level, desc, giver, category, author, store, etc.
Séparés par ` · `.

---

## 8. MODAL

### `openInfoModal(id)`
1. Cherche l'item dans toutes les catégories par son ID
2. Détecte le type via les champs :
   - `item.word_en` → shout
   - `item.level` in `['Novice'...]` → spell
   - `item.slots` → enchant
   - `Array.isArray(item.effects)` → alchemy ingredient
   - `item.section === 'Potions'/'Poisons'` → potion/poison
3. Construit les rangées `makeInfoRow()` selon le type
4. Injecte dans `#infoModalContent` et ajoute `.open` sur l'overlay

**Ordre des champs par type :**
| Type | Champs affichés |
|---|---|
| Quête | Quest Group → City → Daedric Prince → Level → Description → Quest Giver → Rewards |
| Shout | Shout → Translation → DLC → Description → Word Wall Location |
| Spell | School → Level → DLC → Description |
| Enchant | Category → Applicable Slots → Description |
| Ingredient | Group → Origin → Effects (multi-lignes) → How to Obtain → Garden (Oui/Non) |
| Potion/Poison | Category → Group → Type → Level → Effect → Source |

### `closeInfoModal()`
Retire `.open` de `#infoModal`. Appelé par :
- Clic sur l'overlay (fond semi-transparent)
- Bouton ✕
- Touche Échap

---

## 9. INITIALISATION

### `initCollapsedGroups()`
Replier tous les groupes au démarrage :
1. Tous les groupes de toutes les catégories
2. Groupes Books (Skills, Quests, Lores)
3. Groupes Perks + sous-groupes
4. Sections Alchemy (Ingredients, Potions, Poisons, Recipes)
5. Sous-sections Potions (Health, Magicka, Stamina, Skill)
6. Sous-sections Poisons (Damage, Crowd Control, ...)
7. Types de potions/poisons individuels

### `init()` — Point d'entrée
```js
function init() {
  activeProfileId = localStorage.getItem(ACTIVE_PROFILE_KEY);
  if (!activeProfileId || profil invalide) → redirect vers index.html

  localStorage.setItem('skyrim_total_items', total_items); // pour index.html
  initCollapsedGroups();
  load();           // charge checked depuis localStorage
  renderTabs();     // génère les onglets
  renderStats();    // met à jour le %
  renderList();     // affiche les items
  setBadge('saved');
  updateCharacterBtn();
  // branche searchInput et touche Échap
}
init(); // appelé immédiatement (fin du fichier)
```

---

## Ajouter un nouveau groupe de quêtes

1. Ajouter les items dans `data.js` avec les bons `group` et IDs séquentiels
2. Ajouter dans `QUEST_GROUPS` : `{ name: '...', img: 'xxx.webp', labelFr: '...' }`
3. Si le groupe a des actes : ajouter dans `QUEST_ACTS`
4. Si le groupe a une section Story : ajouter dans `QUEST_ACTS_META`
5. Créer le knotwork WebP (1600×115px) dans `assets/images/knotworks/`
6. Ajouter les traductions FR dans `data_fr.js`

Voir [comment-ajouter.md](comment-ajouter.md) pour le guide complet.
