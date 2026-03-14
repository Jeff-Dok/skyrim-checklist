# Documentation — script/i18n.js

> Internationalisation EN / FR.
> Partagé entre `index.html` et `skyrim.html`.
> Chargé en **1er** — avant tous les autres scripts.

---

## Rôle du fichier

Fournit les traductions de l'interface. Expose trois fonctions globales :
- `t(key)` — retourne la traduction d'une clé dans la langue active
- `getLang()` — retourne `'en'` ou `'fr'`
- `toggleLang()` — bascule la langue et recharge la page

---

## Constante de clé localStorage

```js
const LANG_KEY = 'skyrim_lang'; // valeur: 'en' ou 'fr' (défaut: 'en')
```

---

## L'objet `I18N`

Contient les traductions pour les deux langues :
```js
const I18N = {
  en: {
    // index.html
    selectTitle:   'Select a Character',
    newCharacter:  'New Character',
    placeholder:   'Character name…',
    btnCreate:     'Create',
    btnPlay:       '▶ Play',
    emptyProfiles: 'No characters yet — create one below.',
    metaCreated:   'created',
    deleteConfirm: name => `Delete character "${name}"?\nThis action cannot be undone.`,
    langBtn:       'FR',

    // skyrim.html — topbar
    searchPlaceholder: 'Search…',
    completeLabel:     'Complete @',

    // storage badge
    saved:      'saved',
    saving:     'saving…',
    saveFailed: 'save failed',

    // états vides
    emptySearch:   q => `No results for "${q}".`,
    emptyCategory: 'Nothing here yet.',

    // labels de modal (info-btn ⓘ)
    modalGroup:       'Quest Group',
    modalCity:        'City',
    modalPrince:      'Daedric Prince',
    modalLevel:       'Level Required',
    modalDesc:        'Description',
    modalGiver:       'Quest Giver',
    modalRewards:     'Rewards',
    modalShout:       'Shout',
    modalTranslation: 'Translation',
    modalDLC:         'DLC',
    modalLocation:    'Word Wall Location',
    modalSchool:      'School',
    modalSpellLevel:  'Level',
    modalSlots:       'Applicable Slots',
    modalCategory:    'Category',
    modalType:        'Type',
    modalEffect:      'Effect',
    modalSource:      'Source',
    modalOrigin:      'Origin',
    modalEffects:     'Effects',
    modalObtain:      'How to Obtain',
    modalGarden:      'Garden',
    modalYes:         'Yes',
    modalNo:          'No',
  },
  fr: {
    // même structure, valeurs en français
    ...
  }
};
```

### ⚠️ Clés qui sont des fonctions
```js
deleteConfirm: name => `Delete character "${name}"?...`
emptySearch:   q => `No results for "${q}".`
```
Ces clés retournent une **fonction** et non une chaîne.
Usage : `t('deleteConfirm')(name)` — d'abord `t()`, puis appel avec paramètre.

---

## Fonctions

### `getLang()`
```js
function getLang() {
  return localStorage.getItem(LANG_KEY) === 'fr' ? 'fr' : 'en';
}
```
Retourne `'fr'` ou `'en'`. Défaut = `'en'` si rien en localStorage.

### `setLang(lang)`
```js
function setLang(lang) {
  localStorage.setItem(LANG_KEY, lang);
  location.reload(); // recharge pour que tout l'UI se mette à jour
}
```
Enregistre la langue et recharge la page.

### `toggleLang()`
```js
function toggleLang() {
  setLang(getLang() === 'en' ? 'fr' : 'en');
}
```
Bascule entre EN et FR. Appelé par `onclick="toggleLang()"` sur le `.lang-btn`.

### `t(key)`
```js
function t(key) {
  const lang = getLang();
  return (I18N[lang] ?? I18N.en)[key] ?? I18N.en[key] ?? key;
}
```
Retourne la traduction dans la langue active.
Fallback : EN si la clé n'existe pas en FR. Puis la clé elle-même si absente partout.

---

## Usage dans le code

```js
// Chaîne simple
t('saved')           // → 'saved' ou 'sauvegardé'
t('btnCreate')       // → 'Create' ou 'Créer'

// Fonction avec paramètre
t('deleteConfirm')(name)   // → 'Delete character "Dok"?...'
t('emptySearch')(query)    // → 'No results for "dragon".'

// Dans les templates HTML (app.js)
`<div class="search-cat-label">${escHtml(getLang() === 'fr' ? meta.labelFr : meta.label)}</div>`
```

---

## Ajouter une nouvelle clé de traduction

1. Ajouter la clé dans `I18N.en` (version anglaise)
2. Ajouter la même clé dans `I18N.fr` (version française)
3. Utiliser `t('maClé')` dans le code

**⚠️ Ne jamais oublier d'ajouter les deux langues** — sinon le fallback retourne la clé brute.

---

## Traductions dans data_fr.js (séparées de i18n.js)

Les noms des **items de données** (quêtes, sorts, ingrédients...) ne sont pas dans
`i18n.js`. Ils sont dans `data_fr.js` :
- `DATA_FR_NAMES` — `{ [id]: 'Nom FR' }` pour les items 1–1144
- `DATA_FR_WORDS` — `{ [id]: 'signification FR' }` pour les mots draconiques 658–738
- `SHOUT_GROUP_FR_MAP` — dans `app.js` — noms des groupes de cris en FR
- `SPELL_SCHOOL_FR_MAP` — dans `app.js` — noms des écoles de magie en FR
- `QUEST_GROUP_FR_MAP` — dérivé de `QUEST_GROUPS[].labelFr` dans `app.js`

Voir [data-js.md](data-js.md) pour les détails.
