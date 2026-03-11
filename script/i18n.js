/**
 * @file i18n.js
 * @description Internationalisation EN / FR.
 *   Partagé entre index.html et skyrim.html (étendu au besoin).
 *
 * Stockage : localStorage 'skyrim_lang' → 'en' | 'fr'  (défaut : 'en')
 * Usage    : t('key')   → string traduit dans la langue active
 *            getLang()  → 'en' | 'fr'
 *            toggleLang() → bascule la langue et recharge la page
 */

const LANG_KEY = 'skyrim_lang';

const I18N = {
  en: {
    /* ── index.html ── */
    selectTitle:    'Select a Character',
    newCharacter:   'New Character',
    placeholder:    'Character name\u2026',
    btnCreate:      'Create',
    btnPlay:        '\u25b6 Play',
    emptyProfiles:  'No characters yet \u2014 create one below.',
    metaCreated:    'created',
    deleteConfirm:  name => `Delete character \u201c${name}\u201d?\nThis action cannot be undone.`,
    langBtn:        'FR',

    /* ── skyrim.html — topbar statique ── */
    searchPlaceholder: 'Search\u2026',
    completeLabel:     'Complete @',

    /* ── skyrim.html — storage badge ── */
    saved:      'saved',
    saving:     'saving\u2026',
    saveFailed: 'save failed',

    /* ── skyrim.html — empty states ── */
    emptySearch:    q => `No results for \u201c${q}\u201d.`,
    emptyCategory:  'Nothing here yet.',

    /* ── skyrim.html — modal labels ── */
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
    /* ── index.html ── */
    selectTitle:    'Choisir un personnage',
    newCharacter:   'Nouveau personnage',
    placeholder:    'Nom du personnage\u2026',
    btnCreate:      'Cr\u00e9er',
    btnPlay:        '\u25b6 Jouer',
    emptyProfiles:  'Aucun personnage \u2014 cr\u00e9ez-en un ci-dessous.',
    metaCreated:    'cr\u00e9\u00e9 le',
    deleteConfirm:  name => `Supprimer \u00ab\u00a0${name}\u00a0\u00bb ?\nCette action est irr\u00e9versible.`,
    langBtn:        'EN',

    /* ── skyrim.html — topbar statique ── */
    searchPlaceholder: 'Rechercher\u2026',
    completeLabel:     'Complet\u00e9 \u00e0',

    /* ── skyrim.html — storage badge ── */
    saved:      'sauvegard\u00e9',
    saving:     'sauvegarde\u2026',
    saveFailed: 'erreur',

    /* ── skyrim.html — empty states ── */
    emptySearch:    q => `Aucun r\u00e9sultat pour \u00ab\u00a0${q}\u00a0\u00bb.`,
    emptyCategory:  'Rien ici pour le moment.',

    /* ── skyrim.html — modal labels ── */
    modalGroup:       'Groupe de qu\u00eate',
    modalCity:        'Ville',
    modalPrince:      'Prince Daedra',
    modalLevel:       'Niveau requis',
    modalDesc:        'Description',
    modalGiver:       'Donneur de qu\u00eate',
    modalRewards:     'R\u00e9compenses',
    modalShout:       'Cri',
    modalTranslation: 'Traduction',
    modalDLC:         'DLC',
    modalLocation:    'Emplacement du Mur des Mots',
    modalSchool:      '\u00c9cole',
    modalSpellLevel:  'Niveau',
    modalSlots:       'Emplacements applicables',
    modalCategory:    'Cat\u00e9gorie',
    modalType:        'Type',
    modalEffect:      'Effet',
    modalSource:      'Source',
    modalOrigin:      'Origine',
    modalEffects:     'Effets',
    modalObtain:      'Comment obtenir',
    modalGarden:      'Jardin',
    modalYes:         'Oui',
    modalNo:          'Non',
  },
};

/** @returns {'en'|'fr'} */
function getLang() {
  return localStorage.getItem(LANG_KEY) === 'fr' ? 'fr' : 'en';
}

/** @param {'en'|'fr'} lang */
function setLang(lang) {
  localStorage.setItem(LANG_KEY, lang);
  location.reload();
}

/** Bascule entre EN et FR puis recharge la page. */
function toggleLang() {
  setLang(getLang() === 'en' ? 'fr' : 'en');
}

/**
 * Retourne la traduction d'une clé dans la langue active.
 * @param {string} key
 * @returns {string|function}
 */
function t(key) {
  const lang = getLang();
  return (I18N[lang] ?? I18N.en)[key] ?? I18N.en[key] ?? key;
}
