# Design : Refactoring des données — Séparation par catégorie & Fusion EN/FR

**Date :** 2026-03-15
**Statut :** Approuvé

---

## Contexte

Le projet Skyrim Checklist repose actuellement sur deux fichiers de données monolithiques :

- `script/data.js` (1596 lignes) — contient `CHECKLIST_DATA` avec toutes les catégories
- `script/data_fr.js` (2582 lignes) — contient `DATA_FR_NAMES`, `DATA_FR_WORDS`, `DATA_FR_DESC`

Ces fichiers sont difficiles à maintenir, et les données EN/FR sont découplées par lookup d'ID dans `app.js`.

---

## Objectifs

1. Séparer les données en fichiers par catégorie
2. Fusionner les traductions FR directement dans chaque item (`name_fr`, `desc_fr`)
3. Simplifier `app.js` en supprimant les lookups par ID
4. Préparer la structure pour l'ajout futur de nouvelles catégories

---

## Nouvelle structure de fichiers

```
script/
  data/
    quests.js         IDs 1–657    → const QUESTS_DATA = [...]
    shouts.js         IDs 658–738  → const SHOUTS_DATA = [...]
    spells.js         IDs 739–908  → const SPELLS_DATA = [...]
    enchanting.js     IDs 909–961  → const ENCHANTING_DATA = [...]
    alchemy.js        IDs 962–1435 → const ALCHEMY_DATA = [...]
    achievements.js   IDs 1436–1511→ const ACHIEVEMENTS_DATA = [...]
    index.js                       → assemble CHECKLIST_DATA
  app.js              (mis à jour)
  i18n.js             (inchangé)
  profiles.js         (inchangé)
```

Fichiers supprimés après migration :
- `script/data.js`
- `script/data_fr.js`

---

## Format des items — Fusion EN/FR

### Quêtes (exemple)
```js
{
  "id": 1,
  "name": "Unbound",
  "name_fr": "Libération",
  "group": "Main Quest",
  "desc": "Escape Imperial execution...",
  "desc_fr": "Échappez à l'exécution impériale...",
  "giver": "Hadvar or Ralof"
}
```

### Dragon Shouts (exemple)
```js
{
  "id": 658,
  "name": "Fus",
  "group": "Unrelenting Force",
  "word_en": "Force",
  "word_fr": "Force",
  "desc": "...",
  "desc_fr": "..."
}
```

### Règle sur `group_fr`
Les traductions de noms de groupe (ex: `"Main Quest"` → `"Quête Principale"`) **ne sont pas** embarquées dans les items. Elles restent dans les mappings de `app.js` (`QUEST_GROUP_FR_MAP`, `SHOUT_GROUP_FR_MAP`, `SPELL_SCHOOL_FR_MAP`) car elles s'appliquent à tous les items d'un groupe sans redondance.

---

## Loader — `script/data/index.js`

```js
const CHECKLIST_DATA = {
  "Quests":              QUESTS_DATA,
  "Dragon Shouts":       SHOUTS_DATA,
  "Spells":              SPELLS_DATA,
  "Enchanting":          ENCHANTING_DATA,
  "Alchemy":             ALCHEMY_DATA,
  "Achievements":        ACHIEVEMENTS_DATA,
  "Books":               [],
  "Perks":               [],
  "Collectible":         [],
};
```

---

## Chargement HTML

Dans `skyrim.html` uniquement (seul fichier qui charge `data.js` / `data_fr.js`), remplacer :
```html
<script src="script/data.js" defer></script>
<script src="script/data_fr.js" defer></script>
```
Par (ordre garanti grâce à `defer`) :
```html
<script src="script/data/quests.js" defer></script>
<script src="script/data/shouts.js" defer></script>
<script src="script/data/spells.js" defer></script>
<script src="script/data/enchanting.js" defer></script>
<script src="script/data/alchemy.js" defer></script>
<script src="script/data/achievements.js" defer></script>
<script src="script/data/index.js" defer></script>
```

**Note `index.html`** : ce fichier ne charge aucun script de données — rien à modifier.

**Important** : tous ces fichiers doivent rester des scripts classiques (pas de `type="module"`). Les modules ont une queue `defer` séparée et ne partagent pas le scope global — ce qui casserait le partage de variables globales (`QUESTS_DATA`, `CHECKLIST_DATA`, etc.).

---

## Changements dans `app.js`

### Avant
```js
const nameFr = typeof DATA_FR_NAMES !== 'undefined' && DATA_FR_NAMES[item.id];
const descFr = typeof DATA_FR_DESC !== 'undefined' && DATA_FR_DESC[item.id];
const wordFr = DATA_FR_WORDS[item.id] || item.word_en;
```

### Après
```js
const nameFr = getLang() === 'fr' && item.name_fr;
const descFr = getLang() === 'fr' && item.desc_fr;
const wordFr = getLang() === 'fr' ? (item.word_fr || item.word_en) : item.word_en;
```

Toutes les occurrences de `DATA_FR_NAMES`, `DATA_FR_DESC`, `DATA_FR_WORDS` sont remplacées.
Sites de remplacement dans `app.js` : lignes 452, 694, **978** (accès direct sans guard `typeof`), 1282, 1348, 1370.
La ligne 978 a une syntaxe différente (ternaire inline sans guard) — à traiter explicitement.

### Règle sur `word_en` pour les Dragon Shouts
`word_en` **doit être conservé** sur chaque item de type Shout même après l'ajout de `word_fr`. Il sert de détecteur de type (`isShoutItem = !!item.word_en`) et d'affichage de la valeur EN dans la modale. `word_fr` s'y ajoute ; il ne le remplace pas.

---

## Périmètre — Ce qui ne change PAS

- IDs des items (inchangés, jamais réutilisés)
- Clés localStorage (`skyrim_checklist_{profileId}`) — les IDs étant conservés, aucune migration de données utilisateur nécessaire
- `QUEST_GROUP_FR_MAP`, `SHOUT_GROUP_FR_MAP`, `SPELL_SCHOOL_FR_MAP` dans `app.js`
- `i18n.js`, `profiles.js` — inchangés
- Logique de rendu, constantes `CATEGORIES`, `CATEGORY_META`, etc.

---

## Ordre d'exécution

1. Créer `script/data/` avec les 6 fichiers + `index.js`
2. Mettre à jour `app.js` (remplacer lookups)
3. Mettre à jour `skyrim.html` et `index.html` (nouveaux `<script>`)
4. Tester l'app (Playwright ou navigateur)
5. Supprimer `script/data.js` et `script/data_fr.js`
6. Commit

---

## Note sur `alchemy.js`

Ce fichier couvre IDs 962–1435 (~474 items). Il contient deux schémas distincts :
- **Ingredients** (962–1144) : `{ id, name, group, desc, effects, img }`
- **Potions/Poisons** (1145–1435) : `{ id, name, section, type, desc, img }` (pas de `group`)

La détection dans `app.js` se fait via `item.section === 'Potions' || item.section === 'Poisons'` — ce champ est déjà présent dans les données et sera conservé tel quel. `renderAlchemySubsections` continue de fonctionner sans modification.

---

## Risques

| Risque | Mitigation |
|--------|-----------|
| Item sans `name_fr` | `item.name_fr \|\| item.name` — fallback EN conservé |
| Item sans `desc_fr` | `item.desc_fr \|\| item.desc` — fallback EN conservé |
| Ordre de chargement des scripts | `defer` garantit l'ordre déclaré dans le HTML |
| Données utilisateur cassées | IDs inchangés → localStorage intact |
