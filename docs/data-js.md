# Documentation — script/data.js & script/data_fr.js

> Les données brutes de toute la checklist.
> `data.js` chargé en 3e, `data_fr.js` en 4e, avant `app.js`.

---

## data.js — Structure principale

### `CHECKLIST_DATA`
L'objet central exporté par ce fichier :
```js
const CHECKLIST_DATA = {
  'Quests':             [ ...items ],
  'Dragon Shouts':      [ ...items ],
  'Spells':             [ ...items ],
  'Enchanting Effects': [ ...items ],
  'Alchemy Ingredients':[ ...items ],  // inclut Potions et Poisons
  'Books':              [],             // placeholder vide
  'Perks':              [],             // placeholder vide
  // autres catégories ajoutées vides dans app.js :
  // 'Achievements', 'Collectible', etc.
};
```

### Format d'un item (champs selon la catégorie)

#### Quêtes
```js
{
  id: 1,                          // ID unique, séquentiel, jamais réutilisé
  name: 'Unbound',                // nom EN
  group: 'Main Quest',            // groupe d'appartenance (= QUEST_GROUPS[].name)
  desc: 'You arrive in Skyrim...', // description courte
  giver: 'Ralof / Hadvar',        // donneur de quête
  reward: 'None',                 // (optionnel) récompense
  city: 'Helgen',                 // (optionnel) ville associée
  prince: null,                   // (Daedric seulement) nom du prince
  level: null,                    // (Daedric seulement) niveau requis
}
```

#### Dragon Shouts
```js
{
  id: 658,
  name: 'Raan',                   // mot draconique (EN, nom propre inchangé)
  group: 'Animal Allegiance',     // nom du cri
  word_en: 'Animal',              // signification EN du mot
  dlc: null,                      // 'Dawnguard', 'Dragonborn', etc. ou null
  desc: '...',
  location: 'Angarvunde...',      // emplacement du Mur des Mots
}
```

#### Spells (sorts)
```js
{
  id: 739,
  name: 'Oakflesh',
  group: 'Alteration',            // école de magie (= clé dans SPELL_SCHOOL_IMG)
  level: 'Novice',                // 'Novice'|'Apprentice'|'Adept'|'Expert'|'Master'|'Special'
  img: 'OakFlesh',                // nom sans extension → assets/images/spells/{img}.webp
  dlc: null,
  desc: '...',
}
```

#### Enchanting Effects
```js
{
  id: 909,
  name: 'Banish',
  group: 'Weapon Enchantments',   // 'Weapon Enchantments' ou 'Armor Enchantments'
  slots: 'Weapons',               // emplacements applicables
  desc: '...',
}
```

#### Alchemy Ingredients
```js
{
  id: 962,
  name: 'Abecean Longfin',
  group: 'A',                     // lettre alphabétique (pour regroupement)
  section: 'Ingredients',         // 'Ingredients' | 'Potions' | 'Poisons'
  img: 'Abecean_Longfin.webp',    // fichier dans assets/images/ingredients/
  origin: 'Fish',                 // origine/famille
  effects: ['Weakness to Frost', 'Fortify Sneak', '...'],  // tableau d'effets
  source: 'Fishing, vendors',     // comment l'obtenir
  garden: false,                  // cultivable dans un jardin ?
}
```

#### Potions
```js
{
  id: 1145,
  name: 'Potion of Minor Healing',
  section: 'Potions',             // 'Potions' ou 'Poisons'
  group: 'Health',                // sous-groupe : 'Health'|'Magicka'|'Stamina'|'Skill'
  type: null,                     // (pour Skill) ex: 'Fortify Alteration'
  img: 'PotionofMinorHealing',    // nom sans extension → assets/images/potions/{img}.webp
  desc: 'Restore 25 points of Health.',
  source: 'Loot, vendors',
  level: null,                    // force/tier de la potion
}
```

#### Poisons
```js
{
  id: 1357,
  name: 'Weak Lingering Poison of ...',
  section: 'Poisons',
  group: 'Damage',                // sous-groupe : 'Damage'|'Crowd Control'|'Weakness'|'Lingering'|'Special'
  type: 'Damage Health',          // type de dégât
  img: '...',
  desc: '...',
  source: '...',
  level: 1,                       // 1=Weak, 2=standard, 3=Strong, 4=Potent, 5=Deadly
}
```

---

## Règles importantes sur les IDs

- **Séquentiels** : chaque nouvel item prend l'ID suivant le dernier utilisé
- **Jamais réutilisés** : si un item est supprimé, son ID est perdu
- **Dernier ID utilisé : 1435**
- **Prochain ID disponible : 1436**

---

## data_fr.js — Traductions françaises

### `DATA_FR_NAMES`
```js
const DATA_FR_NAMES = {
  1:   'Libéré',          // id 1 → 'Unbound' en FR
  2:   'Avant la tempête',
  ...
  1144: 'Fougère Tordue',
};
```
- Contient les IDs 1–657 (Quêtes) et 739–1144 (Sorts + Enchantements + Ingrédients)
- **IDs 658–738 absents** : les mots draconiques sont des noms propres, non traduits
- **IDs 1145–1435 manquants** : Potions/Poisons pas encore traduits

Utilisé par `itemName(item)` dans `app.js` :
```js
function itemName(item) {
  if (getLang() === 'fr') {
    const fr = DATA_FR_NAMES[item.id];
    if (fr) return fr;  // retourne le nom FR
  }
  return item.name;     // sinon nom EN par défaut
}
```

### `DATA_FR_WORDS`
```js
const DATA_FR_WORDS = {
  658: 'Animal',     // 'Raan' → signification FR du mot draconique
  659: 'Allégeance', // 'Mir'
  ...
  738: 'Vitesse',    // 'Kest'
};
```
81 entrées (IDs 658–738) : signification française des mots draconiques.
Affiché dans `.item-sub` → `.word-en` pour la colonne signification.

Usage dans `app.js` :
```js
getLang() === 'fr' ? (DATA_FR_WORDS[item.id] || item.word_en || '') : (item.word_en || '')
```

---

## extract.py — Régénération de data.js

```
extract.py → lit 'Skyrim Checklist — Master.xlsx' → génère data.js
```
Script Python à la racine du projet. À relancer si le fichier Excel est modifié.
⚠️ Le résultat écrase `data.js` — vérifier avant de committer.

---

## Catégories placeholder (items.length === 0)

Dans `app.js`, `renderList()` bypasse la condition `items.length === 0` pour :
- `Books` → 3 groupes (Skills, Quests, Lores) avec "Data coming soon"
- `Perks` → 6 groupes avec sous-groupes et "Data coming soon"

Ces catégories ont `[]` dans `data.js`.
Quand les données seront disponibles, remplacer `[]` par le tableau d'items
**et** supprimer le bloc `isBooks` / `isPerks` dans `renderItemsHtml()`.
