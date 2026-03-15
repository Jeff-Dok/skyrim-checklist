/**
 * @file app.js
 * @description Logique principale de la Skyrim Checklist.
 *   Gère l'état applicatif (checked, collapsedGroups, currentCat, searchQuery),
 *   le rendu DOM complet (tabs, liste, stats, modal d'info), et la persistance
 *   des données dans le localStorage du navigateur.
 *
 * Dépendances : script/data/*.js — doivent être chargés avant ce fichier.
 *   data/index.js expose CHECKLIST_DATA = { [catégorie: string]: Item[] }
 *   Chaque item contient name_fr, desc_fr (et word_fr pour les shouts).
 *
 * Stockage localStorage :
 *   Clés   : PROFILES_KEY ('skyrim_profiles_v1') — liste des profils
 *            getStorageKey(id) → 'skyrim_checklist_{id}' — progression par profil
 *   Format : JSON.stringify(checked)  →  { [id: number]: true }
 *
 * DOM ciblé (id) :
 *   #itemList, #tabs, #globalPct, #globalFill, #globalProgress,
 *   #storageBadge, #searchInput, #infoModal, #infoModalContent, #infoModalTitle
 */


/* ════════════════════════════════════════════════════════════════
   CONFIGURATION — Constantes & métadonnées
   ════════════════════════════════════════════════════════════════ */

/*
 * PROFILES_KEY, ACTIVE_PROFILE_KEY et getStorageKey() sont définis dans
 * script/profiles.js, chargé avant ce fichier dans skyrim.html.
 */

/**
 * Définition de chaque groupe de quêtes :
 *   name  — clé dans CHECKLIST_DATA['Quests']
 *   img   — nom du fichier WebP dans assets/images/knotworks/ (null = pas d'image)
 *   label — (optionnel) libellé court affiché sur le knotwork
 *
 * L'ordre de ce tableau détermine l'ordre d'affichage des groupes.
 */
const QUEST_GROUPS = [
  { name: 'Main Quest',               img: 'main_quest.webp',               labelFr: 'Quête Principale' },
  { name: 'Companions',               img: 'companions_quest.webp',          labelFr: 'Compagnons' },
  { name: 'College of Winterhold',    img: 'college_quest.webp',    label: 'Coll. of Winterhold',   labelFr: 'Acad. de Fortdhiver' },
  { name: "Thieves Guild",            img: 'thieves_quest.webp',             labelFr: 'Guilde des Voleurs' },
  { name: 'Dark Brotherhood',         img: 'brotherhood_quest.webp',         labelFr: 'Confrérie Noire' },
  { name: 'Civil War',                img: 'civilwar_quest.webp',            labelFr: 'Guerre Civile' },
  { name: 'Daedric',                  img: 'daedric_quest.webp',             labelFr: 'Daedrique' },
  { name: 'Bards College',            img: 'bard_quest.webp',                labelFr: 'Acad. des Bardes' },
  { name: 'Divine Quests',            img: 'divine_quests.webp',             labelFr: 'Quêtes Divines' },
  { name: 'The Greybeards',           img: 'greybeards_quest.webp',          labelFr: 'Les Grises-Barbes' },
  { name: 'The Blades',               img: 'blades_quests.webp',             labelFr: 'Les Lames' },
  { name: 'Side Quests',              img: 'side_quest.webp',                labelFr: 'Quêtes Secondaires' },
  { name: 'Dungeon Quests',           img: 'dungeon_quests.webp',            labelFr: 'Quêtes de Donjon' },
  { name: 'Miscellaneous Objectives', img: 'miscellaneous_objectives.webp', label: 'Miscellaneous Obj.', labelFr: 'Objectifs Divers' },
  { name: 'Favors',                   img: 'favor_objectives.webp',          labelFr: 'Faveurs' },
  { name: 'Dawnguard',                img: 'dawnguard_quest.webp',           labelFr: 'Dawnguard' },
  { name: 'Dragonborn',               img: 'dragonborn_quest.webp',          labelFr: 'Dragonborn' },
  { name: 'Fishing',                  img: 'fishing_quest.webp',             labelFr: 'Pêche' },
  { name: 'Creation Club',            img: 'creationclub_quest.webp',        labelFr: 'Creation Club' },
];

/** Lookup rapide : { [groupName]: imgFilename } — dérivé de QUEST_GROUPS. */
const QUEST_GROUP_MAP = Object.fromEntries(QUEST_GROUPS.map(g => [g.name, g.img]));

/** Lookup des labels courts EN : { [groupName]: label } — groupes avec label défini seulement. */
const QUEST_GROUP_LABEL_MAP = Object.fromEntries(QUEST_GROUPS.filter(g => g.label).map(g => [g.name, g.label]));

/** Lookup des labels FR : { [groupName]: labelFr } — tous les groupes. */
const QUEST_GROUP_FR_MAP = Object.fromEntries(QUEST_GROUPS.filter(g => g.labelFr).map(g => [g.name, g.labelFr]));

/** Traductions FR des écoles de magie (Spells). */
const SPELL_SCHOOL_FR_MAP = {
  'Alteration':  'Altération',
  'Conjuration': 'Conjuration',
  'Destruction': 'Destruction',
  'Illusion':    'Illusion',
  'Restoration': 'Guérison',
};

/** Traductions FR des groupes de cris (Dragon Shouts). */
const SHOUT_GROUP_FR_MAP = {
  'Animal Allegiance':  'Allégeance Animale',
  'Aura Whisper':       'Aura de Perception',
  'Battle Fury':        'Furie Combative',
  'Become Ethereal':    'Corps Éthéré',
  'Bend Will':          'Asservissement',
  'Call Dragon':        'Appel du Dragon',
  'Call of Valor':      'Appel des Valeureux',
  'Clear Skies':        'Ciel Dégagé',
  'Cyclone':            'Cyclone',
  'Disarm':             'Désarmement',
  'Dismaying Shout':    'Intimidation',
  'Dragon Aspect':      'Aspect Draconique',
  'Dragonrend':         'Fendragon',
  'Drain Vitality':     'Ponction de Vitalité',
  'Elemental Fury':     'Furie Élémentale',
  'Fire Breath':        'Souffle Ardent',
  'Frost Breath':       'Souffle Glacé',
  'Ice Form':           'Cri de Glace',
  "Kyne's Peace":       'Paix de Kyne',
  'Marked for Death':   'Marque Mortelle',
  'Slow Time':          'Ralenti',
  'Soul Tear':          "Lacération d'Âme",
  'Storm Call':         'Tourmente',
  'Summon Durnehviir':  'Invocation de Durnehviir',
  'Throw Voice':        'Projection de Voix',
  'Unrelenting Force':  'Déferlement',
  'Whirlwind Sprint':   'Impulsion',
};

/** Ordre de rendu des groupes de quêtes — dérivé de QUEST_GROUPS. */
const QUEST_GROUP_ORDER = QUEST_GROUPS.map(g => g.name);

/**
 * Groupes utilisant un rendu en grille de cartes (au lieu d'une liste).
 * Exception au pattern standard — actuellement uniquement 'Daedric'.
 * @type {Set<string>}
 */
const QUEST_CARD_GROUPS = new Set(['Daedric']);

/**
 * Sections (colonnes d'actes) par groupe de quêtes.
 * firstId : ID du premier item de cette section.
 * Les items dont l'ID est inférieur au premier firstId forment la section "pre-act"
 * (Story, Innkeepers, etc.) définie dans QUEST_ACTS_META.
 * @type {Object.<string, Array<{label: string, firstId: number}>>}
 */
