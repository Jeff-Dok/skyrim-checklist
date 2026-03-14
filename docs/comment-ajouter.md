# Guide pratique — Comment ajouter des données

> Recettes étape par étape pour les tâches les plus courantes.

---

## 1. Ajouter un item à une catégorie existante

### Dans une catégorie standard (Spells, Enchanting, etc.)

1. Ouvrir `script/data.js`
2. Trouver le tableau de la catégorie (ex: `CHECKLIST_DATA['Spells']`)
3. Ajouter l'item à la fin avec **l'ID suivant** (dernier ID + 1)

```js
// Dernier sort existant id: 908
{ id: 909, name: 'Mon Sort', group: 'Alteration', level: 'Novice', img: 'MonSort', dlc: null, desc: '...' },
```

4. Si langue FR : ajouter dans `script/data_fr.js` :
```js
const DATA_FR_NAMES = {
  ...
  909: 'Mon Sort en Français',
};
```

5. Mettre à jour le commentaire **Dernier ID utilisé** dans `CLAUDE.md` et `memory/MEMORY.md`.

---

## 2. Ajouter un nouveau groupe de quêtes

### Étape 1 — Données dans `data.js`
```js
CHECKLIST_DATA['Quests'].push(
  { id: 1436, name: 'Quest 1', group: 'Mon Groupe', desc: '...', giver: '...' },
  { id: 1437, name: 'Quest 2', group: 'Mon Groupe', desc: '...', giver: '...' },
);
```

### Étape 2 — Déclarer le groupe dans `QUEST_GROUPS` (app.js)
```js
const QUEST_GROUPS = [
  ...
  { name: 'Mon Groupe', img: 'mon_groupe.webp', labelFr: 'Mon Groupe FR' },
];
```
⚠️ L'ordre dans `QUEST_GROUPS` = ordre d'affichage.

### Étape 3 — Déclarer les colonnes d'actes (si applicable) dans `QUEST_ACTS` (app.js)
```js
const QUEST_ACTS = {
  ...
  'Mon Groupe': [
    { label: 'Part 1', firstId: 1436 },
    { label: 'Part 2', firstId: 1450 },
  ],
};
```
Si pas d'actes (groupe simple) → ne pas ajouter dans `QUEST_ACTS`.

### Étape 4 — Section Story (si applicable) dans `QUEST_ACTS_META` (app.js)
```js
const QUEST_ACTS_META = {
  ...
  'Mon Groupe': { preLabel: 'Story' },
  // ou avec gridLabel : { preLabel: 'Story', gridLabel: 'Radiant Quests' }
};
```

### Étape 5 — Créer le knotwork
- Format : **1600×115px**, fichier **WebP**
- Destination : `assets/images/knotworks/mon_groupe.webp`
- Si pas d'image disponible : mettre `img: null` dans `QUEST_GROUPS`

### Étape 6 — Traductions FR
Dans `data_fr.js` : ajouter les noms FR des nouvelles quêtes.

---

## 3. Ajouter un sort (Spell)

```js
// data.js — dans CHECKLIST_DATA['Spells']
{ id: 910, name: 'Fire Storm', group: 'Destruction', level: 'Master', img: 'FireStorm', dlc: null, desc: 'Instant area of fire.' },
```

- `group` → doit être une clé de `SPELL_SCHOOL_IMG` (Alteration, Conjuration, Destruction, Illusion, Restoration) — sinon l'icône d'école ne s'affiche pas
- `level` → doit être dans `['Novice', 'Apprentice', 'Adept', 'Expert', 'Master', 'Special']`
- `img` → nom du fichier sans `.webp` → mettre le fichier dans `assets/images/spells/`

---

## 4. Ajouter un ingrédient d'alchimie

```js
// data.js — dans CHECKLIST_DATA['Alchemy Ingredients']
{
  id: 1145, name: 'Abecean Longfin',
  group: 'A',           // lettre alphabétique
  section: 'Ingredients',
  img: 'Abecean_Longfin.webp',   // fichier dans assets/images/ingredients/
  origin: 'Fish',
  effects: ['Weakness to Frost', 'Fortify Sneak', 'Weakness to Poison', 'Fortify Restoration'],
  source: 'Fishing in ponds',
  garden: false,
},
```

