# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Session Workflow (MANDATORY)

### Start of session

Automatically review `CLAUDE.md`, `memory/MEMORY.md`, `TODO.md`, and `RESUME.txt` before doing anything else. No need to mention it unless something is outdated or missing.

### MAJ command

When the user types `MAJ` alone:

1. Update `CLAUDE.md`, `memory/MEMORY.md`, and `TODO.md` to reflect the current state of the project.
2. **Append** a concise summary of the current session's work to `RESUME.txt` (ne pas écraser — ajouter à la suite avec un séparateur de date/session).

### End of session

Triggered automatically when the user says something like: "bon fini", "bonne nuit", "bon à demain", "assez travaillé", "on arrête", "à demain", "bonne soirée", or any similar sign-off phrase.

When triggered, do ALL of the following without being asked:

1. Update `memory/MEMORY.md` with anything new or changed this session
2. Update `CLAUDE.md` if any architecture, conventions, or functions changed
3. Update `TODO.md` to reflect completed tasks and any new items identified
4. **Append** a concise session summary to `RESUME.txt` (ne pas écraser — ajouter à la suite avec un séparateur de date/session), covering:
   - Files modified
   - Features added or fixed
   - Anything important to remember next session
5. Print the same summary in the terminal (French)

## Project Overview

A vanilla JavaScript Skyrim checklist web application. Multi-file structure with no build system, no npm dependencies.

## Clé API Anthropic

- Fichier `.env` : `C:\Users\jnfra\.claude\agents\.env`
- Format : `ANTHROPIC_API_KEY=sk-ant-...`
- Les scripts Python chargent ce fichier automatiquement via `load_dotenv()` — pas besoin de `set` ou `export` avant de les lancer.

## Outils & Plugins disponibles

### MCP Servers actifs
- **Playwright** — automatisation navigateur : tester l'app, prendre des screenshots, vérifier le rendu réel
- **Figma** — lire des maquettes Figma et générer du code HTML/CSS correspondant
- **IDE** — diagnostics de code, exécution de scripts dans l'éditeur

### Skills utiles pour ce projet
- `firecrawl:firecrawl-cli` — scraper UESP / recherche web (**remplace WebFetch et WebSearch**)
- `frontend-design:frontend-design` — générer des composants UI soignés
- `playground:playground` — créer un fichier HTML interactif de test isolé
- `figma:implement-design` — implémenter un design Figma en code
- `superpowers:brainstorming` — avant tout travail créatif ou nouvelle feature
- `superpowers:systematic-debugging` — avant toute correction de bug

## Running the App

Open `index.html` in a browser (or via Live Server). Data persists in localStorage per profile under keys `skyrim_checklist_{profileId}`.

## File Structure

- `index.html` — page d'accueil : sélection / création / suppression de profils
- `skyrim.html` — checklist (redirige vers index.html si aucun profil actif)
- `css/style.css` — all CSS (dark theme, Syne + DM Mono + FuturaCondensed + DragonscriptRegular fonts)
- `script/profiles.js` — CRUD profils partagé (index.html + skyrim.html)
- `script/i18n.js` — internationalisation FR/EN : `t(key)`, `getLang()`, `toggleLang()`, `I18N`
- `script/app.js` — all JavaScript, vanilla ES6
- `script/data/quests.js` — quêtes (IDs 1–657), `name_fr` + `desc_fr`
- `script/data/shouts.js` — cris draconiques (IDs 658–738), `word_fr` + `desc_fr`
- `script/data/spells.js` — sorts (IDs 739–908), `name_fr` + `desc_fr`
- `script/data/enchanting.js` — enchantements (IDs 909–961), `name_fr` + `desc_fr`
- `script/data/alchemy.js` — ingrédients + potions + poisons (IDs 962–1435), `name_fr` + `desc_fr`
- `script/data/achievements.js` — succès (IDs 1436–1511), `name_fr` + `desc_fr`
- `script/data/index.js` — expose `CHECKLIST_DATA = { [category]: [...items] }`
- `assets/fonts/` — FuturaCondensed.ttf, Dragon_script.ttf (DragonscriptRegular)
- `assets/images/logos/` — logo_title.webp
- `assets/images/knotworks/` — WebP banners per quest group (main_quest.webp, etc.)
- `assets/images/schools/` — icônes école magie (*_2.webp, recadrées au motif)
- `assets/images/spells/` — icônes sorts WebP (ex: Fire.webp, Heal.webp)
- `assets/images/craftings/` — alchemy.webp, enchanting.webp
- `assets/images/ingredients/` — icônes ingrédients WebP 64px
- `assets/icons/` — dossier résiduel (vide ou ignoré)
- `extract.py` — regenerates data files from .xlsx (à mettre à jour pour cibler script/data/)
- `Skyrim Checklist — Master.xlsx` — source data