const QUEST_ACTS = {
  'Main Quest': [
    { label: 'ACT 1', firstId: 1  },
    { label: 'ACT 2', firstId: 8  },
    { label: 'ACT 3', firstId: 14 },
  ],
  'Companions': [
    { label: 'Initial Wave', firstId: 26 },
    { label: 'Second Wave',  firstId: 33 },
    { label: 'Final Wave',   firstId: 36 },
  ],
  'College of Winterhold': [
    { label: 'Side Quests',         firstId: 47 },
    { label: 'Ritual Spell Quests', firstId: 53 },
    { label: 'Radiant Quests',      firstId: 58 },
  ],
  "Thieves Guild": [
    { label: 'Side Quests',            firstId: 77 },
    { label: 'Job Quests',             firstId: 81 },
    { label: 'City Influence Quests',  firstId: 88 },
  ],
  'Dark Brotherhood': [
    { label: 'Side Quests',    firstId: 106 },
    { label: 'Side Contracts', firstId: 110 },
    { label: 'Radiant Quests', firstId: 122 },
  ],
  'Civil War': [
    { label: 'Imperial Legion', firstId: 123 },
    { label: 'Stormcloaks',     firstId: 137 },
  ],
  'Bards College': [
    { label: 'Instrument Quests', firstId: 168 },
  ],
  'Divine Quests': [
    { label: 'Side Quests', firstId: 171 },
  ],
  'The Greybeards': [
    { label: 'Radiant Quests', firstId: 177 },
  ],
  'The Blades': [
    { label: 'Radiant Quests', firstId: 178 },
  ],
  'Side Quests': [
    { label: 'Markarth',  firstId: 183 },
    { label: 'Morthal',   firstId: 186 },
    { label: 'Riften',    firstId: 188 },
    { label: 'Solitude',  firstId: 190 },
    { label: 'Whiterun',  firstId: 193 },
    { label: 'Windhelm',  firstId: 195 },
    { label: 'Riverwood', firstId: 199 },
    { label: 'Other',     firstId: 200 },
  ],
  'Dungeon Quests': [
    { label: 'Angarvunde',           firstId: 203 },
    { label: 'Ansilvund',            firstId: 204 },
    { label: "Angi's Camp",          firstId: 205 },
    { label: "Bard's Leap Summit",   firstId: 206 },
    { label: 'Blind Cliff Cave',     firstId: 207 },
    { label: 'Darklight Tower',      firstId: 208 },
    { label: 'Forelhost',            firstId: 209 },
    { label: 'Frostflow Lighthouse', firstId: 210 },
    { label: 'Frostmere Crypt',      firstId: 211 },
    { label: 'High Gate Ruins',      firstId: 212 },
    { label: "Hillgrund's Tomb",     firstId: 213 },
    { label: 'Mistwatch',            firstId: 214 },
    { label: 'Moss Mother Cavern',   firstId: 215 },
    { label: 'Nilheim',              firstId: 216 },
    { label: 'Ragnvald',             firstId: 217 },
    { label: "Rebel's Cairn",        firstId: 218 },
    { label: 'Shroud Hearth Barrow', firstId: 219 },
    { label: 'Sleeping Tree Camp',   firstId: 220 },
    { label: 'Southfringe Sanctum',  firstId: 221 },
    { label: "Treva's Watch",        firstId: 222 },
    { label: 'Valthume',             firstId: 223 },
    { label: 'Volunruud',            firstId: 224 },
    { label: 'Yngol Barrow',         firstId: 225 },
  ],
  'Miscellaneous Objectives': [
    { label: 'Haafingar Hold',   firstId: 246 },
    { label: 'Hjaalmarch Hold',  firstId: 253 },
    { label: 'The Pale',         firstId: 256 },
    { label: 'Winterhold',       firstId: 257 },
    { label: 'The Reach',        firstId: 263 },
    { label: 'Whiterun Hold',    firstId: 277 },
    { label: 'Eastmarch Hold',   firstId: 287 },
    { label: 'Falkreath Hold',   firstId: 292 },
    { label: 'The Rift',         firstId: 294 },
  ],
  'Favors': [
    { label: 'Chopping Wood',           firstId: 327 },
    { label: 'Mining Ore',              firstId: 339 },
    { label: 'Harvesting Crops',        firstId: 350 },
    { label: "A Drunk's Drink",         firstId: 365 },
    { label: 'The Gift of Charity',     firstId: 372 },
    { label: 'Special Delivery',        firstId: 383 },
    { label: 'Sparring Partners',       firstId: 389 },
    { label: 'A Good Talking To',       firstId: 396 },
    { label: 'A Little Light Thievery', firstId: 402 },
    { label: 'A Little Light Burglary', firstId: 405 },
    { label: 'The Bandit Slayer',       firstId: 406 },
    { label: 'The Vampire Slayer',      firstId: 409 },
    { label: 'Rare Item Hunt',          firstId: 410 },
    { label: 'Item Retrieval (Camp)',   firstId: 416 },
    { label: 'Item Retrieval (Cave)',   firstId: 418 },
    { label: 'Jobs for the Jarls',      firstId: 423 },
    { label: 'Thane Tasks',             firstId: 428 },
  ],
  'Dawnguard': [
    { label: 'Postquest Activities',                firstId: 451 },
    { label: 'Dawnguard Faction Quests',            firstId: 455 },
    { label: 'Vampire Faction Quests',              firstId: 464 },
    { label: 'Side Quests',                         firstId: 474 },
    { label: 'Regional Activities: Soul Cairn',     firstId: 478 },
    { label: 'Regional Activities: Forgotten Vale', firstId: 484 },
  ],
  'Dragonborn': [
    { label: 'Solstheim Side Quests',                  firstId: 493 },
    { label: 'Hidden Quests',                          firstId: 520 },
    { label: 'Regional Activities: Raven Rock',        firstId: 526 },
    { label: 'Regional Activities: Skaal Village',     firstId: 534 },
    { label: 'Regional Activities: Tel Mithryn',       firstId: 536 },
    { label: 'Regional Activities: Thirsk Mead Hall',  firstId: 538 },
  ],
  'Fishing': [
    { label: "Swims' Quests",         firstId: 566 },
    { label: "Swims' Radiant Quests", firstId: 571 },
  ],
  'Creation Club': [
    { label: 'Armor Quests',           firstId: 574 },
    { label: 'Weapon Quests',          firstId: 592 },
    { label: 'Ghosts of the Tribunal', firstId: 608 },
    { label: 'Saints & Seducers',      firstId: 614 },
    { label: 'The Cause',              firstId: 622 },
    { label: 'Bittercup',              firstId: 624 },
    { label: 'Divine Crusader',        firstId: 627 },
    { label: 'The Gray Cowl',          firstId: 629 },
    { label: 'Forgotten Seasons',      firstId: 630 },
    { label: 'Hendraheim',             firstId: 633 },
    { label: 'Myrwatch',               firstId: 634 },
    { label: 'Shadowfoot Sanctum',     firstId: 635 },
    { label: 'Bloodchill Manor',       firstId: 636 },
    { label: "Dead Man's Dread",       firstId: 637 },
    { label: 'Gallows Hall',           firstId: 638 },
    { label: 'Nchuanthumz',            firstId: 639 },
    { label: 'Pets',                   firstId: 640 },
    { label: 'Horses',                 firstId: 644 },
    { label: 'Followers',              firstId: 646 },
    { label: 'Farming',                firstId: 647 },
    { label: 'Crafting',               firstId: 649 },
    { label: 'Spells',                 firstId: 656 },
  ],
};

/**
 * Métadonnées optionnelles de sections par groupe de quêtes.
 *   preLabel   : label de la section plate précédant la grille d'actes
 *   gridLabel  : label optionnel affiché au-dessus de la grille d'actes
 * @type {Object.<string, {preLabel?: string, gridLabel?: string}>}
 */
const QUEST_ACTS_META = {
  'Companions':               { preLabel: 'Story', gridLabel: 'Radiant Quests' },
  'College of Winterhold':    { preLabel: 'Story' },
  "Thieves Guild":            { preLabel: 'Story' },
  'Dark Brotherhood':         { preLabel: 'Story' },
  'Bards College':            { preLabel: 'Story' },
  'Dawnguard':                { preLabel: 'Story' },
  'Dragonborn':               { preLabel: 'Story' },
  'Miscellaneous Objectives': { preLabel: 'Innkeepers' },
  'Fishing':                  { preLabel: "Viriya's Quests" },
};

/* Initialisation des catégories vides non définies dans data.js */
CHECKLIST_DATA['Achievements'] = CHECKLIST_DATA['Achievements'] || [];
CHECKLIST_DATA['Collectible']  = CHECKLIST_DATA['Collectible']  || [];

/**
 * Métadonnées de chaque catégorie : label d'onglet affiché.
 * L'ordre des clés détermine l'ordre des onglets.
 * @type {Object.<string, {label: string}>}
 */
const CATEGORY_META = {
  'Quests':                { label: 'Quests',        labelFr: 'Quêtes' },
  'Dragon Shouts':         { label: 'Shouts',        labelFr: 'Cris' },
  'Spells':                { label: 'Spells',        labelFr: 'Sorts' },
  'Enchanting Effects':    { label: 'Enchantments',  labelFr: 'Enchantements' },
  'Alchemy Ingredients':   { label: 'Alchemy',       labelFr: 'Alchimie' },
  'Books':                 { label: 'Books',         labelFr: 'Livres' },
  'Perks':                 { label: 'Perks',         labelFr: 'Atouts' },
  'Collectible':           { label: 'Collectibles',  labelFr: 'Collections' },
  'Unique Gear':           { label: 'Unique Gears',  labelFr: 'Artéfacts' },
  'Locations':             { label: 'Locations',     labelFr: 'Lieux' },
  'Merchants':             { label: 'Merchants',     labelFr: 'Marchands' },
  'Recruitable Followers': { label: 'Followers',     labelFr: 'Compagnons' },
  'Achievements':          { label: 'Achievements',  labelFr: 'Succès' },
};

/** Liste ordonnée des catégories (dérivée de CATEGORY_META). */
const CATEGORIES = Object.keys(CATEGORY_META);

/* ── État applicatif mutable ── */
let currentCat      = CATEGORIES[0]; // catégorie affichée dans le contenu principal
let searchQuery     = '';             // requête de recherche globale courante
let checked         = {};             // { [id]: true } — items cochés (persisté)
let collapsedGroups = {};             // { [catKey]: true } — groupes repliés (session)
let activeProfileId = null;           // id du profil actif (défini au démarrage)

/** Ordre d'affichage des sous-groupes de la section Potions. */
const POTION_SECTIONS = ['Health', 'Magicka', 'Stamina', 'Skill'];
/** Ordre d'affichage des sous-groupes de la section Poisons. */
const POISON_SECTIONS = ['Damage', 'Crowd Control', 'Weakness', 'Lingering', 'Special'];