---

## 5. Ajouter une potion ou un poison

```js
// data.js — dans CHECKLIST_DATA['Alchemy Ingredients'] (même tableau)

// Potion
{
  id: 1357, name: 'Potion of Minor Healing',
  section: 'Potions',
  group: 'Health',      // 'Health' | 'Magicka' | 'Stamina' | 'Skill'
  type: null,           // sous-type pour Skill (ex: 'Fortify Alteration')
  img: 'PotionofMinorHealing',   // → assets/images/potions/{img}.webp
  desc: 'Restore 25 points of Health.',
  source: 'Loot, vendors',
  level: 1,             // 1=Minor, 2=standard, 3=Plentiful, etc.
},

// Poison
{
  id: 1358, name: 'Weak Poison of Damage Health',
  section: 'Poisons',
  group: 'Damage',      // 'Damage' | 'Crowd Control' | 'Weakness' | 'Lingering' | 'Special'
  type: 'Damage Health',
  img: 'PoisonofDamageHealth',
  desc: 'Does 3 points of damage to Health per second.',
  source: 'Craft, loot',
  level: 1,
},
```

---

## 6. Ajouter un enchantement

```js
// data.js — dans CHECKLIST_DATA['Enchanting Effects']
{ id: 962, name: 'Absorb Health', group: 'Weapon Enchantments', slots: 'Weapons', desc: 'Absorbs X points of health.' },
// ou
{ id: 963, name: 'Fortify Alchemy', group: 'Armor Enchantments', slots: 'Head, Necklace, Ring, Gauntlets', desc: 'Potions you mix are X% stronger.' },
```

---

## 7. Activer une catégorie placeholder

Pour activer **Books** ou **Perks** avec de vraies données :

1. Remplir `CHECKLIST_DATA['Books']` dans `data.js` avec les items
2. Dans `app.js`, supprimer le bloc `if (isBooks)` dans `renderItemsHtml()` (ou adapter)
3. Dans `initCollapsedGroups()`, supprimer la ligne Books placeholder
4. Ajouter les traductions FR dans `data_fr.js`

---

## 8. Modifier le label d'un onglet

Dans `CATEGORY_META` (app.js) :
```js
'Quests': { label: 'Quests', labelFr: 'Quêtes' },
// ↓ changer pour :
'Quests': { label: 'Quest Log', labelFr: 'Journal de Quêtes' },
```

---

## 9. Modifier le label d'un groupe de quêtes (affiché sur le knotwork)

Dans `QUEST_GROUPS` (app.js) :
```js
{ name: 'College of Winterhold', img: '...', label: 'Coll. of Winterhold', labelFr: 'Acad. de Fortdhiver' },
```
- `label` → label court EN (si différent du `name`)
- `labelFr` → label FR
- `name` doit rester **identique** à `item.group` dans `data.js`

---

## 10. Ajouter une traduction FR

### Pour un item de données (quête, sort, ingrédient...)
Dans `script/data_fr.js` :
```js
const DATA_FR_NAMES = {
  ...
  1436: 'Nom en français',
};
```

### Pour l'interface (boutons, labels...)
Dans `script/i18n.js`, dans les deux blocs `en` et `fr` :
```js
en: { maClé: 'My label', ... },
fr: { maClé: 'Mon label', ... },
```

---

## Règles à toujours respecter

| Règle | Pourquoi |
|---|---|
| IDs séquentiels, jamais réutilisés | Un ID supprimé laisse un "trou" volontaire |
| `escHtml()` sur tout innerHTML | Prévient le XSS |
| `escJs()` sur tout onclick avec des strings | Prévient les cassures avec les apostrophes |
| Mettre à jour le "Dernier ID" dans CLAUDE.md | Pour ne pas créer de doublons |
| Noms des fichiers images en minuscules + underscores | Convention uniforme |
| CSS : toujours `min-width`, jamais `max-width` | Approche mobile-first |