## Architecture

**Data model:**

```js
CHECKLIST_DATA = { [category: String]: [{ id, name, group, desc, ...extras }] }
checked = { [id]: true }         // persisted in localStorage
currentCat = String              // active tab
searchQuery = String             // global search across all categories
collapsedGroups = { [catKey]: true }  // catKey = cat + '::' + group
```

**Key constants (app.js):**

- `CATEGORIES` — ordered list from `CATEGORY_META` keys
- `CATEGORY_META` — maps data key → display label
- `QUEST_GROUPS` — quest group order + knotwork PNG + optional display label (`{ name, img, label? }`)
- `QUEST_GROUP_MAP` — `{ [name]: img }` derived from QUEST_GROUPS
- `QUEST_GROUP_LABEL_MAP` — `{ [name]: label }` for groups with a shortened display name
- `QUEST_GROUP_ORDER` — `[name, ...]` derived from QUEST_GROUPS
- `QUEST_ACTS` — act/section dividers per quest group (firstId-based)
- `QUEST_ACTS_META` — optional `preLabel` / `gridLabel` per group
- `QUEST_CARD_GROUPS` — Set of groups using card grid layout (currently: `'Daedric'`)
- `DRAGON_SCRIPT_ENC` — lookup table `{ [latinWord]: encodedStr }` for DragonscriptRegular font (ex: `'Fus':'FUS'`, `'Raan':'R1N'`)
- `POTION_SECTIONS` — `['Health', 'Magicka', 'Stamina', 'Skill']` — sous-groupes de la section Potions
- `POISON_SECTIONS` — `['Damage', 'Crowd Control', 'Weakness', 'Lingering', 'Special']` — sous-groupes de la section Poisons
- `POTION_SECTION_IMG` — mapping group → icône (legacy, non utilisé en header)

**Core functions:**
`load()`, `save()` cycle — mutate `checked`, call `save()`, then `renderList()` + `renderStats()` + `renderTabBadges()`.

- `renderTabs()` — generates nav buttons from CATEGORIES
- `renderTabBadges()` — updates done/total badge on each tab button
- `renderList()` — full DOM rebuild; global search when `searchQuery` set
- `renderItemsHtml(items, cat, forceExpand = false)` — renders groups with knotwork headers for Quests; `forceExpand = true` forces all groups open (used during search)
- `renderAlchemySubsections(items, sections, parentKey)` — rendu des sous-groupes Potions/Poisons (sous-groupes collapsibles + types collapsibles)
- `renderPotionLi(item)` — rendu d'un item potion/poison (img + checkbox + nom + ⓘ)
- `switchCat(cat)` — changes active tab, clears search, re-renders
- `toggleGroup(cat, group)` — collapses/expands a group, re-renders
- `checkGroup(cat, group, value)` — bulk check/uncheck all items in a group
- `setBadge(state)` — updates storage badge (saved/saving/error)
- `escJs(str)` — escapes single quotes for safe use in onclick attributes (required for group names with apostrophes)

**UI layout:**

- Topbar: logo (left) | CHECKLIST title (center) | Complete % + storage badge (right)
- Global progress bar
- Tabs row: search input (left, 220px) | nav tabs (center, scrollable)
- Content: scrollable item list

## Quest Group Structure (standard pattern — ALL groups follow this)

Every quest group in the Quests category is built the same way:

1. **data.js** — items with `{ id, name, group, desc, giver, ...extras }`, sequential IDs
2. **QUEST_ACTS** — defines the column sections (acts). Items before the first `firstId` become the `preLabel` flat list (Story). Items from each `firstId` onward fill their act column in the grid.
3. **QUEST_ACTS_META** — `{ preLabel: 'Story' }` (and optionally `gridLabel`) for groups that have a story section before the acts grid.
4. **Rendering** — Story section (flat list, `act-section-header` style) + acts grid (columns with `act-col-header` gold gradient + decorative lines).

**Exception — Daedric group:**
Uses `QUEST_CARD_GROUPS` instead of `QUEST_ACTS`. Renders as a 4-column grid of cards. Each card: prince name header (act-col-header style) + standard `item-label` row (checkbox · quest name · info btn). Extra fields: `prince` (string) and `level` (number, optional) shown in info modal.