const SPELL_SCHOOL_IMG = {
  'Alteration':  'alteration_2.webp',
  'Conjuration': 'conjuration_2.webp',
  'Destruction': 'destruction_2.webp',
  'Illusion':    'illusion_2.webp',
  'Restoration': 'restoration_2.webp',
};

/**
 * Table d'encodage DragonscriptRegular : { [mot latin]: chaîne encodée }.
 * La police DragonscriptRegular (Dragon_script.ttf) réinterprète certains
 * glyphes ASCII pour afficher l'alphabet Dovazhul (Dragon Language).
 * Ex: 'Fus' → 'FUS' sera rendu en caractères dragon par la police.
 */
const DRAGON_SCRIPT_ENC = {
  'Raan':'R1N','Mir':'M7','Tah':'T4',
  'Laas':'L1S','Yah':'Y4','Nir':'N7',
  'Mid':'MID','Vur':'V6','Shaan':'SH1N',
  'Feim':'F2M','Zii':'Z3','Gron':'GRON',
  'Gol':'GOL','Hah':'H4','Dov':'DOV',
  'Od':'OD','Ah':'4','Viing':'V3NG',
  'Hun':'HUN','Kaal':'K1L','Zoor':'Z8R',
  'Lok':'LOK','Vah':'V4','Koor':'K8R',
  'Ven':'VEN','Gaar':'G1R','Nos':'NOS',
  'Zun':'ZUN','Haal':'H1L','Viik':'V3K',
  'Faas':'F1S','Ru':'RU','Maar':'M1R',
  'Mul':'MUL','Qah':'Q4','Diiv':'D3V',
  'Joor':'J8R','Zah':'Z4','Frul':'FRUL',
  'Gaan':'G1N','Lah':'L4','Haas':'H1S',
  'Su':'SU','Grah':'GR4','Dun':'DUN',
  'Yol':'YOL','Toor':'T8R','Shul':'SHUL',
  'Fo':'FO','Krah':'KR4','Diin':'D3N',
  'Iiz':'3Z','Slen':'SLEN','Nus':'NUS',
  'Kaan':'K1N','Drem':'DREM','Ov':'OV',
  'Krii':'KR3','Lun':'LUN','Aus':'AUS',
  'Tiid':'T3D','Klo':'KLO','Ul':'UL',
  'Rii':'R3','Vaaz':'V1Z','Zol':'ZOL',
  'Strun':'STRUN','Bah':'B4','Qo':'QO',
  'Dur':'D6','Neh':'NEH','Viir':'V3R',
  'Zul':'ZUL','Mey':'M9','Gut':'GUT',
  'Fus':'FUS','Ro':'RO','Dah':'D4',
  'Wuld':'WULD','Nah':'N4','Kest':'KEST'
};


/* ════════════════════════════════════════════════════════════════
   PERSISTANCE — localStorage read/write
   ════════════════════════════════════════════════════════════════ */

/**
 * Charge la progression sauvegardée depuis le localStorage.
 * En cas d'erreur (JSON invalide, accès refusé), initialise checked à {}.
 */
function load() {
  try { checked = JSON.parse(localStorage.getItem(getStorageKey(activeProfileId))) || {}; }
  catch { checked = {}; }
}

/** Timer de debounce pour save() — évite des écritures trop fréquentes. */
let _saveTimer = null;

/**
 * Sauvegarde la progression dans le localStorage avec un debounce de 600ms.
 * Affiche l'indicateur "saving…" immédiatement, puis "saved" ou "error".
 */
function save() {
  setBadge('saving');
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(getStorageKey(activeProfileId), JSON.stringify(checked));
      setBadge('saved');
    } catch {
      setBadge('error');
    }
  }, 600);
}

/**
 * Met à jour l'indicateur de statut du stockage (point coloré + label).
 * @param {'saved'|'saving'|'error'} state - État à afficher.
 */
function setBadge(state) {
  const badge = document.getElementById('storageBadge');
  if (!badge) return;
  badge.dataset.state = state;
  const label = badge.querySelector('.storage-label');
  if (state === 'saving') label.textContent = t('saving');
  else if (state === 'error') label.textContent = t('saveFailed');
  else label.textContent = t('saved');
}


/* ════════════════════════════════════════════════════════════════
   PROFIL ACTIF — Lecture + bouton topbar
   ════════════════════════════════════════════════════════════════ */

/**
 * Retourne le nom d'un item dans la langue active.
 * Utilise item.name_fr si la langue est FR et que la traduction existe.
 * @param {{ id: number, name: string, name_fr?: string }} item
 * @returns {string}
 */
function itemName(item) {
  if (typeof getLang === 'function' && getLang() === 'fr' && item.name_fr) {
    return item.name_fr;
  }
  return item.name;
}

/** Met à jour le bouton de personnage dans la topbar avec le nom du profil actif. */
function updateCharacterBtn() {
  const btn = document.getElementById('characterBtn');
  if (!btn) return;
  const profiles = getProfiles();
  const active = profiles.find(p => p.id === activeProfileId);
  btn.textContent = active ? active.name : '—';
}


/* ════════════════════════════════════════════════════════════════
   STATE — Lecture et mutation de l'état
   ════════════════════════════════════════════════════════════════ */

/**
 * Retourne true si l'item avec cet id est coché.
 * @param {number} id
 * @returns {boolean}
 */
function isChecked(id) { return !!checked[id]; }

/**
 * Bascule l'état coché/non-coché d'un item, sauvegarde et met à jour le DOM.
 * Appelé par onchange des checkboxes générées dans renderItemsHtml.
 * @param {number} id - Identifiant unique de l'item.
 */
function toggle(id) {
  if (checked[id]) delete checked[id];
  else checked[id] = true;
  save();
  renderList();
  renderStats();
  renderTabBadges();
}

/**
 * Construit la clé de collapsedGroups pour un groupe d'une catégorie.
 * Format : "catégorie::groupe"
 * @param {string} cat
 * @param {string} group
 * @returns {string}
 */
function groupKey(cat, group) { return cat + '::' + group; }

/**
 * Retourne true si le groupe est actuellement replié.
 * @param {string} cat
 * @param {string} group
 * @returns {boolean}
 */
function isCollapsed(cat, group) { return !!collapsedGroups[groupKey(cat, group)]; }

/**
 * Bascule l'état plié/déplié d'un groupe et relance le rendu de la liste.
 * Appelé par onclick des group-header dans renderItemsHtml.
 * Note : ne mute jamais collapsedGroups pendant une recherche (forceExpand).
 * @param {string} cat
 * @param {string} group
 */
function toggleGroup(cat, group) {
  const k = groupKey(cat, group);
  if (collapsedGroups[k]) delete collapsedGroups[k];
  else collapsedGroups[k] = true;
  renderList();
}

/**
 * Coche ou décoche tous les items d'un groupe en une seule opération.
 * @param {string} cat   - Catégorie du groupe.
 * @param {string} group - Nom du groupe.
 * @param {boolean} value - true = cocher tout, false = décocher tout.
 */
function checkGroup(cat, group, value) {
  const items = CHECKLIST_DATA[cat].filter(i => (i.group || 'Autres') === group);
  items.forEach(i => {
    if (value) checked[i.id] = true;
    else delete checked[i.id];
  });
  save();
  renderList();
  renderStats();
  renderTabBadges();
}


/* ════════════════════════════════════════════════════════════════
   STATS — Calculs de progression
   ════════════════════════════════════════════════════════════════ */

/**
 * Calcule la progression globale sur toutes les catégories.
 * @returns {{ total: number, done: number, pct: number }}
 */
function globalStats() {
  const total = CATEGORIES.reduce((s, c) => s + CHECKLIST_DATA[c].length, 0);
  const done  = Object.keys(checked).length;
  return { total, done, pct: total ? Math.round(done / total * 100) : 0 };
}

/**
 * Calcule la progression pour une catégorie donnée.
 * @param {string} cat
 * @returns {{ total: number, done: number, pct: number }}
 */
function catStats(cat) {
  const items = CHECKLIST_DATA[cat];
  const total = items.length;
  const done  = items.filter(i => isChecked(i.id)).length;
  return { total, done, pct: total ? Math.round(done / total * 100) : 0 };
}


/* ════════════════════════════════════════════════════════════════
   UTILITIES — Échappement et helpers HTML
   ════════════════════════════════════════════════════════════════ */

/**
 * Échappe les caractères spéciaux HTML pour prévenir les injections XSS.
 * À utiliser sur toute chaîne insérée dans innerHTML.
 * @param {string|number|null|undefined} str
 * @returns {string}
 */
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Échappe les apostrophes et backslashes pour une utilisation sûre dans
 * les attributs onclick='...' générés dynamiquement.
 * Indispensable pour les noms de groupes contenant des apostrophes
 * (ex: "Angi's Camp", "A Drunk's Drink").
 * @param {string} str
 * @returns {string}
 */
