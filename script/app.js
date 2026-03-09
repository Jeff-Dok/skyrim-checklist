/**
 * @file app.js
 * @description Logique principale de la Skyrim Checklist.
 *   Gère l'état applicatif (checked, collapsedGroups, currentCat, searchQuery),
 *   le rendu DOM complet (tabs, liste, stats, modal d'info), et la persistance
 *   des données dans le localStorage du navigateur.
 *
 * Dépendance : script/data.js — doit être chargé avant ce fichier.
 *   data.js expose CHECKLIST_DATA = { [catégorie: string]: Item[] }
 *
 * Stockage localStorage :
 *   Clé    : STORAGE_KEY ('skyrim_checklist_v1')
 *   Format : JSON.stringify(checked)  →  { [id: number]: true }
 *
 * DOM ciblé (id) :
 *   #itemList, #tabs, #globalPct, #globalFill, #globalProgress,
 *   #storageBadge, #searchInput, #infoModal, #infoModalContent, #infoModalTitle
 */


/* ════════════════════════════════════════════════════════════════
   CONFIGURATION — Constantes & métadonnées
   ════════════════════════════════════════════════════════════════ */

/** Clé utilisée pour lire/écrire la progression dans le localStorage. */
const STORAGE_KEY = 'skyrim_checklist_v1';

/**
 * Définition de chaque groupe de quêtes :
 *   name  — clé dans CHECKLIST_DATA['Quests']
 *   img   — nom du fichier WebP dans assets/knotworks/ (null = pas d'image)
 *   label — (optionnel) libellé court affiché sur le knotwork
 *
 * L'ordre de ce tableau détermine l'ordre d'affichage des groupes.
 */
const QUEST_GROUPS = [
  { name: 'Main Quest',               img: 'main_quest.webp' },
  { name: 'Companions',               img: 'companions_quest.webp' },
  { name: 'College of Winterhold',    img: 'college_quest.webp', label: 'Coll. of Winterhold' },
  { name: "Thieves Guild",            img: 'thieves_quest.webp' },
  { name: 'Dark Brotherhood',         img: 'brotherhood_quest.webp' },
  { name: 'Civil War',                img: 'civilwar_quest.webp' },
  { name: 'Daedric',                  img: 'daedric_quest.webp' },
  { name: 'Bards College',            img: 'bard_quest.webp' },
  { name: 'Divine Quests',            img: 'creationclub_quest.webp' },
  { name: 'The Greybeards',           img: 'creationclub_quest.webp' },
  { name: 'The Blades',               img: 'creationclub_quest.webp' },
  { name: 'Side Quests',              img: 'side_quest.webp' },
  { name: 'Dungeon Quests',           img: 'creationclub_quest.webp' },
  { name: 'Miscellaneous Objectives', img: 'miscellaneous_objectives.webp', label: 'Miscellaneous Obj.' },
  { name: 'Favors',                   img: 'favor_objectives.webp' },
  { name: 'Dawnguard',                img: 'dawnguard_quest.webp' },
  { name: 'Dragonborn',               img: 'dragonborn_quest.webp' },
  { name: 'Fishing',                  img: 'fishing_quest.webp' },
  { name: 'Creation Club',            img: 'creationclub_quest.webp' },
];

/** Lookup rapide : { [groupName]: imgFilename } — dérivé de QUEST_GROUPS. */
const QUEST_GROUP_MAP = Object.fromEntries(QUEST_GROUPS.map(g => [g.name, g.img]));

/** Lookup des labels courts : { [groupName]: label } — groupes avec label défini seulement. */
const QUEST_GROUP_LABEL_MAP = Object.fromEntries(QUEST_GROUPS.filter(g => g.label).map(g => [g.name, g.label]));

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
  'Quests':                { label: 'Quests' },
  'Dragon Shouts':         { label: 'Shouts' },
  'Spells':                { label: 'Spells' },
  'Enchanting Effects':    { label: 'Enchanting' },
  'Alchemy Ingredients':   { label: 'Alchemy' },
  'Books':                 { label: 'Skill Book' },
  'Perks':                 { label: 'Special Perks' },
  'Collectible':           { label: 'Collectible' },
  'Unique Gear':           { label: 'Unique Gear' },
  'Locations':             { label: 'Locations' },
  'Merchants':             { label: 'Merchants' },
  'Recruitable Followers': { label: 'Followers' },
  'Achievements':          { label: 'Achievements' },
};