**Info modal field order:** Quest Group → City → Daedric Prince → Level Required → Description → Quest Giver → Rewards
**Shout modal field order:** Shout → Translation → DLC → Description → Word Wall Location
Modal size: 640px wide, titre 30px, valeurs 17px. Détection shout via `!!item.word_en`.
Extra data fields: `city` (string, ex: Innkeepers), `prince` (Daedric), `level` (Daedric), `reward` (any).

**Quest item rendering (standard):**

```html
<li class="item [done]">
  <label class="item-label">
    <span class="cb-wrap"><input type="checkbox" /><span class="cb-box"></span></span>
    <span class="item-name">Quest Name</span>
    <button class="info-btn">ⓘ</button>   <!-- Quests only -->
  </label>
</li>
```

**Current last ID: 1511** (Potions IDs 1145–1356, Poisons IDs 1357–1435, Achievements IDs 1436–1511)

**Catégories placeholder (rendu spécial dans renderItemsHtml) :**
- `isBooks` — 3 groupes collapsibles (Skills, Quests, Lores), "Data coming soon" dans chacun
- `isPerks` — 6 groupes (Combat/Magic/Stealth Skills → 6 sous-groupes chacun ; Vampire Lord/Werewolf/Special → "Data coming soon")
  - Combat : One-Handed, Two-Handed, Archery, Block, Heavy Armor, Smithing
  - Magic : Alteration, Conjuration, Destruction, Illusion, Restoration, Enchanting
  - Stealth : Light Armor, Sneak, Lockpicking, Pickpocket, Speech, Alchemy
- Ces catégories ont `[]` dans data.js — bypass de la condition `items.length === 0` dans `renderList()`
- `PERK_INIT` dans `init()` — collapse tous les groupes/sous-groupes Perks au chargement

**Groups sans knotwork (`img: null`):**
Rendu via `group-knotwork-wrap no-img` — texte doré centré, fond noir, sans image. Quand l'image est disponible, remplacer `null` par le nom du fichier WebP. Pour afficher un nom raccourci sur le knotwork, ajouter `label: '...'` dans l'entrée QUEST_GROUPS.

## Key Conventions

- `escHtml()` on all user strings in `innerHTML` — XSS prevention
- `escJs()` on group/cat names used in onclick attributes — prevents apostrophe breakage
- Full DOM rebuild on every change (no partial updates)
- No external JS dependencies beyond Google Fonts
- Quest knotwork group headers use `assets/images/knotworks/[name].webp`
- Spell school headers use `assets/images/schools/[school]_2.webp` (via `SPELL_SCHOOL_IMG`) — nom FR via `SPELL_SCHOOL_FR_MAP`
- Dragon Shout group headers : traduits via `SHOUT_GROUP_FR_MAP` ; mots draconiques = noms propres inchangés EN/FR ; signification (word_en) traduite via `DATA_FR_WORDS`
- Crafting icons (alchemy/enchanting) use `assets/images/craftings/[name].webp`
- Spell icons use `assets/images/spells/[img].webp` (item.img stocke le nom sans extension)
- Potion/Poison icons use `assets/images/potions/[img].webp` (item.img = variant UESP sans extension)
- Potion/Poison collapsedGroups keys: `'Potions::Health'`, `'Potions::Skill::Fortify Alteration'`, etc.
- Modal detection: `isPotionItem = item.section === 'Potions' || item.section === 'Poisons'`
- Storage badge: green=saved, yellow(pulse)=saving(600ms), red=error
- Groups start collapsed by default on page load (initialized in `init()`)
- During search: all groups are force-expanded (`forceExpand = true`); `collapsedGroups` is never mutated, so state is fully restored when search is cleared

## Git — Push (MANDATORY)

Ne jamais faire `git push` automatiquement. Pousser uniquement :
- Quand l'utilisateur le demande explicitement
- En fin de session (end-of-session workflow)

Les commits locaux sont OK à tout moment.

## CSS — Mobile First (MANDATORY)

All new CSS must be written **mobile-first**:
- Base styles target mobile (≤ 600px)
- Use `@media (min-width: ...)` to enhance for larger screens
- Breakpoints: `600px` (tablet), `900px` (desktop)
- The current `style.css` is desktop-first (legacy) — refactor sections when touched
- Never add `max-width` media queries for new rules; use `min-width` exclusively