function escJs(str) {
  if (!str) return '';
  return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Construit une rangée étiquette/valeur pour le modal d'information.
 * @param {string} label - Libellé du champ (ex: "Quest Group", "Description").
 * @param {string|number} val - Valeur à afficher.
 * @param {boolean} [raw=false] - Si true, val est inséré tel quel (HTML brut autorisé).
 *   Utiliser raw=true uniquement avec des valeurs déjà échappées (ex: effets rejoints par <br>).
 * @returns {string} HTML string de la rangée.
 */
function makeInfoRow(label, val, raw = false) {
  const displayed = raw ? val : escHtml(String(val));
  return `<div class="info-row"><span class="info-label">${escHtml(label)}</span><span class="info-val">${displayed}</span></div>`;
}


/* ════════════════════════════════════════════════════════════════
   RENDERING — Mise à jour du DOM
   ════════════════════════════════════════════════════════════════ */

/**
 * Met à jour le pourcentage global, la barre de progression, et l'attribut
 * aria-valuenow pour l'accessibilité.
 */
function renderStats() {
  const { pct } = globalStats();
  document.getElementById('globalPct').textContent = pct + '%';
  document.getElementById('globalFill').style.width = pct + '%';
  const bar = document.getElementById('globalProgress');
  if (bar) bar.setAttribute('aria-valuenow', pct);
}

/**
 * Met à jour les badges "done/total" sur chaque bouton d'onglet.
 * Chaque bouton contient un <span id="badge-{cat}"> généré par renderTabs().
 */
function renderTabBadges() {
  CATEGORIES.forEach(cat => {
    const { done, total } = catStats(cat);
    const el = document.getElementById('badge-' + cat);
    if (el) el.textContent = done + '/' + total;
  });
}

/**
 * Génère les boutons d'onglet dans le nav#tabs.
 * Chaque bouton expose data-cat pour switchCat().
 */
function renderTabs() {
  const container = document.getElementById('tabs');
  const tabs = CATEGORIES.map(cat => {
    const meta   = CATEGORY_META[cat] || {};
    const label  = (getLang() === 'fr' ? meta.labelFr : meta.label) || cat;
    const active = cat === currentCat ? ' active' : '';
    return `<button class="tab-btn${active}" data-cat="${escHtml(cat)}" onclick="switchCat('${escJs(cat)}')">${label}</button>`;
  }).join('');
  container.innerHTML = tabs;
}

/**
 * Change la catégorie active, efface la recherche et relance le rendu.
 * Met à jour la classe .active sur les boutons sans reconstruire tout le nav.
 * @param {string} cat - Clé de catégorie (ex: 'Quests', 'Dragon Shouts').
 */
function switchCat(cat) {
  currentCat = cat;
  localStorage.setItem('skyrim_last_cat', cat);
  searchQuery = '';
  document.getElementById('searchInput').value = '';
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.cat === cat);
  });
  renderList();
}

/**
 * Construit le HTML de tous les groupes d'une liste d'items pour une catégorie donnée.
 * Gère les rendus spéciaux : Alchemy (grille + sections), Shouts (grille 3 col.),
 * Enchanting (grille 6 col.), Spells (colonnes par niveau), Daedric (cartes),
 * et le pattern standard quêtes (knotwork + actes).
 *
 * @param {Array} items - Items à afficher (subset ou totalité de CHECKLIST_DATA[cat]).
 * @param {string} cat  - Catégorie courante.
 * @param {boolean} [forceExpand=false] - Si true, tous les groupes sont affichés
 *   développés, indépendamment de collapsedGroups (utilisé pendant la recherche).
 * @returns {string} HTML string à injecter dans le container.
 */

/**
 * Rendu d'une ligne de tableau pour un achievement.
 * Colonnes : [CB] | [img 46px] | [name] | [desc]
 */
function renderAchievementRow(item) {
  const done    = isChecked(item.id);
  const imgSrc  = `assets/images/achievements/${escHtml(item.img)}.webp`;
  const dispName = (getLang() === 'fr' && item.name_fr) ? item.name_fr : item.name;
  const dispDesc = (getLang() === 'fr' && item.desc_fr) ? item.desc_fr : (item.desc || '');
  return `
<li class="item achievement-row${done ? ' done' : ''}">
  <label class="achievement-label">
    <span class="cb-wrap"><input type="checkbox" ${done ? 'checked' : ''} onchange="toggle(${item.id})"><span class="cb-box"></span></span>
    <img class="achievement-img" src="${imgSrc}" alt="${escHtml(item.name)}" width="46" height="46" loading="lazy">
    <span class="achievement-name">${escHtml(dispName)}</span>
    <span class="achievement-desc">${escHtml(dispDesc)}</span>
  </label>
</li>`;
}

