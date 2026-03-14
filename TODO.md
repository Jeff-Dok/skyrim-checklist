# TODO — Skyrim Checklist

## Groupes de quêtes manquants (données à ajouter dans data.js)

- [X] **Bards College** — quêtes de la guilde des bardes
- [X] **Side Quests** — quêtes secondaires
- [X] **Miscellaneous** — quêtes misc (IDs 226–326, tous les holds complétés)
- [X] **Favors** — faveurs diverses (110 items, IDs 327–436 : Activity Favors + Favors for Citizens + Thane Tasks)
- [X] **Dawnguard** — DLC Dawnguard (quêtes principales + secondaires) — 49 items, IDs 437–485
- [X] **Dragonborn** — DLC Dragonborn (quêtes principales + secondaires) — 56 items, IDs 486–541
- [~] **Fishing** — DLC Fishing (22 quêtes, IDs 552–573) — données ajoutées, 9 quêtes CC restantes à classer
- [X] **Creation Club** — 84 quêtes (IDs 574–657, 22 sections reclassées)

---

## Enrichissement des descriptions (guide Prima)

- [X] Main Quest — toutes enrichies
- [X] Companions — toutes enrichies
- [X] College of Winterhold — toutes enrichies
- [X] Thieves Guild — toutes enrichies
- [X] Dark Brotherhood — toutes enrichies
- [X] Civil War — toutes enrichies
- [X] Daedric (15 quêtes) — toutes enrichies
- [X] Bards College (4 quêtes) — toutes enrichies
- [X] Divine Quests (6 quêtes) — toutes enrichies
- [X] The Greybeards / The Blades — enrichies
- [X] Side Quests (20 quêtes + 5 ajouts IDs 547–551) — toutes enrichies
- [X] Dungeon Quests (23 quêtes) — toutes enrichies
- [X] Dawnguard — toutes enrichies
- [X] Dragonborn — toutes enrichies
- [X] Miscellaneous Objectives, Favors, radiant quests — OK tel quel

---

## Knotworks manquants (img: null dans QUEST_GROUPS)

Tous les knotworks sont maintenant référencés ✅
- [X] **Divine Quests** → `divine_quests.webp` (59Ko PNG → 12Ko WebP)
- [X] **The Greybeards** → `greybeards_quest.webp` (83Ko PNG → 5.8Ko WebP)
- [X] **The Blades** → `blades_quests.webp` (54Ko PNG → 9Ko WebP)
- [X] **Dungeon Quests** → `dungeon_quests.webp` (37Ko PNG → 8Ko WebP)

---

## Catégorie Alchemy — sections à compléter

La catégorie Alchemy Ingredients est rendue (1 colonne, 4 sections collapsibles).

### Potions ✅ COMPLÉTÉ
- [X] 212 items codés (IDs 1145–1356), groupes Health/Magicka/Stamina/Skill
- [X] Types dans Skill : 19 Fortify + Invisibility + Regen + Resist + Waterbreathing + Thieves Guild + DLC/Special
- [ ] **Vérifier les images** — certains `img` peuvent ne pas avoir de fichier correspondant (`onerror` fallback actif)

### Poisons ✅ COMPLÉTÉ
- [X] 79 items codés (IDs 1357–1435), groupes Damage/Crowd Control/Weakness/Lingering/Special
- [X] Types collapsibles comme Potions
- [ ] **Vérifier les images** — SlowMagicka*/SlowStamina* au lieu de LingeringMagicka*/LingeringStamina*

### Recipes
- [ ] Scope à définir — recettes d'alchimie ? combinaisons ingrédients → effet ?

---

## Scrolls (nouvelle catégorie potentielle)

- [ ] **Données préparées** — `Sections/potions_poisons_beverages.txt` section SCROLLS
  - 56 scrolls complets avec ID, effet, valeur, location (UESP + Prima)
  - Organisés par école : Alteration, Conjuration, Destruction, Illusion, Restoration + Quest/Special
- [ ] **Décision** : inclure dans Alchemy ? créer catégorie séparée ? ignorer ?
- [ ] **Rendu** à définir si retenu

---

## Spiders (données CC disponibles)

- [ ] **Données préparées** — `Sections/potions_poisons_beverages.txt` section SPIDERS
  - 15 spiders CC avec effets et descriptions (Prima guide)
- [ ] **Décision** : inclure dans quelle catégorie ?

---

## Scripts utilitaires Python — `Scripts_Python/` (MAJ 2026-03-14)

Tous dans `skyrim_project/Scripts_Python/`. Dépendances : `pip install requests beautifulsoup4 Pillow anthropic`

- [X] `download_url.py` — téléchargeur universel (pages, images, fichiers). GitHub API auto, directory listing auto. `--depth 2` par défaut. Dest : `~/Downloads/`
- [X] `download_uesp_images.py` — télécharge icônes UESP (`SR-icon-*` / `SR-item-*`), dest `UESP/Pictures/`
- [X] `process_ingredient_images.py` — convertit PNG/JPG → WebP 64px, renomme (après dernier `-`), dest `UESP/webp/`
- [X] `analyze_image.py` — analyse 1 image via Claude Vision API → `.txt`
- [X] `batch_analyze.py` — analyse tous PNG/JPG/WEBP d'un dossier. `--skip-existing` pour reprendre
- [X] `build_sections.py` — fusionne pages PDF Prima. Usage : `python build_sections.py "Nom" debut [fin]`
- [X] `README.md` — documentation complète avec options, exemples, workflows, dépannage