/** Liste ordonnée des catégories (dérivée de CATEGORY_META). */
const CATEGORIES = Object.keys(CATEGORY_META);

/* ── État applicatif mutable ── */
let currentCat   = CATEGORIES[0]; // catégorie affichée dans le contenu principal
let searchQuery  = '';             // requête de recherche globale courante
let checked      = {};             // { [id]: true } — items cochés (persisté)
let collapsedGroups = {};          // { [catKey]: true } — groupes repliés (session)

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
  try { checked = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
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
  if (state === 'saving') label.textContent = 'saving…';
  else if (state === 'error') label.textContent = 'save failed';
  else label.textContent = 'saved';
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
    const label  = meta.label || cat;
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
function renderItemsHtml(items, cat, forceExpand = false) {
  const groups    = {};
  const dataOrder = [];
  items.forEach(item => {
    const g = item.group || 'Autres';
    if (!groups[g]) { groups[g] = []; dataOrder.push(g); }
    groups[g].push(item);
  });

  /* Flags de rendu spécial — déterminés une seule fois pour la catégorie */
  const isQuests     = cat === 'Quests';
  const isShouts     = cat === 'Dragon Shouts';
  const isSpells     = cat === 'Spells';
  const isEnchanting = cat === 'Enchanting Effects';
  const isAlchemy    = cat === 'Alchemy Ingredients';

  /* ── Alchemy : rendu spécial deux sections (Ingredients + Potions) ── */
  if (isAlchemy) {
    const ingredients = items.filter(i => i.section === 'Ingredients');
    const potions     = items.filter(i => i.section === 'Potions');

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
          <span class="item-name">${escHtml(item.name)}</span>
          <button class="info-btn" onclick="event.stopPropagation();event.preventDefault();openInfoModal(${item.id})" title="Informations">ⓘ</button>
        </label>
      </li>`;
    };

    const ingGrid      = ingredients.length ? `<ul class="alchemy-grid">${ingredients.map(renderIngLi).join('')}</ul>` : '';
    const ingCollapsed = !!collapsedGroups[cat + '::Ingredients'];
    const potCollapsed = !!collapsedGroups[cat + '::Potions'];

    return `
      <div class="group${ingCollapsed ? ' collapsed' : ''}">
        <div class="group-header" onclick="toggleGroup('${escJs(cat)}','Ingredients')">
          <div class="group-knotwork-wrap no-img">
            <span class="group-knotwork-pct">Ingredients<span class="knotwork-pct-value">&nbsp;&nbsp;—&nbsp;&nbsp;${ingPct}%</span></span>
          </div>
        </div>
        ${ingCollapsed ? '' : ingGrid}
      </div>
      <div class="group${potCollapsed ? ' collapsed' : ''}">
        <div class="group-header" onclick="toggleGroup('${escJs(cat)}','Potions')">
          <div class="group-knotwork-wrap no-img">
            <span class="group-knotwork-pct">Potions<span class="knotwork-pct-value">&nbsp;&nbsp;—&nbsp;&nbsp;${potPct}%</span></span>
          </div>
        </div>
        ${potCollapsed ? '' : '<p class="alchemy-coming-soon">Data coming soon</p>'}
      </div>
    `;
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
          <span class="item-name">${escHtml(item.name)}</span>
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

    /* ── Dragon Shouts : grille 3 colonnes avec DragonScript ── */
    if (isShouts) {
      itemsContent = collapsed ? '' : `<div class="shout-words-grid">
        ${groupItems.map(item => {
          const done = isChecked(item.id);
          return `<div class="shout-word${done ? ' done' : ''}" id="item-${item.id}">
            <label class="item-label">
              <span class="cb-wrap">
                <input type="checkbox" ${done ? 'checked' : ''} onchange="toggle(${item.id})" />
                <span class="cb-box"></span>
              </span>
              <div class="word-body">
                <span class="word-name">${escHtml(item.name)}</span>
                <span class="word-dragon">${escHtml(DRAGON_SCRIPT_ENC[item.name] || item.name)}</span>
                <span class="word-en">${escHtml(item.word_en || '')}</span>
              </div>
              <button class="info-btn" onclick="event.stopPropagation();event.preventDefault();openInfoModal(${item.id})" title="Informations">ⓘ</button>
            </label>
          </div>`;
        }).join('')}
      </div>`;

    /* ── Enchanting Effects : grille 6 colonnes compacte ── */
    } else if (isEnchanting) {
      const enchHtml = collapsed ? '' : groupItems.map(item => {
        const done = isChecked(item.id);
        return `<li class="item${done ? ' done' : ''}" id="item-${item.id}">
          <label class="item-label">
            <span class="cb-wrap">
              <input type="checkbox" ${done ? 'checked' : ''} onchange="toggle(${item.id})" />
              <span class="cb-box"></span>
            </span>
            <span class="item-name">${escHtml(item.name)}</span>
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
          ? `<img class="spell-icon" src="assets/images/spells/SR-icon-spell-${escHtml(item.img)}.webp" alt="" loading="lazy">`
          : '<span class="spell-icon"></span>';
        return `<li class="item${done ? ' done' : ''}" id="item-${item.id}">
          <label class="item-label">
            ${icon}
            <span class="cb-wrap">
              <input type="checkbox" ${done ? 'checked' : ''} onchange="toggle(${item.id})" />
              <span class="cb-box"></span>
            </span>
            <span class="item-name">${escHtml(item.name)}</span>
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
              <span class="item-name">${escHtml(item.name)}</span>
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
    const groupLabel = QUEST_GROUP_LABEL_MAP[group] || group;

    const knotwork = isQuests
      ? img
        ? `<div class="group-knotwork-wrap">
             <img class="group-knotwork" src="assets/knotworks/${img}" alt="${escHtml(group)}" width="1030" height="74" loading="lazy" />
             <span class="group-knotwork-pct">${escHtml(groupLabel)}<span class="knotwork-pct-value">&nbsp;&nbsp;—&nbsp;&nbsp;${groupPct}%</span></span>
           </div>`
        : `<div class="group-knotwork-wrap no-img">
             <span class="group-knotwork-pct">${escHtml(groupLabel)}<span class="knotwork-pct-value">&nbsp;&nbsp;—&nbsp;&nbsp;${groupPct}%</span></span>
           </div>`
      : isShouts || isSpells || isEnchanting || isAlchemy
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
        ? `<img class="spell-icon" src="assets/images/spells/SR-icon-spell-${escHtml(item.img)}.webp" alt="" loading="lazy">`
        : '';
      return `<li class="item${done ? ' done' : ''}" id="item-${item.id}">
        <label class="item-label">
          ${spellIcon}
          <span class="cb-wrap">
            <input type="checkbox" ${done ? 'checked' : ''} onchange="toggle(${item.id})" />
            <span class="cb-box"></span>
          </span>
          ${imgTag}
          <span class="item-name">${escHtml(item.name)}</span>
          ${infoBtn}
        </label>
      </li>`;
    }).join('');
    return `<div class="search-group">
      <div class="search-group-label">${escHtml(group)}</div>
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
      html += `<div class="search-cat-label">${escHtml(meta.label || cat)}</div>`;
      html += renderSearchResults(filtered, cat);
    });
    container.innerHTML = totalFound === 0
      ? `<div class="empty"><span class="empty-icon">✦</span>Aucun résultat pour "${escHtml(q)}".</div>`
      : `<div class="search-results-wrap">${html}</div>`;
  } else {
    /* Affichage normal : catégorie active uniquement */
    const items = CHECKLIST_DATA[currentCat] || [];
    container.innerHTML = items.length === 0
      ? `<div class="empty"><span class="empty-icon">✦</span>Aucun élément.</div>`
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
  if (item.desc)                           parts.push(item.desc);
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

  const rows = [];

  /* ── Alchemy ── */
  if (isAlchemyItem) {
    if (item.section) rows.push(makeInfoRow('Group',        item.section));
    if (item.origin)  rows.push(makeInfoRow('Origin',       item.origin));
    if (item.effects) rows.push(makeInfoRow('Effects',      item.effects.map(e => escHtml(e)).join('<br>'), true));
    if (item.source)  rows.push(makeInfoRow('How to Obtain',item.source));
    rows.push(makeInfoRow('Garden', item.garden ? 'Yes' : 'No'));
  }

  /* ── Champ group (libellé contextuel selon le type) ── */
  if (!isShoutItem && !isSpellItem && !isEnchantItem && !isAlchemyItem && item.group)
    rows.push(makeInfoRow('Quest Group', item.group));
  if (isShoutItem  && item.group) rows.push(makeInfoRow('Shout',    item.group));
  if (isSpellItem  && item.group) rows.push(makeInfoRow('School',   item.group));
  if (isEnchantItem && item.group) rows.push(makeInfoRow('Category', item.group));

  /* ── Champs spécifiques ── */
  if (item.school)  rows.push(makeInfoRow('School',            item.school));
  if (item.slots)   rows.push(makeInfoRow('Applicable Slots',  item.slots));
  if (item.word_en) rows.push(makeInfoRow('Translation',       item.word_en));
  if (isSpellItem && item.level) rows.push(makeInfoRow('Level', item.level));
  if (item.dlc)     rows.push(makeInfoRow('DLC',               item.dlc));
  if (item.city)    rows.push(makeInfoRow('City',              item.city));
  if (item.prince)  rows.push(makeInfoRow('Daedric Prince',    item.prince));
  if (!isSpellItem && item.level) rows.push(makeInfoRow('Level Required', String(item.level)));
  if (item.desc)    rows.push(makeInfoRow('Description',       item.desc));
  if (item.location) rows.push(makeInfoRow('Word Wall Location', item.location));
  if (item.giver)   rows.push(makeInfoRow('Quest Giver',       item.giver));
  if (item.reward)  rows.push(makeInfoRow('Rewards',           item.reward));

  /* Injection dans le DOM — h2#infoModalTitle pour aria-labelledby */
  document.getElementById('infoModalContent').innerHTML = `
    <h2 class="info-modal-title" id="infoModalTitle">${escHtml(item.name)}</h2>
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
 * Point d'entrée de l'application.
 * Appelé une seule fois au chargement (fin de ce fichier, scripts defer).
 *   1. Charge la progression depuis le localStorage.
 *   2. Replie tous les groupes par défaut.
 *   3. Construit le DOM initial (tabs, stats, liste).
 *   4. Branche les événements (search input, touche Échap).
 */
function init() {
  load();

  /* Replier tous les groupes de toutes les catégories par défaut */
  CATEGORIES.forEach(cat => {
    const items = CHECKLIST_DATA[cat] || [];
    [...new Set(items.map(i => i.group || 'Autres'))].forEach(g => {
      collapsedGroups[groupKey(cat, g)] = true;
    });
  });
  /* Sections Alchemy repliées par défaut (utilisent section au lieu de group) */
  collapsedGroups[groupKey('Alchemy Ingredients', 'Ingredients')] = true;
  collapsedGroups[groupKey('Alchemy Ingredients', 'Potions')]     = true;

  renderTabs();
  renderStats();
  renderList();
  setBadge('saved');

  /* Recherche : écoute les frappes en temps réel */
  document.getElementById('searchInput').addEventListener('input', e => onSearch(e.target.value));

  /* Touche Échap : ferme le modal d'information si ouvert */
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeInfoModal(); });
}

init();