function renderItemsHtml(items, cat, forceExpand = false) {
  const groups    = {};
  const dataOrder = [];
  items.forEach(item => {
    const g = item.group || 'Autres';
    if (!groups[g]) { groups[g] = []; dataOrder.push(g); }
    groups[g].push(item);
  });

  /* Flags de rendu spécial — déterminés une seule fois pour la catégorie */
  const isQuests       = cat === 'Quests';
  const isShouts       = cat === 'Dragon Shouts';
  const isSpells       = cat === 'Spells';
  const isEnchanting   = cat === 'Enchanting Effects';
  const isAlchemy      = cat === 'Alchemy Ingredients';
  const isBooks        = cat === 'Books';
  const isPerks        = cat === 'Perks';
  const isAchievements = cat === 'Achievements';

  /* ── Achievements : 4 sections — collapsibles (mobile) / côte à côte (desktop) ── */
  if (isAchievements) {
    const ACHIEVEMENT_GROUPS = ['Skyrim', 'Dawnguard', 'Hearthfire', 'Dragonborn'];
    const sections = ACHIEVEMENT_GROUPS.map(grp => {
      const grpItems    = items.filter(i => i.group === grp);
      const grpDone     = grpItems.filter(i => isChecked(i.id)).length;
      const grpPct      = grpItems.length ? Math.round(100 * grpDone / grpItems.length) : 0;
      const grpCollapsed = !!collapsedGroups[groupKey(cat, grp)];

      let bodyHtml;
      if (grp === 'Skyrim') {
        const subgroups = [...new Set(grpItems.map(i => i.subgroup).filter(Boolean))];
        bodyHtml = subgroups.map(sub => {
          const rows = grpItems.filter(i => i.subgroup === sub).map(item => renderAchievementRow(item)).join('');
          return `<div class="achievement-subgroup">
            <div class="achievement-subgroup-header">${escHtml(sub)}</div>
            <ul class="achievement-list">${rows}</ul>
          </div>`;
        }).join('');
      } else {
        bodyHtml = `<ul class="achievement-list">${grpItems.map(item => renderAchievementRow(item)).join('')}</ul>`;
      }

      return `
        <div class="group${grpCollapsed ? ' collapsed' : ''}">
          <div class="group-header" onclick="toggleGroup('${escJs(cat)}','${escJs(grp)}')">
            <div class="group-knotwork-wrap no-img">
              <span class="group-knotwork-pct">${escHtml(grp)}<span class="knotwork-pct-value">&nbsp;&nbsp;—&nbsp;&nbsp;${grpPct}%</span></span>
            </div>
          </div>
          <div class="group-items">${bodyHtml}</div>
        </div>`;
    }).join('');

    return `<div class="achievement-grid">${sections}</div>`;
  }

  /* ── Perks : 6 groupes, sous-groupes pour Combat/Magic/Stealth ── */
  if (isPerks) {
    const PERK_GROUPS = {
      'Combat Skills':       ['One-Handed', 'Two-Handed', 'Archery', 'Block', 'Heavy Armor', 'Smithing'],
      'Magic Skills':        ['Alteration', 'Conjuration', 'Destruction', 'Illusion', 'Restoration', 'Enchanting'],
      'Stealth Skills':      ['Light Armor', 'Sneak', 'Lockpicking', 'Pickpocket', 'Speech', 'Alchemy'],
      'Vampire Lord Skills': null,
      'Werewolf Skills':     null,
      'Special Skills':      null,
    };
    return Object.entries(PERK_GROUPS).map(([grp, subgroups]) => {
      const grpCollapsed = !!collapsedGroups[groupKey(cat, grp)];
      let content = '';
      if (!grpCollapsed) {
        if (subgroups) {
          content = subgroups.map(sub => {
            const subCollapsed = !!collapsedGroups[groupKey(cat, grp + '::' + sub)];
            return `<div class="potion-subgroup${subCollapsed ? ' collapsed' : ''}">
              <div class="potion-subgroup-header" onclick="toggleGroup('${escJs(cat)}','${escJs(grp + '::' + sub)}')">
                <span class="potion-sub-name">${escHtml(sub)}</span>
              </div>
              ${subCollapsed ? '' : '<p class="alchemy-coming-soon">Data coming soon</p>'}
            </div>`;
          }).join('');
        } else {
          content = '<p class="alchemy-coming-soon">Data coming soon</p>';
        }
      }
      return `
        <div class="group${grpCollapsed ? ' collapsed' : ''}">
          <div class="group-header" onclick="toggleGroup('${escJs(cat)}','${escJs(grp)}')">
            <div class="spell-school-header">
              <span class="spell-school-name">${escHtml(grp)}</span>
            </div>
          </div>
          ${content}
        </div>`;
    }).join('');
  }

  /* ── Books : 3 groupes placeholder ── */
  if (isBooks) {
    const bookGroups = ['Skills', 'Quests', 'Lores'];
    return bookGroups.map(grp => {
      const grpCollapsed = !!collapsedGroups[cat + '::' + grp];
      return `
        <div class="group${grpCollapsed ? ' collapsed' : ''}">
          <div class="group-header" onclick="toggleGroup('${escJs(cat)}','${escJs(grp)}')">
            <div class="spell-school-header">
              <span class="spell-school-name">${escHtml(grp)}</span>
            </div>
          </div>
          ${grpCollapsed ? '' : '<p class="alchemy-coming-soon">Data coming soon</p>'}
        </div>`;
    }).join('');
  }

  /* ── Alchemy : rendu spécial deux sections (Ingredients + Potions) ── */
  if (isAlchemy) {
    const ingredients = items.filter(i => i.section === 'Ingredients');
    const potions     = items.filter(i => i.section === 'Potions');
    const poisons     = items.filter(i => i.section === 'Poisons');

    const ingDone = ingredients.filter(i => isChecked(i.id)).length;
    const ingPct  = ingredients.length ? Math.round(100 * ingDone / ingredients.length) : 0;
    const potDone = potions.filter(i => isChecked(i.id)).length;
    const potPct  = potions.length ? Math.round(100 * potDone / potions.length) : 0;

    /** Génère le HTML d'un item ingrédient (icône + checkbox + nom + bouton ⓘ). */
    const renderIngLi = item => {
      const done = isChecked(item.id);
      const imgTag = item.img
        ? `<img class="alchemy-img" src="assets/images/ingredients/${escHtml(item.img)}" alt="" loading="lazy" onerror="this.style.display='none'">`
        : '';
      return `<li class="item${done ? ' done' : ''}" id="item-${item.id}">
        <label class="item-label">
          <span class="cb-wrap">
            <input type="checkbox" ${done ? 'checked' : ''} onchange="toggle(${item.id})" />
            <span class="cb-box"></span>
          </span>
          ${imgTag}
          <span class="item-name">${escHtml(itemName(item))}</span>
          <button class="info-btn" onclick="event.stopPropagation();event.preventDefault();openInfoModal(${item.id})" title="Informations">ⓘ</button>
        </label>
      </li>`;
    };

    /** Génère le HTML d'un item potion (icône + checkbox + nom + ⓘ). */
    const renderPotionLi = item => {
      const done = isChecked(item.id);
      const imgTag = item.img
        ? `<img class="potion-img" src="assets/images/potions/${escHtml(item.img)}.webp" alt="" loading="lazy" onerror="this.style.display='none'">`
        : '';
      return `<li class="item${done ? ' done' : ''}" id="item-${item.id}">
        <label class="item-label">
          <span class="cb-wrap">
            <input type="checkbox" ${done ? 'checked' : ''} onchange="toggle(${item.id})" />
            <span class="cb-box"></span>
          </span>
          ${imgTag}
          <span class="item-name">${escHtml(itemName(item))}</span>
          <button class="info-btn" onclick="event.stopPropagation();event.preventDefault();openInfoModal(${item.id})" title="Informations">ⓘ</button>
        </label>
      </li>`;
    };

    /**
     * Rendu des sous-sections d'une section Alchemy (Potions ou Poisons).
     * @param {Array}  items      — items de la section
     * @param {Array}  sections   — POTION_SECTIONS ou POISON_SECTIONS
     * @param {string} parentKey  — 'Potions' ou 'Poisons'
     */
    const renderAlchemySubsections = (items, sections, parentKey) => sections.map(grp => {
      const grpItems = items.filter(i => i.group === grp);
      if (!grpItems.length) return '';
      const subKey      = parentKey + '::' + grp;
      const grpCollapsed = !!collapsedGroups[groupKey(cat, subKey)];

      let content;
      const hasTypes = grpItems.some(i => i.type);
      if (hasTypes) {
        /* Sous-groupes par type (Fortify X, Damage Health, etc.) — collapsibles */
        const types = [...new Set(grpItems.map(i => i.type).filter(Boolean))];
        content = types.map(type => {
          const typeItems   = grpItems.filter(i => i.type === type);
          const typeKey     = subKey + '::' + type;
          const typeCollapsed = !!collapsedGroups[groupKey(cat, typeKey)];
          return `<div class="potion-type-block${typeCollapsed ? ' collapsed' : ''}">
            <div class="potion-type-header" onclick="toggleGroup('${escJs(cat)}','${escJs(typeKey)}')">
              <span class="potion-type-name">${escHtml(type)}</span>
              <span class="potion-type-chevron">${typeCollapsed ? '▶' : '▼'}</span>
            </div>
            ${typeCollapsed ? '' : `<ul class="alchemy-grid potion-grid">${typeItems.map(renderPotionLi).join('')}</ul>`}
          </div>`;
        }).join('');
      } else {
        content = `<ul class="alchemy-grid potion-grid">${grpItems.map(renderPotionLi).join('')}</ul>`;
      }

      return `<div class="potion-subgroup${grpCollapsed ? ' collapsed' : ''}">
        <div class="potion-subgroup-header" onclick="toggleGroup('${escJs(cat)}','${escJs(subKey)}')">
          <span class="potion-sub-name">${escHtml(grp)}</span>
        </div>
        ${grpCollapsed ? '' : content}
      </div>`;
    }).join('');

    const ingGrid      = ingredients.length ? `<ul class="alchemy-grid">${ingredients.map(renderIngLi).join('')}</ul>` : '';
    const ingCollapsed = !!collapsedGroups[cat + '::Ingredients'];
    const potCollapsed = !!collapsedGroups[cat + '::Potions'];
    const poisCollapsed  = !!collapsedGroups[cat + '::Poisons'];
    const recCollapsed   = !!collapsedGroups[cat + '::Recipes'];

    return `
      <div class="group${ingCollapsed ? ' collapsed' : ''}">
        <div class="group-header" onclick="toggleGroup('${escJs(cat)}','Ingredients')">
          <div class="spell-school-header">
            <img class="spell-school-icon alchemy-section-icon" src="assets/images/craftings/alchemy.webp" alt="" width="36" height="36">
            <span class="spell-school-name">Ingredients<span class="knotwork-pct-value">&nbsp;&nbsp;—&nbsp;&nbsp;${ingPct}%</span></span>
            <img class="spell-school-icon alchemy-section-icon" src="assets/images/craftings/alchemy.webp" alt="" width="36" height="36">
          </div>
        </div>
        ${ingCollapsed ? '' : ingGrid}
      </div>
      <div class="group${potCollapsed ? ' collapsed' : ''}">
        <div class="group-header" onclick="toggleGroup('${escJs(cat)}','Potions')">
          <div class="spell-school-header">
            <img class="spell-school-icon alchemy-section-icon" src="assets/images/craftings/alchemy.webp" alt="" width="36" height="36">
            <span class="spell-school-name">Potions<span class="knotwork-pct-value">&nbsp;&nbsp;—&nbsp;&nbsp;${potPct}%</span></span>
            <img class="spell-school-icon alchemy-section-icon" src="assets/images/craftings/alchemy.webp" alt="" width="36" height="36">
          </div>
        </div>
        ${potCollapsed ? '' : (potions.length ? renderAlchemySubsections(potions, POTION_SECTIONS, 'Potions') : '<p class="alchemy-coming-soon">Data coming soon</p>')}
      </div>
      <div class="group${poisCollapsed ? ' collapsed' : ''}">
        <div class="group-header" onclick="toggleGroup('${escJs(cat)}','Poisons')">
          <div class="spell-school-header">
            <img class="spell-school-icon alchemy-section-icon" src="assets/images/craftings/alchemy.webp" alt="" width="36" height="36">
            <span class="spell-school-name">Poisons</span>
            <img class="spell-school-icon alchemy-section-icon" src="assets/images/craftings/alchemy.webp" alt="" width="36" height="36">
          </div>
        </div>
        ${poisCollapsed ? '' : (poisons.length ? renderAlchemySubsections(poisons, POISON_SECTIONS, 'Poisons') : '<p class="alchemy-coming-soon">Data coming soon</p>')}
      </div>
      <div class="group${recCollapsed ? ' collapsed' : ''}">
        <div class="group-header" onclick="toggleGroup('${escJs(cat)}','Recipes')">
          <div class="spell-school-header">
            <img class="spell-school-icon alchemy-section-icon" src="assets/images/craftings/alchemy.webp" alt="" width="36" height="36">
            <span class="spell-school-name">Recipes</span>
            <img class="spell-school-icon alchemy-section-icon" src="assets/images/craftings/alchemy.webp" alt="" width="36" height="36">
          </div>
        </div>
        ${recCollapsed ? '' : '<p class="alchemy-coming-soon">Data coming soon</p>'}
      </div>
    `;
  }

  /* ── Dragon Shouts : rendu plat — headers statiques + mots en liste ── */
  if (isShouts) {
    return dataOrder.map(group => {
      const groupItems = groups[group];
      const words = groupItems.map(item => {
        const done = isChecked(item.id);
        const dragon = DRAGON_SCRIPT_ENC[item.name] || item.name;
        return `<li class="item${done ? ' done' : ''}" id="item-${item.id}">
          <label class="item-label">
            <span class="cb-wrap">
              <input type="checkbox" ${done ? 'checked' : ''} onchange="toggle(${item.id})" />
              <span class="cb-box"></span>
            </span>
            <span class="item-name">${escHtml(itemName(item))}</span>
            <span class="word-dragon">${escHtml(dragon)}</span>
            <button class="info-btn" onclick="event.stopPropagation();event.preventDefault();openInfoModal(${item.id})" title="Informations">ⓘ</button>
            <span class="item-sub"><span class="word-en">${escHtml(getLang() === 'fr' ? (item.word_fr || item.word_en || '') : (item.word_en || ''))}</span></span>
          </label>
        </li>`;
      }).join('');
      const groupLabel = getLang() === 'fr' ? (SHOUT_GROUP_FR_MAP[group] || group) : group;
      return `<div class="act-section-header"><span>${escHtml(groupLabel)}</span></div>
        <ul class="shout-list">${words}</ul>`;
    }).join('');
  }

  /* Ordre des groupes : canonique (QUEST_GROUP_ORDER) pour les quêtes, sinon ordre des données */
  const groupOrder = isQuests
    ? QUEST_GROUP_ORDER.filter(g => groups[g])
    : dataOrder;

  /**
   * Génère le HTML d'un item standard (checkbox + nom + bouton ⓘ optionnel + sous-texte).
   * @param {Object} item
   * @returns {string}
   */
  function renderItemLi(item) {
    const done    = isChecked(item.id);
    const sub     = isQuests ? '' : buildSub(item);
    const infoBtn = isQuests
      ? `<button class="info-btn" onclick="event.stopPropagation();event.preventDefault();openInfoModal(${item.id})" title="Informations">ⓘ</button>`
      : '';
    return `<li class="item${done ? ' done' : ''}" id="item-${item.id}">
        <label class="item-label">
          <span class="cb-wrap">
            <input type="checkbox" ${done ? 'checked' : ''} onchange="toggle(${item.id})" />
            <span class="cb-box"></span>
          </span>
          <span class="item-name">${escHtml(itemName(item))}</span>
          ${infoBtn}
          ${sub ? `<span class="item-sub">${sub}</span>` : ''}
        </label>
      </li>`;
  }

  return groupOrder.map(group => {
    const groupItems = groups[group];
    const groupDone  = groupItems.filter(i => isChecked(i.id)).length;
    const collapsed  = forceExpand ? false : isCollapsed(cat, group);
    const acts       = (isQuests && QUEST_ACTS[group]) ? QUEST_ACTS[group] : [];
    const meta       = QUEST_ACTS_META[group] || {};

    let itemsContent;

    /* ── Enchanting Effects : grille 6 colonnes compacte ── */
    if (isEnchanting) {
      const enchHtml = collapsed ? '' : groupItems.map(item => {
        const done = isChecked(item.id);
        return `<li class="item${done ? ' done' : ''}" id="item-${item.id}">
          <label class="item-label">
            <span class="cb-wrap">
              <input type="checkbox" ${done ? 'checked' : ''} onchange="toggle(${item.id})" />
              <span class="cb-box"></span>
            </span>
            <span class="item-name">${escHtml(itemName(item))}</span>
            <button class="info-btn" onclick="event.stopPropagation();event.preventDefault();openInfoModal(${item.id})" title="Informations">ⓘ</button>
          </label>
        </li>`;
      }).join('');
      itemsContent = collapsed ? '' : `<ul class="enchant-grid">${enchHtml}</ul>`;

    /* ── Spells : colonnes par niveau (Novice → Special) ── */
    } else if (isSpells) {
      /** Génère le HTML d'un item sort (icône école + checkbox + nom + ⓘ). */
      const renderSpellLi = item => {
        const done = isChecked(item.id);
        const icon = item.img
          ? `<img class="spell-icon" src="assets/images/spells/${escHtml(item.img)}.webp" alt="" loading="lazy">`
          : '<span class="spell-icon"></span>';
        return `<li class="item${done ? ' done' : ''}" id="item-${item.id}">
          <label class="item-label">
            ${icon}
            <span class="cb-wrap">
              <input type="checkbox" ${done ? 'checked' : ''} onchange="toggle(${item.id})" />
              <span class="cb-box"></span>
            </span>
            <span class="item-name">${escHtml(itemName(item))}</span>
            <button class="info-btn" onclick="event.stopPropagation();event.preventDefault();openInfoModal(${item.id})" title="Informations">ⓘ</button>
          </label>
        </li>`;
      };
      const SPELL_LEVEL_ORDER = ['Novice', 'Apprentice', 'Adept', 'Expert', 'Master', 'Special'];
      const levelGroups = SPELL_LEVEL_ORDER.filter(lvl => groupItems.some(i => i.level === lvl));
      const spellCols   = collapsed ? '' : levelGroups.map(lvl => {
        const lvlItems = groupItems.filter(i => i.level === lvl);
        return `<div class="act-col">
          <div class="act-col-header"><span>${escHtml(lvl)}</span></div>
          <ul class="group-items">${lvlItems.map(renderSpellLi).join('')}</ul>
        </div>`;
      }).join('');
      itemsContent = collapsed ? '' : `<div class="radiant-section"><div class="acts-grid">${spellCols}</div></div>`;

    /* ── Daedric : grille de cartes 4 colonnes (exception QUEST_CARD_GROUPS) ── */
    } else if (isQuests && QUEST_CARD_GROUPS.has(group)) {
      itemsContent = collapsed ? '' : `<div class="daedric-grid">
        ${groupItems.map(item => {
          const done = isChecked(item.id);
          return `<div class="daedric-card${done ? ' done' : ''}">
            <span class="daedric-prince"><span>${escHtml(item.prince || '')}</span></span>
            <label class="item-label">
              <span class="cb-wrap">
                <input type="checkbox" ${done ? 'checked' : ''} onchange="toggle(${item.id})" />
                <span class="cb-box"></span>
              </span>
              <span class="item-name">${escHtml(itemName(item))}</span>
              <button class="info-btn" onclick="event.stopPropagation();event.preventDefault();openInfoModal(${item.id})" title="Informations">ⓘ</button>
            </label>
          </div>`;
        }).join('')}
      </div>`;

    /* ── Pattern standard quêtes : pre-act (Story) + grille d'actes ── */
    } else if (acts.length > 0 && !collapsed) {
      const firstActId  = acts[0].firstId;
      const preActItems = groupItems.filter(item => item.id < firstActId);
      const actCols     = acts.map((act, idx) => {
        const nextAct  = acts[idx + 1];
        const actItems = groupItems.filter(item =>
          item.id >= act.firstId && (!nextAct || item.id < nextAct.firstId)
        );
        return `<div class="act-col">
          <div class="act-col-header"><span>${escHtml(act.label)}</span></div>
          <ul class="group-items">${actItems.map(renderItemLi).join('')}</ul>
        </div>`;
      }).join('');

      const radiantSection = `<div class="radiant-section">
        ${meta.gridLabel ? `<div class="act-section-header"><span>${escHtml(meta.gridLabel)}</span></div>` : ''}
        <div class="acts-grid">${actCols}</div>
      </div>`;

      if (preActItems.length && meta.preLabel) {
        /* Layout story + radiant côte à côte (25% / 75%) */
        const storySection = `<div class="story-section">
          <div class="act-section-header"><span>${escHtml(meta.preLabel)}</span></div>
          <ul class="group-items">${preActItems.map(renderItemLi).join('')}</ul>
        </div>`;
        itemsContent = `<div class="story-radiant-wrap">${storySection}${radiantSection}</div>`;
      } else {
        /* Pre-act sans label : liste plate au-dessus de la grille */
        const preActHtml = preActItems.length
          ? `<ul class="group-items">${preActItems.map(renderItemLi).join('')}</ul>` : '';
        itemsContent = preActHtml + radiantSection;
      }

    /* ── Fallback : liste plate avec séparateurs d'actes ── */
    } else {
      const actMap   = Object.fromEntries(acts.map(a => [a.firstId, a.label]));
      const flatHtml = collapsed ? '' : groupItems.map(item => {
        const actLabel = actMap[item.id]
          ? `<li class="act-divider"><span>${actMap[item.id]}</span></li>`
          : '';
        return actLabel + renderItemLi(item);
      }).join('');
      itemsContent = `<ul class="group-items">${flatHtml}</ul>`;
    }

    /* ── En-tête du groupe (knotwork ou texte doré) ── */
    const groupPct   = groupItems.length ? Math.round(groupDone / groupItems.length * 100) : 0;
    const img        = isQuests ? QUEST_GROUP_MAP[group] : null;
    const groupLabel = getLang() === 'fr'
      ? (QUEST_GROUP_FR_MAP[group] || group)
      : (QUEST_GROUP_LABEL_MAP[group] || group);

    const knotwork = isQuests
      ? img
        ? `<div class="group-knotwork-wrap">
             <img class="group-knotwork" src="assets/images/knotworks/${img}" alt="${escHtml(group)}" width="1030" height="74" loading="lazy" />
             <span class="group-knotwork-pct">${escHtml(groupLabel)}<span class="knotwork-pct-value">&nbsp;&nbsp;—&nbsp;&nbsp;${groupPct}%</span></span>
           </div>`
        : `<div class="group-knotwork-wrap no-img">
             <span class="group-knotwork-pct">${escHtml(groupLabel)}<span class="knotwork-pct-value">&nbsp;&nbsp;—&nbsp;&nbsp;${groupPct}%</span></span>
           </div>`
      : isSpells && SPELL_SCHOOL_IMG[group]
        ? (() => { const si = SPELL_SCHOOL_IMG[group]; return `<div class="spell-school-header spell-school-${escHtml(group.toLowerCase())}">
             <img class="spell-school-icon" src="assets/images/schools/${si}" alt="" width="36" height="36">
             <span class="spell-school-name">${escHtml(getLang() === 'fr' ? (SPELL_SCHOOL_FR_MAP[group] || group) : group)}<span class="knotwork-pct-value">&nbsp;&nbsp;—&nbsp;&nbsp;${groupPct}%</span></span>
             <img class="spell-school-icon" src="assets/images/schools/${si}" alt="" width="36" height="36">
           </div>`; })()
      : isEnchanting && (group === 'Weapon Enchantments' || group === 'Armor Enchantments')
        ? `<div class="spell-school-header">
             <img class="spell-school-icon" src="assets/images/craftings/enchanting.webp" alt="" width="36" height="36">
             <span class="spell-school-name">${escHtml(getLang() === 'fr' ? (SPELL_SCHOOL_FR_MAP[group] || group) : group)}<span class="knotwork-pct-value">&nbsp;&nbsp;—&nbsp;&nbsp;${groupPct}%</span></span>
             <img class="spell-school-icon" src="assets/images/craftings/enchanting.webp" alt="" width="36" height="36">
           </div>`
      : isSpells || isEnchanting || isAlchemy
        ? `<div class="group-knotwork-wrap no-img">
             <span class="group-knotwork-pct">${escHtml(group)}<span class="knotwork-pct-value">&nbsp;&nbsp;—&nbsp;&nbsp;${groupPct}%</span></span>
           </div>`
        : `<span class="group-name">${escHtml(group)}</span>`;

    return `<div class="group${collapsed ? ' collapsed' : ''}">
      <div class="group-header" onclick="toggleGroup('${escJs(cat)}','${escJs(group)}')">
        ${knotwork}
      </div>
      ${itemsContent}
    </div>`;
  }).join('');
}