---

## Catégories à implémenter (données + rendu)

- [X] **Dragon Shouts** — 81 mots (IDs 658–738)
- [X] **Spells** — 170 sorts (IDs 739–908)
- [X] **Enchanting Effects** — 53 effets (IDs 909–961)
- [X] **Alchemy Ingredients** — 183 ingrédients (IDs 962–1144) — section Ingredients complète
- [X] **Alchemy Potions** — 212 items codés (IDs 1145–1356) : Health/Magicka/Stamina/Skill (tous Fortify, Regen, Resist, Invisibility, Waterbreathing, Thieves Guild, DLC, Special)
- [X] **Alchemy Poisons** — 79 items codés (IDs 1357–1435) : Damage/Crowd Control/Weakness/Lingering/Special
- [ ] **Alchemy Recipes** — scope à définir
- [~] **Books** — Structure placeholder : 3 groupes (Skills, Quests, Lores) — "Data coming soon"
  - Données à récupérer (UESP : Skyrim:Skill Books)
  - Rendu : liste par compétence, avec nom du livre + skill boosté
- [~] **Perks** — Structure placeholder : 6 groupes, sous-groupes Combat/Magic/Stealth — "Data coming soon"
  - Données à coder pour chacun des 18 skill trees
- [ ] **Collectible** — scope à définir (cartes au trésor ? Stones of Barenziah ? Flûtes de barde ?)
- [ ] **Unique Gear** — armes/armures uniques
  - Données partiellement préparées (URLs UESP téléchargées cette session)
  - Images `SR-item-*.png` dans `UESP/item/` → à convertir en WebP
  - Rendu potentiel : grille avec image de l'objet
- [ ] **Locations** — lieux à découvrir (Donjons, Villes, Camps, etc.)
- [ ] **Merchants** — marchands spécialisés avec inventaire notable
- [ ] **Recruitable Followers** — compagnons recrutables avec conditions
- [ ] **Achievements** — succès Steam/PlayStation
  - Icônes déjà présentes : `assets/icons/achievements/` (non trackées)
  - Rendu : grille avec icône par succès

---

## Fonctionnalités UI

- [X] **Multi-profils** — index.html (sélection/création/suppression) + skyrim.html (checklist par profil)
- [X] **Internationalisation FR/EN** — i18n.js + data_fr.js (1038 traductions IDs 1–1144) + t() partout dans app.js
- [X] **Traductions Dragon Shouts FR** — headers + mots propres + `DATA_FR_WORDS` (significations FR)
- [X] **Traductions Spells FR** — ~40 corrections (noms officiels via wiki FR) + `SPELL_SCHOOL_FR_MAP`
- [ ] **Traductions Potions/Poisons FR** — data_fr.js ne couvre pas encore les IDs 1145–1435
- [ ] **Images Potions/Poisons** — 13 items mis à jour cette session (HealingExtreme, MagickaExtreme, StaminaExtreme, Ale), vérifier les autres null restants
- [ ] **Export / Import** — sauvegarder/restaurer la progression en JSON
- [ ] **Reset** — bouton remise à zéro avec confirmation modale
- [ ] **Rendu Achievements** — grille icône + nom + description
- [ ] **Rendu Collectible** — mise en page à définir selon scope
- [ ] **Rendu Unique Gear** — grille avec image WebP de l'objet

---

## Documentation offline — `docs/` (MAJ 2026-03-14)

- [X] `docs/GUIDE_PRINCIPAL.md` — Vue d'ensemble, architecture, localStorage, palette, IDs, catégories
- [X] `docs/app-js.md` — Toutes les constantes, états, fonctions de app.js documentés
- [X] `docs/profiles-js.md` — CRUD profils, clés localStorage, migration v1, getProfilePct
- [X] `docs/i18n-js.md` — Structure I18N, t(), getLang(), toggleLang(), guide ajout clés
- [X] `docs/data-js.md` — Format item par catégorie, règles IDs, structure data_fr.js
- [X] `docs/style-css.md` — 19 sections CSS documentées (variables, layout, topbar, modal, responsive…)
- [X] `docs/html.md` — Structure DOM index.html + skyrim.html, ordre chargement scripts, IDs ciblés
- [X] `docs/comment-ajouter.md` — 10 recettes pratiques (ajouter quête, sort, ingrédient, potion…)

---

## Qualité & polish

- [X] **Favicon** — `assets/images/logos/favicon.ico` ajouté + référencé dans index.html et skyrim.html
- [ ] **Responsive mobile** — tester sur mobile réel / DevTools 375px
- [ ] **Vérifier `extract.py`** — couvre-t-il toutes les catégories du `.xlsx` ?
- [ ] **Compléter le `.xlsx`** avec les données des nouvelles catégories