/**
 * Reconstruit entièrement le contenu de #itemList.
 * Si une recherche est active, affiche les résultats de toutes les catégories.
 * Sinon, affiche la catégorie active (currentCat).
 */
/**
 * Rendu simplifié pour les résultats de recherche.
 * Affiche uniquement : en-tête de groupe → liste plate des items correspondants.
 * Pas de knotworks, pas de colonnes d'actes, pas de grilles spéciales.
 * @param {Array} items - Items filtrés correspondant à la requête.
 * @param {string} cat  - Catégorie d'appartenance.
 * @returns {string} HTML string.
 */
function renderSearchResults(items, cat) {
  const groups = {};
  const order  = [];
  items.forEach(item => {
    const g = item.group || item.section || 'Autres';
    if (!groups[g]) { groups[g] = []; order.push(g); }
    groups[g].push(item);
  });

  const isAlchemy = cat === 'Alchemy Ingredients';
  const isSpells  = cat === 'Spells';
  /* Catégories disposant d'un modal ⓘ */
  const showInfo  = ['Quests', 'Dragon Shouts', 'Spells', 'Enchanting Effects', 'Alchemy Ingredients'].includes(cat);

  return order.map(group => {
    const itemsHtml = groups[group].map(item => {
      const done = isChecked(item.id);
      const infoBtn = showInfo
        ? `<button class="info-btn" onclick="event.stopPropagation();event.preventDefault();openInfoModal(${item.id})" title="Informations">ⓘ</button>`
        : '';
      const imgTag = isAlchemy && item.img
        ? `<img class="alchemy-img" src="assets/images/ingredients/${escHtml(item.img)}" alt="" loading="lazy" onerror="this.style.display='none'">`
        : '';
      const spellIcon = isSpells && item.img
        ? `<img class="spell-icon" src="assets/images/spells/${escHtml(item.img)}.webp" alt="" loading="lazy">`
        : '';
      return `<li class="item${done ? ' done' : ''}" id="item-${item.id}">
        <label class="item-label">
          ${spellIcon}
          <span class="cb-wrap">
            <input type="checkbox" ${done ? 'checked' : ''} onchange="toggle(${item.id})" />
            <span class="cb-box"></span>
          </span>
          ${imgTag}
          <span class="item-name">${escHtml(itemName(item))}</span>
          ${infoBtn}
        </label>
      </li>`;
    }).join('');
    return `<div class="search-group">
      <div class="search-group-label">${escHtml(getLang() === 'fr' ? (QUEST_GROUP_FR_MAP[group] || group) : group)}</div>
      <ul class="group-items">${itemsHtml}</ul>
    </div>`;
  }).join('');
}

function renderList() {
  const q         = searchQuery.toLowerCase();
  const container = document.getElementById('itemList');

  if (q) {
    /* Recherche globale : parcourt toutes les catégories */
    let html       = '';
    let totalFound = 0;
    CATEGORIES.forEach(cat => {
      const items    = CHECKLIST_DATA[cat] || [];
      const filtered = items.filter(i =>
        i.name.toLowerCase().includes(q) ||
        (i.group && i.group.toLowerCase().includes(q))
      );
      if (filtered.length === 0) return;
      totalFound += filtered.length;
      const meta = CATEGORY_META[cat] || {};
      html += `<div class="search-cat-label">${escHtml((getLang() === 'fr' ? meta.labelFr : meta.label) || cat)}</div>`;
      html += renderSearchResults(filtered, cat);
    });
    container.innerHTML = totalFound === 0
      ? `<div class="empty"><span class="empty-icon">✦</span>${escHtml(t('emptySearch')(q))}</div>`
      : `<div class="search-results-wrap">${html}</div>`;
  } else {
    /* Affichage normal : catégorie active uniquement */
    const items = CHECKLIST_DATA[currentCat] || [];
    container.innerHTML = (items.length === 0 && currentCat !== 'Books' && currentCat !== 'Perks')
      ? `<div class="empty"><span class="empty-icon">✦</span>${escHtml(t('emptyCategory'))}</div>`
      : renderItemsHtml(items, currentCat);
  }
}

/**
 * Construit le texte de sous-info compact d'un item (affiché en .item-sub).
 * Agrège les champs pertinents selon le type d'item, séparés par " · ".
 * @param {Object} item
 * @returns {string} HTML-escaped string, ou '' si aucun champ disponible.
 */
function buildSub(item) {
  const parts = [];
  if (item.level)                          parts.push(item.level);
  const _desc = (getLang() === 'fr' && item.desc_fr) ? item.desc_fr : item.desc;
  if (_desc)                               parts.push(_desc);
  if (item.giver)                          parts.push('→ ' + item.giver);
  if (item.category)                       parts.push(item.category);
  if (item.author)                         parts.push(item.author);
  if (item.store)                          parts.push(item.store);
  if (item.translation)                    parts.push('"' + item.translation + '"');
  if (item.location)                       parts.push(item.location);
  if (item.type && item.type !== item.group)   parts.push(item.type);
  if (item.effect && item.effect !== item.group) parts.push(item.effect);
  return parts.length ? escHtml(parts.join(' · ')) : '';
}


/* ════════════════════════════════════════════════════════════════
   MODAL — Fiche de détail d'un item
   ════════════════════════════════════════════════════════════════ */

/**
 * Ouvre le modal d'information pour l'item avec l'id donné.
 * Détecte le type d'item (quest, shout, spell, enchant, alchemy) pour adapter
 * les champs affichés. Injecte le contenu dans #infoModalContent.
 *
 * Ordre des champs par type :
 *   Quête    : Quest Group → City → Daedric Prince → Level Required → Description → Quest Giver → Rewards
 *   Shout    : Shout → Translation → DLC → Description → Word Wall Location
 *   Spell    : School → Level → DLC → Description
 *   Enchant  : Category → Applicable Slots → Description
 *   Alchemy  : Group → Origin → Effects → How to Obtain → Garden
 *
 * @param {number} id - Identifiant unique de l'item à afficher.
 */
function openInfoModal(id) {
  /* Recherche de l'item dans toutes les catégories */
  let item = null;
  for (const cat of CATEGORIES) {
    item = (CHECKLIST_DATA[cat] || []).find(i => i.id === id);
    if (item) break;
  }
  if (!item) return;

  /* Détection du type d'item */
  const SPELL_LEVELS  = new Set(['Novice','Apprentice','Adept','Expert','Master','Special']);
  const isShoutItem   = !!item.word_en;
  const isSpellItem   = SPELL_LEVELS.has(item.level);
  const isEnchantItem = !!item.slots;
  const isAlchemyItem = Array.isArray(item.effects);
  const isPotionItem  = item.section === 'Potions' || item.section === 'Poisons';

  const rows = [];

  /* ── Alchemy Ingredients ── */
  if (isAlchemyItem) {
    if (item.section) rows.push(makeInfoRow(t('modalGroup'),   item.section));
    if (item.origin)  rows.push(makeInfoRow(t('modalOrigin'),  item.origin));
    if (item.effects) rows.push(makeInfoRow(t('modalEffects'), item.effects.map(e => escHtml(e)).join('<br>'), true));
    if (item.source)  rows.push(makeInfoRow(t('modalObtain'),  item.source));
    rows.push(makeInfoRow(t('modalGarden'), item.garden ? t('modalYes') : t('modalNo')));
  }

  /* ── Potions / Poisons ── */
  if (isPotionItem) {
    rows.push(makeInfoRow(t('modalCategory'), item.section));
    if (item.group)  rows.push(makeInfoRow(t('modalGroup'),  item.group));
    if (item.type)   rows.push(makeInfoRow(t('modalType'),   item.type));
    if (item.level != null) rows.push(makeInfoRow(t('modalLevel'), String(item.level)));
    const _potionDesc = (getLang() === 'fr' && item.desc_fr) ? item.desc_fr : item.desc;
    if (_potionDesc) rows.push(makeInfoRow(t('modalEffect'), _potionDesc));
    if (item.source) rows.push(makeInfoRow(t('modalSource'), item.source));
  }

  /* ── Champ group (libellé contextuel selon le type) ── */
  if (!isShoutItem && !isSpellItem && !isEnchantItem && !isAlchemyItem && !isPotionItem && item.group)
    rows.push(makeInfoRow(t('modalGroup'),    item.group));
  if (isShoutItem   && item.group) rows.push(makeInfoRow(t('modalShout'),    item.group));
  if (isSpellItem   && item.group) rows.push(makeInfoRow(t('modalSchool'),   item.group));
  if (isEnchantItem && item.group) rows.push(makeInfoRow(t('modalCategory'), item.group));

  /* ── Champs spécifiques (quêtes, sorts, shouts, enchantements) ── */
  if (!isPotionItem) {
    if (item.school)  rows.push(makeInfoRow(t('modalSchool'),       item.school));
    if (item.slots)   rows.push(makeInfoRow(t('modalSlots'),        item.slots));
    if (item.word_en) rows.push(makeInfoRow(t('modalTranslation'), (getLang() === 'fr' && item.word_fr) ? item.word_fr : item.word_en));
    if (isSpellItem && item.level) rows.push(makeInfoRow(t('modalSpellLevel'), item.level));
    if (item.dlc)     rows.push(makeInfoRow(t('modalDLC'),          item.dlc));
    if (item.city)    rows.push(makeInfoRow(t('modalCity'),         item.city));
    if (item.prince)  rows.push(makeInfoRow(t('modalPrince'),       item.prince));
    if (!isSpellItem && item.level) rows.push(makeInfoRow(t('modalLevel'), String(item.level)));
    const descFr = getLang() === 'fr' && item.desc_fr;
    if (descFr || item.desc) rows.push(makeInfoRow(t('modalDesc'), descFr || item.desc));
    if (item.location) rows.push(makeInfoRow(t('modalLocation'),    item.location));
    if (item.giver)   rows.push(makeInfoRow(t('modalGiver'),        item.giver));
    if (item.reward)  rows.push(makeInfoRow(t('modalRewards'),      item.reward));
  }

  /* Injection dans le DOM — h2#infoModalTitle pour aria-labelledby */
  document.getElementById('infoModalContent').innerHTML = `
    <h2 class="info-modal-title" id="infoModalTitle">${escHtml(itemName(item))}</h2>
    <div class="info-modal-rows">${rows.join('')}</div>
  `;
  document.getElementById('infoModal').classList.add('open');
}

/**
 * Ferme le modal d'information.
 * Appelé par : clic sur l'overlay | bouton ✕ | touche Échap (init).
 */
function closeInfoModal() {
  document.getElementById('infoModal').classList.remove('open');
}


/* ════════════════════════════════════════════════════════════════
   RECHERCHE
   ════════════════════════════════════════════════════════════════ */

/**
 * Met à jour searchQuery et relance renderList().
 * Appelé par l'événement "input" sur #searchInput.
 * @param {string} val - Valeur brute du champ de recherche.
 */
function onSearch(val) {
  searchQuery = val.trim();
  renderList();
}


/* ════════════════════════════════════════════════════════════════
   INITIALISATION
   ════════════════════════════════════════════════════════════════ */

/**
 * Initialise collapsedGroups avec tous les groupes repliés par défaut.
 * Appelé au démarrage et à chaque changement de profil.
 */
function initCollapsedGroups() {
  collapsedGroups = {};
  CATEGORIES.forEach(cat => {
    const items = CHECKLIST_DATA[cat] || [];
    [...new Set(items.map(i => i.group || 'Autres'))].forEach(g => {
      collapsedGroups[groupKey(cat, g)] = true;
    });
  });
  /* Groupes Books repliés par défaut */
  ['Skills', 'Quests', 'Lores'].forEach(grp => {
    collapsedGroups[groupKey('Books', grp)] = true;
  });
  /* Groupes Perks repliés par défaut */
  const PERK_INIT = {
    'Combat Skills':       ['One-Handed', 'Two-Handed', 'Archery', 'Block', 'Heavy Armor', 'Smithing'],
    'Magic Skills':        ['Alteration', 'Conjuration', 'Destruction', 'Illusion', 'Restoration', 'Enchanting'],
    'Stealth Skills':      ['Light Armor', 'Sneak', 'Lockpicking', 'Pickpocket', 'Speech', 'Alchemy'],
    'Vampire Lord Skills': null,
    'Werewolf Skills':     null,
    'Special Skills':      null,
  };
  Object.entries(PERK_INIT).forEach(([grp, subs]) => {
    collapsedGroups[groupKey('Perks', grp)] = true;
    if (subs) subs.forEach(sub => {
      collapsedGroups[groupKey('Perks', grp + '::' + sub)] = true;
    });
  });

  /* Achievements : 4 groupes repliés par défaut (desktop force-expand via CSS) */
  ['Skyrim', 'Dawnguard', 'Hearthfire', 'Dragonborn'].forEach(grp => {
    collapsedGroups[groupKey('Achievements', grp)] = true;
  });

  /* Sections Alchemy repliées par défaut (utilisent section au lieu de group) */
  collapsedGroups[groupKey('Alchemy Ingredients', 'Ingredients')] = true;
  collapsedGroups[groupKey('Alchemy Ingredients', 'Potions')]     = true;
  collapsedGroups[groupKey('Alchemy Ingredients', 'Poisons')]     = true;
  collapsedGroups[groupKey('Alchemy Ingredients', 'Recipes')]     = true;
  POTION_SECTIONS.forEach(grp => {
    collapsedGroups[groupKey('Alchemy Ingredients', 'Potions::' + grp)] = true;
  });
  POISON_SECTIONS.forEach(grp => {
    collapsedGroups[groupKey('Alchemy Ingredients', 'Poisons::' + grp)] = true;
  });
  (CHECKLIST_DATA['Alchemy Ingredients'] || []).forEach(i => {
    if ((i.section === 'Potions' || i.section === 'Poisons') && i.type && i.group) {
      collapsedGroups[groupKey('Alchemy Ingredients', i.section + '::' + i.group + '::' + i.type)] = true;
    }
  });
}

/**
 * Point d'entrée de l'application.
 * Appelé une seule fois au chargement (fin de ce fichier, scripts defer).
 *   1. Lit le profil actif depuis localStorage (défini par index.html).
 *      Si aucun profil → redirige vers index.html.
 *   2. Charge la progression du profil actif.
 *   3. Construit le DOM (tabs, stats, liste).
 *   4. Branche les événements (search, Échap).
 */
function init() {
  /* Lire le profil actif défini par la page d'accueil */
  activeProfileId = localStorage.getItem(ACTIVE_PROFILE_KEY);

  /* Aucun profil actif → rediriger vers l'accueil */
  if (!activeProfileId || !getProfiles().find(p => p.id === activeProfileId)) {
    window.location.replace('index.html');
    return;
  }

  /* Stocker le total pour que index.html puisse calculer les % */
  localStorage.setItem('skyrim_total_items', String(Object.values(CHECKLIST_DATA).flat().length));

  /* Restaurer l'onglet actif après un rechargement (ex. changement de langue) */
  const savedCat = localStorage.getItem('skyrim_last_cat');
  if (savedCat && CATEGORIES.includes(savedCat)) currentCat = savedCat;

  initCollapsedGroups();
  load();
  renderTabs();
  renderStats();
  renderList();
  setBadge('saved');
  updateCharacterBtn();

  /* Strings i18n — topbar statique */
  const si = document.getElementById('searchInput');
  if (si) si.placeholder = t('searchPlaceholder');
  const cl = document.querySelector('.complete-label');
  if (cl) cl.textContent = t('completeLabel');
  const lb = document.getElementById('langBtn');
  if (lb) lb.textContent = t('langBtn');

  /* Recherche globale */
  document.getElementById('searchInput').addEventListener('input', e => onSearch(e.target.value));

  /* Touche Échap : ferme le modal d'information si ouvert */
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeInfoModal(); });
}

init();
